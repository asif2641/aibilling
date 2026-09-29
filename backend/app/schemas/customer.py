from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

class CustomerBase(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None

class CustomerResponse(CustomerBase):
    id: str
    created_at: datetime
    updated_at: datetime
    total_invoices: int = 0
    total_spend: Decimal = Decimal("0.00")
    last_purchase_date: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class CustomerInvoiceItem(BaseModel):
    id: str
    invoice_number: Optional[str] = None
    invoice_date: str
    total: Decimal
    currency: str
    vendor_name: Optional[str] = None
    status: str

    model_config = ConfigDict(from_attributes=True)

class CustomerDetailResponse(CustomerResponse):
    invoices: List[CustomerInvoiceItem] = []
