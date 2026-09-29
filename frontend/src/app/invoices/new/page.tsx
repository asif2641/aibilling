"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Building, 
  Receipt, 
  Calendar, 
  Plus, 
  Trash2, 
  DollarSign, 
  Save, 
  AlertCircle, 
  Users, 
  FileText,
  UploadCloud
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { api } from "@/lib/api";
import { Category, Vendor, Customer } from "@/types";
import { getLocalizedCategory, getLocalizedVendor, getLocalizedCustomer } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

interface ManualItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  line_total: number;
}

export default function ManualBillPage() {
  const router = useRouter();
  const { t, language, isUrdu } = useLanguage();

  // Reference lists
  const [categories, setCategories] = useState<Category[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Vendor Information
  const [vendorName, setVendorName] = useState("");
  const [vendorPhone, setVendorPhone] = useState("");
  const [vendorAddress, setVendorAddress] = useState("");
  const [vendorNtn, setVendorNtn] = useState("");

  // Invoice Metadata
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [currency, setCurrency] = useState("PKR");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [notes, setNotes] = useState("");

  // Customer Information (Optional)
  const [showCustomer, setShowCustomer] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");

  // Line Items
  const [items, setItems] = useState<ManualItem[]>([
    { id: "1", name: "", quantity: 1, unit: isUrdu ? "آئٹم" : "Item", unit_price: 0, line_total: 0 }
  ]);

  // Totals
  const [discount, setDiscount] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);
  const [serviceCharge, setServiceCharge] = useState<number>(0);
  const [shipping, setShipping] = useState<number>(0);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [paidManuallyEdited, setPaidManuallyEdited] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load metadata on mount
  useEffect(() => {
    Promise.all([
      api.getCategories().catch(() => []),
      api.getVendors().catch(() => []),
      api.getCustomers().catch(() => []),
      api.getMe().catch(() => null),
    ]).then(([cats, vens, custs, me]) => {
      setCategories(cats);
      setVendors(vens);
      setCustomers(custs);
      if (cats.length > 0) {
        setCategoryId(cats[0].id);
      }
      if (me?.currency) {
        setCurrency(me.currency);
      }
    });
  }, []);

  // Compute Subtotal
  const subtotal = items.reduce((acc, it) => acc + (Number(it.line_total) || 0), 0);
  // Compute Grand Total
  const total = Math.max(0, subtotal - (Number(discount) || 0) + (Number(tax) || 0) + (Number(serviceCharge) || 0) + (Number(shipping) || 0));
  // Compute Balance Due
  const currentPaid = paidManuallyEdited ? amountPaid : total;
  const balanceDue = Math.max(0, total - currentPaid);

  // Auto-fill vendor details if existing vendor chosen
  const handleVendorSelect = (name: string) => {
    setVendorName(name);
    const existing = vendors.find((v) => v.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      if (existing.phone) setVendorPhone(existing.phone);
      if (existing.address) setVendorAddress(existing.address);
      if (existing.ntn) setVendorNtn(existing.ntn);
    }
  };

  // Auto-fill customer details if existing customer chosen
  const handleCustomerSelect = (name: string) => {
    setCustomerName(name);
    const n = name.trim().toLowerCase();
    const existing = customers.find((c) => 
      c.name.toLowerCase() === n || 
      getLocalizedCustomer(c.name, "ur").toLowerCase() === n
    );
    if (existing) {
      if (existing.phone) setCustomerPhone(existing.phone);
      if (existing.email) setCustomerEmail(existing.email);
      if (existing.address) setCustomerAddress(existing.address);
    }
  };

  // Line Item Handlers
  const handleItemChange = (id: string, field: keyof ManualItem, val: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: val };
        if (field === "quantity" || field === "unit_price") {
          const q = field === "quantity" ? Number(val) : item.quantity;
          const p = field === "unit_price" ? Number(val) : item.unit_price;
          updated.line_total = Math.round(q * p * 100) / 100;
        }
        return updated;
      })
    );
  };

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
        name: "",
        quantity: 1,
        unit: isUrdu ? "آئٹم" : "Item",
        unit_price: 0,
        line_total: 0,
      }
    ]);
  };

  const removeItemRow = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!vendorName.trim()) {
      setError(isUrdu ? "براہ کرم وینڈر یا دکان کا نام درج کریں۔" : "Please provide a vendor or business name.");
      return;
    }

    if (items.length === 0 || (items.length === 1 && !items[0].name.trim() && total <= 0)) {
      setError(isUrdu ? "براہ کرم کم از کم ایک آئٹم یا رقم درج کریں۔" : "Please add at least one line item or bill total.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        document_id: null,
        vendor_name: vendorName.trim(),
        vendor_phone: vendorPhone.trim() || null,
        vendor_address: vendorAddress.trim() || null,
        vendor_ntn: vendorNtn.trim() || null,
        invoice_number: invoiceNumber.trim() || `MAN-${Date.now().toString().slice(-6)}`,
        invoice_date: invoiceDate,
        due_date: dueDate || null,
        category_id: categoryId || null,
        currency,
        payment_method: paymentMethod,
        notes: notes.trim() || null,
        customer_name: showCustomer && customerName.trim() ? customerName.trim() : null,
        customer_phone: showCustomer && customerPhone.trim() ? customerPhone.trim() : null,
        customer_email: showCustomer && customerEmail.trim() ? customerEmail.trim() : null,
        customer_address: showCustomer && customerAddress.trim() ? customerAddress.trim() : null,
        subtotal,
        discount: Number(discount) || 0,
        tax: Number(tax) || 0,
        service_charge: Number(serviceCharge) || 0,
        shipping: Number(shipping) || 0,
        rounding: 0,
        total,
        amount_paid: currentPaid,
        balance_due: balanceDue,
        items: items
          .filter((it) => it.name.trim() || it.line_total > 0)
          .map((it) => ({
            name: it.name.trim() || (isUrdu ? "آئٹم" : "Item"),
            quantity: Number(it.quantity) || 1,
            unit: it.unit || (isUrdu ? "آئٹم" : "Item"),
            unit_price: Number(it.unit_price) || 0,
            discount: 0,
            tax: 0,
            line_total: Number(it.line_total) || 0,
          })),
        custom_fields: {
          creation_mode: "MANUAL_ENTRY",
          created_at: new Date().toISOString()
        }
      };

      await api.approveInvoice(payload);
      router.push("/invoices");
    } catch (err: any) {
      setError(err.message || t.manualBill.errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app-layout-container flex min-h-screen bg-slate-50" dir="ltr">
      <Sidebar />
      <div className={`right-content-panel flex-1 flex flex-col min-w-0 ${isUrdu ? "font-urdu" : ""}`} dir="ltr">
        <Header title={t.manualBill.title} />

        <main className="flex-1 p-4 sm:p-8 max-w-5xl mx-auto w-full space-y-6">
          {/* Top Bar Navigation & Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/invoices"
                className="p-2 rounded-lg hover:bg-white text-slate-500 hover:text-slate-800 transition-colors border border-transparent hover:border-slate-200"
                title={t.manualBill.backToBills}
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">{t.manualBill.title}</h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t.manualBill.subtitle}
                </p>
              </div>
            </div>

            <Link
              href="/invoices/upload"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-all"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>{isUrdu ? "یا AI اسکینر استعمال کریں" : "Or Scan with AI"}</span>
            </Link>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Vendor & Merchant */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Building className="w-4 h-4 text-indigo-600" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  {t.manualBill.billDetailsSection}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">
                    {t.manualBill.vendorNameLabel} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    list="vendor-datalist"
                    placeholder={t.manualBill.vendorPlaceholder}
                    value={vendorName}
                    onChange={(e) => handleVendorSelect(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <datalist id="vendor-datalist">
                    {vendors.map((v) => (
                      <option key={v.id} value={isUrdu ? getLocalizedVendor(v.name, language) : v.name}>
                        {getLocalizedVendor(v.name, language)}
                      </option>
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">{isUrdu ? "فون نمبر" : "Phone Number"}</label>
                  <input
                    type="text"
                    placeholder="0321-1234567"
                    value={vendorPhone}
                    onChange={(e) => setVendorPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">{isUrdu ? "ٹیکس نمبر / این ٹی این" : "NTN / Tax ID"}</label>
                  <input
                    type="text"
                    placeholder="1234567-8"
                    value={vendorNtn}
                    onChange={(e) => setVendorNtn(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="font-bold text-slate-700 block mb-1">{isUrdu ? "پتہ / برانچ" : "Address / Branch Location"}</label>
                  <input
                    type="text"
                    placeholder={isUrdu ? "مثلاً گلبرگ، لاہور" : "e.g., Gulberg III, Lahore, Pakistan"}
                    value={vendorAddress}
                    onChange={(e) => setVendorAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Invoice Metadata */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Receipt className="w-4 h-4 text-indigo-600" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  {isUrdu ? "بل کے شناختی کوائف" : "Bill & Invoice Identifiers"}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t.manualBill.invoiceNoLabel}</label>
                  <input
                    type="text"
                    placeholder={t.manualBill.invoiceNoPlaceholder}
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {t.manualBill.invoiceDateLabel} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t.manualBill.dueDateLabel}</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t.manualBill.categoryLabel}</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {getLocalizedCategory(c.name, language)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">{isUrdu ? "کرنسی" : "Currency"}</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:bg-white"
                  >
                    <option value="PKR">{isUrdu ? "روپے (PKR)" : "PKR (Pakistani Rupee)"}</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">{isUrdu ? "طریقہ ادائیگی" : "Payment Method"}</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white"
                  >
                    <option value="Cash">{isUrdu ? "نقد رقم (Cash)" : "Cash"}</option>
                    <option value="Credit Card">{isUrdu ? "کریڈٹ کارڈ" : "Credit Card"}</option>
                    <option value="Debit Card">{isUrdu ? "ڈیبٹ کارڈ" : "Debit Card"}</option>
                    <option value="Bank Transfer">{isUrdu ? "بینک ٹرانسفر" : "Bank Transfer"}</option>
                    <option value="Online / Mobile">{isUrdu ? "موبائل والیٹ (JazzCash / EasyPaisa)" : "Online / Mobile Wallet"}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Optional Customer Profile Section */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    {t.manualBill.customerSection}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCustomer(!showCustomer)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                >
                  {showCustomer ? (isUrdu ? "— فیلڈز چھپائیں" : "— Hide Customer Fields") : (isUrdu ? "+ گاہک کی تفصیل شامل کریں" : "+ Attach Customer / Patient")}
                </button>
              </div>

              {showCustomer && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs pt-1">
                  <div className="sm:col-span-2">
                    <label className="font-bold text-slate-700 block mb-1">{t.manualBill.customerNameLabel}</label>
                    <input
                      type="text"
                      list="customer-datalist"
                      placeholder={t.manualBill.customerNamePlaceholder}
                      value={customerName}
                      onChange={(e) => handleCustomerSelect(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white"
                    />
                    <datalist id="customer-datalist">
                      {customers.map((c) => {
                        const locName = getLocalizedCustomer(c.name, language);
                        return (
                          <option 
                            key={c.id} 
                            value={locName} 
                            label={locName !== c.name ? `${locName} (${c.name})` : c.name} 
                          />
                        );
                      })}
                    </datalist>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">{t.manualBill.customerPhoneLabel}</label>
                    <input
                      type="text"
                      placeholder={t.manualBill.customerPhonePlaceholder}
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">{isUrdu ? "ای میل" : "Email"}</label>
                    <input
                      type="email"
                      placeholder="client@example.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Section 3: Line Items Table */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    {t.manualBill.lineItemsSection} ({items.length})
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={addItemRow}
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-md"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t.manualBill.addItemButton}</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3">{t.manualBill.itemDescCol}</th>
                      <th className="py-2.5 px-3 w-24">{t.manualBill.itemQtyCol}</th>
                      <th className="py-2.5 px-3 w-28">{isUrdu ? "یونٹ" : "Unit"}</th>
                      <th className="py-2.5 px-3 w-32">{t.manualBill.itemPriceCol}</th>
                      <th className="py-2.5 px-3 w-36 text-right">{t.manualBill.itemTotalCol}</th>
                      <th className="py-2.5 px-2 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            placeholder={isUrdu ? "سامان یا آئٹم کا نام" : "Description or Product Name"}
                            value={item.name}
                            onChange={(e) => handleItemChange(item.id, "name", e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-900 focus:bg-white"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="0.001"
                            step="any"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(item.id, "quantity", e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-900 font-mono focus:bg-white"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            placeholder={isUrdu ? "عدد، کلو..." : "Piece, kg, L..."}
                            value={item.unit}
                            onChange={(e) => handleItemChange(item.id, "unit", e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-900 focus:bg-white"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.unit_price}
                            onChange={(e) => handleItemChange(item.id, "unit_price", e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-900 font-mono focus:bg-white"
                          />
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          {currency} {Number(item.line_total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeItemRow(item.id)}
                            disabled={items.length <= 1}
                            className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 disabled:hover:text-slate-400"
                            title={isUrdu ? "آئٹم ختم کریں" : "Delete Item"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 4: Totals & Calculations */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <DollarSign className="w-4 h-4 text-indigo-600" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  {isUrdu ? "مالیاتی حساب اور خلاصہ" : "Financial Calculations & Summary"}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
                {/* Notes */}
                <div className="space-y-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">{t.manualBill.notesLabel}</label>
                    <textarea
                      rows={4}
                      placeholder={t.manualBill.notesPlaceholder}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-900 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Arithmetic Breakdown */}
                <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-semibold">{t.manualBill.subtotal}:</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {currency} {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-600 font-semibold">{t.manualBill.discountAmount}:</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                      className="w-32 bg-white border border-slate-200 rounded px-2 py-1 text-right font-mono font-bold"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-600 font-semibold">{t.manualBill.taxAmount}:</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={tax}
                      onChange={(e) => setTax(Number(e.target.value) || 0)}
                      className="w-32 bg-white border border-slate-200 rounded px-2 py-1 text-right font-mono font-bold"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-600 font-semibold">{isUrdu ? "سروس چارجز:" : "Service / Shipping:"}</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={serviceCharge}
                      onChange={(e) => setServiceCharge(Number(e.target.value) || 0)}
                      className="w-32 bg-white border border-slate-200 rounded px-2 py-1 text-right font-mono font-bold"
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">{t.manualBill.finalTotal}:</span>
                    <span className="text-base font-extrabold text-indigo-700 font-mono">
                      {currency} {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-1">
                    <span className="text-slate-600 font-semibold">{isUrdu ? "ادا شدہ رقم:" : "Amount Paid:"}</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={paidManuallyEdited ? amountPaid : total}
                      onChange={(e) => {
                        setPaidManuallyEdited(true);
                        setAmountPaid(Number(e.target.value) || 0);
                      }}
                      className="w-32 bg-white border border-slate-200 rounded px-2 py-1 text-right font-mono font-bold"
                    />
                  </div>

                  <div className="flex items-center justify-between text-slate-600 pt-1">
                    <span className="font-semibold">{isUrdu ? "باقی رقم:" : "Balance Due:"}</span>
                    <span className={`font-mono font-bold ${balanceDue > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                      {currency} {balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Link
                href="/invoices"
                className="px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-all"
              >
                {t.common.cancel}
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? t.manualBill.saving : t.manualBill.saveAndApproveButton}</span>
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
