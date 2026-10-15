"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Building2, 
  Merge, 
  Search, 
  X,
  Eye,
  Phone,
  Mail,
  MapPin,
  Globe,
  Receipt,
  FileText,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  AlertTriangle
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { InvoiceDetailModal } from "@/components/invoices/InvoiceDetailModal";
import { api } from "@/lib/api";
import { Vendor, VendorDetail } from "@/types";
import { formatCurrency, formatDate, getLocalizedVendor } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { t, language, isUrdu } = useLanguage();

  // Vendor Detail Modal State
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [vendorDetail, setVendorDetail] = useState<VendorDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [billSearch, setBillSearch] = useState("");
  const [vendorBillTab, setVendorBillTab] = useState<"all" | "error">("all");

  // Invoice Detail Modal State
  const [viewingInvoiceId, setViewingInvoiceId] = useState<string | null>(null);
  const [viewingInvoiceFallback, setViewingInvoiceFallback] = useState<any | null>(null);

  // Merge Modal State
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [primaryVendorId, setPrimaryVendorId] = useState("");
  const [selectedDuplicates, setSelectedDuplicates] = useState<string[]>([]);
  const [merging, setMerging] = useState(false);

  const fetchVendors = () => {
    setLoading(true);
    api.getVendors()
      .then(setVendors)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const openDetail = async (id: string) => {
    setSelectedVendorId(id);
    setLoadingDetail(true);
    setBillSearch("");
    setVendorBillTab("all");
    try {
      const data = await api.getVendor(id);
      setVendorDetail(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const filtered = vendors.filter((v) =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    (v.phone && v.phone.includes(search)) ||
    (v.ntn && v.ntn.includes(search))
  );

  const handleMergeSubmit = async () => {
    if (!primaryVendorId || selectedDuplicates.length === 0) {
      alert(isUrdu ? "براہ کرم بنیادی وینڈر اور کم از کم ایک ڈپلیکیٹ وینڈر منتخب کریں۔" : "Please select a primary vendor and at least one duplicate vendor.");
      return;
    }
    setMerging(true);
    try {
      await api.mergeVendors(primaryVendorId, selectedDuplicates);
      setIsMergeModalOpen(false);
      setPrimaryVendorId("");
      setSelectedDuplicates([]);
      fetchVendors();
    } catch (err: any) {
      alert((isUrdu ? "وینڈرز ضم کرنے میں خرابی: " : "Merge failed: ") + err.message);
    } finally {
      setMerging(false);
    }
  };

  // Filter bills inside vendor detail modal
  const filteredVendorInvoices = vendorDetail?.invoices?.filter((inv) => {
    if (vendorBillTab === "error" && !inv.has_discrepancy) {
      return false;
    }
    const q = billSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      (inv.invoice_number && inv.invoice_number.toLowerCase().includes(q)) ||
      (inv.customer_name && inv.customer_name.toLowerCase().includes(q)) ||
      (inv.category_name && inv.category_name.toLowerCase().includes(q)) ||
      (inv.notes && inv.notes.toLowerCase().includes(q)) ||
      inv.invoice_date.includes(q)
    );
  }) || [];

  return (
    <div className="app-layout-container flex min-h-screen bg-slate-50" dir="ltr">
      <Sidebar />
      <div className={`right-content-panel flex-1 flex flex-col min-w-0 ${isUrdu ? "font-urdu" : ""}`} dir="ltr">
        <Header title={t.vendors.title} />

        <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{t.vendors.title}</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {t.vendors.subtitle}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMergeModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200 transition-all cursor-pointer"
              >
                <Merge className="w-3.5 h-3.5" />
                <span>{isUrdu ? "ڈپلیکیٹ وینڈرز یکجا (Merge) کریں" : "Merge Duplicate Vendors"}</span>
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 left-3" />
            <input
              type="text"
              placeholder={t.vendors.searchVendors}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 pl-9 pr-4 shadow-2xs"
            />
          </div>

          {/* Vendor Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <p className="text-xs text-slate-400 py-12 col-span-full text-center">{t.common.loading}</p>
            ) : filtered.length > 0 ? (
              filtered.map((v) => (
                <div
                  key={v.id}
                  className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4 hover:border-indigo-300 hover:shadow-sm transition-all flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 font-bold text-sm border border-indigo-100">
                          {v.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-slate-900 truncate" title={v.name}>
                            {getLocalizedVendor(v.name, language)}
                          </h3>
                          {isUrdu && getLocalizedVendor(v.name, language) !== v.name && (
                            <p className="text-[10px] text-slate-400 font-mono truncate">{v.name}</p>
                          )}
                          <p className="text-[11px] text-slate-400 truncate">
                            {v.address || (isUrdu ? "پتہ درج نہیں ہے" : "No address recorded")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {v.incorrect_invoices_count !== undefined && v.incorrect_invoices_count > 0 && (
                          <span 
                            className="shrink-0 inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full" 
                            title={isUrdu ? "اس وینڈر کے بلز میں غلطیاں / تضادات ہیں" : "Contains bills with discrepancies"}
                          >
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>{v.incorrect_invoices_count} {isUrdu ? "غلط" : "Errors"}</span>
                          </span>
                        )}
                        {v.total_invoices > 1 && (
                          <span className="shrink-0 inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full" title={isUrdu ? "ایک سے زیادہ بلز منسلک ہیں" : "Multiple bills linked"}>
                            <Layers className="w-3 h-3" />
                            <span>{v.total_invoices} {isUrdu ? "بلز" : "bills"}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">{t.vendors.totalSpend}</span>
                        <strong className="text-sm font-bold text-slate-900 font-mono">
                          {formatCurrency(v.total_spend, "PKR", language)}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">{t.vendors.totalBills}</span>
                        <strong className="text-sm font-bold text-slate-900 flex items-center gap-1">
                          {v.total_invoices}
                        </strong>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{isUrdu ? "آخری خریداری:" : "Last Purchase:"}</span>
                      <strong className="text-slate-700 font-medium">
                        {v.last_invoice_date ? formatDate(v.last_invoice_date, language) : (isUrdu ? "دستیاب نہیں" : "N/A")}
                      </strong>
                    </div>

                    {v.ntn && (
                      <div className="text-[10px] text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                        NTN: <span className="font-mono text-slate-700 font-bold">{v.ntn}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Button: View Profile & All Bills */}
                  <div className="pt-3 border-t border-slate-100">
                    <button
                      onClick={() => openDetail(v.id)}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-50 hover:bg-indigo-50 text-indigo-700 font-bold text-xs rounded-lg border border-slate-200 hover:border-indigo-200 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{isUrdu ? "پروفائل اور تمام بلز دیکھیں" : "View Profile & All Bills"}</span>
                      <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full ml-1">
                        {v.total_invoices}
                      </span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-center space-y-2">
                <Building2 className="w-8 h-8 text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">{t.vendors.noVendorsFound}</p>
              </div>
            )}
          </div>

          {/* Vendor Detail Modal / Drawer with All Bills */}
          {selectedVendorId && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold text-base flex items-center justify-center shadow-xs">
                      {vendorDetail?.name ? vendorDetail.name.charAt(0).toUpperCase() : "V"}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <span>{vendorDetail ? getLocalizedVendor(vendorDetail.name, language) : (isUrdu ? "وینڈر پروفائل" : "Vendor Profile")}</span>
                        {vendorDetail && vendorDetail.total_invoices > 1 && (
                          <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <Layers className="w-3 h-3" />
                            <span>{vendorDetail.total_invoices} {isUrdu ? "بلز منسلک ہیں" : "Bills Linked"}</span>
                          </span>
                        )}
                        {vendorDetail && (vendorDetail.incorrect_invoices_count ?? 0) > 0 && (
                          <span className="bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>{vendorDetail.incorrect_invoices_count} {isUrdu ? "غلط بلز" : "Error Bills"}</span>
                          </span>
                        )}
                      </h3>
                      {isUrdu && vendorDetail?.name && getLocalizedVendor(vendorDetail.name, language) !== vendorDetail.name && (
                        <span className="text-[11px] text-slate-400 font-mono block">{vendorDetail.name}</span>
                      )}
                      <p className="text-xs text-slate-500 mt-0.5">{isUrdu ? "وینڈر کی مکمل تاریخ اور منسلک بلز" : "Vendor Purchase History & Consolidated Invoices"}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedVendorId(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-5 overflow-y-auto flex-1">
                  {loadingDetail ? (
                    <div className="py-12 text-center text-slate-400 text-xs">{t.common.loading}</div>
                  ) : vendorDetail ? (
                    <>
                      {/* Multi-bill consolidation callout banner */}
                      {vendorDetail.total_invoices > 1 && (
                        <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-xl flex items-center gap-3 text-xs text-indigo-900">
                          <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                          <div>
                            <strong>{isUrdu ? "متعدد بلز خودکار یکجا:" : "Multiple Bills Consolidated:"}</strong>{" "}
                            {isUrdu 
                              ? `اس وینڈر کے تمام ${vendorDetail.total_invoices} بلز اور اخراجات خودکار طریقے سے اس پروفائل سے منسلک ہیں۔`
                              : `All ${vendorDetail.total_invoices} bills and transactions for this vendor are automatically consolidated under this profile.`}
                          </div>
                        </div>
                      )}

                      {/* Summary Metrics */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                          <span className="text-[11px] font-bold text-slate-500 uppercase block">{t.vendors.totalSpend}</span>
                          <span className="text-base font-bold text-slate-900 font-mono mt-1 block">
                            {formatCurrency(vendorDetail.total_spend, "PKR", language)}
                          </span>
                        </div>
                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                          <span className="text-[11px] font-bold text-slate-500 uppercase block">{t.vendors.totalBills}</span>
                          <span className="text-base font-bold text-indigo-700 font-mono mt-1 block">
                            {vendorDetail.total_invoices}
                          </span>
                        </div>
                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                          <span className="text-[11px] font-bold text-slate-500 uppercase block">{isUrdu ? "اوسط بل رقم" : "Avg Bill Amount"}</span>
                          <span className="text-base font-bold text-slate-900 font-mono mt-1 block">
                            {vendorDetail.total_invoices > 0 
                              ? formatCurrency(Number(vendorDetail.total_spend) / vendorDetail.total_invoices, "PKR", language)
                              : "—"}
                          </span>
                        </div>
                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                          <span className="text-[11px] font-bold text-slate-500 uppercase block">{isUrdu ? "آخری بل تاریخ" : "Last Purchase"}</span>
                          <span className="text-xs font-bold text-slate-800 mt-2 block">
                            {vendorDetail.last_invoice_date ? formatDate(vendorDetail.last_invoice_date, language) : "—"}
                          </span>
                        </div>
                        {(vendorDetail.incorrect_invoices_count ?? 0) > 0 && (
                          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl">
                            <span className="text-[11px] font-bold text-rose-700 uppercase block flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              {isUrdu ? "غلط بلز" : "Error Bills"}
                            </span>
                            <span className="text-base font-bold text-rose-800 font-mono mt-1 block">
                              {vendorDetail.incorrect_invoices_count}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Contact & Registration Metadata */}
                      <div className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs space-y-1.5 text-slate-700">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {vendorDetail.phone && (
                            <p className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <strong className="text-slate-500">{isUrdu ? "فون:" : "Phone:"}</strong>
                              <span className="font-mono text-slate-900 font-semibold">{vendorDetail.phone}</span>
                            </p>
                          )}
                          {vendorDetail.email && (
                            <p className="flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <strong className="text-slate-500">{isUrdu ? "ای میل:" : "Email:"}</strong>
                              <span className="text-slate-900">{vendorDetail.email}</span>
                            </p>
                          )}
                          {vendorDetail.address && (
                            <p className="flex items-center gap-1.5 sm:col-span-2">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <strong className="text-slate-500">{isUrdu ? "پتہ:" : "Address:"}</strong>
                              <span className="text-slate-900">{vendorDetail.address}</span>
                            </p>
                          )}
                          {vendorDetail.ntn && (
                            <p className="flex items-center gap-1.5">
                              <strong className="text-slate-500">NTN:</strong>
                              <span className="font-mono text-slate-900 font-bold">{vendorDetail.ntn}</span>
                            </p>
                          )}
                          {vendorDetail.strn && (
                            <p className="flex items-center gap-1.5">
                              <strong className="text-slate-500">STRN:</strong>
                              <span className="font-mono text-slate-900 font-bold">{vendorDetail.strn}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* ALL INVOICES / BILLS OF THIS VENDOR */}
                      <div className="space-y-3 pt-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                              <Receipt className="w-4 h-4 text-indigo-600" />
                              <span>{isUrdu ? "بلز کی فہرست" : "Invoices List"}</span>
                            </h4>

                            {/* Filter tabs inside vendor detail: All vs Errors */}
                            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
                              <button
                                type="button"
                                onClick={() => setVendorBillTab("all")}
                                className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                                  vendorBillTab === "all"
                                    ? "bg-white text-slate-900 shadow-2xs"
                                    : "text-slate-500 hover:text-slate-900"
                                }`}
                              >
                                {isUrdu ? "تمام بلز" : "All Bills"} ({vendorDetail.invoices?.length || 0})
                              </button>
                              <button
                                type="button"
                                onClick={() => setVendorBillTab("error")}
                                className={`px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1 ${
                                  vendorBillTab === "error"
                                    ? "bg-rose-600 text-white shadow-2xs"
                                    : "text-rose-700 hover:text-rose-900"
                                }`}
                              >
                                <AlertTriangle className="w-3 h-3" />
                                <span>{isUrdu ? "صرف غلط بلز" : "Error Bills"}</span>
                                <span>({vendorDetail.incorrect_invoices_count ?? 0})</span>
                              </button>
                            </div>
                          </div>

                          {/* Quick search inside vendor bills */}
                          {vendorDetail.invoices && vendorDetail.invoices.length > 2 && (
                            <div className="relative max-w-xs w-full">
                              <Search className="w-3.5 h-3.5 text-slate-400 absolute top-1/2 -translate-y-1/2 left-2.5" />
                              <input
                                type="text"
                                placeholder={isUrdu ? "بل نمبر یا کسٹمر سے تلاش کریں..." : "Filter bills by number/customer..."}
                                value={billSearch}
                                onChange={(e) => setBillSearch(e.target.value)}
                                className="w-full py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                          )}
                        </div>

                        {filteredVendorInvoices.length > 0 ? (
                          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                                  <th className="py-2.5 px-3">{isUrdu ? "بل نمبر" : "Bill #"}</th>
                                  <th className="py-2.5 px-3">{isUrdu ? "تاریخ" : "Date"}</th>
                                  <th className="py-2.5 px-3">{isUrdu ? "کیٹیگری" : "Category"}</th>
                                  <th className="py-2.5 px-3">{isUrdu ? "کسٹمر" : "Customer"}</th>
                                  <th className="py-2.5 px-3 text-right">{isUrdu ? "کل رقم" : "Amount"}</th>
                                  <th className="py-2.5 px-3 text-center">{isUrdu ? "حیثیت" : "Status"}</th>
                                  <th className="py-2.5 px-3 text-right">{isUrdu ? "ایکشن" : "Action"}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 bg-white">
                                {filteredVendorInvoices.map((inv) => (
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
                                    <td className="py-2.5 px-3">
                                      {inv.category_name ? (
                                        <span className="inline-block bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-semibold">
                                          {inv.category_name}
                                        </span>
                                      ) : (
                                        <span className="text-slate-400 text-[11px]">—</span>
                                      )}
                                    </td>
                                    <td className="py-2.5 px-3 text-slate-600">
                                      {inv.customer_name ? (
                                        <span className="font-semibold text-slate-800">{inv.customer_name}</span>
                                      ) : (
                                        <span className="text-slate-400 italic text-[11px]">{isUrdu ? "نامعلوم" : "General"}</span>
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
                                            vendor_name: vendorDetail?.name,
                                            customer_name: inv.customer_name,
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
                              : (isUrdu ? "اس وینڈر کے لیے کوئی بل موجود نہیں ہے۔" : "No invoices found for this vendor.")}
                          </div>
                        )}
                      </div>
                    </>
                  ) : null}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
                  <Link
                    href={`/invoices?vendor_id=${selectedVendorId}`}
                    className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5"
                  >
                    <span>{isUrdu ? "لیجر میں وینڈر کے تمام بلز فلٹر کریں" : "Filter all bills in Invoices Ledger"}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    onClick={() => setSelectedVendorId(null)}
                    className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    {t.common.close || (isUrdu ? "بند کریں" : "Close")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Merge Vendors Modal */}
          {isMergeModalOpen && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Merge className="w-4 h-4 text-indigo-600" />
                    <span>{isUrdu ? "ڈپلیکیٹ وینڈرز یکجا کریں" : "Merge Duplicate Vendors"}</span>
                  </h2>
                  <button
                    onClick={() => setIsMergeModalOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-500">
                  {isUrdu 
                    ? "بنیادی وینڈر منتخب کریں۔ دیگر منتخب ڈپلیکیٹ وینڈرز کے تمام بلز اور تاریخ مستقل طور پر بنیادی وینڈر میں منتقل ہو جائیں گے۔"
                    : "Select the primary vendor to preserve. All invoices and purchase histories from duplicate vendors will be permanently reassigned to it."}
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      {isUrdu ? "1۔ بنیادی وینڈر (جس میں ضم کرنا ہے)" : "1. Primary Vendor (Target)"}
                    </label>
                    <select
                      value={primaryVendorId}
                      onChange={(e) => setPrimaryVendorId(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900"
                    >
                      <option value="">{isUrdu ? "بنیادی وینڈر منتخب کریں" : "Select Primary Vendor"}</option>
                      {vendors.map((v) => (
                        <option key={v.id} value={v.id}>
                          {getLocalizedVendor(v.name, language)} ({v.total_invoices} {isUrdu ? "بلز" : "bills"} - {formatCurrency(v.total_spend, "PKR", language)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      {isUrdu ? "2۔ ڈپلیکیٹ وینڈرز (جو ضم ہوں گے)" : "2. Duplicate Vendors to Merge Into Primary"}
                    </label>
                    <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-200 rounded-lg p-2 bg-slate-50">
                      {vendors
                        .filter((v) => v.id !== primaryVendorId)
                        .map((v) => {
                          const isChecked = selectedDuplicates.includes(v.id);
                          return (
                            <label
                              key={v.id}
                              className="flex items-center gap-2.5 p-2 rounded bg-white border border-slate-200/80 text-xs cursor-pointer hover:bg-slate-50"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedDuplicates([...selectedDuplicates, v.id]);
                                  } else {
                                    setSelectedDuplicates(selectedDuplicates.filter((id) => id !== v.id));
                                  }
                                }}
                                className="rounded text-indigo-600"
                              />
                              <span className="font-bold text-slate-900">{getLocalizedVendor(v.name, language)}</span>
                              <span className={`${isUrdu ? "mr-auto" : "ml-auto"} text-[11px] text-slate-400`}>
                                {v.total_invoices} {isUrdu ? "بلز" : "bills"}
                              </span>
                            </label>
                          );
                        })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsMergeModalOpen(false)}
                    className="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="button"
                    disabled={merging || !primaryVendorId || selectedDuplicates.length === 0}
                    onClick={handleMergeSubmit}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {merging ? t.common.loading : (isUrdu ? "ضم کرنے کی تصدیق کریں" : "Confirm & Merge")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

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
