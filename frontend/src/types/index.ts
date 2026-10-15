export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role?: string;
  is_superuser?: boolean;
  currency: string;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
}

export interface StaffMember {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  is_superuser: boolean;
  is_active: boolean;
  currency: string;
  password_display?: string | null;
  created_at: string;
  last_login_at: string | null;
}

export interface BoundingBox {
  page: number;
  x: number;      // 0.0 to 1.0
  y: number;      // 0.0 to 1.0
  width: number;  // 0.0 to 1.0
  height: number; // 0.0 to 1.0
}

export interface ExtractedField<T = string | number | null> {
  value: T;
  confidence: number;
  source_text?: string | null;
  page_number?: number;
  bounding_box?: BoundingBox | null;
}

export interface ExtractedItem {
  name: string;
  description?: string | null;
  sku?: string | null;
  quantity: number;
  unit?: string | null;
  unit_price: number;
  discount: number;
  tax: number;
  line_total: number;
  confidence: number;
  bounding_box?: BoundingBox | null;
}

export interface Discrepancy {
  field: string;
  item_index?: number | null;
  message: string;
  severity: "warning" | "error";
}

export interface ValidationResult {
  is_valid: boolean;
  discrepancies: Discrepancy[];
  calculated_subtotal: number;
  calculated_total: number;
}

export interface ExtractionResult {
  document_type: string;
  vendor_name: ExtractedField<string | null>;
  vendor_phone: ExtractedField<string | null>;
  vendor_email: ExtractedField<string | null>;
  vendor_address: ExtractedField<string | null>;
  vendor_ntn: ExtractedField<string | null>;
  vendor_strn: ExtractedField<string | null>;
  invoice_number: ExtractedField<string | null>;
  receipt_number: ExtractedField<string | null>;
  order_number: ExtractedField<string | null>;
  invoice_date: ExtractedField<string | null>;
  due_date: ExtractedField<string | null>;
  currency: ExtractedField<string>;
  payment_method: ExtractedField<string | null>;
  customer_name: ExtractedField<string | null>;
  customer_phone: ExtractedField<string | null>;
  customer_email: ExtractedField<string | null>;
  customer_address: ExtractedField<string | null>;
  items: ExtractedItem[];
  subtotal: ExtractedField<number>;
  discount: ExtractedField<number>;
  tax: ExtractedField<number>;
  service_charge: ExtractedField<number>;
  shipping: ExtractedField<number>;
  rounding: ExtractedField<number>;
  total: ExtractedField<number>;
  amount_paid: ExtractedField<number | null>;
  balance_due: ExtractedField<number | null>;
  custom_fields: Record<string, any>;
  suggested_category?: string | null;
  suggested_category_id?: string | null;
  validation?: ValidationResult | null;
}

export interface DocumentPageItem {
  id: string;
  page_number: number;
  width?: number;
  height?: number;
  file_url: string;
}

export interface DocumentItem {
  id: string;
  user_id: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  page_count: number;
  status: "UPLOADED" | "PROCESSING" | "EXTRACTED" | "REVIEW_REQUIRED" | "VERIFIED" | "FAILED" | "ARCHIVED";
  document_type: string;
  processing_error?: string | null;
  file_url: string;
  pages?: DocumentPageItem[];
  extraction?: ExtractionResult | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id?: string;
  name: string;
  description?: string | null;
  sku?: string | null;
  quantity: number;
  unit?: string | null;
  unit_price: number;
  discount: number;
  tax: number;
  line_total: number;
  confidence?: number;
  bounding_box?: BoundingBox | null;
}

export interface Invoice {
  id: string;
  user_id: string;
  document_id?: string | null;
  vendor_id?: string | null;
  customer_id?: string | null;
  vendor?: { id: string; name: string; phone?: string | null; address?: string | null; ntn?: string | null; strn?: string | null } | null;
  customer?: { id: string; name: string; phone?: string | null; email?: string | null; address?: string | null } | null;
  category?: { id: string; name: string; color: string; icon: string } | null;
  invoice_number?: string | null;
  receipt_number?: string | null;
  order_number?: string | null;
  invoice_date: string;
  due_date?: string | null;
  currency: string;
  subtotal: string | number;
  discount: string | number;
  tax: string | number;
  service_charge: string | number;
  shipping: string | number;
  rounding: string | number;
  total: string | number;
  amount_paid: string | number;
  balance_due: string | number;
  payment_method?: string | null;
  confidence_score: number;
  verification_status: "UNVERIFIED" | "VERIFIED" | "REJECTED";
  has_discrepancy?: boolean;
  discrepancy_count?: number;
  discrepancy_notes?: string[];
  custom_fields?: Record<string, any>;
  notes?: string | null;
  items: InvoiceItem[];
  created_at: string;
  updated_at: string;
}

export interface InvoiceListResponse {
  items: Invoice[];
  total: number;
  page: number;
  page_size: number;
  total_spend: string | number;
  incorrect_count?: number;
  clean_count?: number;
}

export interface Vendor {
  id: string;
  name: string;
  normalized_name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  website?: string | null;
  tax_id?: string | null;
  ntn?: string | null;
  strn?: string | null;
  total_invoices: number;
  total_spend: string | number;
  incorrect_invoices_count?: number;
  last_invoice_date?: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  user_id?: string | null;
  name: string;
  color: string;
  icon: string;
  is_default: boolean;
}

export interface CategorySpendItem {
  category_id: string | null;
  category_name: string;
  color: string;
  amount: string | number;
  percentage: number;
  count: number;
}

export interface VendorSpendItem {
  vendor_id: string | null;
  vendor_name: string;
  amount: string | number;
  bill_count: number;
}

export interface WeeklyTrendItem {
  label: string;
  start_date: string;
  amount: string | number;
  bill_count: number;
}

export interface DashboardSummary {
  total_spending: string | number;
  total_bills: number;
  this_week_spending: string | number;
  this_month_spending: string | number;
  avg_bill_amount: string | number;
  currency: string;
  category_spending: CategorySpendItem[];
  top_vendors: VendorSpendItem[];
  weekly_trend: WeeklyTrendItem[];
  recent_invoices: Invoice[];
  status_counts: Record<string, number>;
  incorrect_bills_count?: number;
}

export interface TimelinePoint {
  label: string;
  date: string;
  amount: string | number;
  bill_count: number;
}

export interface ReportSummary {
  report_type: string;
  start_date: string;
  end_date: string;
  selected_vendor_id?: string | null;
  selected_vendor_name?: string | null;
  total_spending: string | number;
  total_bills: number;
  avg_bill_amount: string | number;
  highest_bill_amount: string | number;
  highest_bill_vendor?: string | null;
  currency: string;
  category_breakdown: CategorySpendItem[];
  vendor_breakdown: VendorSpendItem[];
  timeline: TimelinePoint[];
  invoices: Invoice[];
}

export interface VendorInvoiceItem {
  id: string;
  invoice_number?: string | null;
  invoice_date: string;
  total: string | number;
  currency: string;
  customer_name?: string | null;
  customer_id?: string | null;
  status: string;
  category_name?: string | null;
  items_count?: number;
  notes?: string | null;
  document_id?: string | null;
  has_discrepancy?: boolean;
  discrepancy_notes?: string[];
}

export interface VendorDetail extends Vendor {
  invoices: VendorInvoiceItem[];
}

export interface CustomerInvoiceItem {
  id: string;
  invoice_number?: string | null;
  invoice_date: string;
  total: string | number;
  currency: string;
  vendor_name?: string | null;
  vendor_id?: string | null;
  status: string;
  category_name?: string | null;
  items_count?: number;
  notes?: string | null;
  document_id?: string | null;
  has_discrepancy?: boolean;
  discrepancy_notes?: string[];
}

export interface Customer {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  total_invoices: number;
  total_spend: string | number;
  incorrect_invoices_count?: number;
  last_purchase_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerDetail extends Customer {
  invoices: CustomerInvoiceItem[];
}

