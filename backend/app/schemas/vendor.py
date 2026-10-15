from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

class VendorBase(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    website: Optional[str] = None
    tax_id: Optional[str] = None
    ntn: Optional[str] = None
    strn: Optional[str] = None

class VendorCreate(VendorBase):
    pass

class VendorResponse(VendorBase):
    id: str
    normalized_name: str
    total_invoices: int = 0
    total_spend: Decimal = Decimal("0.00")
    incorrect_invoices_count: int = 0
    last_invoice_date: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class VendorInvoiceItem(BaseModel):
    id: str
    invoice_number: Optional[str] = None
    invoice_date: str
    total: Decimal
    currency: str
    customer_name: Optional[str] = None
    customer_id: Optional[str] = None
    status: str
    category_name: Optional[str] = None
    items_count: int = 0
    notes: Optional[str] = None
    document_id: Optional[str] = None
    has_discrepancy: bool = False
    discrepancy_notes: List[str] = []

    model_config = ConfigDict(from_attributes=True)

class VendorDetailResponse(VendorResponse):
    invoices: List[VendorInvoiceItem] = []

class VendorMergeRequest(BaseModel):
    primary_vendor_id: str
    duplicate_vendor_ids: List[str]

