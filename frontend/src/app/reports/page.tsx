"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { 
  Download, 
  FileSpreadsheet, 
  Tag, 
  Building2, 
  TrendingUp, 
  X
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { api } from "@/lib/api";
import { ReportSummary, Vendor } from "@/types";
import { formatCurrency, formatDate, getStatusBadge, getLocalizedCategory, getLocalizedVendor } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

export default function ReportsPage() {
  const [reportType, setReportType] = useState<"weekly" | "monthly" | "yearly" | "custom">("monthly");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [vendorsList, setVendorsList] = useState<Vendor[]>([]);
  const [data, setData] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const { t, language, isUrdu } = useLanguage();

  // Load vendors list on mount
  useEffect(() => {
    api.getVendors().then(setVendorsList).catch(() => {});
  }, []);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getReportSummary(
        reportType, 
        startDate || undefined, 
        endDate || undefined, 
        selectedVendorId || undefined
      );
      setData(res);
    } catch (err) {
      console.error("Failed to load report", err);
    } finally {
      setLoading(false);
    }
  }, [reportType, startDate, endDate, selectedVendorId]);

  useEffect(() => {
    if (reportType !== "custom" || (startDate && endDate)) {
      fetchReport();
    }
  }, [reportType, startDate, endDate, selectedVendorId, fetchReport]);

  const handleExport = (format: "csv" | "xlsx") => {
    const url = api.getExportUrl(format, {
      start_date: startDate || data?.start_date,
      end_date: endDate || data?.end_date,
      vendor_id: selectedVendorId || undefined,
    });
    window.open(url, "_blank");
  };

  // Compute maximum timeline amount for proportional bar heights
  const maxTimelineAmount = data?.timeline && data.timeline.length > 0
    ? Math.max(...data.timeline.map((t) => Number(t.amount) || 0), 1)
    : 1;

  const timeframeLabels: Record<string, string> = {
    weekly: t.reports.timeframeWeekly,
    monthly: t.reports.timeframeMonthly,
    yearly: t.reports.timeframeYearly,
    custom: t.reports.timeframeCustom,
  };

  return (
    <div className="app-layout-container flex min-h-screen bg-slate-50" dir="ltr">
      <Sidebar />
      <div className={`right-content-panel flex-1 flex flex-col min-w-0 ${isUrdu ? "font-urdu" : ""}`} dir="ltr">
        <Header title={t.reports.title} />

        <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Header Controls & Export */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{t.reports.title}</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {t.reports.subtitle}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExport("csv")}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-xs transition-all"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>{t.reports.exportCsv}</span>
              </button>
              <button
                onClick={() => handleExport("xlsx")}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-emerald-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-xs transition-all"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t.reports.exportExcel}</span>
              </button>
            </div>
          </div>

          {/* Timeframe & Vendor Filtering Control Center */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Timeframe Presets */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
                {(["weekly", "monthly", "yearly", "custom"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setReportType(type)}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-md capitalize transition-all ${
                      reportType === type 
                        ? "bg-white text-indigo-700 shadow-xs" 
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {timeframeLabels[type] || type}
                  </button>
                ))}
              </div>

              {/* Vendor Selector Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{t.reports.vendorFocusLabel}</span>
                </span>
                <select
                  value={selectedVendorId}
                  onChange={(e) => setSelectedVendorId(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">{t.reports.allVendorsOption}</option>
                  {vendorsList.map((v) => (
                    <option key={v.id} value={v.id}>
                      {getLocalizedVendor(v.name, language)} ({v.total_invoices} {isUrdu ? "بلز" : "bills"})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Custom Date Range Pickers (if custom selected) */}
            {reportType === "custom" && (
              <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
                <span className="text-xs font-medium text-slate-500">{t.reports.customRangeLabel}</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
                />
                <span className="text-xs text-slate-400">{t.common.or}</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
                />
                <button
                  onClick={fetchReport}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  {t.reports.applyDateFilter}
                </button>
              </div>
            )}

            {/* Active Range & Vendor State Bar */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>
                {t.reports.analysisWindow} <strong className="text-slate-800">{data ? `${formatDate(data.start_date, language)} – ${formatDate(data.end_date, language)}` : t.common.loading}</strong>
              </span>

              {selectedVendorId && data?.selected_vendor_name && (
                <div className="flex items-center gap-2">
                  <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-semibold border border-indigo-200 flex items-center gap-1.5">
                    <span>{t.reports.filteringVendor} {getLocalizedVendor(data.selected_vendor_name, language)}</span>
                    <button
                      onClick={() => setSelectedVendorId("")}
                      className="hover:text-indigo-900"
                      title={t.reports.clearVendorFilter}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                  <button
                    onClick={() => setSelectedVendorId("")}
                    className="text-xs text-slate-400 hover:text-indigo-600 underline font-semibold"
                  >
                    {t.reports.viewAllVendors}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                {t.reports.totalPeriodSpend}
              </span>
              <div className="text-2xl font-bold text-slate-900 font-mono">
                {loading ? "..." : formatCurrency(data?.total_spending, data?.currency, language)}
              </div>
              <p className="text-[11px] text-slate-400">
                {selectedVendorId ? `${t.reports.vendorSpendSubtitle}: ${data?.selected_vendor_name}` : t.reports.periodSpendSubtitle}
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                {t.reports.totalInvoices}
              </span>
              <div className="text-2xl font-bold text-slate-900 font-mono">
                {loading ? "..." : data?.total_bills}
              </div>
              <p className="text-[11px] text-slate-400">{t.reports.invoicesSubtitle}</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                {t.reports.avgBillSize}
              </span>
              <div className="text-2xl font-bold text-slate-900 font-mono">
                {loading ? "..." : formatCurrency(data?.avg_bill_amount, data?.currency, language)}
              </div>
              <p className="text-[11px] text-slate-400">{t.reports.avgBillSubtitle}</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                {t.reports.highestSingleBill}
              </span>
              <div className="text-2xl font-bold text-slate-900 font-mono">
                {loading ? "..." : formatCurrency(data?.highest_bill_amount, data?.currency, language)}
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {data?.highest_bill_vendor || (isUrdu ? "کوئی نہیں" : "None")}
              </p>
            </div>
          </div>

          {/* Interactive Timeline & Spending Momentum Chart */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  {t.reports.spendingTrendTitle} ({timeframeLabels[reportType] || reportType})
                </h2>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {selectedVendorId ? `${t.reports.singleVendorTrendSub}: ${data?.selected_vendor_name}` : t.reports.consolidatedTrendSub}
              </span>
            </div>

            {loading ? (
              <div className="h-48 flex items-center justify-center text-xs text-slate-400">
                {t.common.loading}
              </div>
            ) : data?.timeline && data.timeline.length > 0 ? (
              <div className="space-y-4 pt-2">
                {/* Visual Bar Columns */}
                <div className="h-48 flex items-end gap-2 sm:gap-4 border-b border-slate-200 pb-2 px-2 overflow-x-auto">
                  {data.timeline.map((point, idx) => {
                    const amt = Number(point.amount) || 0;
                    const heightPercent = maxTimelineAmount > 0 
                      ? Math.max(Math.round((amt / maxTimelineAmount) * 100), amt > 0 ? 8 : 2)
                      : 2;

                    return (
                      <div
                        key={idx}
                        className="flex-1 flex flex-col items-center min-w-[50px] group relative"
                      >
                        {/* Tooltip on hover */}
                        <div className="absolute -top-12 bg-slate-900 text-white text-[10px] py-1 px-2 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 text-center font-mono">
                          <p className="font-bold">{formatCurrency(amt, data.currency, language)}</p>
                          <p className="text-[9px] text-slate-300">{point.bill_count} {isUrdu ? "بلز" : (point.bill_count === 1 ? "bill" : "bills")}</p>
                        </div>

                        {/* Amount label above bar */}
                        {amt > 0 && (
                          <span className="text-[10px] font-mono text-indigo-700 font-bold mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {formatCurrency(amt, data.currency, language)}
                          </span>
                        )}

                        {/* Bar */}
                        <div
                          className={`w-full rounded-t-lg transition-all duration-500 ${
                            amt > 0 
                              ? "bg-indigo-600 hover:bg-indigo-500 shadow-sm" 
                              : "bg-slate-100"
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        ></div>

                        {/* Label below bar */}
                        <span className="text-[10px] text-slate-500 mt-2 text-center truncate max-w-[65px]" title={point.label}>
                          {point.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-8 text-center italic">
                {t.reports.noTransactions}
              </p>
            )}
          </div>

          {/* Comparative Analysis: Vendor Breakdown & Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vendor Comparison Matrix / Share of Spend */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <span>
                    {selectedVendorId ? t.reports.singleVendorShareTitle : t.reports.vendorsMatrixTitle}
                  </span>
                </h2>
                {!selectedVendorId && (
                  <span className="text-[11px] text-slate-400 font-medium">{t.reports.clickVendorToIsolate}</span>
                )}
              </div>

              <div className="space-y-3">
                {data?.vendor_breakdown && data.vendor_breakdown.length > 0 ? (
                  data.vendor_breakdown.map((v, idx) => {
                    const totalSpendNum = Number(data.total_spending) || 1;
                    const vAmount = Number(v.amount) || 0;
                    const sharePercent = totalSpendNum > 0 ? Math.round((vAmount / totalSpendNum) * 100) : 0;

                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          const matched = vendorsList.find((ven) => ven.name.toLowerCase() === v.vendor_name.toLowerCase());
                          if (matched) setSelectedVendorId(matched.id);
                        }}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          selectedVendorId 
                            ? "border-indigo-300 bg-indigo-50/40" 
                            : "border-slate-100 bg-slate-50/50 hover:bg-indigo-50/30 hover:border-indigo-200"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-bold text-slate-900 truncate">{getLocalizedVendor(v.vendor_name, language)}</span>
                            <span className="text-[11px] text-slate-400 shrink-0">
                              ({v.bill_count} {isUrdu ? "بلز" : (v.bill_count === 1 ? "bill" : "bills")})
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-mono font-bold text-slate-900 mr-2">
                              {formatCurrency(v.amount, data.currency, language)}
                            </span>
                            <span className="font-bold text-indigo-600 text-[11px]">{sharePercent}%</span>
                          </div>
                        </div>

                        {/* Comparative Share Bar */}
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(sharePercent, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 py-6 text-center italic">
                    {t.reports.noTransactions}
                  </p>
                )}
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-600" />
                <span>{t.reports.categoryAllocationTitle}</span>
              </h2>

              <div className="space-y-3">
                {data?.category_breakdown && data.category_breakdown.length > 0 ? (
                  data.category_breakdown.map((cat, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">{getLocalizedCategory(cat.category_name, language)}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 font-mono">{formatCurrency(cat.amount, data.currency, language)}</span>
                          <span className="font-bold text-slate-900 w-12 text-right">{cat.percentage}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(cat.percentage, 100)}%`,
                            backgroundColor: cat.color || "#4F46E5",
                          }}
                        ></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-6 text-center italic">
                    {t.reports.noTransactions}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Invoices List Table for this Filtered Period & Vendor */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  {t.reports.detailedBillsTitle} ({data?.invoices?.length || 0})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedVendorId 
                    ? `${t.reports.filteringVendor} ${data?.selected_vendor_name}` 
                    : t.reports.detailedBillsSub}
                </p>
              </div>

              {selectedVendorId && (
                <button
                  onClick={() => setSelectedVendorId("")}
                  className="text-xs font-bold text-indigo-600 hover:underline"
                >
                  {isUrdu ? "← تمام وینڈرز دیکھیں" : "Show All Vendors →"}
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">{t.invoices.columnDate}</th>
                    <th className="py-3 px-4">{t.invoices.columnVendor}</th>
                    <th className="py-3 px-4">{t.invoices.columnInvoiceNo}</th>
                    <th className="py-3 px-4">{t.invoices.columnCategory}</th>
                    <th className="py-3 px-4 text-right">{t.invoices.columnAmount}</th>
                    <th className="py-3 px-4">{t.invoices.columnStatus}</th>
                    <th className="py-3 px-4 text-right">{t.invoices.columnAction}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data?.invoices && data.invoices.length > 0 ? (
                    data.invoices.map((inv) => {
                      const badge = getStatusBadge(inv.verification_status, language);
                      return (
                        <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 text-slate-600 whitespace-nowrap font-medium">
                            {formatDate(inv.invoice_date, language)}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            {getLocalizedVendor(inv.vendor?.name, language)}
                          </td>
                          <td className="py-3 px-4 text-slate-500 font-mono">
                            {inv.invoice_number || "—"}
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-block px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700">
                              {getLocalizedCategory(inv.category?.name, language)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                            {formatCurrency(inv.total, inv.currency, language)}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${badge.bg} ${badge.text}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {inv.document_id ? (
                              <Link
                                href={`/invoices/${inv.document_id}/review`}
                                className="text-indigo-600 font-semibold hover:underline"
                              >
                                {isUrdu ? "بل کا جائزہ لیں ←" : "View Bill →"}
                              </Link>
                            ) : (
                              <span className="text-slate-400">{t.invoices.manualBadge}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                        {t.invoices.noInvoicesFound}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
