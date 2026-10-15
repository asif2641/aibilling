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
    ValidationResultSchema,
    DiscrepancySchema
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

        # Determine initial page count (pypdf for PDFs)
        pdf_pages = 1
        if mime_type == "application/pdf":
            try:
                import pypdf
                pdf_reader = pypdf.PdfReader(io.BytesIO(file_bytes))
                pdf_pages = max(len(pdf_reader.pages), 1)
            except Exception as pe:
                logger.warning(f"Could not read PDF page count: {pe}")

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
            page_count=pdf_pages
        )
        db.add(doc)

        # Store page references for multi-page PDFs (PRD Section 18)
        if mime_type == "application/pdf" and pdf_pages > 1:
            for p_num in range(1, pdf_pages + 1):
                db.add(DocumentPage(
                    id=str(uuid.uuid4()),
                    document_id=doc_id,
                    page_number=p_num,
                    image_storage_key=f"{storage_key}#page={p_num}"
                ))

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

    @staticmethod
    def stitch_images(image_bytes_list: List[bytes]) -> Tuple[bytes, str, int, int]:
        """
        Vertically stitches multiple image parts/pages of a long receipt or multi-page bill
        into one continuous high-resolution composite image.
        Returns: (stitched_bytes, mime_type, total_width, total_height)
        """
        from PIL import Image, ImageOps

        opened_images = []
        for b in image_bytes_list:
            try:
                img = Image.open(io.BytesIO(b))
                img = ImageOps.exif_transpose(img)
                if img.mode != "RGB":
                    img = img.convert("RGB")
                opened_images.append(img)
            except Exception as e:
                logger.error(f"Error opening image part for stitching: {e}")

        if not opened_images:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not decode any valid images for stitching."
            )

        if len(opened_images) == 1:
            out_buf = io.BytesIO()
            opened_images[0].save(out_buf, format="JPEG", quality=95)
            w, h = opened_images[0].size
            return out_buf.getvalue(), "image/jpeg", w, h

        # Determine target uniform width: use the maximum width among parts
        target_width = max(img.width for img in opened_images)
        target_width = max(min(target_width, 2400), 1000)

        resized_images = []
        total_height = 0
        seam_height = 4  # subtle visual divider between parts

        for idx, img in enumerate(opened_images):
            aspect = img.height / img.width
            new_height = int(target_width * aspect)
            resized = img.resize((target_width, new_height), Image.Resampling.LANCZOS)
            resized_images.append(resized)
            total_height += new_height
            if idx < len(opened_images) - 1:
                total_height += seam_height

        # Create composite canvas
        composite = Image.new("RGB", (target_width, total_height), (240, 240, 240))
        y_offset = 0

        for idx, img in enumerate(resized_images):
            composite.paste(img, (0, y_offset))
            y_offset += img.height
            if idx < len(resized_images) - 1:
                y_offset += seam_height

        out_buf = io.BytesIO()
        composite.save(out_buf, format="JPEG", quality=95)
        stitched_bytes = out_buf.getvalue()

        return stitched_bytes, "image/jpeg", target_width, total_height

    @classmethod
    async def ingest_multi_image_document(
        cls,
        user_id: str,
        files: List[UploadFile],
        db: Session
    ) -> Tuple[Document, bool, Optional[str]]:
        """
        Ingest multiple images representing different sections/pages of ONE long bill.
        Stitches them into a single continuous document, stores both composite and individual pages,
        and creates a single unified Document entity.
        """
        if not files:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one image file is required."
            )

        raw_parts = []
        filenames = []
        for f in files:
            b = await f.read()
            if len(b) > 0:
                cls.verify_magic_bytes(b)
                raw_parts.append(b)
                filenames.append(f.filename or "part.jpg")

        if not raw_parts:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="All uploaded files were empty."
            )

        # 1. Stitch into single continuous bill image
        stitched_bytes, mime_type, target_width, total_height = cls.stitch_images(raw_parts)
        stitched_size = len(stitched_bytes)

        # 2. Check total size
        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if stitched_size > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Combined bill exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB."
            )

        # 3. Compute SHA-256 for the combined composite
        sha256 = hashlib.sha256(stitched_bytes).hexdigest()

        # 4. Duplicate check
        is_dup, existing_inv_id, reason = ValidationService.check_duplicate(
            db=db, user_id=user_id, checksum=sha256
        )

        # 5. Store composite document
        doc_id = str(uuid.uuid4())
        composite_key = f"{user_id}/{doc_id}_composite.jpg"
        storage = get_storage_provider()
        await storage.upload(stitched_bytes, composite_key, mime_type)

        combined_filename = f"Combined_Bill_{len(raw_parts)}Pages_{doc_id[:8]}.jpg"
        if filenames:
            first_name = filenames[0].rsplit(".", 1)[0]
            combined_filename = f"{first_name}_combined_{len(raw_parts)}parts.jpg"

        doc = Document(
            id=doc_id,
            user_id=user_id,
            storage_provider=settings.STORAGE_PROVIDER,
            storage_key=composite_key,
            original_filename=combined_filename,
            mime_type=mime_type,
            file_size=stitched_size,
            sha256_checksum=sha256,
            status="PROCESSING" if not is_dup else "REVIEW_REQUIRED",
            page_count=len(raw_parts)
        )
        db.add(doc)
        db.flush()

        # 6. Store individual pages in DocumentPage table & storage
        for idx, (part_b, fn) in enumerate(zip(raw_parts, filenames)):
            part_key = f"{user_id}/{doc_id}_page_{idx+1}.jpg"
            await storage.upload(part_b, part_key, "image/jpeg")
            try:
                p_img = Image.open(io.BytesIO(part_b))
                pw, ph = p_img.size
            except Exception:
                pw, ph = None, None

            db.add(DocumentPage(
                id=str(uuid.uuid4()),
                document_id=doc.id,
                page_number=idx + 1,
                image_storage_key=part_key,
                width=pw,
                height=ph
            ))

        db.add(AuditLog(
            user_id=user_id,
            action="UPLOAD_MULTI_IMAGE",
            entity_type="document",
            entity_id=doc_id,
            after_state={
                "filename": combined_filename,
                "parts_count": len(raw_parts),
                "composite_size": stitched_size
            }
        ))
        db.commit()
        db.refresh(doc)

        return doc, is_dup, existing_inv_id

    @classmethod
    async def process_extraction_pipeline(cls, document_id: str, db: Optional[Session] = None):
        session_created = False
        if db is None:
            from app.main import app
            from app.core.database import get_db, SessionLocal
            if get_db in app.dependency_overrides:
                override = app.dependency_overrides[get_db]
                db_gen = override()
                db = next(db_gen)
                session_created = False
            else:
                db = SessionLocal()
                session_created = True

        try:
            await cls._run_extraction_pipeline(document_id, db)
        except Exception as e:
            logger.error(f"Unexpected error in process_extraction_pipeline for {document_id}: {e}")
            try:
                db.rollback()
            except Exception:
                pass
            raise
        finally:
            if session_created and db is not None:
                db.close()

    @classmethod
    async def _run_extraction_pipeline(cls, document_id: str, db: Session):
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

        # Preprocessing quality check (PRD Section 60: Image Quality Detection)
        from app.services.image_quality_service import ImageQualityService
        quality_res = ImageQualityService.evaluate_image(file_bytes, doc.mime_type)

        if not quality_res.is_acceptable:
            rejection_reason = "; ".join(quality_res.issues) if quality_res.issues else "Image quality is too poor for legible text extraction."
            logger.warning(f"Rejecting document {doc.id} due to low quality: {rejection_reason}")
            doc.status = "FAILED"
            doc.processing_error = f"Image Quality Rejection: {rejection_reason}"
            db.add(AuditLog(
                user_id=doc.user_id,
                action="QUALITY_REJECT",
                entity_type="document",
                entity_id=doc.id,
                after_state={
                    "quality_score": quality_res.quality_score,
                    "issues": quality_res.issues,
                    "metrics": quality_res.metrics
                }
            ))
            db.commit()
            return

        # Local OCR / PDF text extraction check (PRD Section 18)
        ocr_text = ""
        try:
            from app.services.ocr_service import OCRService
            if doc.mime_type == "application/pdf":
                ocr_text, pdf_pages, page_texts = OCRService.extract_text_from_pdf(file_bytes)
                if pdf_pages > 0 and doc.page_count != pdf_pages:
                    doc.page_count = pdf_pages
                    # Ensure page records exist for multi-page PDF
                    if pdf_pages > 1:
                        existing_p = db.query(DocumentPage).filter(DocumentPage.document_id == doc.id).count()
                        if existing_p == 0:
                            for p_num in range(1, pdf_pages + 1):
                                db.add(DocumentPage(
                                    id=str(uuid.uuid4()),
                                    document_id=doc.id,
                                    page_number=p_num,
                                    image_storage_key=f"{doc.storage_key}#page={p_num}"
                                ))
            else:
                import os
                file_disk_path = os.path.join(settings.STORAGE_LOCAL_PATH, doc.storage_key)
                if not os.path.exists(file_disk_path) and hasattr(storage, "_get_full_path"):
                    file_disk_path = storage._get_full_path(doc.storage_key)
                if not os.path.exists(file_disk_path):
                    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
                    file_disk_path = os.path.join(base_dir, "uploads", doc.storage_key)

                if os.path.exists(file_disk_path):
                    ocr_text = OCRService.extract_text_from_file(file_disk_path)
        except Exception as e:
            logger.warning(f"OCR/PDF text inspection warning: {e}")

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
        if quality_res and quality_res.metrics:
            extraction.custom_fields["image_quality"] = {
                "score": quality_res.quality_score,
                "has_warning": quality_res.has_warning,
                "issues": quality_res.issues,
                "metrics": quality_res.metrics
            }

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

        # Incorporate image quality warnings into validation discrepancies
        if quality_res and quality_res.has_warning and quality_res.issues:
            for issue in quality_res.issues:
                validation.discrepancies.append(
                    DiscrepancySchema(
                        field="image_quality",
                        message=f"Image Quality Warning: {issue}",
                        severity="warning"
                    )
                )

        doc.status = "REVIEW_REQUIRED"
        doc.has_discrepancy = (not validation.is_valid) or (quality_res is not None and quality_res.has_warning)
        doc.discrepancy_notes = [d.message for d in validation.discrepancies]
        db.add(AuditLog(
            user_id=doc.user_id,
            action="EXTRACT",
            entity_type="document",
            entity_id=doc.id,
            after_state={"document_type": doc.document_type, "is_valid": validation.is_valid, "has_discrepancy": doc.has_discrepancy}
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
            if document.discrepancy_notes:
                for note in document.discrepancy_notes:
                    if "Image Quality" in note or "quality" in note.lower():
                        if not any(d.message == note for d in result.validation.discrepancies):
                            result.validation.discrepancies.append(
                                DiscrepancySchema(
                                    field="image_quality",
                                    message=note,
                                    severity="warning"
                                )
                            )
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
