"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Receipt, 
  User, 
  Building2, 
  Calendar, 
  Tag, 
  CheckCircle2, 
  Clock, 
  Printer, 
  ExternalLink, 
  Eye, 
  Phone, 
  Mail, 
  MapPin, 
  Loader2,
  FileSpreadsheet,
  AlertCircle,
  AlertTriangle
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { api } from "@/lib/api";
import { Invoice } from "@/types";
import { formatCurrency, formatDate, getLocalizedCategory, getLocalizedVendor, getLocalizedCustomer } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t, language, isUrdu } = useLanguage();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOriginalImage, setShowOriginalImage] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getInvoice(id)
      .then((data) => setInvoice(data))
      .catch((err) => {
        console.error("Failed to load invoice:", err);
        setError(err.message || (isUrdu ? "بل تلاش نہیں ہو سکا۔" : "Invoice not found."));
      })
      .finally(() => setLoading(false));
  }, [id, isUrdu]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header />
        <main className="p-4 sm:p-8 max-w-5xl mx-auto w-full space-y-6">
          {/* Top Bar Navigation */}
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/invoices"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{isUrdu ? "بلز لیجر پر واپس جائیں" : "Back to Invoices Ledger"}</span>
            </Link>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{isUrdu ? "پرنٹ کریں" : "Print"}</span>
              </button>
              {invoice?.document_id && (
                <Link
                  href={`/invoices/${invoice.document_id}/review`}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{isUrdu ? "AI اسکین ایڈٹ ورک اسپیس" : "AI Review Workspace"}</span>
                </Link>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-3 bg-white rounded-2xl border border-slate-200">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <p className="text-xs font-semibold">{isUrdu ? "بل کی تفصیلات لوڈ ہو رہی ہیں..." : "Loading invoice details..."}</p>
            </div>
          ) : error || !invoice ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">{error || "Invoice Not Found"}</h3>
              <p className="text-xs text-slate-500">
                {isUrdu ? "یہ بل ڈیٹا بیس میں دستیاب نہیں ہے۔" : "The requested invoice could not be retrieved."}
              </p>
              <Link
                href="/invoices"
                className="inline-block mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold"
              >
                {isUrdu ? "تمام بلز دیکھیں" : "View All Invoices"}
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-slate-800">
              {/* HEADER */}
              <div className="p-6 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold font-mono text-slate-900">
                        {invoice.invoice_number || "—"}
                      </h2>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold uppercase ${
                        invoice.verification_status === "VERIFIED"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        {invoice.verification_status === "VERIFIED" ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{isUrdu ? "تصدیق شدہ" : "Verified"}</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>{isUrdu ? "زیرِ جائزہ" : "Under Review"}</span>
                          </>
                        )}
                      </span>
                      {invoice.has_discrepancy && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold uppercase bg-rose-50 text-rose-700 border border-rose-300">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          <span>{isUrdu ? "غلطی موجود" : "Has Errors"}</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(invoice.invoice_date, language)}
                      </span>
                      {invoice.category?.name && (
                        <>
                          <span>•</span>
                          <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-semibold">
                            {getLocalizedCategory(invoice.category.name, language)}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <p className="text-xs text-slate-400 uppercase font-semibold">{isUrdu ? "کل رقم" : "Total Amount"}</p>
                  <p className="text-2xl font-bold font-mono text-indigo-600">
                    {formatCurrency(invoice.total, invoice.currency, language)}
                  </p>
                </div>
              </div>

              {/* BODY */}
              <div className="p-6 sm:p-8 space-y-6">
                {/* DISCREPANCY & ERROR ALERT BANNER */}
                {invoice.has_discrepancy && (
                  <div className="p-4 rounded-xl bg-rose-50 border-2 border-rose-300 text-rose-900 shadow-2xs space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-rose-900">
                        {isUrdu
                          ? `اس بل میں ${invoice.discrepancy_count || (invoice.discrepancy_notes?.length || 1)} غلطیاں / تضادات موجود ہیں`
                          : `${invoice.discrepancy_count || (invoice.discrepancy_notes?.length || 1)} Financial Errors / Discrepancies Flagged`}
                      </h4>
                    </div>
                    {invoice.discrepancy_notes && invoice.discrepancy_notes.length > 0 && (
                      <ul className="text-xs space-y-1 list-disc list-inside text-rose-800 font-medium">
                        {invoice.discrepancy_notes.map((note, idx) => (
                          <li key={idx}>{note}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Customer and Vendor Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Customer Card */}
                  <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <User className="w-4 h-4 text-indigo-600" />
                      <span>{isUrdu ? "کسٹمر" : "Customer"}</span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">
                      {invoice.customer?.name ? getLocalizedCustomer(invoice.customer.name, language) : "—"}
                    </h3>
                    {invoice.customer?.phone && (
                      <p className="text-xs text-slate-600 flex items-center gap-1.5 font-mono">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{invoice.customer.phone}</span>
                      </p>
                    )}
                    {invoice.customer?.email && (
                      <p className="text-xs text-slate-600 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{invoice.customer.email}</span>
                      </p>
                    )}
                    {invoice.customer?.address && (
                      <p className="text-xs text-slate-600 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{invoice.customer.address}</span>
                      </p>
                    )}
                  </div>

                  {/* Vendor Card */}
                  <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <Building2 className="w-4 h-4 text-indigo-600" />
                      <span>{isUrdu ? "وینڈر" : "Vendor"}</span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">
                      {invoice.vendor?.name ? getLocalizedVendor(invoice.vendor.name, language) : "—"}
                    </h3>
                    {invoice.vendor?.phone && (
                      <p className="text-xs text-slate-600 flex items-center gap-1.5 font-mono">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{invoice.vendor.phone}</span>
                      </p>
                    )}
                    {invoice.vendor?.address && (
                      <p className="text-xs text-slate-600 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{invoice.vendor.address}</span>
                      </p>
                    )}
                    {(invoice.vendor?.ntn || invoice.vendor?.strn) && (
                      <p className="text-xs text-slate-500 font-mono">
                        {invoice.vendor.ntn && `NTN: ${invoice.vendor.ntn}`}
                        {invoice.vendor.ntn && invoice.vendor.strn && ` | `}
                        {invoice.vendor.strn && `STRN: ${invoice.vendor.strn}`}
                      </p>
                    )}
                  </div>
                </div>

                {/* Items Table */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                    <span>{isUrdu ? "بل کے آئٹمز" : "Line Items"}</span>
                    <span className="text-slate-400 font-normal">({invoice.items?.length || 1})</span>
                  </h4>

                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                          <th className="py-3 px-4">{isUrdu ? "تفصیل" : "Description"}</th>
                          <th className="py-3 px-3 text-center">{isUrdu ? "تعداد" : "Qty"}</th>
                          <th className="py-3 px-3 text-right">{isUrdu ? "قیمت فی یونٹ" : "Unit Price"}</th>
                          <th className="py-3 px-4 text-right">{isUrdu ? "کل" : "Total"}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {invoice.items && invoice.items.length > 0 ? (
                          invoice.items.map((it, idx) => {
                            const isMissingPrice = Number(it.unit_price || 0) <= 0 || Number(it.line_total || 0) <= 0;
                            return (
                              <tr 
                                key={it.id || idx} 
                                className={`transition-colors ${
                                  isMissingPrice ? "bg-rose-50/70 hover:bg-rose-100/60" : "hover:bg-slate-50/70"
                                }`}
                              >
                                <td className="py-3 px-4 font-medium text-slate-800">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span>{it.name}</span>
                                    {isMissingPrice && (
                                      <span className="text-[10px] font-bold text-rose-700 bg-rose-100 border border-rose-300 px-1.5 py-0.5 rounded">
                                        {isUrdu ? "⚠️ قیمت درج نہیں" : "⚠️ Missing Price"}
                                      </span>
                                    )}
                                  </div>
                                  {it.description && it.description !== it.name && (
                                    <div className="text-[11px] text-slate-400 mt-0.5">{it.description}</div>
                                  )}
                                </td>
                                <td className="py-3 px-3 text-center font-mono text-slate-600">
                                  {Number(it.quantity).toLocaleString()} {it.unit || ""}
                                </td>
                                <td className={`py-3 px-3 text-right font-mono ${
                                  Number(it.unit_price || 0) <= 0 ? "text-rose-600 font-bold" : "text-slate-600"
                                }`}>
                                  {formatCurrency(it.unit_price, invoice.currency, language)}
                                </td>
                                <td className={`py-3 px-4 text-right font-mono font-bold ${
                                  Number(it.line_total || 0) <= 0 ? "text-rose-600" : "text-slate-900"
                                }`}>
                                  {formatCurrency(it.line_total, invoice.currency, language)}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td className="py-3 px-4 font-medium text-slate-800">
                              {invoice.vendor?.name ? `${invoice.vendor.name} Purchase` : "Bill Total"}
                            </td>
                            <td className="py-3 px-3 text-center font-mono text-slate-600">1</td>
                            <td className="py-3 px-3 text-right font-mono text-slate-600">
                              {formatCurrency(invoice.total, invoice.currency, language)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                              {formatCurrency(invoice.total, invoice.currency, language)}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Summary & Scanned Image */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  {/* Left: Scanned Bill Image Preview */}
                  {invoice.document_id ? (
                    <div className="space-y-2 border border-slate-200 rounded-xl p-4 bg-slate-50/60">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{isUrdu ? "اصل دستاویز کا عکس" : "Original Scanned Document"}</span>
                        </h5>
                        <Link
                          href={`/invoices/${invoice.document_id}/review`}
                          className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                        >
                          <span>{isUrdu ? "AI ورک اسپیس" : "OCR Review"}</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                      <div className="bg-white rounded-lg border border-slate-200 p-2 flex items-center justify-center max-h-[300px] overflow-hidden shadow-2xs">
                        <img 
                          src={`http://127.0.0.1:8000/api/v1/documents/${invoice.document_id}/file`}
                          alt="Original Scanned Bill"
                          className="max-h-[280px] w-auto object-contain rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
                      {invoice.notes && (
                        <p>
                          <strong className="text-slate-700">{isUrdu ? "نوٹس:" : "Notes:"}</strong> {invoice.notes}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Right: Financial Totals */}
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2 font-mono text-xs">
                    {invoice.subtotal && Number(invoice.subtotal) > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span className="font-sans">{isUrdu ? "ذیلی رقم:" : "Subtotal:"}</span>
                        <span>{formatCurrency(invoice.subtotal, invoice.currency, language)}</span>
                      </div>
                    )}
                    {invoice.tax && Number(invoice.tax) > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span className="font-sans">{isUrdu ? "ٹیکس / GST:" : "Tax / GST:"}</span>
                        <span>+{formatCurrency(invoice.tax, invoice.currency, language)}</span>
                      </div>
                    )}
                    {invoice.discount && Number(invoice.discount) > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span className="font-sans">{isUrdu ? "رعایت / ڈسکاؤنٹ:" : "Discount:"}</span>
                        <span>-{formatCurrency(invoice.discount, invoice.currency, language)}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
                      <span className="font-sans uppercase text-xs tracking-wider">{isUrdu ? "کل واجب الادا رقم:" : "Total Amount:"}</span>
                      <span className="text-indigo-600 text-lg">
                        {formatCurrency(invoice.total, invoice.currency, language)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
