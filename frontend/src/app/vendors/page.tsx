"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Building2, 
  Merge, 
  Search, 
  X,
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { api } from "@/lib/api";
import { Vendor } from "@/types";
import { formatCurrency, formatDate, getLocalizedVendor } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { t, language, isUrdu } = useLanguage();

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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200 transition-all"
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
              className="w-full py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 pl-9 pr-4"
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
                  className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 hover:border-indigo-300 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 font-bold text-sm">
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
                      <strong className="text-sm font-bold text-slate-900">{v.total_invoices}</strong>
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
              ))
            ) : (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-center space-y-2">
                <Building2 className="w-8 h-8 text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">{t.vendors.noVendorsFound}</p>
              </div>
            )}
          </div>

          {/* Merge Vendors Modal */}
          {isMergeModalOpen && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
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
                    className="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="button"
                    disabled={merging || !primaryVendorId || selectedDuplicates.length === 0}
                    onClick={handleMergeSubmit}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm disabled:opacity-50"
                  >
                    {merging ? t.common.loading : (isUrdu ? "ضم کرنے کی تصدیق کریں" : "Confirm & Merge")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
