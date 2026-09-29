from datetime import date, timedelta
from decimal import Decimal
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc

from app.models.invoice import Invoice
from app.models.document import Document
from app.models.vendor import Vendor
from app.models.category import Category
from app.schemas.dashboard import (
    DashboardSummaryResponse, 
    CategorySpendItem, 
    VendorSpendItem, 
    WeeklyTrendItem
)
from app.schemas.report import ReportSummaryResponse, TimelinePoint

class AnalyticsService:
    @staticmethod
    def get_dashboard_summary(user_id: str, db: Session) -> DashboardSummaryResponse:
        today = date.today()
        start_of_week = today - timedelta(days=today.weekday())
        start_of_month = date(today.year, today.month, 1)

        # 1. Total Spend & Count
        total_stats = db.query(
            func.coalesce(func.sum(Invoice.total), Decimal("0.00")),
            func.count(Invoice.id)
        ).filter(Invoice.user_id == user_id).first()

        total_spending = total_stats[0] or Decimal("0.00")
        total_bills = total_stats[1] or 0
        avg_bill = (total_spending / total_bills) if total_bills > 0 else Decimal("0.00")

        # 2. This Week Spend
        this_week = db.query(func.coalesce(func.sum(Invoice.total), Decimal("0.00"))).filter(
            Invoice.user_id == user_id,
            Invoice.invoice_date >= start_of_week
        ).scalar() or Decimal("0.00")

        # 3. This Month Spend
        this_month = db.query(func.coalesce(func.sum(Invoice.total), Decimal("0.00"))).filter(
            Invoice.user_id == user_id,
            Invoice.invoice_date >= start_of_month
        ).scalar() or Decimal("0.00")

        # 4. Spending by Category
        cat_rows = db.query(
            Category.id,
            Category.name,
            Category.color,
            func.coalesce(func.sum(Invoice.total), Decimal("0.00")).label("cat_total"),
            func.count(Invoice.id).label("cat_count")
        ).join(Invoice, Invoice.category_id == Category.id).filter(
            Invoice.user_id == user_id
        ).group_by(Category.id, Category.name, Category.color).all()

        category_spending = []
        for r in cat_rows:
            pct = float((r.cat_total / total_spending) * 100) if total_spending > 0 else 0.0
            category_spending.append(CategorySpendItem(
                category_id=r.id,
                category_name=r.name,
                color=r.color or "#6B7280",
                amount=r.cat_total,
                percentage=round(pct, 1),
                count=r.cat_count
            ))

        # 5. Top Vendors
        top_vendor_rows = db.query(
            Vendor.id,
            Vendor.name,
            func.coalesce(func.sum(Invoice.total), Decimal("0.00")).label("vendor_total"),
            func.count(Invoice.id).label("vendor_count")
        ).join(Invoice, Invoice.vendor_id == Vendor.id).filter(
            Invoice.user_id == user_id
        ).group_by(Vendor.id, Vendor.name).order_by(desc("vendor_total")).limit(5).all()

        top_vendors = [
            VendorSpendItem(
                vendor_id=r.id,
                vendor_name=r.name,
                amount=r.vendor_total,
                bill_count=r.vendor_count
            )
            for r in top_vendor_rows
        ]

        # 6. Weekly Trend (Last 4 Weeks)
        weekly_trend = []
        for w in range(3, -1, -1):
            w_start = start_of_week - timedelta(weeks=w)
            w_end = w_start + timedelta(days=6)
            w_sum = db.query(
                func.coalesce(func.sum(Invoice.total), Decimal("0.00")),
                func.count(Invoice.id)
            ).filter(
                Invoice.user_id == user_id,
                Invoice.invoice_date >= w_start,
                Invoice.invoice_date <= w_end
            ).first()
            weekly_trend.append(WeeklyTrendItem(
                label=f"{w_start.strftime('%d %b')}",
                start_date=w_start.isoformat(),
                amount=w_sum[0] or Decimal("0.00"),
                bill_count=w_sum[1] or 0
            ))

        # 7. Document Status Counts
        doc_counts = db.query(
            Document.status,
            func.count(Document.id)
        ).filter(Document.user_id == user_id).group_by(Document.status).all()
        status_map = {status: count for status, count in doc_counts}

        # 8. Recent 5 Invoices
        recent_invoices = db.query(Invoice).options(
            joinedload(Invoice.vendor),
            joinedload(Invoice.category),
            joinedload(Invoice.items)
        ).filter(Invoice.user_id == user_id).order_by(desc(Invoice.invoice_date)).limit(5).all()

        return DashboardSummaryResponse(
            total_spending=total_spending,
            total_bills=total_bills,
            this_week_spending=this_week,
            this_month_spending=this_month,
            avg_bill_amount=round(avg_bill, 2),
            currency="PKR",
            category_spending=category_spending,
            top_vendors=top_vendors,
            weekly_trend=weekly_trend,
            recent_invoices=recent_invoices,
            status_counts=status_map
        )

    @staticmethod
    def get_report(
        user_id: str, 
        report_type: str, 
        start_date: date, 
        end_date: date, 
        db: Session,
        vendor_id: Optional[str] = None
    ) -> ReportSummaryResponse:
        query = db.query(Invoice).options(
            joinedload(Invoice.vendor),
            joinedload(Invoice.category),
            joinedload(Invoice.items)
        ).filter(
            Invoice.user_id == user_id,
            Invoice.invoice_date >= start_date,
            Invoice.invoice_date <= end_date
        )

        selected_vendor_name = None
        if vendor_id:
            query = query.filter(Invoice.vendor_id == vendor_id)
            v = db.query(Vendor).filter(Vendor.id == vendor_id, Vendor.user_id == user_id).first()
            if v:
                selected_vendor_name = v.name

        invoices = query.order_by(desc(Invoice.invoice_date)).all()

        total_spending = sum((i.total for i in invoices), Decimal("0.00"))
        total_bills = len(invoices)
        avg_bill = (total_spending / total_bills) if total_bills > 0 else Decimal("0.00")

        highest_bill = Decimal("0.00")
        highest_vendor = None
        for inv in invoices:
            if inv.total > highest_bill:
                highest_bill = inv.total
                highest_vendor = inv.vendor.name if inv.vendor else "Unknown"

        # Category breakdown
        cat_map = {}
        for inv in invoices:
            cat_name = inv.category.name if inv.category else "Uncategorized"
            cat_color = inv.category.color if inv.category else "#6B7280"
            if cat_name not in cat_map:
                cat_map[cat_name] = {"total": Decimal("0.00"), "count": 0, "color": cat_color}
            cat_map[cat_name]["total"] += inv.total
            cat_map[cat_name]["count"] += 1

        cat_breakdown = [
            CategorySpendItem(
                category_id=None,
                category_name=name,
                color=data["color"],
                amount=data["total"],
                percentage=round(float((data["total"] / total_spending) * 100), 1) if total_spending > 0 else 0.0,
                count=data["count"]
            )
            for name, data in cat_map.items()
        ]
        cat_breakdown.sort(key=lambda x: x.amount, reverse=True)

        # Vendor breakdown
        ven_map = {}
        for inv in invoices:
            v_name = inv.vendor.name if inv.vendor else "Unknown"
            if v_name not in ven_map:
                ven_map[v_name] = {"total": Decimal("0.00"), "count": 0}
            ven_map[v_name]["total"] += inv.total
            ven_map[v_name]["count"] += 1

        ven_breakdown = [
            VendorSpendItem(
                vendor_id=None,
                vendor_name=name,
                amount=data["total"],
                bill_count=data["count"]
            )
            for name, data in ven_map.items()
        ]
        ven_breakdown.sort(key=lambda x: x.amount, reverse=True)

        # Timeline generation for charting
        timeline: List[TimelinePoint] = []
        delta_days = (end_date - start_date).days
        if delta_days <= 14:  # Daily intervals
            cur = start_date
            while cur <= end_date:
                day_invs = [i for i in invoices if i.invoice_date == cur]
                day_sum = sum((i.total for i in day_invs), Decimal("0.00"))
                timeline.append(TimelinePoint(
                    label=cur.strftime("%a %d %b"),
                    date=cur.isoformat(),
                    amount=day_sum,
                    bill_count=len(day_invs)
                ))
                cur += timedelta(days=1)
        elif delta_days <= 62:  # Weekly intervals
            cur = start_date
            week_idx = 1
            while cur <= end_date:
                w_end = min(cur + timedelta(days=6), end_date)
                w_invs = [i for i in invoices if cur <= i.invoice_date <= w_end]
                w_sum = sum((i.total for i in w_invs), Decimal("0.00"))
                timeline.append(TimelinePoint(
                    label=f"W{week_idx} ({cur.strftime('%d %b')})",
                    date=cur.isoformat(),
                    amount=w_sum,
                    bill_count=len(w_invs)
                ))
                cur = w_end + timedelta(days=1)
                week_idx += 1
        else:  # Monthly intervals
            y = start_date.year
            m = start_date.month
            while (y < end_date.year) or (y == end_date.year and m <= end_date.month):
                m_invs = [i for i in invoices if i.invoice_date.year == y and i.invoice_date.month == m]
                m_sum = sum((i.total for i in m_invs), Decimal("0.00"))
                m_date = date(y, m, 1)
                timeline.append(TimelinePoint(
                    label=m_date.strftime("%b %Y"),
                    date=m_date.isoformat(),
                    amount=m_sum,
                    bill_count=len(m_invs)
                ))
                if m == 12:
                    y += 1
                    m = 1
                else:
                    m += 1

        return ReportSummaryResponse(
            report_type=report_type,
            start_date=start_date,
            end_date=end_date,
            selected_vendor_id=vendor_id,
            selected_vendor_name=selected_vendor_name,
            total_spending=total_spending,
            total_bills=total_bills,
            avg_bill_amount=round(avg_bill, 2),
            highest_bill_amount=highest_bill,
            highest_bill_vendor=highest_vendor,
            currency="PKR",
            category_breakdown=cat_breakdown,
            vendor_breakdown=ven_breakdown,
            timeline=timeline,
            invoices=invoices
        )
