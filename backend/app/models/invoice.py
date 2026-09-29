import uuid
from datetime import datetime, timezone, date
from decimal import Decimal
from sqlalchemy import Column, String, Date, DateTime, ForeignKey, Text, Numeric, Float, JSON, Integer
from sqlalchemy.orm import relationship
from app.core.database import Base

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="SET NULL"), nullable=True, index=True)
    vendor_id = Column(String(36), ForeignKey("vendors.id", ondelete="SET NULL"), nullable=True, index=True)
    customer_id = Column(String(36), ForeignKey("customers.id", ondelete="SET NULL"), nullable=True, index=True)
    category_id = Column(String(36), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True)

    invoice_number = Column(String(100), nullable=True, index=True)
    receipt_number = Column(String(100), nullable=True)
    order_number = Column(String(100), nullable=True)
    invoice_date = Column(Date, default=date.today, nullable=False, index=True)
    due_date = Column(Date, nullable=True)
    currency = Column(String(3), default="PKR", nullable=False)

    # Financial totals with exact Decimal representation
    subtotal = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    discount = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    tax = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    service_charge = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    shipping = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    rounding = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    total = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False, index=True)
    amount_paid = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    balance_due = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)

    payment_method = Column(String(50), nullable=True)
    confidence_score = Column(Float, default=1.0, nullable=False)
    verification_status = Column(String(50), default="UNVERIFIED", nullable=False, index=True) # UNVERIFIED, VERIFIED, REJECTED
    custom_fields = Column(JSON, default=dict, nullable=False)
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", back_populates="invoices")
    document = relationship("Document", back_populates="invoice")
    vendor = relationship("Vendor", back_populates="invoices")
    customer = relationship("Customer", back_populates="invoices")
    category = relationship("Category", back_populates="invoices")
    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan", order_by="InvoiceItem.item_order")

class InvoiceItem(Base):
    __tablename__ = "invoice_items"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    invoice_id = Column(String(36), ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False, index=True)
    item_order = Column(Integer, default=0, nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    sku = Column(String(100), nullable=True)
    quantity = Column(Numeric(10, 3), default=Decimal("1.000"), nullable=False)
    unit = Column(String(50), nullable=True)
    unit_price = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    discount = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    tax = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    line_total = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    confidence = Column(Float, default=1.0, nullable=False)
    bounding_box = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    invoice = relationship("Invoice", back_populates="items")
