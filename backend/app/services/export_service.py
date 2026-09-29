import io
import csv
from typing import List
import pandas as pd
from app.models.invoice import Invoice

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
