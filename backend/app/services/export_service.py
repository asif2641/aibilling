import io
import csv
from typing import List, Optional, Dict, Any
from datetime import datetime, date
import pandas as pd
import xml.sax.saxutils
from app.models.invoice import Invoice

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas that dynamically calculates total page count
    and renders consistent running headers and footers on every page.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_decorations(self, page_count: int):
        self.saveState()
        # Header accent bar
        self.setFillColor(colors.HexColor("#312e81"))
        self.rect(0, A4[1] - 6, A4[0], 6, fill=True, stroke=False)

        # Footer separator line
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.75)
        self.line(30, 32, A4[0] - 30, 32)

        # Running Footer text
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        self.drawString(30, 20, "AI Bill Intelligence & Expense Platform  •  Verified Financial Audit Ledger")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(A4[0] - 30, 20, page_str)
        self.restoreState()


class ExportService:
    @staticmethod
    def invoices_to_rows(invoices: List[Invoice]) -> List[dict]:
        rows = []
        for inv in invoices:
            rows.append({
                "Date": inv.invoice_date.isoformat(),
                "Vendor": inv.vendor.name if inv.vendor else "Unknown",
                "Invoice Number": inv.invoice_number or "",
                "Receipt Number": inv.receipt_number or "",
                "Category": inv.category.name if inv.category else "Uncategorized",
                "Payment Method": inv.payment_method or "",
                "Currency": inv.currency,
                "Subtotal": float(inv.subtotal),
                "Discount": float(inv.discount),
                "Tax (GST)": float(inv.tax),
                "Service Charge": float(inv.service_charge),
                "Total": float(inv.total),
                "Items Count": len(inv.items),
                "Status": inv.verification_status,
                "Created At": inv.created_at.strftime("%Y-%m-%d %H:%M:%S")
            })
        return rows

    @classmethod
    def export_csv(cls, invoices: List[Invoice]) -> io.BytesIO:
        rows = cls.invoices_to_rows(invoices)
        output = io.StringIO()
        if rows:
            writer = csv.DictWriter(output, fieldnames=list(rows[0].keys()))
            writer.writeheader()
            writer.writerows(rows)
        else:
            output.write("Date,Vendor,Invoice Number,Total\n")
        
        mem = io.BytesIO()
        mem.write(output.getvalue().encode("utf-8-sig"))
        mem.seek(0)
        return mem

    @classmethod
    def export_excel(cls, invoices: List[Invoice]) -> io.BytesIO:
        rows = cls.invoices_to_rows(invoices)
        df = pd.DataFrame(rows)
        
        mem = io.BytesIO()
        with pd.ExcelWriter(mem, engine="openpyxl") as writer:
            df.to_excel(writer, index=False, sheet_name="Invoices")
            # Items sheet
            item_rows = []
            for inv in invoices:
                for item in inv.items:
                    item_rows.append({
                        "Invoice Number": inv.invoice_number or "",
                        "Invoice Date": inv.invoice_date.isoformat(),
                        "Vendor": inv.vendor.name if inv.vendor else "",
                        "Item Name": item.name,
                        "Quantity": float(item.quantity),
                        "Unit": item.unit or "",
                        "Unit Price": float(item.unit_price),
                        "Line Total": float(item.line_total)
                    })
            if item_rows:
                pd.DataFrame(item_rows).to_excel(writer, index=False, sheet_name="Line Items")
        mem.seek(0)
        return mem

    @classmethod
    def export_pdf(
        cls, 
        invoices: List[Invoice], 
        filter_meta: Optional[Dict[str, Any]] = None
    ) -> io.BytesIO:
        """
        Generate a publication-grade, verified PDF report containing
        executive financial KPIs and full detailed invoices table.
        """
        mem = io.BytesIO()
        doc = SimpleDocTemplate(
            mem,
            pagesize=A4,
            leftMargin=30,
            rightMargin=30,
            topMargin=32,
            bottomMargin=42
        )

        styles = getSampleStyleSheet()
        
        title_style = ParagraphStyle(
            "ReportTitle",
            parent=styles["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=16,
            leading=20,
            textColor=colors.HexColor("#1e1b4b"),
            spaceAfter=2
        )
        subtitle_style = ParagraphStyle(
            "ReportSub",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#475569"),
            spaceAfter=12
        )
        kpi_title_style = ParagraphStyle(
            "KPITitle",
            fontName="Helvetica",
            fontSize=7.5,
            leading=9,
            textColor=colors.HexColor("#64748b"),
            alignment=TA_CENTER
        )
        kpi_value_style = ParagraphStyle(
            "KPIVal",
            fontName="Helvetica-Bold",
            fontSize=11,
            leading=14,
            textColor=colors.HexColor("#0f172a"),
            alignment=TA_CENTER
        )
        th_style = ParagraphStyle(
            "TH",
            fontName="Helvetica-Bold",
            fontSize=7.5,
            leading=9,
            textColor=colors.white,
            alignment=TA_LEFT
        )
        th_right_style = ParagraphStyle(
            "THRight",
            parent=th_style,
            alignment=TA_RIGHT
        )
        td_style = ParagraphStyle(
            "TD",
            fontName="Helvetica",
            fontSize=7.5,
            leading=9.5,
            textColor=colors.HexColor("#1e293b")
        )
        td_bold_style = ParagraphStyle(
            "TDBold",
            fontName="Helvetica-Bold",
            fontSize=7.5,
            leading=9.5,
            textColor=colors.HexColor("#0f172a")
        )
        td_right_style = ParagraphStyle(
            "TDRight",
            parent=td_style,
            alignment=TA_RIGHT
        )
        td_right_bold_style = ParagraphStyle(
            "TDRightBold",
            parent=td_bold_style,
            alignment=TA_RIGHT
        )
        badge_clean = ParagraphStyle(
            "BadgeClean",
            fontName="Helvetica-Bold",
            fontSize=6.5,
            leading=8,
            textColor=colors.HexColor("#065f46")
        )
        badge_error = ParagraphStyle(
            "BadgeError",
            fontName="Helvetica-Bold",
            fontSize=6.5,
            leading=8,
            textColor=colors.HexColor("#991b1b")
        )

        elements = []

        # 1. Header & Branding
        elements.append(Paragraph("AI BILL INTELLIGENCE &amp; EXPENSE PLATFORM", title_style))
        gen_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        date_range_str = "All Time"
        if filter_meta:
            s_d = filter_meta.get("start_date")
            e_d = filter_meta.get("end_date")
            if s_d and e_d:
                date_range_str = f"{s_d} to {e_d}"
            elif s_d:
                date_range_str = f"From {s_d}"
            elif e_d:
                date_range_str = f"Until {e_d}"

        sub_text = f"Financial Expenses &amp; Ledger Audit Report &nbsp;|&nbsp; Period: <b>{date_range_str}</b> &nbsp;|&nbsp; Generated: {gen_time}"
        elements.append(Paragraph(sub_text, subtitle_style))

        # 2. Key Performance Indicators (KPI Cards)
        total_spending = sum(float(inv.total or 0.0) for inv in invoices)
        total_bills = len(invoices)
        discrepancy_count = sum(1 for inv in invoices if getattr(inv, "has_discrepancy", False))
        clean_count = total_bills - discrepancy_count
        currency = invoices[0].currency if invoices else (filter_meta.get("currency") if filter_meta else "PKR")

        kpi_data = [
            [
                Paragraph("TOTAL SPENDING", kpi_title_style),
                Paragraph("TOTAL BILLS", kpi_title_style),
                Paragraph("VERIFIED / CLEAN", kpi_title_style),
                Paragraph("DISCREPANCIES", kpi_title_style),
            ],
            [
                Paragraph(f"{currency} {total_spending:,.2f}", kpi_value_style),
                Paragraph(f"{total_bills:,}", kpi_value_style),
                Paragraph(f"{clean_count:,}", kpi_value_style),
                Paragraph(f"{discrepancy_count:,}", kpi_value_style),
            ]
        ]
        kpi_table = Table(kpi_data, colWidths=[140, 125, 135, 130])
        kpi_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#e2e8f0")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]))
        elements.append(kpi_table)
        elements.append(Spacer(1, 14))

        # 3. Detailed Invoices Table
        # Column widths total: 20 + 55 + 145 + 75 + 85 + 75 + 80 = 535 pt (A4 printable width)
        table_rows = [
            [
                Paragraph("#", th_style),
                Paragraph("Date", th_style),
                Paragraph("Vendor / Business", th_style),
                Paragraph("Invoice #", th_style),
                Paragraph("Category", th_style),
                Paragraph("Status", th_style),
                Paragraph("Total", th_right_style),
            ]
        ]

        if not invoices:
            table_rows.append([
                Paragraph("1", td_style),
                Paragraph("-", td_style),
                Paragraph("No invoices found for the specified criteria.", td_style),
                Paragraph("-", td_style),
                Paragraph("-", td_style),
                Paragraph("-", td_style),
                Paragraph(f"{currency} 0.00", td_right_style),
            ])
        else:
            for idx, inv in enumerate(invoices, start=1):
                vendor_name = xml.sax.saxutils.escape(inv.vendor.name if inv.vendor else "Unknown Vendor")
                inv_no = xml.sax.saxutils.escape(inv.invoice_number or inv.receipt_number or "—")
                cat_name = xml.sax.saxutils.escape(inv.category.name if inv.category else "General")
                has_disc = getattr(inv, "has_discrepancy", False)

                if has_disc:
                    status_p = Paragraph("DISCREPANCY", badge_error)
                elif inv.verification_status == "VERIFIED":
                    status_p = Paragraph("VERIFIED", badge_clean)
                else:
                    status_p = Paragraph("REVIEW REQ", badge_error)

                table_rows.append([
                    Paragraph(str(idx), td_style),
                    Paragraph(inv.invoice_date.strftime("%Y-%m-%d"), td_style),
                    Paragraph(vendor_name, td_bold_style),
                    Paragraph(inv_no, td_style),
                    Paragraph(cat_name, td_style),
                    status_p,
                    Paragraph(f"{inv.currency} {float(inv.total):,.2f}", td_right_bold_style),
                ])

            # Grand Total Summary Row
            table_rows.append([
                Paragraph("", td_style),
                Paragraph("", td_style),
                Paragraph("<b>TOTAL EXPENDITURE</b>", td_bold_style),
                Paragraph("", td_style),
                Paragraph("", td_style),
                Paragraph(f"<b>{total_bills} bills</b>", td_style),
                Paragraph(f"<b>{currency} {total_spending:,.2f}</b>", td_right_bold_style),
            ])

        col_widths = [22, 56, 142, 75, 85, 75, 80]
        data_table = Table(table_rows, colWidths=col_widths, repeatRows=1)

        t_style = [
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e1b4b")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 4.5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4.5),
            ("LEFTPADDING", (0, 0), (-1, -1), 4),
            ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ]

        # Alternating row background colors
        if invoices:
            for r_idx in range(1, len(invoices) + 1):
                if r_idx % 2 == 0:
                    t_style.append(("BACKGROUND", (0, r_idx), (-1, r_idx), colors.HexColor("#f8fafc")))
            # Total row highlight
            tot_row_idx = len(invoices) + 1
            t_style.append(("BACKGROUND", (0, tot_row_idx), (-1, tot_row_idx), colors.HexColor("#eef2ff")))
            t_style.append(("LINEABOVE", (0, tot_row_idx), (-1, tot_row_idx), 1.2, colors.HexColor("#4338ca")))

        data_table.setStyle(TableStyle(t_style))
        elements.append(data_table)

        doc.build(elements, canvasmaker=NumberedCanvas)
        mem.seek(0)
        return mem

