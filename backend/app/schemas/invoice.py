from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import date, datetime
from decimal import Decimal

class InvoiceItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    sku: Optional[str] = None
    quantity: Decimal = Decimal("1.000")
    unit: Optional[str] = None
    unit_price: Decimal = Decimal("0.00")
    discount: Decimal = Decimal("0.00")
    tax: Decimal = Decimal("0.00")
    line_total: Decimal = Decimal("0.00")
    confidence: float = 1.0
    bounding_box: Optional[Dict[str, Any]] = None

class InvoiceItemCreate(InvoiceItemBase):
    pass

class InvoiceItemResponse(InvoiceItemBase):
    id: str
    item_order: int

    model_config = ConfigDict(from_attributes=True)

class InvoiceBase(BaseModel):
    invoice_number: Optional[str] = None
    receipt_number: Optional[str] = None
    order_number: Optional[str] = None
    invoice_date: date
    due_date: Optional[date] = None
    currency: str = "PKR"
    
    subtotal: Decimal = Decimal("0.00")
    discount: Decimal = Decimal("0.00")
    tax: Decimal = Decimal("0.00")
    service_charge: Decimal = Decimal("0.00")
    shipping: Decimal = Decimal("0.00")
    rounding: Decimal = Decimal("0.00")
    total: Decimal = Decimal("0.00")
    amount_paid: Decimal = Decimal("0.00")
    balance_due: Decimal = Decimal("0.00")

    payment_method: Optional[str] = None
    category_id: Optional[str] = None
    notes: Optional[str] = None
    has_discrepancy: bool = False
    discrepancy_count: int = 0
    discrepancy_notes: List[str] = []
    custom_fields: Dict[str, Any] = {}

class InvoiceVerificationRequest(InvoiceBase):
    document_id: Optional[str] = None
    vendor_name: str
    vendor_phone: Optional[str] = None
    vendor_address: Optional[str] = None
    vendor_ntn: Optional[str] = None
    vendor_strn: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    customer_address: Optional[str] = None
    items: List[InvoiceItemCreate] = []

class InvoiceUpdate(BaseModel):
    vendor_name: Optional[str] = None
    vendor_id: Optional[str] = None
    customer_name: Optional[str] = None
    customer_id: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    customer_address: Optional[str] = None
    invoice_number: Optional[str] = None
    invoice_date: Optional[date] = None
    due_date: Optional[date] = None
    currency: Optional[str] = None
    category_id: Optional[str] = None
    subtotal: Optional[Decimal] = None
    discount: Optional[Decimal] = None
    tax: Optional[Decimal] = None
    service_charge: Optional[Decimal] = None
    shipping: Optional[Decimal] = None
    rounding: Optional[Decimal] = None
    total: Optional[Decimal] = None
    amount_paid: Optional[Decimal] = None
    balance_due: Optional[Decimal] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None
    verification_status: Optional[str] = None
    custom_fields: Optional[Dict[str, Any]] = None
    items: Optional[List[InvoiceItemCreate]] = None

class VendorBrief(BaseModel):
    id: str
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    ntn: Optional[str] = None
    strn: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class CustomerBrief(BaseModel):
    id: str
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class CategoryBrief(BaseModel):
    id: str
    name: str
    color: str
    icon: str

    model_config = ConfigDict(from_attributes=True)

class InvoiceResponse(InvoiceBase):
    id: str
    user_id: str
    document_id: Optional[str] = None
    vendor_id: Optional[str] = None
    customer_id: Optional[str] = None
    vendor: Optional[VendorBrief] = None
    customer: Optional[CustomerBrief] = None
    category: Optional[CategoryBrief] = None
    confidence_score: float
    verification_status: str
    items: List[InvoiceItemResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class InvoiceListResponse(BaseModel):
    items: List[InvoiceResponse]
    total: int
    page: int
    page_size: int
    total_spend: Decimal
    incorrect_count: int = 0
    clean_count: int = 0
