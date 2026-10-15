"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { 
  Search, 
  Download, 
  Trash2, 
  Eye, 
  FileSpreadsheet, 
  FileText,
  PenTool,
  UploadCloud,
  RotateCcw,
  ReceiptText,
  Filter,
  ExternalLink,
  X,
  User,
  Building2,
  Loader2,
  AlertTriangle
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { InvoiceDetailModal } from "@/components/invoices/InvoiceDetailModal";
import { api } from "@/lib/api";
import { Invoice, Category, Vendor, Customer } from "@/types";
import { 
  formatCurrency, 
  formatDate, 
  getStatusBadge, 
  getLocalizedCategory, 
  getLocalizedVendor,
  getLocalizedCustomer
} from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

function InvoicesLedgerContent() {
  const searchParams = useSearchParams();
  const urlSearch = searchParams?.get("search") || "";
  const urlVendorId = searchParams?.get("vendor_id") || "";
  const urlCustomerId = searchParams?.get("customer_id") || "";
  const urlHasDiscrepancy = searchParams?.get("has_discrepancy") || "";

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalSpend, setTotalSpend] = useState<number | string>(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [cleanCount, setCleanCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { t, language, isUrdu } = useLanguage();

  // Filters initialized directly from URL
  const [search, setSearch] = useState(urlSearch);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [vendorId, setVendorId] = useState(urlVendorId);
  const [customerId, setCustomerId] = useState(urlCustomerId);
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState("");
  const [discrepancyFilter, setDiscrepancyFilter] = useState(urlHasDiscrepancy);
  const [sortBy, setSortBy] = useState("invoice_date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);

  // Invoice Detail Modal State
  const [viewingInvoiceId, setViewingInvoiceId] = useState<string | null>(null);

  // Metadata
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Update when URL search params change
  useEffect(() => {
    const q = searchParams?.get("search") || "";
    const v = searchParams?.get("vendor_id") || "";
    const c = searchParams?.get("customer_id") || "";
    const d = searchParams?.get("has_discrepancy") || "";
    setSearch(q);
    setVendorId(v);
    setCustomerId(c);
    setDiscrepancyFilter(d);
  }, [searchParams]);

  const hasActiveFilters = Boolean(
    search || startDate || endDate || vendorId || customerId || categoryId || status || discrepancyFilter
  );

  const resetFilters = () => {
    setSearch("");
    setStartDate("");
    setEndDate("");
    setVendorId("");
    setCustomerId("");
    setCategoryId("");
    setStatus("");
    setDiscrepancyFilter("");
    setPage(1);
  };

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getInvoices({
        search,
        start_date: startDate,
        end_date: endDate,
        vendor_id: vendorId,
        customer_id: customerId,
        category_id: categoryId,
        status,
        has_discrepancy: discrepancyFilter === "" ? undefined : discrepancyFilter,
        sort_by: sortBy,
        sort_order: sortOrder,
        page,
        page_size: 20,
      });
      setInvoices(data.items || []);
      setTotalCount(data.total || 0);
      setTotalSpend(data.total_spend || 0);
      setIncorrectCount(data.incorrect_count || 0);
      setCleanCount(data.clean_count || 0);
    } catch (err) {
      console.error("Failed to load invoices", err);
    } finally {
      setLoading(false);
    }
  }, [search, startDate, endDate, vendorId, customerId, categoryId, status, discrepancyFilter, sortBy, sortOrder, page]);

  useEffect(() => {
    api.getVendors().then(setVendors).catch(() => {});
    api.getCustomers().then(setCustomers).catch(() => {});
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleDelete = async (id: string) => {
    const confirmMsg = isUrdu 
      ? "کیا آپ واقعی اس بل کو حذف کرنا چاہتے ہیں؟" 
      : "Are you sure you want to delete this invoice?";
    if (!confirm(confirmMsg)) return;
    try {
      await api.deleteInvoice(id);
      fetchInvoices();
    } catch (err: any) {
      alert((isUrdu ? "بل حذف نہیں ہو سکا: " : "Failed to delete invoice: ") + err.message);
    }
  };

  const handleExport = (format: "csv" | "xlsx" | "pdf") => {
    const url = api.getExportUrl(format, {
      search,
      start_date: startDate,
      end_date: endDate,
      vendor_id: vendorId,
      customer_id: customerId,
      category_id: categoryId,
      status,
    });
    window.open(url, "_blank");
  };

  // Find active customer and vendor names for filter pills
  const activeCustomer = customers.find((c) => c.id === customerId);
  const activeVendor = vendors.find((v) => v.id === vendorId);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header />
        <main className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {t.invoices.title}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                {t.invoices.subtitle}
              </p>
            </div>

            <div className="flex items-center flex-wrap gap-2">
              <button
                onClick={() => handleExport("csv")}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-xs transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>{t.common.exportCsv}</span>
              </button>
              <button
                onClick={() => handleExport("xlsx")}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-emerald-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-xs transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t.common.exportExcel}</span>
              </button>
              <button
                onClick={() => handleExport("pdf")}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-900 hover:bg-indigo-950 text-white text-xs font-semibold rounded-lg border border-indigo-800 shadow-xs transition-all cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-200" />
                <span>{t.common.exportPdf}</span>
              </button>
              <Link
                href="/invoices/new"
                className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-indigo-700 text-xs font-semibold px-3 py-2 rounded-lg border border-indigo-200 shadow-xs transition-all"
              >
                <PenTool className="w-3.5 h-3.5 text-indigo-600" />
                <span>{t.nav.manualBill}</span>
              </Link>
              <Link
                href="/invoices/upload"
                className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-sm shadow-indigo-100 transition-all"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>{t.nav.uploadBill}</span>
              </Link>
            </div>
          </div>

          {/* ACTIVE FILTER BANNER (e.g. When filtered by customer or vendor or discrepancy) */}
          {(customerId || vendorId || search || discrepancyFilter) && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center flex-wrap gap-2">
                <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{isUrdu ? "موجودہ فلٹرز:" : "Active Filters:"}</span>
                </span>

                {discrepancyFilter === "true" && (
                  <span className="inline-flex items-center gap-1.5 bg-rose-50 border border-rose-300 text-rose-900 px-2.5 py-1 rounded-lg font-bold shadow-2xs">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>{isUrdu ? "صرف غلط / تضاد والے بلز" : "Bills with Errors Only"}</span>
                    <button
                      onClick={() => setDiscrepancyFilter("")}
                      className="ml-1 text-rose-400 hover:text-rose-700 cursor-pointer"
                      title={isUrdu ? "فلٹر ختم کریں" : "Clear filter"}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {discrepancyFilter === "false" && (
                  <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-300 text-emerald-900 px-2.5 py-1 rounded-lg font-bold shadow-2xs">
                    <span>{isUrdu ? "صرف درست بلز" : "Clean Verified Bills Only"}</span>
                    <button
                      onClick={() => setDiscrepancyFilter("")}
                      className="ml-1 text-emerald-400 hover:text-emerald-700 cursor-pointer"
                      title={isUrdu ? "فلٹر ختم کریں" : "Clear filter"}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {customerId && (
                  <span className="inline-flex items-center gap-1.5 bg-white border border-indigo-300 text-indigo-900 px-2.5 py-1 rounded-lg font-bold shadow-2xs">
                    <User className="w-3 h-3 text-indigo-600" />
                    <span>{isUrdu ? "کسٹمر: " : "Customer: "}</span>
                    <span className="text-slate-900 font-extrabold">
                      {activeCustomer ? getLocalizedCustomer(activeCustomer.name, language) : customerId}
                    </span>
                    <button
                      onClick={() => setCustomerId("")}
                      className="ml-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                      title={isUrdu ? "کسٹمر فلٹر ختم کریں" : "Clear customer filter"}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {vendorId && (
                  <span className="inline-flex items-center gap-1.5 bg-white border border-indigo-300 text-indigo-900 px-2.5 py-1 rounded-lg font-bold shadow-2xs">
                    <Building2 className="w-3 h-3 text-indigo-600" />
                    <span>{isUrdu ? "وینڈر: " : "Vendor: "}</span>
                    <span className="text-slate-900 font-extrabold">
                      {activeVendor ? getLocalizedVendor(activeVendor.name, language) : vendorId}
                    </span>
                    <button
                      onClick={() => setVendorId("")}
                      className="ml-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                      title={isUrdu ? "وینڈر فلٹر ختم کریں" : "Clear vendor filter"}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {search && (
                  <span className="inline-flex items-center gap-1.5 bg-white border border-indigo-300 text-indigo-900 px-2.5 py-1 rounded-lg font-bold shadow-2xs">
                    <Search className="w-3 h-3 text-indigo-600" />
                    <span>&quot;{search}&quot;</span>
                    <button
                      onClick={() => setSearch("")}
                      className="ml-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                      title={isUrdu ? "تلاش ختم کریں" : "Clear search"}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>

              <button
                onClick={resetFilters}
                className="text-xs font-bold text-indigo-700 hover:text-indigo-900 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{isUrdu ? "تمام فلٹرز ختم کریں" : "Clear All Filters"}</span>
              </button>
            </div>
          )}

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <Filter className="w-3.5 h-3.5 text-indigo-600" />
                <span>{t.common.filter}</span>
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{t.invoices.clearFilters}</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute top-1/2 -translate-y-1/2 left-3" />
                <input
                  type="text"
                  placeholder={t.invoices.searchPlaceholder}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 pl-8 pr-3"
                />
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setPage(1);
                  }}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
                >
                  <option value="">{t.invoices.allStatuses}</option>
                  <option value="APPROVED">{t.status.approved}</option>
                  <option value="REVIEW_REQUIRED">{t.status.needs_review}</option>
                  <option value="PENDING">{t.status.pending}</option>
                  <option value="REJECTED">{t.status.rejected}</option>
                </select>
              </div>

              {/* Vendor Filter */}
              <div>
                <select
                  value={vendorId}
                  onChange={(e) => {
                    setVendorId(e.target.value);
                    setPage(1);
                  }}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
                >
                  <option value="">{t.invoices.allVendors}</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {getLocalizedVendor(v.name, language)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Customer Filter */}
              <div>
                <select
                  value={customerId}
                  onChange={(e) => {
                    setCustomerId(e.target.value);
                    setPage(1);
                  }}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
                >
                  <option value="">{isUrdu ? "تمام کسٹمرز" : "All Customers"}</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {getLocalizedCustomer(c.name, language)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <select
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(e.target.value);
                    setPage(1);
                  }}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
                >
                  <option value="">{t.invoices.allCategories}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {getLocalizedCategory(c.name, language)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Date */}
              <div>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                  className="w-full py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 text-slate-700"
                />
              </div>

              {/* End Date */}
              <div>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                  className="w-full py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 text-slate-700"
                />
              </div>
            </div>
          </div>

          {/* Accuracy Audit Filter Tabs (All Bills vs Error Bills vs Clean Bills) */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => { setDiscrepancyFilter(""); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  discrepancyFilter === ""
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <span>{isUrdu ? "تمام بلز" : "All Bills"}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                  discrepancyFilter === "" ? "bg-white/20 text-white" : "bg-slate-200/80 text-slate-700"
                }`}>
                  {totalCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => { setDiscrepancyFilter("true"); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  discrepancyFilter === "true"
                    ? "bg-rose-600 text-white shadow-xs ring-2 ring-rose-300"
                    : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{isUrdu ? "غلط / تضاد والے بلز" : "Bills with Errors"}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  discrepancyFilter === "true" ? "bg-white/20 text-white" : "bg-rose-200 text-rose-900"
                }`}>
                  {incorrectCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => { setDiscrepancyFilter("false"); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  discrepancyFilter === "false"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                }`}
              >
                <span>{isUrdu ? "درست بلز" : "Clean Verified Bills"}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  discrepancyFilter === "false" ? "bg-white/20 text-white" : "bg-emerald-200 text-emerald-900"
                }`}>
                  {cleanCount}
                </span>
              </button>
            </div>

            <div className="text-xs text-slate-500 font-medium px-2 flex items-center gap-2">
              <span>{isUrdu ? "آڈٹ ریکارڈ:" : "Audit Breakdown:"}</span>
              <span className="inline-flex items-center gap-1 text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                <AlertTriangle className="w-3 h-3 text-rose-600" />
                {incorrectCount} {isUrdu ? "غلط" : "with errors"}
              </span>
              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {cleanCount} {isUrdu ? "درست" : "clean"}
              </span>
            </div>
          </div>

          {/* Ledger Table Section */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-800">
                {t.invoices.totalCount}: {totalCount}
              </span>
              <span>
                {t.invoices.totalSpend}:{" "}
                <strong className="text-slate-900 font-mono">
                  {formatCurrency(totalSpend, "PKR", language)}
                </strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                    <th className="py-3 px-4">{t.invoices.columnInvoiceNo}</th>
                    <th className="py-3 px-4">{t.invoices.columnDate}</th>
                    <th className="py-3 px-4">{t.invoices.columnVendor}</th>
                    <th className="py-3 px-4">{isUrdu ? "کسٹمر" : "Customer"}</th>
                    <th className="py-3 px-4">{t.invoices.columnCategory}</th>
                    <th className="py-3 px-4 text-right">{t.invoices.columnAmount}</th>
                    <th className="py-3 px-4">{t.invoices.columnStatus}</th>
                    <th className="py-3 px-4 text-right">{t.invoices.columnAction}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        {t.common.loading}
                      </td>
                    </tr>
                  ) : invoices.length > 0 ? (
                    invoices.map((inv) => {
                      const badge = getStatusBadge(inv.verification_status, language);
                      return (
                        <tr 
                          key={inv.id} 
                          className={`transition-colors ${
                            inv.has_discrepancy 
                              ? "bg-rose-50/40 hover:bg-rose-50/70" 
                              : "hover:bg-slate-50/80"
                          }`}
                        >
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setViewingInvoiceId(inv.id)}
                                className="hover:text-indigo-600 hover:underline cursor-pointer text-left"
                              >
                                {inv.invoice_number || "—"}
                              </button>
                              {inv.has_discrepancy && (
                                <span
                                  title={inv.discrepancy_notes?.join(" • ") || "Mathematical discrepancy flagged"}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 cursor-help"
                                >
                                  <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                                  <span>{isUrdu ? "غلطی" : "Error"}</span>
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {formatDate(inv.invoice_date, language)}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-900">
                            {inv.vendor?.name ? getLocalizedVendor(inv.vendor.name, language) : "—"}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {inv.customer?.name ? getLocalizedCustomer(inv.customer.name, language) : "—"}
                          </td>
                          <td className="py-3.5 px-4">
                            {inv.category?.name ? (
                              <span className="inline-block bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-semibold">
                                {getLocalizedCategory(inv.category.name, language)}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                            {formatCurrency(inv.total, inv.currency, language)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${badge.bg} ${badge.text}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            <button
                              type="button"
                              onClick={() => setViewingInvoiceId(inv.id)}
                              className="p-1 text-slate-400 hover:text-indigo-600 inline-block transition-colors cursor-pointer"
                              title={isUrdu ? "بل کی تفصیلات دیکھیں" : "View Invoice Details"}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {inv.document_id && (
                              <Link
                                href={`/invoices/${inv.document_id}/review`}
                                className="p-1 text-slate-400 hover:text-indigo-600 inline-block transition-colors"
                                title={t.invoices.viewReview}
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
                            )}
                            <button
                              onClick={() => handleDelete(inv.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 inline-block transition-colors cursor-pointer"
                              title={t.common.delete}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-16 text-center">
                        <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-center space-y-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                            <ReceiptText className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-700 text-sm">
                              {t.invoices.noInvoicesFound || (isUrdu ? "کوئی بل نہیں ملا" : "No invoices found")}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {hasActiveFilters 
                                ? (isUrdu ? "موجودہ فلٹرز کے مطابق کوئی بل نہیں ملا۔ فلٹرز تبدیل کر کے دیکھیں۔" : "No invoices matched the selected filters. Try clearing your search.")
                                : (isUrdu ? "لیجر میں ریکارڈز شامل کرنے کے لیے بل اپلوڈ کریں یا مینوئل اندراج کریں۔" : "Upload your first bill or add one manually to start tracking expenses.")}
                            </p>
                          </div>
                          {hasActiveFilters ? (
                            <button
                              onClick={resetFilters}
                              className="text-xs text-indigo-600 hover:underline font-bold"
                            >
                              {t.invoices.clearFilters}
                            </button>
                          ) : (
                            <div className="flex items-center gap-2 pt-2">
                              <Link
                                href="/invoices/upload"
                                className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold shadow-xs"
                              >
                                {isUrdu ? "پہلا بل اپلوڈ کریں" : "Upload First Bill"}
                              </Link>
                              <Link
                                href="/invoices/new"
                                className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200"
                              >
                                {isUrdu ? "مینوئل بل بنائیں" : "Add Manual Bill"}
                              </Link>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalCount > 20 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>{isUrdu ? `دکھائے جا رہے ہیں ${invoices.length} کل ${totalCount} میں سے` : `Showing ${invoices.length} of ${totalCount} records`}</span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    className="px-2.5 py-1 border border-slate-200 rounded disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
                  >
                    {isUrdu ? "پچھلا" : "Previous"}
                  </button>
                  <span className="font-semibold">{page}</span>
                  <button
                    disabled={page * 20 >= totalCount}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-2.5 py-1 border border-slate-200 rounded disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
                  >
                    {isUrdu ? "اگلا" : "Next"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Invoice Detail Breakdown Modal */}
      <InvoiceDetailModal
        invoiceId={viewingInvoiceId}
        isOpen={Boolean(viewingInvoiceId)}
        onClose={() => setViewingInvoiceId(null)}
      />
    </div>
  );
}

export default function InvoicesLedgerPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    }>
      <InvoicesLedgerContent />
    </Suspense>
  );
}
