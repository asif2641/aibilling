import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    storage_provider = Column(String(50), default="local", nullable=False)
    storage_key = Column(String(500), nullable=False)
    original_filename = Column(String(255), nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_size = Column(Integer, nullable=False)
    sha256_checksum = Column(String(64), nullable=False, index=True)
    document_type = Column(String(50), default="unknown", nullable=False)
    status = Column(String(50), default="UPLOADED", nullable=False, index=True) 
    # Statuses: UPLOADED, PROCESSING, EXTRACTED, REVIEW_REQUIRED, VERIFIED, FAILED, ARCHIVED
    page_count = Column(Integer, default=1, nullable=False)
    has_discrepancy = Column(Boolean, default=False, nullable=False, index=True)
    discrepancy_notes = Column(JSON, default=list, nullable=False)
    processing_error = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", back_populates="documents")
    pages = relationship("DocumentPage", back_populates="document", cascade="all, delete-orphan")
    extraction_fields = relationship("ExtractionField", back_populates="document", cascade="all, delete-orphan")
    invoice = relationship("Invoice", back_populates="document", uselist=False)

class DocumentPage(Base):
    __tablename__ = "document_pages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    page_number = Column(Integer, nullable=False)
    image_storage_key = Column(String(500), nullable=False)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    document = relationship("Document", back_populates="pages")

class ExtractionField(Base):
    __tablename__ = "extraction_fields"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    field_name = Column(String(100), nullable=False)
    field_value = Column(Text, nullable=True)
    normalized_value = Column(Text, nullable=True)
    confidence = Column(Float, default=1.0, nullable=False)
    source_text = Column(Text, nullable=True)
    page_number = Column(Integer, default=1, nullable=False)
    bounding_box = Column(JSON, nullable=True)  # {"x": 0.1, "y": 0.2, "width": 0.3, "height": 0.05}
    validation_status = Column(String(50), default="valid", nullable=False)
    user_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    document = relationship("Document", back_populates="extraction_fields")
