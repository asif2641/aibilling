from typing import List, Optional
from fastapi import (
    APIRouter, 
    Depends, 
    UploadFile, 
    File, 
    BackgroundTasks, 
    HTTPException, 
    status, 
    Response, 
    Query
)
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.document import Document, DocumentPage
from app.services.document_service import DocumentService
from app.providers.storage import get_storage_provider
from app.schemas.document import (
    DocumentUploadResponse, 
    DocumentStatusResponse, 
    DocumentDetailResponse, 
    DocumentListResponse,
    DocumentPageResponse
)

router = APIRouter()

@router.post("/upload", response_model=DocumentUploadResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    doc, is_dup, existing_inv_id = await DocumentService.ingest_document(
        user_id=user_id,
        file=file,
        db=db
    )

    # Enqueue background extraction with isolated session lifecycle
    background_tasks.add_task(DocumentService.process_extraction_pipeline, doc.id)

    return DocumentUploadResponse(
        id=doc.id,
        original_filename=doc.original_filename,
        mime_type=doc.mime_type,
        file_size=doc.file_size,
        sha256_checksum=doc.sha256_checksum,
        status=doc.status,
        duplicate_detected=is_dup,
        existing_invoice_id=existing_inv_id,
        created_at=doc.created_at
    )

@router.post("/upload-multi", response_model=DocumentUploadResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_multi_image_document(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Upload and stitch multiple photos/pages belonging to ONE single long receipt or bill.
    Combines all parts into a single consolidated document, extracts items across all parts,
    and returns a single unified document ID.
    """
    if not files or len(files) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="At least one image file is required.")

    if len(files) == 1:
        doc, is_dup, existing_inv_id = await DocumentService.ingest_document(
            user_id=user_id,
            file=files[0],
            db=db
        )
    else:
        doc, is_dup, existing_inv_id = await DocumentService.ingest_multi_image_document(
            user_id=user_id,
            files=files,
            db=db
        )

    # Enqueue background extraction with isolated session lifecycle
    background_tasks.add_task(DocumentService.process_extraction_pipeline, doc.id)

    return DocumentUploadResponse(
        id=doc.id,
        original_filename=doc.original_filename,
        mime_type=doc.mime_type,
        file_size=doc.file_size,
        sha256_checksum=doc.sha256_checksum,
        status=doc.status,
        duplicate_detected=is_dup,
        existing_invoice_id=existing_inv_id,
        created_at=doc.created_at
    )

@router.get("/{document_id}/status", response_model=DocumentStatusResponse)
def get_document_status(
    document_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == user_id
    ).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    
    return DocumentStatusResponse(
        id=doc.id,
        status=doc.status,
        processing_error=doc.processing_error,
        updated_at=doc.updated_at
    )

@router.get("/{document_id}", response_model=DocumentDetailResponse)
async def get_document_detail(
    document_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == user_id
    ).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    extraction = await DocumentService.get_document_review(doc, db)

    page_items = [
        DocumentPageResponse(
            id=p.id,
            page_number=p.page_number,
            width=p.width,
            height=p.height,
            file_url=f"/api/v1/documents/{doc.id}/pages/{p.page_number}/file"
        )
        for p in sorted(doc.pages, key=lambda x: x.page_number)
    ] if doc.pages else None

    return DocumentDetailResponse(
        id=doc.id,
        user_id=doc.user_id,
        original_filename=doc.original_filename,
        mime_type=doc.mime_type,
        file_size=doc.file_size,
        page_count=doc.page_count,
        status=doc.status,
        document_type=doc.document_type,
        processing_error=doc.processing_error,
        file_url=f"/api/v1/documents/{doc.id}/file",
        pages=page_items,
        extraction=extraction,
        created_at=doc.created_at,
        updated_at=doc.updated_at
    )

@router.get("/{document_id}/pages", response_model=List[DocumentPageResponse])
def get_document_pages(
    document_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == user_id
    ).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    return [
        DocumentPageResponse(
            id=p.id,
            page_number=p.page_number,
            width=p.width,
            height=p.height,
            file_url=f"/api/v1/documents/{doc.id}/pages/{p.page_number}/file"
        )
        for p in sorted(doc.pages, key=lambda x: x.page_number)
    ]

@router.get("/{document_id}/pages/{page_number}/file")
async def get_document_page_file(
    document_id: str,
    page_number: int,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == user_id
    ).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    page = db.query(DocumentPage).filter(
        DocumentPage.document_id == document_id,
        DocumentPage.page_number == page_number
    ).first()
    if not page:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page not found")

    storage = get_storage_provider()
    try:
        data = await storage.get(page.image_storage_key)
        headers = {
            "Content-Disposition": f'inline; filename="{doc.original_filename}_page_{page_number}.jpg"',
            "Cache-Control": "private, max-age=3600"
        }
        return Response(content=data, media_type="image/jpeg", headers=headers)
    except FileNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page file binary not found on storage")

@router.get("/{document_id}/file")
async def get_document_file(
    document_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == user_id
    ).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    storage = get_storage_provider()
    try:
        data = await storage.get(doc.storage_key)
        headers = {
            "Content-Disposition": f'inline; filename="{doc.original_filename}"',
            "Cache-Control": "private, max-age=3600"
        }
        return Response(content=data, media_type=doc.mime_type, headers=headers)
    except FileNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File binary not found on storage")

from pydantic import BaseModel
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class AISettingsResponse(BaseModel):
    ai_provider: str
    gemini_api_key_configured: bool
    gemini_api_key_masked: str
    gemini_model: str

class AISettingsUpdateRequest(BaseModel):
    ai_provider: Optional[str] = None
    gemini_api_key: Optional[str] = None
    gemini_model: Optional[str] = None

@router.get("/ai-settings", response_model=AISettingsResponse)
def get_ai_settings(
    user_id: str = Depends(get_current_user_id),
):
    key = settings.GEMINI_API_KEY or ""
    masked = ""
    if key:
        masked = key[:4] + "..." + key[-4:] if len(key) > 8 else "***"
    return AISettingsResponse(
        ai_provider=settings.AI_PROVIDER,
        gemini_api_key_configured=bool(key),
        gemini_api_key_masked=masked,
        gemini_model=settings.GEMINI_MODEL or "gemini-1.5-flash"
    )

@router.post("/ai-settings", response_model=AISettingsResponse)
def update_ai_settings(
    req: AISettingsUpdateRequest,
    user_id: str = Depends(get_current_user_id),
):
    import os
    if req.ai_provider is not None:
        settings.AI_PROVIDER = req.ai_provider
    if req.gemini_api_key is not None:
        settings.GEMINI_API_KEY = req.gemini_api_key.strip()
    if req.gemini_model is not None:
        settings.GEMINI_MODEL = req.gemini_model.strip()

    # Persist to backend/.env
    backend_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    env_path = os.path.join(backend_root, ".env")
    if os.path.exists(env_path):
        try:
            with open(env_path, "r", encoding="utf-8") as f:
                lines = f.readlines()
            new_lines = []
            found_provider = False
            found_key = False
            found_model = False
            for line in lines:
                if line.startswith("AI_PROVIDER="):
                    new_lines.append(f"AI_PROVIDER={settings.AI_PROVIDER}\n")
                    found_provider = True
                elif line.startswith("GEMINI_API_KEY="):
                    new_lines.append(f"GEMINI_API_KEY={settings.GEMINI_API_KEY}\n")
                    found_key = True
                elif line.startswith("GEMINI_MODEL="):
                    new_lines.append(f"GEMINI_MODEL={settings.GEMINI_MODEL}\n")
                    found_model = True
                else:
                    new_lines.append(line)
            if not found_provider:
                new_lines.append(f"AI_PROVIDER={settings.AI_PROVIDER}\n")
            if not found_key:
                new_lines.append(f"GEMINI_API_KEY={settings.GEMINI_API_KEY}\n")
            if not found_model:
                new_lines.append(f"GEMINI_MODEL={settings.GEMINI_MODEL}\n")
            with open(env_path, "w", encoding="utf-8") as f:
                f.writelines(new_lines)
        except Exception as e:
            logger.error(f"Failed to persist .env AI settings: {e}")

    key = settings.GEMINI_API_KEY or ""
    masked = key[:4] + "..." + key[-4:] if len(key) > 8 else ("***" if key else "")
    return AISettingsResponse(
        ai_provider=settings.AI_PROVIDER,
        gemini_api_key_configured=bool(key),
        gemini_api_key_masked=masked,
        gemini_model=settings.GEMINI_MODEL or "gemini-1.5-flash"
    )

@router.post("/{document_id}/reprocess", status_code=status.HTTP_200_OK)
async def reprocess_document(
    document_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == user_id
    ).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    doc.status = "PROCESSING"
    doc.processing_error = None
    db.commit()

    # Synchronously execute extraction pipeline so database is fresh before returning
    await DocumentService.process_extraction_pipeline(doc.id, db)
    db.refresh(doc)
    return {"message": "Reprocessing complete", "status": doc.status}

@router.get("", response_model=DocumentListResponse)
def list_documents(
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    query = db.query(Document).filter(Document.user_id == user_id)
    if status:
        query = query.filter(Document.status == status)

    total = query.count()
    docs = query.order_by(Document.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    items = [
        DocumentDetailResponse(
            id=d.id,
            user_id=d.user_id,
            original_filename=d.original_filename,
            mime_type=d.mime_type,
            file_size=d.file_size,
            page_count=d.page_count,
            status=d.status,
            document_type=d.document_type,
            processing_error=d.processing_error,
            file_url=f"/api/v1/documents/{d.id}/file",
            extraction=None,
            created_at=d.created_at,
            updated_at=d.updated_at
        )
        for d in docs
    ]

    return DocumentListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size
    )
