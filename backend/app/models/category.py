import uuid
from sqlalchemy import Column, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Category(Base):
    __tablename__ = "categories"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    name = Column(String(100), nullable=False)
    color = Column(String(20), default="#6B7280", nullable=False)
    icon = Column(String(50), default="tag", nullable=False)
    is_default = Column(Boolean, default=False, nullable=False)

    user = relationship("User", back_populates="categories")
    invoices = relationship("Invoice", back_populates="category")
