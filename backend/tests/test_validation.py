from decimal import Decimal
from app.services.validation_service import ValidationService
from app.schemas.extraction import (
    ExtractionResultSchema,
    ExtractedFieldSchema,
    ExtractedItemSchema
)

def test_prd_ground_truth_scenario_validation():
    """Tests PRD Section 89: ABC Super Store verified calculation."""
    extraction = ExtractionResultSchema(
        document_type="retail_receipt",
        vendor_name=ExtractedFieldSchema(value="ABC Super Store", confidence=0.99),
        invoice_number=ExtractedFieldSchema(value="INV-1025", confidence=0.98),
        invoice_date=ExtractedFieldSchema(value="2026-09-25", confidence=0.99),
        items=[
            ExtractedItemSchema(name="Milk", quantity=2.0, unit_price=250.00, line_total=500.00),
            ExtractedItemSchema(name="Bread", quantity=1.0, unit_price=180.00, line_total=180.00),
            ExtractedItemSchema(name="Eggs", quantity=1.0, unit_price=320.00, line_total=320.00),
        ],
        subtotal=ExtractedFieldSchema(value=1000.00, confidence=0.99),
        tax=ExtractedFieldSchema(value=180.00, confidence=0.98),
        total=ExtractedFieldSchema(value=1180.00, confidence=0.99)
    )

    result = ValidationService.validate_financial_arithmetic(extraction)
    assert result.is_valid is True
    assert len(result.discrepancies) == 0
    assert result.calculated_subtotal == 1000.00
    assert result.calculated_total == 1180.00

def test_arithmetic_discrepancy_detection():
    """Tests that mismatched line totals or totals trigger discrepancies."""
    extraction = ExtractionResultSchema(
        document_type="retail_receipt",
        items=[
            # 2 * 250 = 500, but line_total is given as 600
            ExtractedItemSchema(name="Milk", quantity=2.0, unit_price=250.00, line_total=600.00),
        ],
        subtotal=ExtractedFieldSchema(value=500.00), # mismatch with line_total sum (600)
        total=ExtractedFieldSchema(value=800.00)     # mismatch with subtotal
    )

    result = ValidationService.validate_financial_arithmetic(extraction)
    assert result.is_valid is False
    assert len(result.discrepancies) >= 2
    fields_flagged = [d.field for d in result.discrepancies]
    assert "line_total" in fields_flagged
    assert "subtotal" in fields_flagged

def test_zero_hallucination_null_preservation():
    """Tests PRD Rule 1 & Section 74: Absent attributes must remain None/null."""
    extraction = ExtractionResultSchema(
        document_type="retail_receipt",
        vendor_name=ExtractedFieldSchema(value="Corner Shop"),
        total=ExtractedFieldSchema(value=500.00)
    )
    # Absent fields
    assert extraction.customer_name.value is None
    assert extraction.customer_phone.value is None
    assert extraction.vendor_ntn.value is None

def test_date_and_currency_normalization():
    assert ValidationService.normalize_date("25/09/2026").isoformat() == "2026-09-25"
    assert ValidationService.normalize_date("2026-09-25").isoformat() == "2026-09-25"
    assert ValidationService.normalize_date("25-Sep-2026").isoformat() == "2026-09-25"

    assert ValidationService.normalize_currency("Rs. 2500") == "PKR"
    assert ValidationService.normalize_currency("PKR") == "PKR"
    assert ValidationService.normalize_currency("$") == "USD"
    assert ValidationService.normalize_currency("USD") == "USD"
    assert ValidationService.normalize_currency("EUR") == "EUR"
