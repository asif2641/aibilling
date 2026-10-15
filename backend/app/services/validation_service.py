from decimal import Decimal, ROUND_HALF_UP
import re
from datetime import datetime, date
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from app.schemas.extraction import (
    ExtractionResultSchema, 
    ValidationResultSchema, 
    DiscrepancySchema
)
from app.models.invoice import Invoice
from app.models.vendor import Vendor

TOLERANCE = Decimal("0.05")

class ValidationService:
    @staticmethod
    def to_decimal(val) -> Decimal:
        if val is None or val == "":
            return Decimal("0.00")
        try:
            # Strip currency symbols and commas
            clean = re.sub(r"[^\d.-]", "", str(val))
            if not clean:
                return Decimal("0.00")
            return Decimal(clean).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        except Exception:
            return Decimal("0.00")

    @classmethod
    def validate_financial_arithmetic(cls, extraction: ExtractionResultSchema) -> ValidationResultSchema:
        discrepancies: List[DiscrepancySchema] = []
        calculated_subtotal = Decimal("0.00")

        # 1. Line items check
        for idx, item in enumerate(extraction.items):
            qty = cls.to_decimal(item.quantity or 1.0)
            unit_price = cls.to_decimal(item.unit_price)
            discount = cls.to_decimal(item.discount)
            actual_total = cls.to_decimal(item.line_total)

            # Check for missing item price / zero price
            if (unit_price <= Decimal("0.00") or actual_total <= Decimal("0.00")) and item.name:
                discrepancies.append(DiscrepancySchema(
                    field="unit_price",
                    item_index=idx,
                    message=f"Line item '{item.name}': Missing price or price is 0.00",
                    severity="error"
                ))

            expected_line_total = (qty * unit_price) - discount
            if abs(expected_line_total - actual_total) > TOLERANCE and (qty > 0 and unit_price > 0):
                discrepancies.append(DiscrepancySchema(
                    field="line_total",
                    item_index=idx,
                    message=f"Line item '{item.name}': Expected {expected_line_total} ({qty} × {unit_price}), but got {actual_total}",
                    severity="warning"
                ))
            calculated_subtotal += actual_total

        # 2. Subtotal check
        stated_subtotal = cls.to_decimal(extraction.subtotal.value) if extraction.subtotal.value is not None else calculated_subtotal
        if len(extraction.items) > 0 and abs(calculated_subtotal - stated_subtotal) > TOLERANCE:
            discrepancies.append(DiscrepancySchema(
                field="subtotal",
                message=f"Sum of line items ({calculated_subtotal}) differs from stated subtotal ({stated_subtotal}) by {abs(calculated_subtotal - stated_subtotal)}",
                severity="warning"
            ))

        # 3. Grand total cross-check
        discount = cls.to_decimal(extraction.discount.value)
        tax = cls.to_decimal(extraction.tax.value)
        service_charge = cls.to_decimal(extraction.service_charge.value)
        shipping = cls.to_decimal(extraction.shipping.value)
        rounding = cls.to_decimal(extraction.rounding.value)
        stated_total = cls.to_decimal(extraction.total.value)

        # Baseline: subtotal - discount + tax + service_charge + shipping + rounding
        expected_total = stated_subtotal - discount + tax + service_charge + shipping + rounding
        if abs(expected_total - stated_total) > TOLERANCE and stated_total > Decimal("0.00"):
            discrepancies.append(DiscrepancySchema(
                field="total",
                message=f"Calculated grand total ({expected_total}) differs from printed total ({stated_total}) by {abs(expected_total - stated_total)}",
                severity="warning"
            ))

        # 4. Negative values check (PRD Section 14)
        if stated_total < Decimal("0.00"):
            discrepancies.append(DiscrepancySchema(
                field="total",
                message="Grand total is negative. Please verify if this is a credit note or refund.",
                severity="warning"
            ))

        is_valid = len(discrepancies) == 0
        return ValidationResultSchema(
            is_valid=is_valid,
            discrepancies=discrepancies,
            calculated_subtotal=float(calculated_subtotal),
            calculated_total=float(expected_total if stated_total == Decimal("0.00") else stated_total)
        )

    @classmethod
    def evaluate_invoice_discrepancies(
        cls,
        subtotal: Any,
        discount: Any,
        tax: Any,
        service_charge: Any,
        shipping: Any,
        rounding: Any,
        total: Any,
        items: List[Any],
        vendor_name: Optional[str] = None
    ) -> Tuple[bool, List[str]]:
        """
        Evaluates saved/approved invoice against mathematical and completeness rules.
        Returns: (has_discrepancy, list_of_discrepancy_reasons)
        """
        notes: List[str] = []
        d_subtotal = cls.to_decimal(subtotal)
        d_discount = cls.to_decimal(discount)
        d_tax = cls.to_decimal(tax)
        d_service = cls.to_decimal(service_charge)
        d_shipping = cls.to_decimal(shipping)
        d_rounding = cls.to_decimal(rounding)
        d_total = cls.to_decimal(total)

        # 1. Line items checks
        calculated_items_sum = Decimal("0.00")
        for idx, item in enumerate(items):
            name = getattr(item, "name", None) or (item.get("name") if isinstance(item, dict) else f"Item #{idx+1}")
            qty = cls.to_decimal(getattr(item, "quantity", None) or (item.get("quantity") if isinstance(item, dict) else 1))
            price = cls.to_decimal(getattr(item, "unit_price", None) or (item.get("unit_price") if isinstance(item, dict) else 0))
            line_tot = cls.to_decimal(getattr(item, "line_total", None) or (item.get("line_total") if isinstance(item, dict) else 0))

            if (price <= Decimal("0.00") or line_tot <= Decimal("0.00")) and name:
                notes.append(f"Item '{name}' is missing price or price is 0.00")
            elif qty > 0 and price > 0:
                expected_line = qty * price
                it_disc = cls.to_decimal(getattr(item, "discount", None) or (item.get("discount") if isinstance(item, dict) else 0))
                if abs((expected_line - it_disc) - line_tot) > TOLERANCE:
                    notes.append(f"Item '{name}' line total ({line_tot}) does not match quantity × price ({expected_line - it_disc})")

            calculated_items_sum += line_tot

        # 2. Subtotal check against line items (if items itemized)
        if len(items) > 0 and abs(calculated_items_sum - d_subtotal) > TOLERANCE:
            notes.append(f"Sum of line items ({calculated_items_sum}) does not match subtotal ({d_subtotal})")

        # 3. Grand total equation check
        expected_total = d_subtotal - d_discount + d_tax + d_service + d_shipping + d_rounding
        if abs(expected_total - d_total) > TOLERANCE and d_total > Decimal("0.00"):
            notes.append(f"Calculated grand total ({expected_total}) differs from stated total ({d_total})")

        # 4. Zero or negative total
        if d_total <= Decimal("0.00"):
            notes.append("Grand total is zero or negative")

        has_discrepancy = len(notes) > 0
        return has_discrepancy, notes

    @staticmethod
    def normalize_date(date_str: Optional[str]) -> Optional[date]:
        if not date_str:
            return None
        formats = [
            "%Y-%m-%d",
            "%d/%m/%Y",
            "%d-%m-%Y",
            "%d-%b-%Y",
            "%d-%B-%Y",
            "%m/%d/%Y",
            "%Y/%m/%d"
        ]
        clean_str = date_str.strip()
        for fmt in formats:
            try:
                return datetime.strptime(clean_str, fmt).date()
            except ValueError:
                continue
        return None

    @staticmethod
    def normalize_currency(currency_str: Optional[str]) -> str:
        if not currency_str:
            return "PKR"
        curr = currency_str.strip().upper()
        if any(term in curr for term in ["RS", "PKR", "RUPEE"]):
            return "PKR"
        if any(term in curr for term in ["$", "USD"]):
            return "USD"
        if any(term in curr for term in ["€", "EUR"]):
            return "EUR"
        if any(term in curr for term in ["£", "GBP"]):
            return "GBP"
        return curr[:3]

    @staticmethod
    def check_duplicate(
        db: Session, 
        user_id: str, 
        checksum: str,
        vendor_name: Optional[str] = None,
        invoice_number: Optional[str] = None,
        invoice_date: Optional[date] = None,
        total: Optional[Decimal] = None
    ) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Multi-signal duplicate detection per PRD Section 14 & 59.
        Returns: (is_duplicate, existing_invoice_id, reason)
        """
        # Level 1: Strict SHA-256 binary match on document
        from app.models.document import Document
        existing_doc = db.query(Document).filter(
            Document.user_id == user_id,
            Document.sha256_checksum == checksum
        ).first()

        if existing_doc and existing_doc.invoice:
            return True, existing_doc.invoice.id, "Exact file binary duplicate detected."

        # Level 2: Strict invoice_number + vendor match
        if vendor_name and invoice_number:
            norm_vendor = vendor_name.strip().lower()
            existing_inv = db.query(Invoice).join(Vendor).filter(
                Invoice.user_id == user_id,
                Vendor.normalized_name == norm_vendor,
                Invoice.invoice_number == invoice_number.strip()
            ).first()
            if existing_inv:
                return True, existing_inv.id, f"Invoice number '{invoice_number}' already exists for vendor '{vendor_name}'."

        # Level 3: Same vendor + same date + same total
        if vendor_name and invoice_date and total:
            norm_vendor = vendor_name.strip().lower()
            existing_inv = db.query(Invoice).join(Vendor).filter(
                Invoice.user_id == user_id,
                Vendor.normalized_name == norm_vendor,
                Invoice.invoice_date == invoice_date,
                Invoice.total == total
            ).first()
            if existing_inv:
                return True, existing_inv.id, f"Matching bill from '{vendor_name}' on {invoice_date} for amount {total} exists."

        return False, None, None
