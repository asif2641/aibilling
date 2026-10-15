from pydantic import BaseModel, Field, model_validator
from typing import Optional, List, Dict, Any

class BoundingBoxSchema(BaseModel):
    page: int = 1
    x: float = Field(..., description="Normalized top-left x (0.0 to 1.0)")
    y: float = Field(..., description="Normalized top-left y (0.0 to 1.0)")
    width: float = Field(..., description="Normalized width (0.0 to 1.0)")
    height: float = Field(..., description="Normalized height (0.0 to 1.0)")

class ExtractedFieldSchema(BaseModel):
    value: Any = None
    confidence: float = 1.0
    source_text: Optional[str] = None
    page_number: int = 1
    bounding_box: Optional[BoundingBoxSchema] = None

    @model_validator(mode="before")
    @classmethod
    def wrap_primitive(cls, data: Any):
        if data is None:
            return {"value": None, "confidence": 1.0}
        if not isinstance(data, dict):
            return {"value": data, "confidence": 0.95, "source_text": str(data)}
        return data

class ExtractedItemSchema(BaseModel):
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
    bounding_box: Optional[BoundingBoxSchema] = None

class DiscrepancySchema(BaseModel):
    field: str
    item_index: Optional[int] = None
    message: str
    severity: str = "warning"  # warning | error

class ValidationResultSchema(BaseModel):
    is_valid: bool
    discrepancies: List[DiscrepancySchema] = []
    calculated_subtotal: float
    calculated_total: float

class ExtractionResultSchema(BaseModel):
    document_type: str = "invoice"
    vendor_name: ExtractedFieldSchema = Field(default_factory=ExtractedFieldSchema)
    vendor_phone: ExtractedFieldSchema = Field(default_factory=ExtractedFieldSchema)
    vendor_email: ExtractedFieldSchema = Field(default_factory=ExtractedFieldSchema)
    vendor_address: ExtractedFieldSchema = Field(default_factory=ExtractedFieldSchema)
    vendor_tax_id: ExtractedFieldSchema = Field(default_factory=ExtractedFieldSchema)
    vendor_ntn: ExtractedFieldSchema = Field(default_factory=ExtractedFieldSchema)
    vendor_strn: ExtractedFieldSchema = Field(default_factory=ExtractedFieldSchema)

    invoice_number: ExtractedFieldSchema = Field(default_factory=ExtractedFieldSchema)
    receipt_number: ExtractedFieldSchema = Field(default_factory=ExtractedFieldSchema)
    order_number: ExtractedFieldSchema = Field(default_factory=ExtractedFieldSchema)
    invoice_date: ExtractedFieldSchema = Field(default_factory=ExtractedFieldSchema)
    due_date: ExtractedFieldSchema = Field(default_factory=ExtractedFieldSchema)
    currency: ExtractedFieldSchema = Field(default_factory=lambda: ExtractedFieldSchema(value="PKR"))
    payment_method: ExtractedFieldSchema = Field(default_factory=ExtractedFieldSchema)

    customer_name: ExtractedFieldSchema = Field(default_factory=ExtractedFieldSchema)
    customer_phone: ExtractedFieldSchema = Field(default_factory=ExtractedFieldSchema)
    customer_email: ExtractedFieldSchema = Field(default_factory=ExtractedFieldSchema)
    customer_address: ExtractedFieldSchema = Field(default_factory=ExtractedFieldSchema)

    items: List[ExtractedItemSchema] = []

    subtotal: ExtractedFieldSchema = Field(default_factory=ExtractedFieldSchema)
    discount: ExtractedFieldSchema = Field(default_factory=ExtractedFieldSchema)
    tax: ExtractedFieldSchema = Field(default_factory=ExtractedFieldSchema)
    service_charge: ExtractedFieldSchema = Field(default_factory=ExtractedFieldSchema)
    shipping: ExtractedFieldSchema = Field(default_factory=ExtractedFieldSchema)
    rounding: ExtractedFieldSchema = Field(default_factory=ExtractedFieldSchema)
    total: ExtractedFieldSchema = Field(default_factory=ExtractedFieldSchema)
    amount_paid: ExtractedFieldSchema = Field(default_factory=ExtractedFieldSchema)
    balance_due: ExtractedFieldSchema = Field(default_factory=ExtractedFieldSchema)

    custom_fields: Dict[str, Any] = {}
    suggested_category: Optional[str] = None
    suggested_category_id: Optional[str] = None
    validation: Optional[ValidationResultSchema] = None
