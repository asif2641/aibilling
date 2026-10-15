from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.schemas.extraction import ExtractionResultSchema

class DocumentUploadResponse(BaseModel):
    id: str
    original_filename: str
    mime_type: str
    file_size: int
    sha256_checksum: str
    status: str
    duplicate_detected: bool = False
    existing_invoice_id: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DocumentStatusResponse(BaseModel):
    id: str
    status: str
    processing_error: Optional[str] = None
    updated_at: datetime

class DocumentPageResponse(BaseModel):
    id: str
    page_number: int
    width: Optional[int] = None
    height: Optional[int] = None
    file_url: str

    model_config = ConfigDict(from_attributes=True)

class DocumentDetailResponse(BaseModel):
    id: str
    user_id: str
    original_filename: str
    mime_type: str
    file_size: int
    page_count: int
    status: str
    document_type: str
    processing_error: Optional[str] = None
    file_url: str
    pages: Optional[List[DocumentPageResponse]] = None
    extraction: Optional[ExtractionResultSchema] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DocumentListResponse(BaseModel):
    items: List[DocumentDetailResponse]
    total: int
    page: int
    page_size: int
