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
  PenTool,
  Layers,
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Files,
  Camera
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { api } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";

interface UploadItem {
  id: string;
  file: File;
  docId?: string;
  partsCount?: number;
  status: "waiting" | "uploading" | "preprocessing" | "reading" | "validating" | "review_required" | "verified" | "error";
  error?: string;
  duplicateDetected?: boolean;
}

interface StagedPart {
  id: string;
  file: File;
  previewUrl: string;
}

export default function UploadPage() {
  const router = useRouter();
  const { t, isUrdu } = useLanguage();

  // Completed / Processing Upload Queue
  const [items, setItems] = useState<UploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Staged parts for a multi-part long bill
  const [stagedParts, setStagedParts] = useState<StagedPart[]>([]);
  const [isStitching, setIsStitching] = useState(false);
  const [multiStage, setMultiStage] = useState<"idle" | "stitching" | "uploading" | "reading" | "validating" | "done" | "error">("idle");
  const [multiError, setMultiError] = useState<string | null>(null);
  const [stitchedDocId, setStitchedDocId] = useState<string | null>(null);

  // -------------------------------------------------------------
  // Unified File Drop / Select Handler (Single Place)
  // -------------------------------------------------------------
  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);

    // If multiple files are uploaded together:
    // Stage them as parts of a long bill with the option to combine or separate
    if (fileList.length > 1) {
      const newParts: StagedPart[] = fileList.map((file) => ({
        id: Math.random().toString(36).substring(7),
        file,
        previewUrl: URL.createObjectURL(file),
      }));
      setStagedParts((prev) => [...prev, ...newParts]);
      setMultiStage("idle");
      setMultiError(null);
      setStitchedDocId(null);
      return;
    }

    // If 1 file is selected:
    // If the user already has staged parts in progress, append this new part!
    if (stagedParts.length > 0) {
      const added: StagedPart = {
        id: Math.random().toString(36).substring(7),
        file: fileList[0],
        previewUrl: URL.createObjectURL(fileList[0]),
      };
      setStagedParts((prev) => [...prev, added]);
      setMultiStage("idle");
      setMultiError(null);
      return;
    }

    // Otherwise, single file with no staged parts -> process immediately as 1 bill!
    const singleItem: UploadItem = {
      id: Math.random().toString(36).substring(7),
      file: fileList[0],
      status: "waiting",
    };
    setItems((prev) => [singleItem, ...prev]);
    uploadAndPoll(singleItem);
  };

  const uploadAndPoll = async (item: UploadItem) => {
    updateItemStatus(item.id, "uploading");

    try {
      const res = await api.uploadDocument(item.file);
      const docId = res.id;

      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, docId, duplicateDetected: res.duplicate_detected }
            : i
        )
      );

      updateItemStatus(item.id, "preprocessing");
      await new Promise((r) => setTimeout(r, 600));

      updateItemStatus(item.id, "reading");
      await new Promise((r) => setTimeout(r, 800));

      updateItemStatus(item.id, "validating");
      await new Promise((r) => setTimeout(r, 500));

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

  // -------------------------------------------------------------
  // Staged Parts Controls (Reordering & Actions)
  // -------------------------------------------------------------
  const movePart = (index: number, direction: "up" | "down") => {
    setStagedParts((prev) => {
      const copy = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= copy.length) return prev;
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const removePart = (id: string) => {
    setStagedParts((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      const remaining = prev.filter((p) => p.id !== id);
      if (remaining.length === 0) {
        setMultiStage("idle");
        setMultiError(null);
      }
      return remaining;
    });
  };

  const clearStagedParts = () => {
    stagedParts.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setStagedParts([]);
    setMultiStage("idle");
    setMultiError(null);
    setStitchedDocId(null);
  };

  // Action 1: Combine into 1 single bill
  const handleCombineAndScan = async () => {
    if (stagedParts.length === 0) return;
    setIsStitching(true);
    setMultiError(null);
    setMultiStage("stitching");

    try {
      await new Promise((r) => setTimeout(r, 400));
      setMultiStage("uploading");

      const files = stagedParts.map((p) => p.file);
      const res = await api.uploadMultiImageDocument(files);
      const docId = res.id;
      setStitchedDocId(docId);

      setMultiStage("reading");
      await new Promise((r) => setTimeout(r, 900));

      setMultiStage("validating");
      await new Promise((r) => setTimeout(r, 500));

      const statusRes = await api.getDocumentStatus(docId);
      if (statusRes.status === "FAILED") {
        setMultiStage("error");
        setMultiError(statusRes.processing_error || (isUrdu ? "ڈیٹا اخذ کرنے میں خرابی" : "Extraction failed"));
      } else {
        setMultiStage("done");
        // Also add to the queue table below
        const stitchedItem: UploadItem = {
          id: Math.random().toString(36).substring(7),
          file: stagedParts[0].file,
          docId: docId,
          partsCount: stagedParts.length,
          status: "review_required",
          duplicateDetected: res.duplicate_detected,
        };
        setItems((prev) => [stitchedItem, ...prev]);
      }
    } catch (err: any) {
      setMultiStage("error");
      setMultiError(err.message || (isUrdu ? "تصاویر جوڑنے میں خرابی پیش آئی" : "Stitching & processing failed"));
    } finally {
      setIsStitching(false);
    }
  };

  // Action 2: Process as separate bills instead
  const handleProcessAsSeparate = () => {
    const newItems: UploadItem[] = stagedParts.map((part) => ({
      id: Math.random().toString(36).substring(7),
      file: part.file,
      status: "waiting",
    }));

    clearStagedParts();
    setItems((prev) => [...newItems, ...prev]);
    newItems.forEach((item) => uploadAndPoll(item));
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

        <main className="flex-1 p-4 sm:p-8 max-w-4xl mx-auto w-full space-y-6">
          {/* Header Title & Subtitle */}
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{t.upload.title}</h1>
            <p className="text-xs text-slate-500">
              {isUrdu 
                ? "عام بلز، پی ڈی ایف، یا ایک طویل رسید کے مختلف ٹکڑے سب یہیں سے اپلوڈ کریں۔ AI خود بخود جوڑ لے گا۔" 
                : "Upload single bills, PDFs, or multiple photos of a long receipt in one place. AI automatically parses and stitches them."}
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

          {/* ------------------------------------------------------------- */}
          {/* UNIFIED SINGLE DROPZONE (یکساں اپلوڈ ایریا)                      */}
          {/* ------------------------------------------------------------- */}
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
            className={`border-2 border-dashed rounded-2xl p-9 text-center cursor-pointer transition-all ${
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
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = "";
              }}
              className="hidden"
            />
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = "";
              }}
              className="hidden"
            />
            <div className="max-w-md mx-auto space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-sm shadow-indigo-100">
                <UploadCloud className="w-7 h-7" />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-900 block">
                  {isUrdu 
                    ? "بل کی تصویر، لمبی رسید کے حصے یا پی ڈی ایف یہاں ڈالیں" 
                    : "Drop bill photo, long receipt parts, or PDF here"}
                </span>
                <span className="text-xs text-slate-500 mt-0.5 block">
                  {isUrdu
                    ? "موبائل کیمرے سے براہ راست تصویر لیں یا گیلری/فائلز سے منتخب کریں"
                    : "Snap directly with your phone's camera or browse existing bills & PDFs"}
                </span>
              </div>

              {/* Action Buttons: Direct Mobile Camera & Browse Files */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    cameraInputRef.current?.click();
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-sm transition-all cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>{t.upload.takePhoto}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4 text-slate-500" />
                  <span>{t.upload.browseFiles}</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-[11px] font-medium text-slate-600">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isUrdu ? "عام بلز اور پی ڈی ایف" : "Single Bills & PDFs"}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[11px] font-semibold">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isUrdu ? "طویل بل: متعدد تصاویر ملا کر 1 بل" : "Long Receipt: Multi-photos merged to 1 bill"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* STAGED MULTI-PART CARD (جب ایک سے زیادہ تصاویر منتخب ہوں)      */}
          {/* ------------------------------------------------------------- */}
          {stagedParts.length > 0 && (
            <div className="bg-white rounded-2xl border-2 border-emerald-500/30 p-5 shadow-sm space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900">
                      {isUrdu 
                        ? `طویل بل کی ${stagedParts.length} تصاویر منتخب ہوئیں` 
                        : `${stagedParts.length} Photos Selected for Long Bill`}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {isUrdu ? "ترتیب: اوپر سے نیچے (Top to Bottom)" : "Order: Top to Bottom (Header to Totals)"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg transition-all shadow-xs cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{t.upload.snapNextPart}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isUrdu ? "+ فائل منتخب کریں" : "+ Add File"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={clearStagedParts}
                    className="text-xs text-slate-400 hover:text-rose-600 transition-colors px-2 py-1 cursor-pointer"
                  >
                    {isUrdu ? "منسوخ کریں" : "Clear"}
                  </button>
                </div>
              </div>

              {/* Thumbnail List with Reorder Controls */}
              <div className="space-y-2">
                {stagedParts.map((part, index) => {
                  const isTop = index === 0;
                  const isBottom = index === stagedParts.length - 1;
                  const partLabel = isTop 
                    ? (isUrdu ? "حصہ 1 (اوپر کا حصہ / ہیڈر)" : "Part 1 (Top / Header)")
                    : isBottom && stagedParts.length > 1
                    ? (isUrdu ? `حصہ ${index + 1} (نچلا حصہ / ٹوٹل)` : `Part ${index + 1} (Bottom / Totals)`)
                    : (isUrdu ? `حصہ ${index + 1} (درمیانی حصہ)` : `Part ${index + 1} (Middle)`);

                  return (
                    <div
                      key={part.id}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white transition-all shadow-2xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Part Badge */}
                        <div className="flex flex-col items-center justify-center w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs shrink-0">
                          {index + 1}
                        </div>

                        {/* Thumbnail */}
                        <div className="w-12 h-12 rounded-lg bg-slate-200 overflow-hidden shrink-0 border border-slate-300/80">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={part.previewUrl}
                            alt={`Part ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {partLabel}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate max-w-xs sm:max-w-md">
                            {part.file.name} • {(part.file.size / 1024).toFixed(0)} KB
                          </p>
                        </div>
                      </div>

                      {/* Reordering and Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => movePart(index, "up")}
                          disabled={isTop || isStitching}
                          title="Move Up"
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => movePart(index, "down")}
                          disabled={isBottom || isStitching}
                          title="Move Down"
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removePart(part.id)}
                          disabled={isStitching}
                          title="Remove Part"
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* In-Flight Status Feedback */}
              {isStitching && (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-emerald-600 animate-spin shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-emerald-950">
                      {multiStage === "stitching" && (isUrdu ? "تصاویر کو عمودی جوڑ کر ایک مکمل بل بنایا جا رہا ہے..." : "Stitching images vertically without distortion...")}
                      {multiStage === "uploading" && (isUrdu ? "مشترکہ بل اپلوڈ ہو رہا ہے..." : "Uploading combined composite...")}
                      {multiStage === "reading" && (isUrdu ? "AI تمام حصوں کا متن اور اندراج پڑھ رہا ہے..." : "AI reading vendor and item lines across all parts...")}
                      {multiStage === "validating" && (isUrdu ? "حساب اور رقوم کی تصدیق جاری ہے..." : "Validating ledger totals and subtotals...")}
                    </p>
                    <p className="text-[11px] text-emerald-700">
                      {isUrdu ? "براہ کرم چند لمحے انتظار کریں..." : "Please wait a moment while AI unifies all items..."}
                    </p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {multiStage === "error" && multiError && (
                <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-rose-900">{isUrdu ? "خرابی" : "Processing Error"}</p>
                    <p className="text-[11px] text-rose-700">{multiError}</p>
                  </div>
                </div>
              )}

              {/* Success Banner */}
              {multiStage === "done" && stitchedDocId && (
                <div className="p-4 bg-emerald-600 text-white rounded-xl shadow-md flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 shrink-0" />
                    <div>
                      <p className="text-xs font-black">
                        {isUrdu ? "کامیابی! تمام تصاویر ملا کر 1 بل بن گیا" : "Success! Stitched into 1 Unified Bill"}
                      </p>
                      <p className="text-[11px] text-emerald-100">
                        {isUrdu ? "تمام آئٹمز اور رقم ایک ہی انوائس میں شامل کر دیے گئے ہیں۔" : "All sections and line items consolidated into one bill."}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/invoices/${stitchedDocId}/review`}
                    className="inline-flex items-center gap-1.5 bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-black px-4 py-2 rounded-lg shadow-xs shrink-0 transition-all"
                  >
                    <span>{isUrdu ? "بل کا جائزہ لیں" : "Review Bill"}</span>
                    <ArrowRight className={`w-3.5 h-3.5 ${isUrdu ? "rotate-180" : ""}`} />
                  </Link>
                </div>
              )}

              {/* Action Buttons: 1. Combine into 1 Bill, 2. Or separate */}
              {multiStage !== "done" && (
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleCombineAndScan}
                    disabled={isStitching || stagedParts.length === 0}
                    className="flex-1 w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isStitching ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{isUrdu ? "بل تیار ہو رہا ہے..." : "Combining & Extracting..."}</span>
                      </>
                    ) : (
                      <>
                        <Layers className="w-4 h-4" />
                        <span>
                          {isUrdu 
                            ? `تمام تصاویر ملا کر 1 بل بنائیں اور اسکین کریں (${stagedParts.length} تصاویر)` 
                            : `Combine & Scan as 1 Bill (${stagedParts.length} Parts)`}
                        </span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleProcessAsSeparate}
                    disabled={isStitching}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors"
                  >
                    <Files className="w-3.5 h-3.5 text-slate-500" />
                    <span>{isUrdu ? "الگ الگ بلز بنائیں" : "Scan as Separate Bills"}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* UPLOAD & PROCESSING QUEUE (حالیہ اسکینز کی فہرست)               */}
          {/* ------------------------------------------------------------- */}
          {items.length > 0 && (
            <div className="space-y-3 pt-2">
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
                          {isPdf ? (
                            <FileText className="w-5 h-5 text-rose-500" />
                          ) : item.partsCount && item.partsCount > 1 ? (
                            <Layers className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-indigo-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold text-slate-900 truncate max-w-sm">
                              {item.file.name}
                            </p>
                            {item.partsCount && item.partsCount > 1 && (
                              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded border border-emerald-300 shrink-0">
                                {isUrdu ? `${item.partsCount} تصاویر مل کر 1 بل` : `${item.partsCount} Parts Combined`}
                              </span>
                            )}
                          </div>
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
