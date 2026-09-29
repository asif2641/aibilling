"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Receipt, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  ArrowUpRight, 
  Clock, 
  Building, 
  Tag,
  PenTool,
  UploadCloud,
  FileText
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { api } from "@/lib/api";
import { DashboardSummary } from "@/types";
import { formatCurrency, formatDate, getStatusBadge, getLocalizedCategory, getLocalizedVendor } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const { t, language, isUrdu } = useLanguage();

  useEffect(() => {
    api.getDashboardSummary()
      .then(setData)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="app-layout-container flex min-h-screen bg-slate-50" dir="ltr">
      <Sidebar />
      <div className={`right-content-panel flex-1 flex flex-col min-w-0 ${isUrdu ? "font-urdu" : ""}`} dir="ltr">
        <Header title={t.dashboard.title} />

        <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6 sm:space-y-8">
          {/* Quick Action Banner */}
          <div 
            className="bg-indigo-950 rounded-2xl p-5 sm:p-6 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-indigo-800/50"
            style={{ 
              background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #3730a3 100%)',
              color: '#ffffff'
            }}
          >
            <div className="space-y-1.5">
              <h2 
                className="text-lg sm:text-xl font-bold tracking-tight text-white drop-shadow-xs"
                style={{ color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.25)' }}
              >
                {t.dashboard.title}
              </h2>
              <p 
                className="text-xs text-indigo-100 max-w-xl leading-relaxed"
                style={{ color: '#e0e7ff' }}
              >
                {t.dashboard.totalSpendingSub}
              </p>
            </div>
            <div className="flex items-center flex-wrap gap-2 shrink-0">
              <Link
                href="/invoices/new"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 text-white text-xs font-bold rounded-lg border border-white/30 transition-all backdrop-blur-xs shadow-xs"
                style={{ color: '#ffffff', fontSize: isUrdu ? '0.80rem' : '0.75rem' }}
              >
                <PenTool className="w-3.5 h-3.5 shrink-0" />
                <span>{t.dashboard.manualBillCta}</span>
              </Link>
              <Link
                href="/invoices/upload"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white text-indigo-950 hover:bg-indigo-50 text-xs font-bold rounded-lg shadow-sm transition-all"
                style={{ fontSize: isUrdu ? '0.80rem' : '0.75rem' }}
              >
                <UploadCloud className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
                <span>{t.dashboard.scanBillCta}</span>
              </Link>
            </div>
          </div>

          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Spending */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2 hover:border-slate-300 hover:shadow-sm transition-all">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">{t.dashboard.totalSpending}</span>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {loading ? "..." : formatCurrency(data?.total_spending, data?.currency, language)}
              </div>
              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                <span>{t.dashboard.totalSpendingSub}</span>
              </p>
            </div>

            {/* Card 2: This Month's Spending */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2 hover:border-slate-300 hover:shadow-sm transition-all">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">{t.dashboard.thisMonth}</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {loading ? "..." : formatCurrency(data?.this_month_spending, data?.currency, language)}
              </div>
              <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{t.dashboard.thisMonthSub}</span>
              </p>
            </div>

            {/* Card 3: This Week */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2 hover:border-slate-300 hover:shadow-sm transition-all">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">{t.dashboard.thisWeek}</span>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {loading ? "..." : formatCurrency(data?.this_week_spending, data?.currency, language)}
              </div>
              <p className="text-[11px] text-slate-500">{t.dashboard.thisWeekSub}</p>
            </div>

            {/* Card 4: Total Bills & Average */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2 hover:border-slate-300 hover:shadow-sm transition-all">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">{t.dashboard.totalBills}</span>
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                  <Receipt className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 tabular-nums">
                {loading ? "..." : data?.total_bills}
              </div>
              <p className="text-[11px] text-slate-500">
                {t.dashboard.avgBill}: <strong className="text-slate-700 font-mono tabular-nums">{loading ? "..." : formatCurrency(data?.avg_bill_amount, data?.currency, language)}</strong>
              </p>
            </div>
          </div>

          {/* Breakdown Section: Categories & Top Vendors */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Spending by Category */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Tag className="w-4 h-4 text-indigo-600" />
                  <span>{t.dashboard.categoryAllocationTitle}</span>
                </h2>
                <Link href="/reports" className="text-xs text-indigo-600 font-semibold hover:underline">
                  {isUrdu ? "مکمل رپورٹ ←" : "Full Report →"}
                </Link>
              </div>

              <div className="space-y-3">
                {data?.category_spending && data.category_spending.length > 0 ? (
                  data.category_spending.map((cat, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">{getLocalizedCategory(cat.category_name, language)}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500 font-mono tabular-nums">{formatCurrency(cat.amount, data.currency, language)}</span>
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
                  <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                      <Tag className="w-5 h-5" />
                    </div>
                    <p className="text-xs text-slate-400 italic">
                      {t.dashboard.noInvoicesYet}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Top Vendors by Spend */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Building className="w-4 h-4 text-indigo-600" />
                  <span>{t.dashboard.topVendorsTitle}</span>
                </h2>
                <Link href="/vendors" className="text-xs text-indigo-600 font-semibold hover:underline">
                  {isUrdu ? "تمام وینڈرز ←" : "Manage Vendors →"}
                </Link>
              </div>

              <div className="space-y-3">
                {data?.top_vendors && data.top_vendors.length > 0 ? (
                  data.top_vendors.map((ven, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 truncate">{getLocalizedVendor(ven.vendor_name, language)}</p>
                          <p className="text-[11px] text-slate-400">{ven.bill_count} {isUrdu ? "بلز" : "bills"}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-900 font-mono tabular-nums">
                          {formatCurrency(ven.amount, data.currency, language)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                      <Building className="w-5 h-5" />
                    </div>
                    <p className="text-xs text-slate-400 italic">
                      {t.dashboard.noInvoicesYet}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Weekly Momentum Trend */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <span>{t.dashboard.weeklyTrendTitle}</span>
            </h2>

            {data?.weekly_trend && data.weekly_trend.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {data.weekly_trend.map((w, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1 hover:border-slate-300 transition-colors">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">{w.label}</span>
                    <div className="text-lg font-bold text-slate-900 font-mono tabular-nums">
                      {formatCurrency(w.amount, data.currency, language)}
                    </div>
                    <span className="text-[11px] text-slate-400">{w.bill_count} {isUrdu ? "بلز" : "bills"}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 flex flex-col items-center justify-center text-center space-y-2">
                <TrendingUp className="w-6 h-6 text-slate-300" />
                <p className="text-xs text-slate-400 italic">{t.dashboard.noInvoicesYet}</p>
              </div>
            )}
          </div>

          {/* Recent Invoices Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-0">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">{t.dashboard.recentInvoicesTitle}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{t.invoices.subtitle}</p>
              </div>
              <Link href="/invoices" className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1">
                <span>{t.dashboard.viewAllInvoices}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
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
                  {data?.recent_invoices && data.recent_invoices.length > 0 ? (
                    data.recent_invoices.map((inv) => {
                      const badge = getStatusBadge(inv.verification_status, language);
                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{formatDate(inv.invoice_date, language)}</td>
                          <td className="py-3 px-4 font-semibold text-slate-900">{getLocalizedVendor(inv.vendor?.name, language)}</td>
                          <td className="py-3 px-4 text-slate-500 font-mono">{inv.invoice_number || "—"}</td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700">
                              {getLocalizedCategory(inv.category?.name, language)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono tabular-nums">
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
                                {t.invoices.viewReview}
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
                      <td colSpan={7} className="py-12 text-center">
                        <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-center space-y-2">
                          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                            <FileText className="w-5 h-5" />
                          </div>
                          <p className="text-xs font-semibold text-slate-700">{t.dashboard.noInvoicesYet}</p>
                          <Link
                            href="/invoices/upload"
                            className="text-xs text-indigo-600 hover:text-indigo-700 font-bold inline-flex items-center gap-1 pt-1"
                          >
                            <span>{t.dashboard.scanBillCta}</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>
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
    </div>
  );
}
