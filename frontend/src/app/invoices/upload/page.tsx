"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  UploadCloud, 
  FileText, 
  Image as ImageIcon, 
  Loader2, 
  ArrowRight,
  PenTool
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { api } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";

interface UploadItem {
  id: string;
  file: File;
  docId?: string;
  status: "waiting" | "uploading" | "preprocessing" | "reading" | "validating" | "review_required" | "verified" | "error";
  error?: string;
  duplicateDetected?: boolean;
}

export default function UploadPage() {
  const router = useRouter();
  const [items, setItems] = useState<UploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t, isUrdu } = useLanguage();

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newItems: UploadItem[] = Array.from(files).map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      status: "waiting",
    }));

    setItems((prev) => [...prev, ...newItems]);
    newItems.forEach((item) => uploadAndPoll(item));
  };

  const uploadAndPoll = async (item: UploadItem) => {
    updateItemStatus(item.id, "uploading");

    try {
      // Step 1: Upload
      const res = await api.uploadDocument(item.file);
      const docId = res.id;

      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, docId, duplicateDetected: res.duplicate_detected }
            : i
        )
      );

      // Step 2: Realistic processing stages
      updateItemStatus(item.id, "preprocessing");
      await new Promise((r) => setTimeout(r, 600));

      updateItemStatus(item.id, "reading");
      await new Promise((r) => setTimeout(r, 800));

      updateItemStatus(item.id, "validating");
      await new Promise((r) => setTimeout(r, 500));

      // Poll server status
      const statusRes = await api.getDocumentStatus(docId);
      if (statusRes.status === "FAILED") {
        updateItemStatus(item.id, "error", statusRes.processing_error || (isUrdu ? "ڈیٹا اخذ کرنے میں ناکامی" : "Failed to extract"));
      } else {
        updateItemStatus(item.id, "review_required");
      }
    } catch (err: any) {
      updateItemStatus(item.id, "error", err.message || (isUrdu ? "فائل اپلوڈ کرنے میں خرابی" : "Upload failed"));
    }
  };

  const updateItemStatus = (id: string, status: UploadItem["status"], error?: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status, error } : i))
    );
  };

  const getStageLabel = (status: UploadItem["status"]) => {
    if (isUrdu) {
      switch (status) {
        case "waiting":
          return "قطار میں شامل ہے...";
        case "uploading":
          return "اپلوڈ ہو رہی ہے...";
        case "preprocessing":
          return "دستاویز کی کوالٹی جانچی جا رہی ہے...";
        case "reading":
          return "AI متن اور اندراج پڑھ رہا ہے...";
        case "validating":
          return "حساب اور رقوم کی تصدیق جاری ہے...";
        case "review_required":
          return "ڈیٹا اخذ ہو گیا — جائزے کے لیے تیار";
        case "verified":
          return "تصدیق شدہ اور محفوظ";
        case "error":
          return "پراسیسنگ میں خرابی";
      }
    } else {
      switch (status) {
        case "waiting":
          return "Queued...";
        case "uploading":
          return "Uploading...";
        case "preprocessing":
          return "Preparing document & checking clarity...";
        case "reading":
          return "Reading document & understanding layout...";
        case "validating":
          return "Validating financial calculations...";
        case "review_required":
          return "Extraction Complete — Ready for Review";
        case "verified":
          return "Verified & Saved";
        case "error":
          return "Processing Error";
      }
    }
  };

  return (
    <div className="app-layout-container flex min-h-screen bg-slate-50" dir="ltr">
      <Sidebar />
      <div className={`right-content-panel flex-1 flex flex-col min-w-0 ${isUrdu ? "font-urdu" : ""}`} dir="ltr">
        <Header title={t.upload.title} />

        <main className="flex-1 p-4 sm:p-8 max-w-4xl mx-auto w-full space-y-8">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{t.upload.title}</h1>
            <p className="text-xs text-slate-500">
              {t.upload.subtitle}
            </p>
          </div>

          {/* Manual Entry Callout Banner */}
          <div className="bg-indigo-50 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-600 text-white shrink-0">
                <PenTool className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">{t.upload.manualBannerHeading}</p>
                <p className="text-[11px] text-slate-600">{t.upload.manualBannerSub}</p>
              </div>
            </div>
            <Link
              href="/invoices/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200 shadow-xs transition-all shrink-0"
            >
              <span>{t.upload.manualBannerButton}</span>
            </Link>
          </div>

          {/* Drag & Drop Receptive Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
              isDragging
                ? "border-indigo-600 bg-indigo-50/50 scale-[0.99]"
                : "border-slate-300 hover:border-indigo-400 bg-white hover:bg-slate-50/50"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
            />
            <div className="max-w-sm mx-auto space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-sm shadow-indigo-100">
                <UploadCloud className="w-7 h-7" />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-900 block">
                  {t.upload.dropzoneHeading}
                </span>
                <span className="text-xs text-slate-500 mt-0.5 block">
                  {t.upload.dropzoneSub}
                </span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-[11px] font-medium text-slate-600">
                <span>{isUrdu ? "ایک سے زائد بلز ایک ساتھ اپلوڈ کیے جا سکتے ہیں" : "Multi-document batch upload supported"}</span>
              </div>
            </div>
          </div>

          {/* Upload & Processing Queue List */}
          {items.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  {t.upload.recentUploadsTitle} ({items.length})
                </h2>
                <button
                  onClick={() => setItems([])}
                  className="text-xs text-slate-400 hover:text-rose-600 transition-colors"
                >
                  {isUrdu ? "فہرست صاف کریں" : "Clear Queue"}
                </button>
              </div>

              <div className="space-y-2">
                {items.map((item) => {
                  const isPdf = item.file.type.includes("pdf");
                  return (
                    <div
                      key={item.id}
                      className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                          {isPdf ? <FileText className="w-5 h-5 text-rose-500" /> : <ImageIcon className="w-5 h-5 text-indigo-500" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 truncate max-w-sm">
                            {item.file.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-slate-400">
                              {(item.file.size / 1024).toFixed(0)} KB
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-[11px] font-medium text-indigo-600 flex items-center gap-1">
                              {["uploading", "preprocessing", "reading", "validating"].includes(item.status) && (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              )}
                              <span>{getStageLabel(item.status)}</span>
                            </span>
                            {item.duplicateDetected && (
                              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded border border-amber-300">
                                {isUrdu ? "پہلے سے موجود بل (Duplicate)" : "Duplicate Detected"}
                              </span>
                            )}
                          </div>
                          {item.error && (
                            <p className="text-[11px] text-rose-600 mt-1">{item.error}</p>
                          )}
                        </div>
                      </div>

                      {/* Action */}
                      <div className="shrink-0">
                        {item.status === "review_required" && item.docId && (
                          <Link
                            href={`/invoices/${item.docId}/review`}
                            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3.5 py-2 rounded-lg shadow-sm shadow-indigo-100 transition-all"
                          >
                            <span>{isUrdu ? "بل کا جائزہ لیں" : "Review Bill"}</span>
                            <ArrowRight className={`w-3.5 h-3.5 ${isUrdu ? "rotate-180" : ""}`} />
                          </Link>
                        )}
                        {item.status === "error" && (
                          <button
                            onClick={() => uploadAndPoll(item)}
                            className="text-xs text-rose-600 font-semibold hover:underline"
                          >
                            {isUrdu ? "دوبارہ کوشش کریں" : "Retry"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
