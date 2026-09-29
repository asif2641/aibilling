"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { api } from "@/lib/api";
import { User, Category } from "@/types";
import { 
  UserCheck, 
  Check, 
  Sparkles, 
  Tag, 
  Plus, 
  Trash2, 
  Edit2, 
  X, 
  Palette, 
  AlertCircle,
  Languages
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { getLocalizedCategory } from "@/lib/utils";

const PALETTE = [
  "#10B981", "#3B82F6", "#8B5CF6", "#F59E0B", 
  "#EF4444", "#EC4899", "#14B8A6", "#6366F1", 
  "#F97316", "#06B6D4", "#84CC16", "#6B7280"
];

const ICONS = [
  "tag", "shopping-cart", "utensils", "activity", 
  "zap", "cpu", "briefcase", "home", "compass", "file-text"
];

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState("");
  const [currency, setCurrency] = useState("PKR");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Language Context
  const { language, setLanguage, t, isUrdu } = useLanguage();

  // Categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);

  // Add / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catName, setCatName] = useState("");
  const [catColor, setCatColor] = useState(PALETTE[0]);
  const [catIcon, setCatIcon] = useState("tag");
  const [savingCat, setSavingCat] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);

  const fetchCats = () => {
    setLoadingCats(true);
    api.getCategories()
      .then(setCategories)
      .catch(console.error)
      .finally(() => setLoadingCats(false));
  };

  useEffect(() => {
    api.getMe()
      .then((u) => {
        setUser(u);
        setFullName(u.full_name || "");
        setCurrency(u.currency || "PKR");
      })
      .catch(() => {});
    fetchCats();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileError(null);
    try {
      const updated = await api.updateUser({ full_name: fullName, currency });
      setUser(updated);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err: any) {
      setProfileError(err.message || (isUrdu ? "پروفائل اپڈیٹ کرنے میں خرابی ہوئی" : "Failed to update profile"));
    } finally {
      setSavingProfile(false);
    }
  };

  const openCreateModal = () => {
    setEditingCatId(null);
    setCatName("");
    setCatColor(PALETTE[Math.floor(Math.random() * PALETTE.length)]);
    setCatIcon("tag");
    setCatError(null);
    setModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCatId(cat.id);
    setCatName(cat.name);
    setCatColor(cat.color);
    setCatIcon(cat.icon);
    setCatError(null);
    setModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      setCatError(isUrdu ? "کیٹیگری کا نام درکار ہے" : "Category name is required");
      return;
    }
    setSavingCat(true);
    setCatError(null);
    try {
      if (editingCatId) {
        await api.updateCategory(editingCatId, {
          name: catName.trim(),
          color: catColor,
          icon: catIcon,
        });
      } else {
        await api.createCategory({
          name: catName.trim(),
          color: catColor,
          icon: catIcon,
        });
      }
      setModalOpen(false);
      fetchCats();
    } catch (err: any) {
      setCatError(err.message || (isUrdu ? "کیٹیگری محفوظ نہیں ہو سکی" : "Failed to save category"));
    } finally {
      setSavingCat(false);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    const confirmMsg = isUrdu 
      ? `کیا آپ واقعی کیٹیگری "${name}" کو حذف کرنا چاہتے ہیں؟`
      : `Are you sure you want to delete category "${name}"? Linked invoices will have their category cleared.`;
    if (!confirm(confirmMsg)) return;
    try {
      await api.deleteCategory(id);
      fetchCats();
    } catch (err: any) {
      alert((isUrdu ? "کیٹیگری حذف نہیں ہو سکی: " : "Failed to delete category: ") + err.message);
    }
  };

  return (
    <div className="app-layout-container flex min-h-screen bg-slate-50" dir="ltr">
      <Sidebar />
      <div className={`right-content-panel flex-1 flex flex-col min-w-0 ${isUrdu ? "font-urdu" : ""}`} dir="ltr">
        <Header title={t.settings.title} />

        <main className="flex-1 p-4 sm:p-8 max-w-5xl mx-auto w-full space-y-6">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{t.settings.title}</h1>
            <p className="text-xs text-slate-500">
              {t.settings.subtitle}
            </p>
          </div>

          {profileSaved && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{isUrdu ? "تبدیلیاں کامیابی سے محفوظ کر لی گئی ہیں۔" : "Profile preferences updated successfully."}</span>
            </div>
          )}

          {profileError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>{profileError}</span>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-100">
            {/* Language & Typography Preferences Card */}
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Languages className="w-4 h-4 text-indigo-600" />
                    <span>{t.settings.languageSection}</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t.settings.languageSub}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* English Option */}
                <div
                  onClick={() => setLanguage("en")}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    language === "en"
                      ? "border-indigo-600 bg-indigo-50/50 shadow-xs"
                      : "border-slate-200 bg-slate-50/50 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-900 text-sm">English</span>
                    {language === "en" && (
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
                        ✓
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 font-sans">
                    Default Left-to-Right (LTR) typography with clean system sans-serif font.
                  </p>
                </div>

                {/* Urdu Option with Jameel Noori Nastaleeq */}
                <div
                  onClick={() => setLanguage("ur")}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    language === "ur"
                      ? "border-indigo-600 bg-indigo-50/50 shadow-xs"
                      : "border-slate-200 bg-slate-50/50 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-900 text-base font-urdu">اردو (Urdu)</span>
                    {language === "ur" && (
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
                        ✓
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-700 font-urdu leading-relaxed">
                    مستند جمیل نوری نستعلیق (Jameel Noori Nastaleeq) فونٹ کے ساتھ دائیں سے بائیں (RTL) مکمل انٹرفیس۔
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Section */}
            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                <span>{t.settings.profileSection}</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">{t.settings.fullName}</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">{t.settings.emailAddress}</label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ""}
                    className="w-full text-xs bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-500 cursor-not-allowed font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">{t.settings.currency}</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="PKR">{isUrdu ? "روپے (PKR)" : "PKR (Rs. - Pakistani Rupee)"}</option>
                    <option value="USD">USD ($ - US Dollar)</option>
                    <option value="EUR">EUR (€ - Euro)</option>
                    <option value="GBP">GBP (£ - British Pound)</option>
                    <option value="AED">AED (AED - UAE Dirham)</option>
                    <option value="SAR">SAR (SAR - Saudi Riyal)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-all disabled:opacity-50 shadow-sm"
              >
                {savingProfile ? t.common.loading : t.settings.saveProfile}
              </button>
            </form>

            {/* Category Management Section */}
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Tag className="w-4 h-4 text-indigo-600" />
                    <span>{t.settings.categoriesSection}</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isUrdu ? "خودکار AI درجہ بندی اور مالیاتی رپورٹس کے لیے کیٹیگریز ترتیب دیں۔" : "Configure categories for automatic AI classification and financial aggregation."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-indigo-200 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t.settings.addCategory}</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-4">{isUrdu ? "رنگ" : "Color"}</th>
                      <th className="py-2.5 px-4">{isUrdu ? "کیٹیگری کا نام" : "Category Name"}</th>
                      <th className="py-2.5 px-4">{isUrdu ? "آئیکون" : "Icon Key"}</th>
                      <th className="py-2.5 px-4">{isUrdu ? "قسم" : "Type"}</th>
                      <th className="py-2.5 px-4 text-right">{t.common.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loadingCats ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400">
                          {t.common.loading}
                        </td>
                      </tr>
                    ) : categories.length > 0 ? (
                      categories.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-2.5 px-4">
                            <span
                              className="w-4 h-4 rounded-full inline-block shadow-xs border border-white"
                              style={{ backgroundColor: c.color }}
                            ></span>
                          </td>
                          <td className="py-2.5 px-4 font-bold text-slate-800">
                            {getLocalizedCategory(c.name, language)}
                            {isUrdu && getLocalizedCategory(c.name, language) !== c.name && (
                              <span className="block text-[10px] text-slate-400 font-mono font-normal">{c.name}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">
                            {c.icon || "tag"}
                          </td>
                          <td className="py-2.5 px-4">
                            {c.is_default ? (
                              <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-600 rounded">
                                {isUrdu ? "سسٹم ڈیفالٹ" : "System Default"}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-50 text-indigo-700 rounded border border-indigo-200">
                                {isUrdu ? "کسٹم" : "Custom"}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-right space-x-1">
                            <button
                              type="button"
                              onClick={() => openEditModal(c)}
                              className="p-1 text-slate-400 hover:text-indigo-600 transition-colors inline-block"
                              title={t.common.edit}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {!c.is_default && (
                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(c.id, c.name)}
                                className="p-1 text-slate-400 hover:text-rose-600 transition-colors inline-block"
                                title={t.common.delete}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400 italic">
                          {isUrdu ? "ابھی تک کوئی کیٹیگری نہیں ہے۔" : "No categories defined yet."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* AI Engine Status */}
            <div className="p-6 space-y-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>{t.settings.apiSection}</span>
              </h2>
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-semibold">{isUrdu ? "انجن پرووائیڈر:" : "Extraction Provider:"}</span>
                  <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    Multimodal Vision Engine (Gemini API + Local OCR Fallback)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-semibold">{isUrdu ? "ہینڈ رائٹنگ اور رسیدیں:" : "Handwriting & Receipts:"}</span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>{isUrdu ? "مکمل معاونت فعال ہے" : "Full Multimodal Support Active"}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-semibold">{isUrdu ? "جمیل نوری نستعلیق فونٹ:" : "Jameel Noori Font Status:"}</span>
                  <span className="text-emerald-700 font-bold font-mono">
                    Local WOFF2 Ready (9.8 MB)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Add / Edit Category Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingCatId ? (isUrdu ? "کیٹیگری میں ترمیم کریں" : "Edit Category") : (isUrdu ? "نئی کیٹیگری بنائیں" : "New Custom Category")}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-5 space-y-4">
              {catError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs">
                  {catError}
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isUrdu ? "کیٹیگری کا نام *" : "Category Name *"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isUrdu ? "مثلاً دفتری اخراجات، پیٹرول..." : "e.g. Office Supplies, Travel & Fuel"}
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isUrdu ? "رنگ کا انتخاب" : "Color Theme"}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {PALETTE.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCatColor(c)}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${
                        catColor === c ? "border-slate-900 scale-110 shadow-xs" : "border-white hover:scale-105"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isUrdu ? "آئیکون" : "Icon Identifier"}
                </label>
                <select
                  value={catIcon}
                  onChange={(e) => setCatIcon(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {ICONS.map((ic) => (
                    <option key={ic} value={ic}>
                      {ic}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={savingCat}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-1.5 rounded-lg transition-all disabled:opacity-50"
                >
                  {savingCat ? t.common.loading : editingCatId ? t.common.save : (isUrdu ? "کیٹیگری بنائیں" : "Create Category")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
