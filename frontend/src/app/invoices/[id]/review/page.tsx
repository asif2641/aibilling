"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  AlertCircle, 
  Loader2,
  Eye,
  Edit3
} from "lucide-react";
import { DocumentViewer } from "@/components/review/DocumentViewer";
import { ReviewForm } from "@/components/review/ReviewForm";
import { api } from "@/lib/api";
import { DocumentItem, BoundingBox, Category } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

export default function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { t, isUrdu } = useLanguage();

  const [document, setDocument] = useState<DocumentItem | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active highlighted bounding box sync
  const [activeBoundingBox, setActiveBoundingBox] = useState<BoundingBox | null>(null);
  const [activeFieldLabel, setActiveFieldLabel] = useState<string | null>(null);

  // Mobile layout tab toggle: 'doc' | 'form'
  const [mobileTab, setMobileTab] = useState<"doc" | "form">("form");

  useEffect(() => {
    Promise.all([
      api.getDocumentDetail(id),
      api.getCategories().catch(() => []),
    ])
      .then(([doc, cats]) => {
        setDocument(doc);
        setCategories(cats);
      })
      .catch((err) => setError(err.message || (isUrdu ? "دستاویز لوڈ کرنے میں ناکامی" : "Failed to load document")))
      .finally(() => setLoading(false));
  }, [id, isUrdu]);

  const handleFieldFocus = (field: string, bbox?: BoundingBox | null) => {
    setActiveFieldLabel(field.replace("_", " ").toUpperCase());
    setActiveBoundingBox(bbox || null);
  };

  const handleApprove = async (formData: any) => {
    try {
      await api.approveInvoice(formData);
      router.push("/invoices");
    } catch (err: any) {
      alert((isUrdu ? "بل منظور کرنے میں خرابی: " : "Error approving invoice: ") + err.message);
    }
  };

  const handleReprocess = async () => {
    try {
      await api.reprocessDocument(id);
      const updated = await api.getDocumentDetail(id);
      setDocument(updated);
    } catch (err: any) {
      alert((isUrdu ? "دوبارہ ڈیٹا نکالنے میں خرابی: " : "Reprocessing failed: ") + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-3">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-xs font-bold text-slate-500">
          {isUrdu ? "دستاویز کا ڈیٹا اور اسکینر لوڈ ہو رہا ہے..." : "Loading document extraction workspace..."}
        </p>
      </div>
    );
  }

  if (error || !document || !document.extraction) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h1 className="text-lg font-bold text-slate-900">
          {isUrdu ? "دستاویز دستیاب نہیں ہے" : "Document Unavailable"}
        </h1>
        <p className="text-xs text-slate-500 max-w-sm">
          {error || (isUrdu ? "اس دستاویز کا ڈیٹا حاصل نہیں کیا جا سکا۔" : "Could not retrieve extraction records.")}
        </p>
        <Link
          href="/invoices/upload"
          className="text-xs font-bold text-indigo-600 hover:underline"
        >
          {isUrdu ? "← اپلوڈ اسکرین پر واپس جائیں" : "← Return to Upload"}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden">
      {/* Top Bar */}
      <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Link
            href="/invoices"
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
            title={t.manualBill.backToBills}
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="h-4 w-px bg-slate-200"></div>
          <div>
            <h1 className="text-xs font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
              {t.review.title}: {document.original_filename}
            </h1>
            <p className="text-[10px] text-slate-500">{t.review.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <LanguageSwitcher variant="pill" />

          {/* Mobile Tab Switcher */}
          <div className="lg:hidden flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setMobileTab("doc")}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-md transition-all ${
                mobileTab === "doc" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{t.review.originalDocument}</span>
            </button>
            <button
              onClick={() => setMobileTab("form")}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-md transition-all ${
                mobileTab === "form" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{t.review.extractedDetails}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 50/50 Split-Screen Workspace */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 min-h-0 overflow-hidden">
        {/* Left: Interactive Document Viewer */}
        <div className={`h-full min-h-0 ${mobileTab === "doc" ? "block" : "hidden lg:block"}`}>
          <DocumentViewer
            fileUrl={api.getDocumentFileUrl(document.id)}
            filename={document.original_filename}
            mimeType={document.mime_type}
            activeBoundingBox={activeBoundingBox}
            activeFieldLabel={activeFieldLabel}
          />
        </div>

        {/* Right: Editable Structured Verification Form */}
        <div className={`h-full min-h-0 ${mobileTab === "form" ? "block" : "hidden lg:block"}`}>
          <ReviewForm
            documentId={document.id}
            initialData={document.extraction}
            categories={categories}
            onFieldFocus={handleFieldFocus}
            onApprove={handleApprove}
            onReprocess={handleReprocess}
          />
        </div>
      </main>
    </div>
  );
}
