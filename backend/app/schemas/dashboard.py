from pydantic import BaseModel
from typing import List, Optional
from decimal import Decimal
from datetime import date
from app.schemas.invoice import InvoiceResponse

class CategorySpendItem(BaseModel):
    category_id: Optional[str]
    category_name: str
    color: str
    amount: Decimal
    percentage: float
    count: int

class VendorSpendItem(BaseModel):
    vendor_id: Optional[str]
    vendor_name: str
    amount: Decimal
    bill_count: int

class WeeklyTrendItem(BaseModel):
    label: str  # e.g. "Week 38" or "2026-09-21"
    start_date: str
    amount: Decimal
    bill_count: int

class MonthlyTrendItem(BaseModel):
    month: str  # e.g. "2026-09"
    amount: Decimal
    bill_count: int

class DashboardSummaryResponse(BaseModel):
    total_spending: Decimal
    total_bills: int
    this_week_spending: Decimal
    this_month_spending: Decimal
    avg_bill_amount: Decimal
    currency: str
    
    # Breakdowns
    category_spending: List[CategorySpendItem]
    top_vendors: List[VendorSpendItem]
    weekly_trend: List[WeeklyTrendItem]
    recent_invoices: List[InvoiceResponse]

    # Processing state counts
    status_counts: dict
    incorrect_bills_count: int = 0
