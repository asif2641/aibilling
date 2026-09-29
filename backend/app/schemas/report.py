from pydantic import BaseModel
from typing import List, Optional
from decimal import Decimal
from datetime import date
from app.schemas.dashboard import CategorySpendItem, VendorSpendItem
from app.schemas.invoice import InvoiceResponse

class TimelinePoint(BaseModel):
    label: str
    date: str
    amount: Decimal
    bill_count: int

class ReportSummaryResponse(BaseModel):
    report_type: str  # weekly | monthly | yearly | custom
    start_date: date
    end_date: date
    selected_vendor_id: Optional[str] = None
    selected_vendor_name: Optional[str] = None
    total_spending: Decimal
    total_bills: int
    avg_bill_amount: Decimal
    highest_bill_amount: Decimal
    highest_bill_vendor: Optional[str] = None
    currency: str
    
    category_breakdown: List[CategorySpendItem]
    vendor_breakdown: List[VendorSpendItem]
    timeline: List[TimelinePoint] = []
    invoices: List[InvoiceResponse]
