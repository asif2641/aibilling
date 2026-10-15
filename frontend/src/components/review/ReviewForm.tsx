"use client";

import { useState, useEffect } from "react";
import { 
  Check, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Save, 
  RefreshCw, 
  HelpCircle,
  Building,
  Calendar,
  Receipt,
  Tag,
  DollarSign
} from "lucide-react";
import { ExtractionResult, BoundingBox, Category } from "@/types";
import { getConfidenceBadge } from "@/lib/utils";

interface ReviewFormProps {
  documentId: string;
  initialData: ExtractionResult;
  categories: Category[];
  onFieldFocus: (field: string, bbox?: BoundingBox | null) => void;
  onApprove: (formData: any) => Promise<void>;
  onReprocess: () => Promise<void>;
}

export function ReviewForm({
  documentId,
  initialData,
  categories,
  onFieldFocus,
  onApprove,
  onReprocess,
}: ReviewFormProps) {
  // Form State
  const [docType, setDocType] = useState(initialData.document_type || "retail_receipt");
  const [vendorName, setVendorName] = useState(initialData.vendor_name.value || "");
  const [vendorPhone, setVendorPhone] = useState(initialData.vendor_phone.value || "");
  const [vendorAddress, setVendorAddress] = useState(initialData.vendor_address.value || "");
  const [vendorNtn, setVendorNtn] = useState(initialData.vendor_ntn.value || "");

  const [invoiceNumber, setInvoiceNumber] = useState(initialData.invoice_number.value || "");
  const [invoiceDate, setInvoiceDate] = useState(initialData.invoice_date.value || "");
  const [currency, setCurrency] = useState(initialData.currency.value || "PKR");
  const [paymentMethod, setPaymentMethod] = useState(initialData.payment_method.value || "Cash");
  // Intelligent Expense Category resolver based on suggested category and document classification
  const resolveExpenseCategoryId = (
    suggestedId?: string | null,
    suggestedName?: string | null,
    currentDocType?: string,
    currentVendor?: string
  ): string => {
    // 1. Direct suggested ID match
    if (suggestedId && categories.some((c) => c.id === suggestedId)) {
      return suggestedId;
    }
    // 2. Direct name match
    if (suggestedName) {
      const match = categories.find((c) => c.name.toLowerCase() === suggestedName.toLowerCase());
      if (match) return match.id;
      const partial = categories.find(
        (c) =>
          c.name.toLowerCase().includes(suggestedName.toLowerCase()) ||
          suggestedName.toLowerCase().includes(c.name.toLowerCase())
      );
      if (partial) return partial.id;
    }
    // 3. Fallback based on document classification & vendor
    const vLower = (currentVendor || "").toLowerCase();
    if (vLower.includes("fan") || vLower.includes("tech") || vLower.includes("electric")) {
      const el = categories.find((c) => c.name.toLowerCase().includes("tech") || c.name.toLowerCase().includes("electronic"));
      if (el) return el.id;
    }

    if (currentDocType === "pharmacy_bill") {
      const med = categories.find((c) => c.name.toLowerCase().includes("medicine") || c.name.toLowerCase().includes("pharmacy"));
      if (med) return med.id;
    } else if (currentDocType === "restaurant_receipt") {
      const rest = categories.find((c) => c.name.toLowerCase().includes("restaurant") || c.name.toLowerCase().includes("dining"));
      if (rest) return rest.id;
    } else if (currentDocType === "utility_bill") {
      const util = categories.find((c) => c.name.toLowerCase().includes("utilit") || c.name.toLowerCase().includes("bill"));
      if (util) return util.id;
    } else if (currentDocType === "retail_receipt") {
      const groc = categories.find((c) => c.name.toLowerCase().includes("grocer") || c.name.toLowerCase().includes("food"));
      if (groc) return groc.id;
    }

    return categories[0]?.id || "";
  };

  const [categoryId, setCategoryId] = useState(() =>
    resolveExpenseCategoryId(
      initialData.suggested_category_id,
      initialData.suggested_category,
      initialData.document_type,
      initialData.vendor_name?.value || ""
    )
  );

  const [customerName, setCustomerName] = useState(initialData.customer_name.value || "");
  const [customerPhone, setCustomerPhone] = useState(initialData.customer_phone.value || "");

  const [items, setItems] = useState<any[]>(
    initialData.items && initialData.items.length > 0
      ? initialData.items.map((it) => ({
          name: it.name,
          quantity: it.quantity || 1,
          unit: it.unit || "",
          unit_price: it.unit_price || 0,
          discount: it.discount || 0,
          tax: it.tax || 0,
          line_total: it.line_total || (it.quantity || 1) * (it.unit_price || 0),
          bounding_box: it.bounding_box,
        }))
      : []
  );

  const [subtotal, setSubtotal] = useState(Number(initialData.subtotal.value || 0));
  const [discount, setDiscount] = useState(Number(initialData.discount.value || 0));
  const [tax, setTax] = useState(Number(initialData.tax.value || 0));
  const [serviceCharge, setServiceCharge] = useState(Number(initialData.service_charge.value || 0));
  const [total, setTotal] = useState(Number(initialData.total.value || 0));

  const [customFields, setCustomFields] = useState<Record<string, any>>(initialData.custom_fields || {});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReprocessing, setIsReprocessing] = useState(false);

  // Sync state when initialData updates (e.g. after AI reprocess or document reload)
  useEffect(() => {
    const docClassification = initialData.document_type || "retail_receipt";
    setDocType(docClassification);
    setVendorName(initialData.vendor_name?.value || "");
    setVendorPhone(initialData.vendor_phone?.value || "");
    setVendorAddress(initialData.vendor_address?.value || "");
    setVendorNtn(initialData.vendor_ntn?.value || "");

    setInvoiceNumber(initialData.invoice_number?.value || "");
    setInvoiceDate(initialData.invoice_date?.value || "");
    setCurrency(initialData.currency?.value || "PKR");
    setPaymentMethod(initialData.payment_method?.value || "Cash");

    setCustomerName(initialData.customer_name?.value || "");
    setCustomerPhone(initialData.customer_phone?.value || "");

    // Automatically resolve expense category based on nature of bill and suggested category
    setCategoryId(
      resolveExpenseCategoryId(
        initialData.suggested_category_id,
        initialData.suggested_category,
        docClassification,
        initialData.vendor_name?.value || ""
      )
    );

    setItems(
      initialData.items && initialData.items.length > 0
        ? initialData.items.map((it) => ({
            name: it.name,
            quantity: it.quantity || 1,
            unit: it.unit || "",
            unit_price: it.unit_price || 0,
            discount: it.discount || 0,
            tax: it.tax || 0,
            line_total: it.line_total || (it.quantity || 1) * (it.unit_price || 0),
            bounding_box: it.bounding_box,
          }))
        : []
    );

    setSubtotal(Number(initialData.subtotal?.value || 0));
    setDiscount(Number(initialData.discount?.value || 0));
    setTax(Number(initialData.tax?.value || 0));
    setServiceCharge(Number(initialData.service_charge?.value || 0));
    setTotal(Number(initialData.total?.value || 0));

    setCustomFields(initialData.custom_fields || {});
  }, [initialData]);

  // Handle changing document classification: also auto-update suggested expense category
  const handleDocTypeChange = (newDocType: string) => {
    setDocType(newDocType);
    const autoCatId = resolveExpenseCategoryId(null, null, newDocType, vendorName);
    if (autoCatId) {
      setCategoryId(autoCatId);
    }
  };

  // Real-time Arithmetic Recalculations & Discrepancies
  const calculatedItemsSum = items.reduce((sum, item) => sum + Number(item.line_total || 0), 0);
  const calculatedGrandTotal = subtotal - discount + tax + serviceCharge;
  const isSubtotalMatching = items.length === 0 || Math.abs(calculatedItemsSum - subtotal) <= 0.05;
  const isGrandTotalMatching = Math.abs(calculatedGrandTotal - total) <= 0.05;

  // Identify items with missing price
  const missingPriceItems = items.filter(
    (item) => Number(item.unit_price || 0) <= 0 || Number(item.line_total || 0) <= 0
  );

  // Active errors list
  const activeDiscrepancies: string[] = [];
  if (missingPriceItems.length > 0) {
    missingPriceItems.forEach((it) => {
      activeDiscrepancies.push(`Item "${it.name || "Unnamed"}" is missing unit price (0.00)`);
    });
  }
  if (!isSubtotalMatching) {
    activeDiscrepancies.push(
      `Line items sum (${calculatedItemsSum.toFixed(2)}) differs from subtotal (${subtotal.toFixed(2)})`
    );
  }
  if (!isGrandTotalMatching) {
    activeDiscrepancies.push(
      `Calculated total (${calculatedGrandTotal.toFixed(2)}) differs from grand total (${total.toFixed(2)})`
    );
  }
  if (total <= 0) {
    activeDiscrepancies.push("Grand total is zero or negative");
  }

  // Check for image quality advisory warnings from backend
  const qualityWarnings: string[] = [];
  if (initialData?.validation?.discrepancies) {
    initialData.validation.discrepancies.forEach((d) => {
      if (d.field === "image_quality" || d.message?.includes("Image Quality")) {
        if (!qualityWarnings.includes(d.message)) {
          qualityWarnings.push(d.message);
        }
      }
    });
  }

  const hasDiscrepancy = activeDiscrepancies.length > 0;

  const handleAutoFixMath = () => {
    if (items.length > 0) {
      setSubtotal(parseFloat(calculatedItemsSum.toFixed(2)));
      const newGrand = calculatedItemsSum - discount + tax + serviceCharge;
      setTotal(parseFloat(newGrand.toFixed(2)));
    } else {
      setTotal(parseFloat(calculatedGrandTotal.toFixed(2)));
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index][field] = value;
    if (field === "quantity" || field === "unit_price") {
      const q = Number(updated[index].quantity || 0);
      const p = Number(updated[index].unit_price || 0);
      updated[index].line_total = parseFloat((q * p).toFixed(2));
    }
    setItems(updated);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        name: "New Item",
        quantity: 1,
        unit: "pc",
        unit_price: 0,
        discount: 0,
        tax: 0,
        line_total: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onApprove({
        document_id: documentId,
        vendor_name: vendorName.trim() || "Unknown Vendor",
        vendor_phone: vendorPhone.trim() || null,
        vendor_address: vendorAddress.trim() || null,
        vendor_ntn: vendorNtn.trim() || null,
        customer_name: customerName.trim() || null,
        customer_phone: customerPhone.trim() || null,
        invoice_number: invoiceNumber.trim() || null,
        invoice_date: invoiceDate || new Date().toISOString().split("T")[0],
        currency: currency,
        category_id: categoryId || null,
        subtotal: subtotal,
        discount: discount,
        tax: tax,
        service_charge: serviceCharge,
        total: total,
        payment_method: paymentMethod,
        items: items,
        custom_fields: customFields,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header status bar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <span>Verify Extracted Data</span>
            <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-300 font-bold px-2 py-0.5 rounded-full">
              Review Required
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Verify printed data before approving into permanent ledger.
          </p>
        </div>

        <button
          type="button"
          onClick={async () => {
            setIsReprocessing(true);
            await onReprocess();
            setIsReprocessing(false);
          }}
          disabled={isReprocessing}
          className="text-xs font-medium text-slate-600 hover:text-indigo-600 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isReprocessing ? "animate-spin" : ""}`} />
          <span>Reprocess AI</span>
        </button>
      </div>

      {/* Scrollable Form Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Prominent Bill Error / Discrepancy Banner */}
        {hasDiscrepancy && (
          <div className="p-4 rounded-xl bg-rose-50 border-2 border-rose-300 text-rose-900 shadow-xs space-y-2.5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-900">
                  {activeDiscrepancies.length} Errors / Discrepancies Detected in this Bill
                </h4>
              </div>
              <button
                type="button"
                onClick={handleAutoFixMath}
                className="text-[11px] font-bold bg-white hover:bg-rose-100 text-rose-800 border border-rose-300 px-2.5 py-1 rounded-md transition-colors cursor-pointer shrink-0"
              >
                ⚡ Auto-Fix Calculations
              </button>
            </div>
            <ul className="text-xs space-y-1 list-disc list-inside text-rose-800">
              {activeDiscrepancies.map((msg, i) => (
                <li key={i} className="font-medium">
                  {msg}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Image Quality Warning Advisory Banner */}
        {qualityWarnings.length > 0 && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 shadow-xs space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-base">📷</span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Image Quality Advisory
              </h4>
            </div>
            <ul className="text-xs space-y-1 list-disc list-inside text-amber-800">
              {qualityWarnings.map((warn, i) => (
                <li key={i} className="font-medium">
                  {warn}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Document Classification (Nature of Bill) */}
        <div className="bg-slate-50/70 p-3.5 rounded-lg border border-slate-200/80">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700">Document Classification (Bill Nature)</label>
            <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200/60 font-medium px-2 py-0.5 rounded-full">
              Inferred from Bill Nature
            </span>
          </div>
          <select
            value={docType}
            onChange={(e) => handleDocTypeChange(e.target.value)}
            className="w-full text-xs font-medium bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="retail_receipt">Retail / Grocery Receipt</option>
            <option value="restaurant_receipt">Restaurant / Dining Slip</option>
            <option value="pharmacy_bill">Pharmacy / Medical Bill (Diagnostic Labs)</option>
            <option value="tax_invoice">GST / FBR Tax Invoice</option>
            <option value="utility_bill">Electricity / Gas / Utility Bill</option>
            <option value="service_invoice">Service Invoice</option>
            <option value="other">Other Financial Document</option>
          </select>
        </div>

        {/* Section 1: Vendor Details */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-indigo-600" />
              <span>Vendor / Merchant Details</span>
            </h3>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${getConfidenceBadge(initialData.vendor_name.confidence).bg} ${getConfidenceBadge(initialData.vendor_name.confidence).text} ${getConfidenceBadge(initialData.vendor_name.confidence).border}`}>
              {getConfidenceBadge(initialData.vendor_name.confidence).label}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1">Business Name *</label>
              <input
                type="text"
                required
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                onFocus={() => onFieldFocus("vendor_name", initialData.vendor_name.bounding_box)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                placeholder="e.g. ABC Super Store"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1">Phone Number</label>
              <input
                type="text"
                value={vendorPhone}
                onChange={(e) => setVendorPhone(e.target.value)}
                onFocus={() => onFieldFocus("vendor_phone", initialData.vendor_phone.bounding_box)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                placeholder="e.g. 042-35889900"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1">NTN / STRN</label>
              <input
                type="text"
                value={vendorNtn}
                onChange={(e) => setVendorNtn(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                placeholder="e.g. 3819204-7"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1">Address / Branch</label>
              <input
                type="text"
                value={vendorAddress}
                onChange={(e) => setVendorAddress(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                placeholder="e.g. Gulberg, Lahore"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Invoice Metadata */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-indigo-600" />
              <span>Bill Identifiers</span>
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1">Invoice Number</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                onFocus={() => onFieldFocus("invoice_number", initialData.invoice_number.bounding_box)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                placeholder="e.g. INV-1025"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1">Invoice Date *</label>
              <input
                type="date"
                required
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                onFocus={() => onFieldFocus("invoice_date", initialData.invoice_date.bounding_box)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="PKR">PKR (Rs.)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-slate-600 block">Expense Category *</label>
                <span className="text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-200/80 font-bold px-1.5 py-0.5 rounded-sm">
                  ✨ Auto-Decided
                </span>
              </div>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Line Items */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-600" />
              <span>Line Items ({items.length})</span>
            </h3>
            <button
              type="button"
              onClick={handleAddItem}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Item</span>
            </button>
          </div>

          <div className="space-y-2">
            {items.map((item, idx) => {
              const hasItemPriceError = Number(item.unit_price || 0) <= 0 || Number(item.line_total || 0) <= 0;
              return (
                <div
                  key={idx}
                  onMouseEnter={() => item.bounding_box && onFieldFocus(`item_${idx}`, item.bounding_box)}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border transition-colors ${
                    hasItemPriceError
                      ? "border-rose-300 bg-rose-50/60"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex-1">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleItemChange(idx, "name", e.target.value)}
                      className={`w-full text-xs font-medium bg-white border rounded px-2.5 py-1.5 text-slate-900 ${
                        hasItemPriceError ? "border-rose-300" : "border-slate-200"
                      }`}
                      placeholder="Item name"
                    />
                  </div>
                  <div className="w-16">
                    <input
                      type="number"
                      step="any"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 rounded px-2 py-1.5 text-slate-900 text-center"
                      placeholder="Qty"
                    />
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(idx, "unit_price", e.target.value)}
                      className={`w-full text-xs bg-white border rounded px-2 py-1.5 text-right ${
                        Number(item.unit_price || 0) <= 0
                          ? "border-rose-400 bg-rose-50/70 text-rose-900 font-semibold"
                          : "border-slate-200 text-slate-900"
                      }`}
                      placeholder="Unit Price"
                    />
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      step="0.01"
                      value={item.line_total}
                      onChange={(e) => handleItemChange(idx, "line_total", e.target.value)}
                      className={`w-full text-xs font-semibold bg-white border rounded px-2 py-1.5 text-right ${
                        Number(item.line_total || 0) <= 0
                          ? "border-rose-400 bg-rose-50/70 text-rose-900"
                          : "border-slate-200 text-slate-900"
                      }`}
                      placeholder="Total"
                    />
                  </div>
                  {hasItemPriceError && (
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100 border border-rose-300 px-1.5 py-0.5 rounded whitespace-nowrap">
                      ⚠️ Missing Price
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}

            {items.length === 0 && (
              <p className="text-xs text-slate-400 italic py-2 text-center bg-slate-50 rounded-lg">
                No individual line items itemized. Total amount is recorded directly.
              </p>
            )}
          </div>
        </div>

        {/* Section 4: Totals & Mathematical Validation Engine */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
              <span>Financial Totals</span>
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1">
                Subtotal {!isSubtotalMatching && <span className="text-rose-600 font-bold">*Mismatch</span>}
              </label>
              <input
                type="number"
                step="0.01"
                value={subtotal}
                onChange={(e) => setSubtotal(Number(e.target.value))}
                onFocus={() => onFieldFocus("subtotal", initialData.subtotal.bounding_box)}
                className={`w-full text-xs rounded-lg px-3 py-2 text-right font-medium bg-white border ${
                  !isSubtotalMatching
                    ? "border-rose-400 bg-rose-50/50 text-rose-900 ring-1 ring-rose-300"
                    : "border-slate-200 text-slate-900"
                }`}
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1">Discount</label>
              <input
                type="number"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-right font-medium"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1">GST / Tax</label>
              <input
                type="number"
                step="0.01"
                value={tax}
                onChange={(e) => setTax(Number(e.target.value))}
                onFocus={() => onFieldFocus("tax", initialData.tax.bounding_box)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-right font-medium"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold block mb-1 text-slate-900">
                Grand Total * {!isGrandTotalMatching && <span className="text-rose-600 font-bold">⚠️ Error</span>}
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={total}
                onChange={(e) => setTotal(Number(e.target.value))}
                onFocus={() => onFieldFocus("total", initialData.total.bounding_box)}
                className={`w-full text-sm font-bold rounded-lg px-3 py-2 text-right bg-white ${
                  !isGrandTotalMatching
                    ? "border-2 border-rose-500 bg-rose-50/60 text-rose-900"
                    : "border-2 border-indigo-500 text-indigo-900"
                }`}
              />
            </div>
          </div>

          {/* Mathematical Cross-Check Verification Alert */}
          {(!isSubtotalMatching || !isGrandTotalMatching) ? (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Financial Discrepancy Flagged</span>
                {!isSubtotalMatching && (
                  <p className="mt-0.5">Line items sum ({calculatedItemsSum}) does not equal subtotal ({subtotal}). Difference: {Math.abs(calculatedItemsSum - subtotal).toFixed(2)}</p>
                )}
                {!isGrandTotalMatching && (
                  <p className="mt-0.5">Calculated grand total ({calculatedGrandTotal.toFixed(2)}) differs from entered total ({total}).</p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Calculations verified: Subtotal ({subtotal}) + Tax ({tax}) - Discount ({discount}) = Grand Total ({total})</span>
            </div>
          )}
        </div>

        {/* Section 5: Dynamic Custom Fields (Restaurant Table, Pharmacy Doctor, etc.) */}
        {Object.keys(customFields).length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Dynamic Document Metadata
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              {Object.entries(customFields).map(([k, v]) => (
                <div key={k}>
                  <label className="text-[11px] font-semibold text-slate-600 uppercase block mb-1">
                    {k.replace("_", " ")}
                  </label>
                  <input
                    type="text"
                    value={String(v || "")}
                    onChange={(e) => setCustomFields({ ...customFields, [k]: e.target.value })}
                    className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 text-slate-800"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Actions */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
        <div className="text-xs text-slate-500">
          Total to commit: <strong className="text-slate-900 font-semibold">{currency} {total.toFixed(2)}</strong>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-5 py-2.5 rounded-lg shadow-sm shadow-emerald-200 transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSubmitting ? "Committing..." : "Approve & Save"}</span>
        </button>
      </div>
    </form>
  );
}
