import hashlib
import uuid
import io
import json
import logging
from typing import Optional, Tuple
from fastapi import UploadFile, HTTPException, status
from sqlalchemy.orm import Session
from PIL import Image

from app.core.config import settings
from app.models.document import Document, DocumentPage, ExtractionField
from app.models.audit_log import AuditLog
from app.providers.storage import get_storage_provider
from app.providers.ai_provider import get_ai_provider
from app.services.validation_service import ValidationService
from app.schemas.extraction import (
    ExtractionResultSchema, 
    ExtractedFieldSchema, 
    ExtractedItemSchema, 
    BoundingBoxSchema,
    ValidationResultSchema
)

logger = logging.getLogger(__name__)

# Magic byte signatures
MAGIC_BYTES = {
    b"\xFF\xD8\xFF": "image/jpeg",
    b"\x89PNG\r\n\x1a\n": "image/png",
    b"%PDF-": "application/pdf",
    b"RIFF": "image/webp"
}

class DocumentService:
    @staticmethod
    def verify_magic_bytes(content: bytes) -> str:
        for magic, mime in MAGIC_BYTES.items():
            if content.startswith(magic):
                return mime
        # Allow webp riff check
        if len(content) > 12 and content[:4] == b"RIFF" and content[8:12] == b"WEBP":
            return "image/webp"
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload a valid JPG, PNG, WEBP, or PDF document."
        )

    @classmethod
    async def ingest_document(
        cls, 
        user_id: str, 
        file: UploadFile, 
        db: Session
    ) -> Tuple[Document, bool, Optional[str]]:
        file_bytes = await file.read()
        file_size = len(file_bytes)

        # 1. Size Check
        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if file_size > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB."
            )

        # 2. Magic byte check
        mime_type = cls.verify_magic_bytes(file_bytes)

        # 3. Compute SHA-256
        sha256 = hashlib.sha256(file_bytes).hexdigest()

        # 4. Check for binary duplicate
        is_dup, existing_inv_id, reason = ValidationService.check_duplicate(
            db=db, user_id=user_id, checksum=sha256
        )

        # 5. Store file with sanitized UUID path
        doc_id = str(uuid.uuid4())
        ext = file.filename.split(".")[-1].lower() if "." in file.filename else "bin"
        storage_key = f"{user_id}/{doc_id}.{ext}"
        storage = get_storage_provider()
        await storage.upload(file_bytes, storage_key, mime_type)

        # 6. Create Document record
        doc = Document(
            id=doc_id,
            user_id=user_id,
            storage_provider=settings.STORAGE_PROVIDER,
            storage_key=storage_key,
            original_filename=file.filename or f"bill_{doc_id[:8]}.{ext}",
            mime_type=mime_type,
            file_size=file_size,
            sha256_checksum=sha256,
            status="PROCESSING" if not is_dup else "REVIEW_REQUIRED",
            page_count=1
        )
        db.add(doc)

        # Audit log
        db.add(AuditLog(
            user_id=user_id,
            action="UPLOAD",
            entity_type="document",
            entity_id=doc_id,
            after_state={"filename": doc.original_filename, "size": file_size}
        ))
        db.commit()
        db.refresh(doc)

        return doc, is_dup, existing_inv_id

    @classmethod
    async def process_extraction_pipeline(cls, document_id: str, db: Session):
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            logger.error(f"Document {document_id} not found for extraction.")
            return

        storage = get_storage_provider()
        try:
            file_bytes = await storage.get(doc.storage_key)
        except Exception as e:
            doc.status = "FAILED"
            doc.processing_error = f"Failed to retrieve stored file: {str(e)}"
            db.commit()
            return

        # Preprocessing quality check (Pillow)
        try:
            if doc.mime_type.startswith("image/"):
                img = Image.open(io.BytesIO(file_bytes))
                doc.page_count = 1
                # Optional blur check simulation / sanity
                if img.width < 100 or img.height < 100:
                    doc.processing_error = "Image resolution is extremely low; extraction may be inaccurate."
        except Exception as e:
            logger.warning(f"Image preprocessing warning: {e}")

        # Local OCR check (for categorization, identification & verification)
        ocr_text = ""
        try:
            import os
            file_disk_path = os.path.join(settings.STORAGE_LOCAL_PATH, doc.storage_key)
            if not os.path.exists(file_disk_path) and hasattr(storage, "_get_full_path"):
                file_disk_path = storage._get_full_path(doc.storage_key)
            if not os.path.exists(file_disk_path):
                base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
                file_disk_path = os.path.join(base_dir, "uploads", doc.storage_key)

            if os.path.exists(file_disk_path):
                from app.services.ocr_service import OCRService
                ocr_text = OCRService.extract_text_from_file(file_disk_path)
        except Exception as e:
            logger.warning(f"OCR inspection warning: {e}")

        # AI Extraction
        ai_provider = get_ai_provider()
        try:
            extraction = await ai_provider.extract_document(
                file_bytes=file_bytes,
                mime_type=doc.mime_type,
                filename=doc.original_filename,
                ocr_text=ocr_text
            )
            doc.document_type = extraction.document_type
        except Exception as e:
            logger.error(f"Extraction failed for document {doc.id}: {e}")
            doc.status = "FAILED"
            doc.processing_error = f"We couldn't confidently read this document: {str(e)}"
            db.commit()
            return

        # Deterministic Mathematical Validation
        validation = ValidationService.validate_financial_arithmetic(extraction)
        extraction.validation = validation

        # Intelligent Categorization based on nature of bill/invoice
        from app.services.categorization_service import CategorizationService
        doc_type, suggested_cat = CategorizationService.infer_category_and_type(
            vendor_name=str(extraction.vendor_name.value or ""),
            document_text=ocr_text,
            items=extraction.items,
            raw_document_type=extraction.document_type
        )
        extraction.document_type = doc_type
        extraction.suggested_category = suggested_cat
        suggested_cat_id = CategorizationService.resolve_category_id(suggested_cat, db)
        extraction.suggested_category_id = suggested_cat_id
        doc.document_type = doc_type

        # Clear existing fields for this document to avoid duplicate accumulation
        db.query(ExtractionField).filter(ExtractionField.document_id == doc.id).delete()

        # Save atomic extraction fields into extraction_fields table
        # 1. Vendor
        for field in ["vendor_name", "vendor_address", "vendor_phone", "vendor_email", "vendor_ntn", "vendor_strn"]:
            ef: ExtractedFieldSchema = getattr(extraction, field, None)
            if ef and ef.value is not None:
                db.add(ExtractionField(
                    document_id=doc.id,
                    field_name=field,
                    field_value=str(ef.value),
                    confidence=ef.confidence,
                    source_text=ef.source_text,
                    bounding_box=ef.bounding_box.model_dump() if ef.bounding_box else None
                ))

        # 2. Invoice Identifiers
        for field in ["invoice_number", "invoice_date", "currency", "payment_method", "customer_name", "customer_phone"]:
            ef: ExtractedFieldSchema = getattr(extraction, field, None)
            if ef and ef.value is not None:
                db.add(ExtractionField(
                    document_id=doc.id,
                    field_name=field,
                    field_value=str(ef.value),
                    confidence=ef.confidence,
                    source_text=ef.source_text,
                    bounding_box=ef.bounding_box.model_dump() if ef.bounding_box else None
                ))

        # 3. Totals
        for field in ["subtotal", "discount", "tax", "service_charge", "shipping", "rounding", "total", "amount_paid", "balance_due"]:
            ef: ExtractedFieldSchema = getattr(extraction, field, None)
            if ef and ef.value is not None:
                db.add(ExtractionField(
                    document_id=doc.id,
                    field_name=field,
                    field_value=str(ef.value),
                    confidence=ef.confidence,
                    source_text=ef.source_text,
                    bounding_box=ef.bounding_box.model_dump() if ef.bounding_box else None
                ))

        # 4. Line items stored as JSON
        if extraction.items:
            db.add(ExtractionField(
                document_id=doc.id,
                field_name="items",
                field_value=json.dumps([item.model_dump() for item in extraction.items]),
                confidence=1.0,
            ))

        # 5. Custom fields stored as JSON
        if extraction.custom_fields:
            db.add(ExtractionField(
                document_id=doc.id,
                field_name="custom_fields",
                field_value=json.dumps(extraction.custom_fields),
                confidence=1.0,
            ))

        # 6. Suggested Expense Category
        if extraction.suggested_category:
            db.add(ExtractionField(
                document_id=doc.id,
                field_name="suggested_category",
                field_value=str(extraction.suggested_category),
                confidence=1.0,
            ))
        if extraction.suggested_category_id:
            db.add(ExtractionField(
                document_id=doc.id,
                field_name="suggested_category_id",
                field_value=str(extraction.suggested_category_id),
                confidence=1.0,
            ))

        doc.status = "REVIEW_REQUIRED"
        db.add(AuditLog(
            user_id=doc.user_id,
            action="EXTRACT",
            entity_type="document",
            entity_id=doc.id,
            after_state={"document_type": doc.document_type, "is_valid": validation.is_valid}
        ))
        db.commit()
        db.refresh(doc)

    @classmethod
    async def get_document_review(cls, document: Document, db: Session) -> ExtractionResultSchema:
        """
        Reconstruct complete structured review schema for the review workspace.
        """
        fields = db.query(ExtractionField).filter(ExtractionField.document_id == document.id).all()
        field_map = {f.field_name: f for f in fields}

        if field_map and ("vendor_name" in field_map or "total" in field_map):
            def make_field(name: str, default=None):
                if name in field_map:
                    f = field_map[name]
                    val = f.field_value
                    if name in ["subtotal", "tax", "discount", "service_charge", "shipping", "rounding", "total", "amount_paid", "balance_due"]:
                        try:
                            val = float(val) if val is not None else 0.0
                        except (ValueError, TypeError):
                            val = 0.0
                    bbox = BoundingBoxSchema(**f.bounding_box) if f.bounding_box else None
                    return ExtractedFieldSchema(
                        value=val,
                        confidence=f.confidence,
                        source_text=f.source_text,
                        bounding_box=bbox
                    )
                return ExtractedFieldSchema(value=default, confidence=1.0)

            items = []
            if "items" in field_map and field_map["items"].field_value:
                try:
                    raw_items = json.loads(field_map["items"].field_value)
                    for it in raw_items:
                        bbox = BoundingBoxSchema(**it["bounding_box"]) if it.get("bounding_box") else None
                        items.append(ExtractedItemSchema(
                            name=it.get("name", ""),
                            quantity=float(it.get("quantity") or 1.0),
                            unit=it.get("unit"),
                            unit_price=float(it.get("unit_price") or 0.0),
                            line_total=float(it.get("line_total") or 0.0),
                            discount=float(it.get("discount") or 0.0),
                            tax=float(it.get("tax") or 0.0),
                            confidence=float(it.get("confidence") or 1.0),
                            bounding_box=bbox
                        ))
                except Exception as e:
                    logger.warning(f"Failed to parse items json: {e}")

            custom_fields = {}
            if "custom_fields" in field_map and field_map["custom_fields"].field_value:
                try:
                    custom_fields = json.loads(field_map["custom_fields"].field_value)
                except Exception:
                    pass

            s_cat = field_map.get("suggested_category")
            s_cat_id = field_map.get("suggested_category_id")
            suggested_category = s_cat.field_value if s_cat else None
            suggested_category_id = s_cat_id.field_value if s_cat_id else None

            if not suggested_category or not suggested_category_id:
                from app.services.categorization_service import CategorizationService
                doc_type, exp_category = CategorizationService.infer_category_and_type(
                    vendor_name=str(make_field("vendor_name").value or ""),
                    document_text="",
                    items=items,
                    raw_document_type=document.document_type
                )
                suggested_category = exp_category
                suggested_category_id = CategorizationService.resolve_category_id(exp_category, db)

            result = ExtractionResultSchema(
                document_type=document.document_type or "retail_receipt",
                vendor_name=make_field("vendor_name"),
                vendor_address=make_field("vendor_address"),
                vendor_phone=make_field("vendor_phone"),
                vendor_email=make_field("vendor_email"),
                vendor_ntn=make_field("vendor_ntn"),
                vendor_strn=make_field("vendor_strn"),
                invoice_number=make_field("invoice_number"),
                invoice_date=make_field("invoice_date"),
                currency=make_field("currency", default="PKR"),
                payment_method=make_field("payment_method", default="Cash"),
                customer_name=make_field("customer_name"),
                customer_phone=make_field("customer_phone"),
                items=items,
                subtotal=make_field("subtotal", default=0.0),
                discount=make_field("discount", default=0.0),
                tax=make_field("tax", default=0.0),
                service_charge=make_field("service_charge", default=0.0),
                shipping=make_field("shipping", default=0.0),
                rounding=make_field("rounding", default=0.0),
                total=make_field("total", default=0.0),
                amount_paid=make_field("amount_paid", default=0.0),
                balance_due=make_field("balance_due", default=0.0),
                custom_fields=custom_fields,
                suggested_category=suggested_category,
                suggested_category_id=suggested_category_id
            )
            result.validation = ValidationService.validate_financial_arithmetic(result)
            return result

        # If fields not in DB, extract now
        ai = get_ai_provider()
        storage = get_storage_provider()
        try:
            content = await storage.get(document.storage_key)
            result = await ai.extract_document(content, document.mime_type, document.original_filename)
        except Exception:
            from app.providers.ai_provider import MockAIProvider
            result = await MockAIProvider().extract_document(b"", "image/jpeg", document.original_filename)

        from app.services.categorization_service import CategorizationService
        doc_type, exp_category = CategorizationService.infer_category_and_type(
            vendor_name=str(result.vendor_name.value or ""),
            document_text="",
            items=result.items,
            raw_document_type=result.document_type
        )
        result.document_type = doc_type
        result.suggested_category = exp_category
        result.suggested_category_id = CategorizationService.resolve_category_id(exp_category, db)

        # Recalculate validation
        result.validation = ValidationService.validate_financial_arithmetic(result)
        return result
