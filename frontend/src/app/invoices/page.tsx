"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { 
  Search, 
  Download, 
  Trash2, 
  Eye, 
  FileSpreadsheet, 
  PenTool,
  UploadCloud,
  RotateCcw,
  ReceiptText,
  Filter
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { api } from "@/lib/api";
import { Invoice, Category, Vendor } from "@/types";
import { 
  formatCurrency, 
  formatDate, 
  getStatusBadge, 
  getLocalizedCategory, 
  getLocalizedVendor,
  getLocalizedCustomer
} from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

export default function InvoicesLedgerPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalSpend, setTotalSpend] = useState<number | string>(0);
  const [loading, setLoading] = useState(true);
  const { t, language, isUrdu } = useLanguage();

  // Filters
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("invoice_date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);

  // Metadata
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const hasActiveFilters = Boolean(search || startDate || endDate || vendorId || categoryId || status);

  const resetFilters = () => {
    setSearch("");
    setStartDate("");
    setEndDate("");
    setVendorId("");
    setCategoryId("");
    setStatus("");
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
        category_id: categoryId,
        status,
        sort_by: sortBy,
        sort_order: sortOrder,
        page,
        page_size: 20,
      });
      setInvoices(data.items || []);
      setTotalCount(data.total || 0);
      setTotalSpend(data.total_spend || 0);
    } catch (err) {
      console.error("Failed to load invoices", err);
    } finally {
      setLoading(false);
    }
  }, [search, startDate, endDate, vendorId, categoryId, status, sortBy, sortOrder, page]);

  useEffect(() => {
    api.getVendors().then(setVendors).catch(() => {});
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

  const handleExport = (format: "csv" | "xlsx") => {
    const url = api.getExportUrl(format, {
      search,
      start_date: startDate,
      end_date: endDate,
      vendor_id: vendorId,
      category_id: categoryId,
      status,
    });
    window.open(url, "_blank");
  };

  return (
    <div className="app-layout-container flex min-h-screen bg-slate-50" dir="ltr">
      <Sidebar />
      <div className={`right-content-panel flex-1 flex flex-col min-w-0 ${isUrdu ? "font-urdu" : ""}`} dir="ltr">
        <Header title={t.invoices.title} />

        <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Header & Export controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{t.invoices.title}</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {t.invoices.totalCount}: <strong>{totalCount}</strong> | {t.invoices.totalSpend}:{" "}
                <strong className="text-indigo-600 font-mono">{formatCurrency(totalSpend, "PKR", language)}</strong>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
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

              {/* Date Start */}
              <div>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
                  title={isUrdu ? "شروع کی تاریخ" : "Start Date"}
                />
              </div>

              {/* Date End */}
              <div>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
                  title={isUrdu ? "آخری تاریخ" : "End Date"}
                />
              </div>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">{t.invoices.columnDate}</th>
                    <th className="py-3 px-4">{t.invoices.columnVendor}</th>
                    <th className="py-3 px-4">{t.invoices.columnInvoiceNo}</th>
                    <th className="py-3 px-4">{t.invoices.columnCategory}</th>
                    <th className="py-3 px-4">{isUrdu ? "آئٹمز" : "Items"}</th>
                    <th className="py-3 px-4 text-right">{t.invoices.columnAmount}</th>
                    <th className="py-3 px-4">{t.invoices.columnStatus}</th>
                    <th className="py-3 px-4 text-right">{t.invoices.columnAction}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-slate-400">
                        <div className="inline-flex flex-col items-center gap-2">
                          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                          <span>{t.common.loading}</span>
                        </div>
                      </td>
                    </tr>
                  ) : invoices.length > 0 ? (
                    invoices.map((inv) => {
                      const badge = getStatusBadge(inv.verification_status, language);
                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap font-medium">
                            {formatDate(inv.invoice_date, language)}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-900">
                            <div>{getLocalizedVendor(inv.vendor?.name, language)}</div>
                            {inv.customer?.name && (
                              <div className="text-[11px] font-normal text-slate-500 mt-0.5 flex items-center gap-1">
                                <span className="text-[10px] text-indigo-600 bg-indigo-50/80 px-1 py-0.2 rounded font-medium">
                                  {isUrdu ? "گاہک" : "Cust"}
                                </span>
                                <span className="truncate max-w-[140px]">
                                  {getLocalizedCustomer(inv.customer.name, language)}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 font-mono">
                            {inv.invoice_number || "—"}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700">
                              <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: inv.category?.color || "#6B7280" }}
                              ></span>
                              <span className="truncate">{getLocalizedCategory(inv.category?.name, language)}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500">
                            {inv.items?.length || 0} {isUrdu ? "آئٹم" : "items"}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-slate-900 font-mono tabular-nums">
                            {formatCurrency(inv.total, inv.currency, language)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${badge.bg} ${badge.text}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            {inv.document_id ? (
                              <Link
                                href={`/invoices/${inv.document_id}/review`}
                                className="p-1 text-slate-400 hover:text-indigo-600 inline-block transition-colors"
                                title={t.invoices.viewReview}
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                            ) : (
                              <span className="text-[11px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-bold">
                                {t.invoices.manualBadge}
                              </span>
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
                          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                            <ReceiptText className="w-6 h-6" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-sm font-bold text-slate-900">{t.invoices.noInvoicesFound}</h3>
                            <p className="text-xs text-slate-500">
                              {hasActiveFilters
                                ? (isUrdu
                                    ? "موجودہ فلٹرز کے مطابق کوئی بل موجود نہیں ہے۔ فلٹرز صاف کر کے دیکھیں۔"
                                    : "No invoices matched your current filters. Try resetting the filters.")
                                : (isUrdu
                                    ? "ابھی تک کوئی بل شامل نہیں کیا گیا۔ شروع کرنے کے لیے نیا بل اپلوڈ یا درج کریں۔"
                                    : "No bills or invoices have been recorded yet. Upload a bill or enter one manually to get started.")}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 pt-2">
                            {hasActiveFilters ? (
                              <button
                                onClick={resetFilters}
                                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                              >
                                {t.invoices.clearFilters}
                              </button>
                            ) : (
                              <>
                                <Link
                                  href="/invoices/upload"
                                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                                >
                                  {t.nav.uploadBill}
                                </Link>
                                <Link
                                  href="/invoices/new"
                                  className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-xs transition-colors"
                                >
                                  {t.nav.manualBill}
                                </Link>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
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
    </div>
  );
}
