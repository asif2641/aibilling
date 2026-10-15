"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  X, 
  Receipt, 
  User, 
  Building2, 
  Calendar, 
  Tag, 
  FileText, 
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
  AlertTriangle
} from "lucide-react";
import { api } from "@/lib/api";
import { Invoice } from "@/types";
import { formatCurrency, formatDate, getLocalizedCategory, getLocalizedVendor, getLocalizedCustomer } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

interface InvoiceDetailModalProps {
  invoiceId: string | null;
  isOpen: boolean;
  onClose: () => void;
  fallbackData?: {
    invoice_number?: string | null;
    vendor_name?: string | null;
    customer_name?: string | null;
    total?: string | number;
    currency?: string;
    invoice_date?: string;
    status?: string;
    category_name?: string | null;
    document_id?: string | null;
  };
}

export function InvoiceDetailModal({
  invoiceId,
  isOpen,
  onClose,
  fallbackData,
}: InvoiceDetailModalProps) {
  const { t, language, isUrdu } = useLanguage();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOriginalImage, setShowOriginalImage] = useState(false);

  useEffect(() => {
    if (!isOpen || !invoiceId) {
      setInvoice(null);
      setError(null);
      setShowOriginalImage(false);
      return;
    }

    setLoading(true);
    setError(null);
    api.getInvoice(invoiceId)
      .then((data) => {
        setInvoice(data);
      })
      .catch((err) => {
        console.error("Error fetching invoice details:", err);
        setError(err.message || (isUrdu ? "بل کی تفصیلات لوڈ کرنے میں ناکامی۔" : "Failed to load invoice details."));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, invoiceId, isUrdu]);

  if (!isOpen) return null;

  // Resolve values prioritizing full invoice, then fallbackData
  const invNumber = invoice?.invoice_number || fallbackData?.invoice_number || "—";
  const invDate = invoice?.invoice_date || fallbackData?.invoice_date || "";
  const totalAmount = invoice ? invoice.total : (fallbackData?.total || 0);
  const currency = invoice?.currency || fallbackData?.currency || "PKR";
  const status = invoice?.verification_status || fallbackData?.status || "REVIEW";
  const docId = invoice?.document_id || fallbackData?.document_id;
  const vendorName = invoice?.vendor?.name || fallbackData?.vendor_name || "—";
  const customerName = invoice?.customer?.name || fallbackData?.customer_name || "—";
  const categoryName = invoice?.category?.name || fallbackData?.category_name;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base font-mono">
                  {invNumber}
                </h3>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
                  status === "VERIFIED" 
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}>
                  {status === "VERIFIED" ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>{isUrdu ? "تصدیق شدہ" : "Verified"}</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3 h-3 text-amber-600" />
                      <span>{isUrdu ? "زیرِ جائزہ" : "Under Review"}</span>
                    </>
                  )}
                </span>
                {invoice?.has_discrepancy && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-rose-50 text-rose-700 border border-rose-300">
                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                    <span>{isUrdu ? "غلطی موجود" : "Has Errors"}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                <span>{isUrdu ? "بل کی مکمل تفصیلات" : "Bill Detailed Breakdown"}</span>
                {invDate && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(invDate, language)}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              title={isUrdu ? "پرنٹ کریں" : "Print Receipt"}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && !invoice ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <p className="text-xs font-semibold">{isUrdu ? "بل کی تفصیلات لوڈ ہو رہی ہیں..." : "Loading bill details..."}</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-medium">
                  {error}
                </div>
              )}

              {/* DISCREPANCY & ERROR ALERT BANNER */}
              {invoice?.has_discrepancy && (
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

              {/* CUSTOMER & VENDOR CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Customer Box */}
                <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <User className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{isUrdu ? "کسٹمر کی معلومات" : "Customer Information"}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      {getLocalizedCustomer(customerName, language)}
                    </h4>
                    {invoice?.customer?.phone && (
                      <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-1 font-mono">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{invoice.customer.phone}</span>
                      </p>
                    )}
                    {invoice?.customer?.email && (
                      <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{invoice.customer.email}</span>
                      </p>
                    )}
                    {invoice?.customer?.address && (
                      <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{invoice.customer.address}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Vendor Box */}
                <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{isUrdu ? "وینڈر / فراہم کنندہ" : "Vendor / Supplier"}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      {getLocalizedVendor(vendorName, language)}
                    </h4>
                    {invoice?.vendor?.phone && (
                      <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-1 font-mono">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{invoice.vendor.phone}</span>
                      </p>
                    )}
                    {invoice?.vendor?.address && (
                      <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{invoice.vendor.address}</span>
                      </p>
                    )}
                    {(invoice?.vendor?.ntn || invoice?.vendor?.strn) && (
                      <p className="text-[11px] text-slate-500 mt-1 font-mono">
                        {invoice.vendor.ntn && `NTN: ${invoice.vendor.ntn}`}
                        {invoice.vendor.ntn && invoice.vendor.strn && ` | `}
                        {invoice.vendor.strn && `STRN: ${invoice.vendor.strn}`}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* METADATA BAR */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-500">{isUrdu ? "کیٹیگری:" : "Category:"}</span>
                  {categoryName ? (
                    <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded font-semibold text-[11px]">
                      {getLocalizedCategory(categoryName, language)}
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </div>

                {invoice?.payment_method && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">{isUrdu ? "طریقہ ادائیگی:" : "Payment Method:"}</span>
                    <span className="font-semibold text-slate-800 capitalize bg-white px-2 py-0.5 rounded border border-slate-200">
                      {invoice.payment_method}
                    </span>
                  </div>
                )}

                {invoice?.due_date && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">{isUrdu ? "واجب الادا تاریخ:" : "Due Date:"}</span>
                    <span className="font-semibold text-slate-800">
                      {formatDate(invoice.due_date, language)}
                    </span>
                  </div>
                )}
              </div>

              {/* LINE ITEMS BREAKDOWN */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{isUrdu ? "اشیاء / آئٹمز کی تفصیلات" : "Purchased Line Items"}</span>
                  <span className="text-slate-400 font-normal">
                    ({invoice?.items?.length || (fallbackData ? 1 : 0)})
                  </span>
                </h4>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                        <th className="py-2.5 px-4">{isUrdu ? "آئٹم کا نام / تفصیل" : "Item / Description"}</th>
                        <th className="py-2.5 px-3 text-center">{isUrdu ? "تعداد" : "Qty"}</th>
                        <th className="py-2.5 px-3 text-right">{isUrdu ? "قیمت فی یونٹ" : "Unit Price"}</th>
                        <th className="py-2.5 px-4 text-right">{isUrdu ? "کل قیمت" : "Total"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {invoice?.items && invoice.items.length > 0 ? (
                        invoice.items.map((it, idx) => {
                          const isMissingPrice = Number(it.unit_price || 0) <= 0 || Number(it.line_total || 0) <= 0;
                          return (
                            <tr 
                              key={it.id || idx} 
                              className={`transition-colors ${
                                isMissingPrice ? "bg-rose-50/70 hover:bg-rose-100/60" : "hover:bg-slate-50/70"
                              }`}
                            >
                              <td className="py-2.5 px-4 font-medium text-slate-800">
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
                              <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                                {Number(it.quantity).toLocaleString()} {it.unit || ""}
                              </td>
                              <td className={`py-2.5 px-3 text-right font-mono ${
                                Number(it.unit_price || 0) <= 0 ? "text-rose-600 font-bold" : "text-slate-600"
                              }`}>
                                {formatCurrency(it.unit_price, currency, language)}
                              </td>
                              <td className={`py-2.5 px-4 text-right font-mono font-bold ${
                                Number(it.line_total || 0) <= 0 ? "text-rose-600" : "text-slate-900"
                              }`}>
                                {formatCurrency(it.line_total, currency, language)}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td className="py-3 px-4 font-medium text-slate-800">
                            {vendorName !== "—" ? `${vendorName} Purchase` : (isUrdu ? "بل کے اخراجات" : "General Bill Expense")}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-slate-600">1</td>
                          <td className="py-3 px-3 text-right font-mono text-slate-600">
                            {formatCurrency(totalAmount, currency, language)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                            {formatCurrency(totalAmount, currency, language)}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* FINANCIAL SUMMARY TOTALS */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="space-y-1 text-xs text-slate-500">
                  {invoice?.notes && (
                    <p className="max-w-xs">
                      <strong className="text-slate-700">{isUrdu ? "نوٹس:" : "Notes:"}</strong> {invoice.notes}
                    </p>
                  )}
                  {docId && (
                    <div className="pt-1 flex items-center gap-2">
                      <button
                        onClick={() => setShowOriginalImage(!showOriginalImage)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>
                          {showOriginalImage 
                            ? (isUrdu ? "اصل بل تصویر چھپائیں" : "Hide Scanned Receipt") 
                            : (isUrdu ? "اصل بل اسکین تصویر دیکھیں" : "View Scanned Receipt Image")}
                        </span>
                      </button>

                      <span>•</span>

                      <Link
                        href={`/invoices/${docId}/review`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        <span>{isUrdu ? "AI اسکین ایڈٹ ورک اسپیس" : "Open Full AI OCR Workspace"}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  )}
                </div>

                <div className="w-full sm:w-64 space-y-1.5 text-xs text-slate-600 font-mono">
                  {invoice?.subtotal && Number(invoice.subtotal) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-sans">{isUrdu ? "ذیلی رقم:" : "Subtotal:"}</span>
                      <span>{formatCurrency(invoice.subtotal, currency, language)}</span>
                    </div>
                  )}
                  {invoice?.tax && Number(invoice.tax) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-sans">{isUrdu ? "ٹیکس / GST:" : "Tax / GST:"}</span>
                      <span>+{formatCurrency(invoice.tax, currency, language)}</span>
                    </div>
                  )}
                  {invoice?.discount && Number(invoice.discount) > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span className="font-sans">{isUrdu ? "رعایت / ڈسکاؤنٹ:" : "Discount:"}</span>
                      <span>-{formatCurrency(invoice.discount, currency, language)}</span>
                    </div>
                  )}
                  <div className="pt-1.5 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
                    <span className="font-sans text-xs uppercase tracking-wider">{isUrdu ? "کل واجب الادا رقم:" : "Total Amount:"}</span>
                    <span className="text-indigo-600 text-base">
                      {formatCurrency(totalAmount, currency, language)}
                    </span>
                  </div>
                </div>
              </div>

              {/* SCANNED ORIGINAL RECEIPT VIEWER (COLLAPSIBLE) */}
              {showOriginalImage && docId && (
                <div className="space-y-2 pt-2 border-t border-slate-200 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{isUrdu ? "اصل دستاویز کا عکس" : "Original Scanned Document / Receipt"}</span>
                    </h5>
                    <button
                      onClick={() => setShowOriginalImage(false)}
                      className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {isUrdu ? "بند کریں" : "Close Image"}
                    </button>
                  </div>
                  <div className="bg-slate-900/5 rounded-xl border border-slate-200 p-2 overflow-hidden flex items-center justify-center max-h-[400px]">
                    <img 
                      src={`http://127.0.0.1:8000/api/v1/documents/${docId}/file`}
                      alt="Original Bill"
                      className="max-h-[380px] w-auto object-contain rounded-lg shadow-sm"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {docId && (
              <Link
                href={`/invoices/${docId}/review`}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <span>{isUrdu ? "AI ورک اسپیس میں دیکھیں" : "Review in AI Workspace"}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg transition-colors cursor-pointer shadow-2xs"
          >
            {t.common.close || (isUrdu ? "بند کریں" : "Close")}
          </button>
        </div>
      </div>
    </div>
  );
}
