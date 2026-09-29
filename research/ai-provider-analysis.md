# AI Document Provider Analysis & Extraction Engine Design

## 1. Provider Comparison & Evaluation

| Criteria | Google Gemini Multimodal Vision (Gemini 2.5 Flash / Pro) | Google Cloud Document AI (Invoice Parser) | AWS Textract (Analyze Expense) | Local / Open Source Vision (Qwen2-VL / Llama-3.2-Vision) | Offline Deterministic Mock Provider |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Document Understanding** | **Exceptional:** Understands messy layouts, handwritten notes, tables, dynamic custom fields, thermal slips | High: Pretrained invoice models perform well on standard layouts | Moderate: Works well on standard US/EU receipts; struggles on informal slips | High: Good multimodal comprehension, but requires GPU infrastructure | High: Deterministic, returns exact ground-truth mock data for test suites |
| **Bilingual Support (English + Urdu)** | **Native:** Strong multilingual OCR and comprehension of mixed Pakistani text | Limited: Primarily optimized for Latin alphabet scripts | Very Limited: Struggles with Urdu script and local Pakistani formats | Good on larger models; resource heavy | Complete support for predefined bilingual sample fixtures |
| **Bounding Box Evidence** | Supported: Can output 2D bounding boxes `[ymin, xmin, ymax, xmax]` normalized to $[0, 1000]$ | Supported: Rich normalized vertices | Supported: Polygon bounding boxes | Varies by architecture | Synthetic bounding boxes matching document areas |
| **Dynamic Fields Extraction** | **Native:** Dynamically detects pharmacy expiry/batch, restaurant table/waiter, warranty serials | Poor: Rigid schema, requires custom model training for custom entities | Poor: Fixed key-value blocks | Moderate: Requires prompt tuning | Supports arbitrary key-value pairs |
| **Cost & Latency** | Low cost per page (~$0.001 - $0.003), ~1.5–3s inference latency | Enterprise pricing ($0.05 - $0.10 / page), 2–5s latency | Moderate pricing ($0.05 / page), 3–6s latency | High server hosting costs (VRAM) | Zero cost, instant (< 50ms) execution |
| **Suitability for MVP** | **Primary Choice (Production)** | Secondary / Future Enterprise | Optional Alternative | Future On-Premises | **Mandatory (Testing & Offline Dev)** |

---

## 2. Pluggable Provider Abstraction Pattern

The platform decouples business logic from AI vendors using the Adapter Pattern:

```python
from abc import ABC, abstractmethod
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class BoundingBox(BaseModel):
    page: int = 1
    x: float = Field(..., description="Normalized top-left x (0.0 to 1.0)")
    y: float = Field(..., description="Normalized top-left y (0.0 to 1.0)")
    width: float = Field(..., description="Normalized width (0.0 to 1.0)")
    height: float = Field(..., description="Normalized height (0.0 to 1.0)")

class ExtractedField(BaseModel):
    value: Any
    confidence: float = Field(ge=0.0, le=1.0)
    source_text: Optional[str] = None
    bounding_box: Optional[BoundingBox] = None

class ExtractedLineItem(BaseModel):
    name: str
    description: Optional[str] = None
    sku: Optional[str] = None
    quantity: float = 1.0
    unit: Optional[str] = None
    unit_price: float = 0.0
    discount: float = 0.0
    tax: float = 0.0
    line_total: float = 0.0
    confidence: float = 1.0
    bounding_box: Optional[BoundingBox] = None

class ExtractionResult(BaseModel):
    document_type: str
    vendor_name: ExtractedField
    vendor_address: Optional[ExtractedField] = None
    vendor_phone: Optional[ExtractedField] = None
    vendor_email: Optional[ExtractedField] = None
    vendor_tax_id: Optional[ExtractedField] = None
    vendor_ntn: Optional[ExtractedField] = None
    vendor_strn: Optional[ExtractedField] = None
    
    invoice_number: ExtractedField
    invoice_date: ExtractedField
    due_date: Optional[ExtractedField] = None
    currency: ExtractedField
    payment_method: Optional[ExtractedField] = None
    
    customer_name: Optional[ExtractedField] = None
    customer_phone: Optional[ExtractedField] = None
    customer_email: Optional[ExtractedField] = None
    customer_address: Optional[ExtractedField] = None
    
    line_items: List[ExtractedLineItem] = []
    
    subtotal: ExtractedField
    discount: ExtractedField
    tax: ExtractedField
    service_charge: ExtractedField
    shipping: ExtractedField
    rounding: ExtractedField
    total: ExtractedField
    amount_paid: Optional[ExtractedField] = None
    balance_due: Optional[ExtractedField] = None
    
    custom_fields: Dict[str, Any] = {}
    raw_response: Dict[str, Any] = {}

class DocumentAIProvider(ABC):
    @abstractmethod
    async def extract_document(
        self, 
        file_bytes: bytes, 
        mime_type: str, 
        options: Optional[Dict[str, Any]] = None
    ) -> ExtractionResult:
        """Process file and return validated ExtractionResult."""
        pass
```

---

## 3. Strict Zero-Hallucination Prompt Strategy

To comply with **PRD Rule 1, 2, and 43**, the AI system prompt enforces rigorous extraction boundaries:

```text
You are an expert financial document intelligence system.
Your task is to extract data from the provided bill/invoice/receipt into strict structured JSON.

CRITICAL INSTRUCTIONS (FAILURE TO FOLLOW WILL CAUSE DATA REJECTION):
1. ZERO INVENTIONS: Extract ONLY data that explicitly appears on the document.
2. MISSING VALUES: If an attribute is NOT explicitly written on the document (e.g., customer name, phone number, tax ID, due date, invoice number), you MUST set its value to null. DO NOT guess, infer, or provide placeholder text like "N/A" or "Unknown".
3. NUMERICAL ACCURACY: Preserve exact printed numerical amounts. Do not round numbers. Distinguish line totals, discounts, taxes (GST/VAT), service charges, and grand totals.
4. CONFIDENCE SCORING: Provide a realistic confidence score between 0.0 and 1.0 for each field based on legibility and visual clarity.
5. BOUNDING BOXES: For each extracted field and line item, estimate the normalized bounding box [ymin, xmin, ymax, xmax] scaled between 0 and 1000.
6. PAKISTAN FORMATS: Recognize PKR / Rs. currency, NTN numbers (7 digits + 1 check digit), STRN (13 digits), and Pakistani phone formats (03XX-XXXXXXX).
7. CUSTOM FIELDS: Any domain-specific metadata (e.g. Doctor, Patient, Table Number, Cashier, Warranty) must be placed in "custom_fields".
```

---

## 4. Fallback & Mock Provider for Testing & Development

The platform includes a built-in `MockAIProvider` that:
1. Performs deterministic OCR simulation on test datasets.
2. Injects real test scenarios:
   - Valid grocery receipt with GST (e.g., ABC Super Store).
   - Restaurant receipt with service charge & table number.
   - Pharmacy bill with doctor/patient custom fields.
   - Faulty receipt with arithmetic discrepancy (triggers validation warning).
   - Document with missing customer phone (proves zero-hallucination null enforcement).
   - Low-confidence degraded receipt (tests review workflow).
3. Operates offline without external network or API keys, allowing CI/CD test automation to run cleanly in under 5 seconds.
