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
    last_invoice_date: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class VendorMergeRequest(BaseModel):
    primary_vendor_id: str
    duplicate_vendor_ids: List[str]
