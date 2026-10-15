"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Users, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  Receipt, 
  Edit3, 
  Eye, 
  X,
  Layers,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  AlertTriangle
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { InvoiceDetailModal } from "@/components/invoices/InvoiceDetailModal";
import { api } from "@/lib/api";
import { Customer, CustomerDetail } from "@/types";
import { formatCurrency, formatDate, getLocalizedCustomer, getLocalizedVendor } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { t, language, isUrdu } = useLanguage();

  // Customer Detail Modal
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerDetail, setCustomerDetail] = useState<CustomerDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [billSearch, setBillSearch] = useState("");
  const [customerBillTab, setCustomerBillTab] = useState<"all" | "error">("all");

  // Invoice Detail Modal inside Customer View
  const [viewingInvoiceId, setViewingInvoiceId] = useState<string | null>(null);
  const [viewingInvoiceFallback, setViewingInvoiceFallback] = useState<any | null>(null);

  // Edit Customer Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCust, setEditingCust] = useState<Customer | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchCustomers = () => {
    setLoading(true);
    api.getCustomers()
      .then(setCustomers)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const openDetail = async (id: string) => {
    setSelectedCustomerId(id);
    setLoadingDetail(true);
    setBillSearch("");
    setCustomerBillTab("all");
    try {
      const data = await api.getCustomer(id);
      setCustomerDetail(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const openEdit = (c: Customer) => {
    setEditingCust(c);
    setName(c.name);
    setPhone(c.phone || "");
    setEmail(c.email || "");
    setAddress(c.address || "");
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCust) return;
    setSaving(true);
    try {
      await api.updateCustomer(editingCust.id, {
        name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
      });
      setEditModalOpen(false);
      fetchCustomers();
    } catch (err: any) {
      alert((isUrdu ? "کسٹمر محفوظ کرنے میں خرابی: " : "Failed to update customer: ") + err.message);
    } finally {
      setSaving(false);
    }
  };

  const filtered = customers.filter((c) => {
    const urduName = getLocalizedCustomer(c.name, "ur");
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      urduName.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  });

  const filteredCustomerInvoices = customerDetail?.invoices?.filter((inv) => {
    if (customerBillTab === "error" && !inv.has_discrepancy) {
      return false;
    }
    const q = billSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      (inv.invoice_number && inv.invoice_number.toLowerCase().includes(q)) ||
      (inv.vendor_name && inv.vendor_name.toLowerCase().includes(q)) ||
      (inv.category_name && inv.category_name.toLowerCase().includes(q)) ||
      (inv.notes && inv.notes.toLowerCase().includes(q)) ||
      inv.invoice_date.includes(q)
    );
  }) || [];

  return (
    <div className="app-layout-container flex min-h-screen bg-slate-50" dir="ltr">
      <Sidebar />
      <div className={`right-content-panel flex-1 flex flex-col min-w-0 ${isUrdu ? "font-urdu" : ""}`} dir="ltr">
        <Header title={t.customers.title} />

        <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{t.customers.title}</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {t.customers.subtitle}
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 left-3" />
            <input
              type="text"
              placeholder={t.customers.searchCustomers}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 pl-9 pr-4"
            />
          </div>

          {/* Customers Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">{t.customers.customerName}</th>
                    <th className="py-3 px-4">{t.customers.phone}</th>
                    <th className="py-3 px-4">{isUrdu ? "ای میل / پتہ" : "Email / Address"}</th>
                    <th className="py-3 px-4">{t.customers.totalBills}</th>
                    <th className="py-3 px-4 text-right">{isUrdu ? "کل خریداری" : "Total Purchases"}</th>
                    <th className="py-3 px-4">{isUrdu ? "آخری تاریخ" : "Last Activity"}</th>
                    <th className="py-3 px-4 text-right">{t.common.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        {t.common.loading}
                      </td>
                    </tr>
                  ) : filtered.length > 0 ? (
                    filtered.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-700 font-semibold flex items-center justify-center text-xs border border-indigo-200 shrink-0">
                            {isUrdu ? getLocalizedCustomer(c.name, language).charAt(0) : c.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="truncate text-slate-900 font-bold">{getLocalizedCustomer(c.name, language)}</span>
                            {isUrdu && getLocalizedCustomer(c.name, language) !== c.name && (
                              <span className="text-[10px] text-slate-400 font-mono font-normal truncate">{c.name}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-mono">
                          {c.phone || "—"}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 truncate max-w-xs">
                          {c.email || c.address || "—"}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="inline-flex items-center gap-1 font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                              <Receipt className="w-3 h-3 text-slate-500" />
                              <span>{c.total_invoices} {isUrdu ? "بلز" : "bills"}</span>
                            </span>
                            {(c.incorrect_invoices_count ?? 0) > 0 && (
                              <span 
                                className="bg-rose-50 text-rose-700 border border-rose-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full inline-flex items-center gap-1"
                                title={isUrdu ? "اس کسٹمر کے بلز میں غلطیاں / تضادات ہیں" : "Contains bills with discrepancies"}
                              >
                                <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                                <span>{c.incorrect_invoices_count} {isUrdu ? "غلط" : "Errors"}</span>
                              </span>
                            )}
                            {c.total_invoices > 1 && (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-1.5 py-0.2 rounded-full inline-flex items-center gap-0.5" title={isUrdu ? "متعدد بلز منسلک ہیں" : "Multiple bills linked"}>
                                <Layers className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-900 font-mono">
                          {formatCurrency(c.total_spend, "PKR", language)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                          {c.last_purchase_date ? formatDate(c.last_purchase_date, language) : "—"}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                          <button
                            onClick={() => openDetail(c.id)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors inline-block cursor-pointer"
                            title={isUrdu ? "پروفائل اور تمام بلز دیکھیں" : "View Profile & All Bills"}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEdit(c)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors inline-block cursor-pointer"
                            title={isUrdu ? "کسٹمر میں ترمیم کریں" : "Edit Contact"}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-2">
                          <Users className="w-8 h-8 text-slate-300" />
                          <p className="text-xs font-semibold text-slate-600">{t.customers.noCustomersFound}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Customer Detail Drawer / Modal with Consolidated Invoices */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold text-base flex items-center justify-center shadow-xs">
                  {customerDetail?.name ? customerDetail.name.charAt(0).toUpperCase() : "C"}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>{customerDetail ? getLocalizedCustomer(customerDetail.name, language) : (isUrdu ? "کسٹمر پروفائل" : "Customer Profile")}</span>
                    {customerDetail && customerDetail.total_invoices > 1 && (
                      <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        <span>{customerDetail.total_invoices} {isUrdu ? "بلز منسلک ہیں" : "Bills Linked"}</span>
                      </span>
                    )}
                    {customerDetail && (customerDetail.incorrect_invoices_count ?? 0) > 0 && (
                      <span className="bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        <span>{customerDetail.incorrect_invoices_count} {isUrdu ? "غلط بلز" : "Error Bills"}</span>
                      </span>
                    )}
                  </h3>
                  {isUrdu && customerDetail?.name && getLocalizedCustomer(customerDetail.name, language) !== customerDetail.name && (
                    <span className="text-[11px] text-slate-400 font-mono block">{customerDetail.name}</span>
                  )}
                  <p className="text-xs text-slate-500 mt-0.5">{isUrdu ? "خریداری کی تاریخ اور تمام منسلک بلز" : "Purchase History & Consolidated Invoices"}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomerId(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {loadingDetail ? (
                <div className="py-12 text-center text-slate-400 text-xs">{t.common.loading}</div>
              ) : customerDetail ? (
                <>
                  {/* Multi-bill consolidation callout banner */}
                  {customerDetail.total_invoices > 1 && (
                    <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-xl flex items-center gap-3 text-xs text-indigo-900">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                      <div>
                        <strong>{isUrdu ? "متعدد بلز خودکار یکجا:" : "Multiple Bills Consolidated:"}</strong>{" "}
                        {isUrdu 
                          ? `اس کسٹمر کے تمام ${customerDetail.total_invoices} بلز خودکار طریقے سے اس پروفائل میں یکجا ہیں۔`
                          : `All ${customerDetail.total_invoices} bills and purchases for this customer are automatically consolidated under this profile.`}
                      </div>
                    </div>
                  )}

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-[11px] font-bold text-slate-500 uppercase block">{isUrdu ? "کل خریداری" : "Total Purchases"}</span>
                      <span className="text-base font-bold text-slate-900 font-mono mt-1 block">
                        {formatCurrency(customerDetail.total_spend, "PKR", language)}
                      </span>
                    </div>
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-[11px] font-bold text-slate-500 uppercase block">{isUrdu ? "کل بلز" : "Total Bills"}</span>
                      <span className="text-base font-bold text-indigo-700 font-mono mt-1 block">
                        {customerDetail.total_invoices}
                      </span>
                    </div>
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-[11px] font-bold text-slate-500 uppercase block">{isUrdu ? "اوسط خریداری" : "Avg Purchase"}</span>
                      <span className="text-base font-bold text-slate-900 font-mono mt-1 block">
                        {customerDetail.total_invoices > 0 
                          ? formatCurrency(Number(customerDetail.total_spend) / customerDetail.total_invoices, "PKR", language)
                          : "—"}
                      </span>
                    </div>
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-[11px] font-bold text-slate-500 uppercase block">{isUrdu ? "آخری سرگرمی" : "Last Activity"}</span>
                      <span className="text-xs font-bold text-slate-800 mt-2 block">
                        {customerDetail.last_purchase_date ? formatDate(customerDetail.last_purchase_date, language) : "—"}
                      </span>
                    </div>
                    {(customerDetail.incorrect_invoices_count ?? 0) > 0 && (
                      <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl">
                        <span className="text-[11px] font-bold text-rose-700 uppercase block flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          {isUrdu ? "غلط بلز" : "Error Bills"}
                        </span>
                        <span className="text-base font-bold text-rose-800 font-mono mt-1 block">
                          {customerDetail.incorrect_invoices_count}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Contact Info */}
                  <div className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs space-y-1.5 text-slate-700">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {customerDetail.phone && (
                        <p className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <strong className="text-slate-500">{t.customers.phone}:</strong>
                          <span className="font-mono text-slate-900 font-semibold">{customerDetail.phone}</span>
                        </p>
                      )}
                      {customerDetail.email && (
                        <p className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <strong className="text-slate-500">{isUrdu ? "ای میل:" : "Email:"}</strong>
                          <span className="text-slate-900">{customerDetail.email}</span>
                        </p>
                      )}
                      {customerDetail.address && (
                        <p className="flex items-center gap-1.5 sm:col-span-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <strong className="text-slate-500">{t.customers.address}:</strong>
                          <span className="text-slate-900">{customerDetail.address}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* ALL INVOICES / BILLS OF THIS CUSTOMER */}
                  <div className="space-y-3 pt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                          <Receipt className="w-4 h-4 text-indigo-600" />
                          <span>{isUrdu ? "بلز کی فہرست" : "Invoices List"}</span>
                        </h4>

                        {/* Filter tabs inside customer detail: All vs Errors */}
                        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
                          <button
                            type="button"
                            onClick={() => setCustomerBillTab("all")}
                            className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                              customerBillTab === "all"
                                ? "bg-white text-slate-900 shadow-2xs"
                                : "text-slate-500 hover:text-slate-900"
                            }`}
                          >
                            {isUrdu ? "تمام بلز" : "All Bills"} ({customerDetail.invoices?.length || 0})
                          </button>
                          <button
                            type="button"
                            onClick={() => setCustomerBillTab("error")}
                            className={`px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1 ${
                              customerBillTab === "error"
                                ? "bg-rose-600 text-white shadow-2xs"
                                : "text-rose-700 hover:text-rose-900"
                            }`}
                          >
                            <AlertTriangle className="w-3 h-3" />
                            <span>{isUrdu ? "صرف غلط بلز" : "Error Bills"}</span>
                            <span>({customerDetail.incorrect_invoices_count ?? 0})</span>
                          </button>
                        </div>
                      </div>

                      {/* Quick search inside customer bills */}
                      {customerDetail.invoices && customerDetail.invoices.length > 2 && (
                        <div className="relative max-w-xs w-full">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute top-1/2 -translate-y-1/2 left-2.5" />
                          <input
                            type="text"
                            placeholder={isUrdu ? "بل نمبر یا وینڈر سے تلاش کریں..." : "Filter bills by number/vendor..."}
                            value={billSearch}
                            onChange={(e) => setBillSearch(e.target.value)}
                            className="w-full py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      )}
                    </div>

                    {filteredCustomerInvoices.length > 0 ? (
                      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                              <th className="py-2.5 px-3">{isUrdu ? "بل نمبر" : "Bill #"}</th>
                              <th className="py-2.5 px-3">{isUrdu ? "تاریخ" : "Date"}</th>
                              <th className="py-2.5 px-3">{isUrdu ? "وینڈر" : "Vendor"}</th>
                              <th className="py-2.5 px-3">{isUrdu ? "کیٹیگری" : "Category"}</th>
                              <th className="py-2.5 px-3 text-right">{isUrdu ? "رقم" : "Amount"}</th>
                              <th className="py-2.5 px-3 text-center">{isUrdu ? "حیثیت" : "Status"}</th>
                              <th className="py-2.5 px-3 text-right">{isUrdu ? "ایکشن" : "Action"}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {filteredCustomerInvoices.map((inv) => (
                              <tr 
                                key={inv.id} 
                                className={`transition-colors ${
                                  inv.has_discrepancy ? "bg-rose-50/40 hover:bg-rose-50/70" : "hover:bg-slate-50/80"
                                }`}
                              >
                                <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                                  <div className="flex items-center gap-1.5">
                                    <span>{inv.invoice_number || "—"}</span>
                                    {inv.has_discrepancy && (
                                      <span
                                        title={inv.discrepancy_notes?.join(" • ") || "Mathematical discrepancy flagged"}
                                        className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300"
                                      >
                                        <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                                        <span>{isUrdu ? "غلطی" : "Error"}</span>
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 text-slate-500">
                                  {formatDate(inv.invoice_date, language)}
                                </td>
                                <td className="py-2.5 px-3 font-semibold text-slate-800">
                                  {inv.vendor_name ? getLocalizedVendor(inv.vendor_name, language) : "—"}
                                </td>
                                <td className="py-2.5 px-3">
                                  {inv.category_name ? (
                                    <span className="inline-block bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-semibold">
                                      {inv.category_name}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-[11px]">—</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                                  {formatCurrency(inv.total, inv.currency, language)}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                    inv.status === "VERIFIED" 
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                                      : "bg-amber-50 text-amber-700 border border-amber-200"
                                  }`}>
                                    {inv.status === "VERIFIED" ? (isUrdu ? "تصدیق شدہ" : "Verified") : (isUrdu ? "زیرِ جائزہ" : "Review")}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setViewingInvoiceId(inv.id);
                                      setViewingInvoiceFallback({
                                        invoice_number: inv.invoice_number,
                                        vendor_name: inv.vendor_name,
                                        customer_name: customerDetail?.name,
                                        total: inv.total,
                                        currency: inv.currency,
                                        invoice_date: inv.invoice_date,
                                        status: inv.status,
                                        category_name: inv.category_name,
                                        document_id: inv.document_id,
                                      });
                                    }}
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                                  >
                                    <span>{isUrdu ? "دیکھیں" : "View"}</span>
                                    <ChevronRight className="w-3 h-3" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                        {billSearch 
                          ? (isUrdu ? "تلاش کے مطابق کوئی بل نہیں ملا۔" : "No matching invoices found for this search filter.")
                          : (isUrdu ? "اس کسٹمر کے لیے کوئی بل موجود نہیں ہے۔" : "No invoices found for this customer.")}
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
              <Link
                href={`/invoices?customer_id=${selectedCustomerId}`}
                className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5"
              >
                <span>{isUrdu ? "لیجر میں کسٹمر کے تمام بلز فلٹر کریں" : "Filter all customer bills in Ledger"}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>

              <button
                onClick={() => setSelectedCustomerId(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer"
              >
                {t.common.close || (isUrdu ? "بند کریں" : "Close")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {isUrdu 
                  ? (editingCust?.name ? `کسٹمر ترمیم: ${getLocalizedCustomer(editingCust.name, language)}` : "کسٹمر کی تفصیلات میں ترمیم") 
                  : "Edit Customer"}
              </h3>
              <button onClick={() => setEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-5 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">{t.customers.customerName}</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">{t.customers.phone}</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">{isUrdu ? "ای میل" : "Email"}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">{t.customers.address}</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-bold cursor-pointer"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-2xs disabled:opacity-50 cursor-pointer"
                >
                  {saving ? t.common.loading : t.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Detailed Breakdown Modal */}
      <InvoiceDetailModal
        invoiceId={viewingInvoiceId}
        isOpen={Boolean(viewingInvoiceId)}
        onClose={() => setViewingInvoiceId(null)}
        fallbackData={viewingInvoiceFallback}
      />
    </div>
  );
}
