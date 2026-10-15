from datetime import date, timedelta
from typing import Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, Query, Response, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.services.analytics_service import AnalyticsService
from app.services.invoice_service import InvoiceService
from app.services.export_service import ExportService
from app.schemas.report import ReportSummaryResponse

router = APIRouter()

@router.get("/summary", response_model=ReportSummaryResponse)
def get_report_summary(
    report_type: str = Query("monthly", pattern="^(weekly|monthly|yearly|custom)$"),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    vendor_id: Optional[str] = Query(None),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    today = date.today()
    if report_type == "weekly":
        start_date = today - timedelta(days=today.weekday())
        end_date = start_date + timedelta(days=6)
    elif report_type == "monthly":
        start_date = date(today.year, today.month, 1)
        next_month = date(today.year + (1 if today.month == 12 else 0), 1 if today.month == 12 else today.month + 1, 1)
        end_date = next_month - timedelta(days=1)
    elif report_type == "yearly":
        start_date = date(today.year, 1, 1)
        end_date = date(today.year, 12, 31)
    else: # custom
        if not start_date or not end_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Custom reports require both start_date and end_date"
            )

    return AnalyticsService.get_report(
        user_id=user_id,
        report_type=report_type,
        start_date=start_date,
        end_date=end_date,
        db=db,
        vendor_id=vendor_id
    )

@router.get("/export")
def export_invoices(
    format: str = Query("csv", pattern="^(csv|xlsx|pdf)$"),
    search: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    vendor_id: Optional[str] = None,
    customer_id: Optional[str] = None,
    category_id: Optional[str] = None,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    items, *_ = InvoiceService.get_invoices(
        db=db,
        user_id=user_id,
        search=search,
        start_date=start_date,
        end_date=end_date,
        vendor_id=vendor_id,
        customer_id=customer_id,
        category_id=category_id,
        page=1,
        page_size=10000 # full export
    )

    if format == "csv":
        data = ExportService.export_csv(items)
        return Response(
            content=data.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=bills_export_{date.today().isoformat()}.csv"}
        )
    elif format == "xlsx":
        data = ExportService.export_excel(items)
        return Response(
            content=data.getvalue(),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=bills_export_{date.today().isoformat()}.xlsx"}
        )
    else:  # pdf
        filter_meta = {
            "start_date": start_date.isoformat() if start_date else None,
            "end_date": end_date.isoformat() if end_date else None,
            "search": search,
        }
        data = ExportService.export_pdf(items, filter_meta=filter_meta)
        return Response(
            content=data.getvalue(),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=bills_report_{date.today().isoformat()}.pdf"}
        )
