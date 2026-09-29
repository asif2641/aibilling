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
from app.models.document import Document
from app.services.document_service import DocumentService
from app.providers.storage import get_storage_provider
from app.schemas.document import (
    DocumentUploadResponse, 
    DocumentStatusResponse, 
    DocumentDetailResponse, 
    DocumentListResponse
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

    # Enqueue background extraction
    background_tasks.add_task(DocumentService.process_extraction_pipeline, doc.id, db)

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
        extraction=extraction,
        created_at=doc.created_at,
        updated_at=doc.updated_at
    )

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

@router.post("/{document_id}/reprocess", status_code=status.HTTP_202_ACCEPTED)
async def reprocess_document(
    document_id: str,
    background_tasks: BackgroundTasks,
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

    background_tasks.add_task(DocumentService.process_extraction_pipeline, doc.id, db)
    return {"message": "Reprocessing started", "status": "PROCESSING"}

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
