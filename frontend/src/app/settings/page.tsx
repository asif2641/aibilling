"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { api } from "@/lib/api";
import { User, Category, StaffMember } from "@/types";
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
  Languages,
  ShieldCheck,
  UserPlus,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Edit3,
  Loader2,
  Search,
  CheckCircle2,
  Users
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

  // AI Settings State
  const [aiProvider, setAiProvider] = useState("mock");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [geminiKeyConfigured, setGeminiKeyConfigured] = useState(false);
  const [geminiKeyMasked, setGeminiKeyMasked] = useState("");
  const [geminiModel, setGeminiModel] = useState("gemini-1.5-flash");
  const [showApiKey, setShowApiKey] = useState(false);
  const [savingAI, setSavingAI] = useState(false);
  const [aiSaved, setAiSaved] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Tab switcher in Settings: "general" vs "staff"
  const [activeTab, setActiveTab] = useState<"general" | "staff">("general");

  // Language Context
  const { language, setLanguage, t, isUrdu } = useLanguage();

  // Categories State
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catName, setCatName] = useState("");
  const [catColor, setCatColor] = useState(PALETTE[0]);
  const [catIcon, setCatIcon] = useState("tag");
  const [savingCat, setSavingCat] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);

  // Staff Management State (Super Admin)
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [staffSearch, setStaffSearch] = useState("");
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Staff Modals
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [isEditStaffModalOpen, setIsEditStaffModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [submittingStaff, setSubmittingStaff] = useState(false);

  const [addStaffForm, setAddStaffForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "staff",
  });

  const [editStaffForm, setEditStaffForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "staff",
    is_active: true,
  });

  const isSuperAdmin = user?.role === "super_admin" || user?.is_superuser || user?.email === "asif2641@gmail.com";

  const fetchCats = () => {
    setLoadingCats(true);
    api.getCategories()
      .then(setCategories)
      .catch(console.error)
      .finally(() => setLoadingCats(false));
  };

  const fetchStaff = () => {
    setLoadingStaff(true);
    setStaffError(null);
    api.getStaffUsers()
      .then(setStaffList)
      .catch((err) => setStaffError(err.message || "Failed to load staff accounts"))
      .finally(() => setLoadingStaff(false));
  };

  useEffect(() => {
    api.getMe()
      .then((u) => {
        setUser(u);
        setFullName(u.full_name || "");
        setCurrency(u.currency || "PKR");
        if (u.role === "super_admin" || u.is_superuser || u.email === "asif2641@gmail.com") {
          fetchStaff();
        }
      })
      .catch(() => {});
    fetchCats();
    api.getAISettings()
      .then((res) => {
        setAiProvider(res.ai_provider);
        setGeminiKeyConfigured(res.gemini_api_key_configured);
        setGeminiKeyMasked(res.gemini_api_key_masked);
        setGeminiModel(res.gemini_model || "gemini-1.5-flash");
      })
      .catch(() => {});

    // Check query param e.g. /settings?tab=staff
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("tab") === "staff") {
        setActiveTab("staff");
      }
    }
  }, []);

  // -------------------------------------------------------------
  // AI Settings Handlers
  // -------------------------------------------------------------
  const handleSaveAISettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAI(true);
    setAiSaved(false);
    setAiError(null);
    try {
      const payload: any = {
        ai_provider: aiProvider,
        gemini_model: geminiModel,
      };
      if (geminiApiKey.trim()) {
        payload.gemini_api_key = geminiApiKey.trim();
      }
      const updated = await api.updateAISettings(payload);
      setAiProvider(updated.ai_provider);
      setGeminiKeyConfigured(updated.gemini_api_key_configured);
      setGeminiKeyMasked(updated.gemini_api_key_masked);
      setGeminiModel(updated.gemini_model);
      setGeminiApiKey("");
      setAiSaved(true);
      setTimeout(() => setAiSaved(false), 4000);
    } catch (err: any) {
      setAiError(err.message || (isUrdu ? "AI ترتیبات محفوظ کرنے میں خرابی" : "Failed to save AI settings"));
    } finally {
      setSavingAI(false);
    }
  };

  // -------------------------------------------------------------
  // Profile Handlers
  // -------------------------------------------------------------
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

  // -------------------------------------------------------------
  // Category Handlers
  // -------------------------------------------------------------
  const openCreateCatModal = () => {
    setEditingCatId(null);
    setCatName("");
    setCatColor(PALETTE[Math.floor(Math.random() * PALETTE.length)]);
    setCatIcon("tag");
    setCatError(null);
    setModalOpen(true);
  };

  const openEditCatModal = (cat: Category) => {
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

  // -------------------------------------------------------------
  // Staff Credentials Handlers (Super Admin)
  // -------------------------------------------------------------
  const togglePasswordVisibility = (id: string) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const copyToClipboard = (text: string, id: string) => {
    if (!text || text === "••••••••") return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenAddStaffModal = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setAddStaffForm({
      full_name: "",
      email: "",
      password: `staff${randomSuffix}#`,
      role: "staff",
    });
    setIsAddStaffModalOpen(true);
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addStaffForm.email || !addStaffForm.password) return;

    setSubmittingStaff(true);
    try {
      await api.createStaffUser(addStaffForm);
      setIsAddStaffModalOpen(false);
      fetchStaff();
    } catch (err: any) {
      alert((isUrdu ? "اسٹاف اکاؤنٹ بنانے میں خرابی: " : "Error creating staff: ") + err.message);
    } finally {
      setSubmittingStaff(false);
    }
  };

  const handleOpenEditStaffModal = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setEditStaffForm({
      full_name: staff.full_name || "",
      email: staff.email,
      password: staff.password_display || "",
      role: staff.role || "staff",
      is_active: staff.is_active,
    });
    setIsEditStaffModalOpen(true);
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;

    setSubmittingStaff(true);
    try {
      const payload: any = {
        full_name: editStaffForm.full_name,
        email: editStaffForm.email,
        role: editStaffForm.role,
        is_active: editStaffForm.is_active,
      };
      if (editStaffForm.password && editStaffForm.password.trim() !== "") {
        payload.password = editStaffForm.password.trim();
      }

      await api.updateStaffUser(selectedStaff.id, payload);
      setIsEditStaffModalOpen(false);
      setSelectedStaff(null);
      fetchStaff();
    } catch (err: any) {
      alert((isUrdu ? "اکاؤنٹ اپڈیٹ کرنے میں خرابی: " : "Error updating staff: ") + err.message);
    } finally {
      setSubmittingStaff(false);
    }
  };

  const handleDeleteStaff = async (staff: StaffMember) => {
    const confirmMsg = isUrdu 
      ? `کیا آپ واقعی ${staff.email} کو حذف کرنا چاہتے ہیں؟` 
      : `Are you sure you want to delete staff account ${staff.email}?`;
    if (!confirm(confirmMsg)) return;

    try {
      await api.deleteStaffUser(staff.id);
      fetchStaff();
    } catch (err: any) {
      alert((isUrdu ? "اکاؤنٹ حذف کرنے میں خرابی: " : "Error deleting staff: ") + err.message);
    }
  };

  const filteredStaff = staffList.filter((s) => {
    const q = staffSearch.toLowerCase();
    return (
      s.email.toLowerCase().includes(q) ||
      (s.full_name && s.full_name.toLowerCase().includes(q)) ||
      s.role.toLowerCase().includes(q)
    );
  });

  return (
    <div className="app-layout-container flex min-h-screen bg-slate-50" dir="ltr">
      <Sidebar />
      <div className={`right-content-panel flex-1 flex flex-col min-w-0 ${isUrdu ? "font-urdu" : ""}`} dir="ltr">
        <Header title={t.settings.title} />

        <main className="flex-1 p-4 sm:p-8 max-w-5xl mx-auto w-full space-y-6">
          {/* Header Title */}
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{t.settings.title}</h1>
            <p className="text-xs text-slate-500">
              {t.settings.subtitle}
            </p>
          </div>

          {/* Tab Switcher (Visible to Super Admin) */}
          {isSuperAdmin && (
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab("general")}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === "general"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>{isUrdu ? "عام ترتیبات اور کیٹیگریز" : "General & Categories"}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("staff")}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === "staff"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isUrdu ? "اسٹاف اور یوزرز کا انتظام" : "Staff & User Credentials"}</span>
                <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded font-black">
                  Admin
                </span>
              </button>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB 1: GENERAL SETTINGS (Language, Profile, Categories)      */}
          {/* ------------------------------------------------------------- */}
          {activeTab === "general" && (
            <div className="space-y-6">
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

                {/* AI OCR & Vision Engine Configuration Card */}
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>{isUrdu ? "AI وژن اور اسکینر انجن (AI Vision Engine)" : "AI Vision & OCR Engine"}</span>
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {isUrdu 
                          ? "اردو رسیدوں، بلوں اور ہاتھ سے لکھے گئے کھاتوں کو خودکار درست پڑھنے کے لیے AI انجن منتخب کریں۔" 
                          : "Configure Google Gemini Multimodal Vision or Offline Engine for real-time bill and receipt extraction."}
                      </p>
                    </div>
                  </div>

                  {aiSaved && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>{isUrdu ? "AI ترتیبات کامیابی سے محفوظ ہو گئیں۔" : "AI engine settings saved successfully."}</span>
                    </div>
                  )}

                  {aiError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      <span>{aiError}</span>
                    </div>
                  )}

                  <form onSubmit={handleSaveAISettings} className="space-y-4 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Option 1: Mock / Offline Engine */}
                      <div
                        onClick={() => setAiProvider("mock")}
                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                          aiProvider === "mock"
                            ? "border-indigo-600 bg-indigo-50/50 shadow-xs"
                            : "border-slate-200 bg-slate-50/50 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-slate-900 text-sm">
                            {isUrdu ? "لوکل / آف لائن انجن" : "Offline Smart Engine"}
                          </span>
                          {aiProvider === "mock" && (
                            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                              ✓
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600">
                          {isUrdu
                            ? "بغیر انٹرنیٹ اور بغیر کسی API کلید کے معیاری رسیدوں کے لیے لوکل OCR استعمال کرتا ہے۔"
                            : "Uses local deterministic OCR and sample templates without requiring any external API key."}
                        </p>
                      </div>

                      {/* Option 2: Google Gemini Multimodal Vision */}
                      <div
                        onClick={() => setAiProvider("gemini")}
                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                          aiProvider === "gemini"
                            ? "border-amber-500 bg-amber-50/40 shadow-xs"
                            : "border-slate-200 bg-slate-50/50 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span>Google Gemini Vision AI</span>
                          </span>
                          {aiProvider === "gemini" && (
                            <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold">
                              ✓
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600">
                          {isUrdu
                            ? "اردو خط نستعلیق اور ہاتھ سے لکھی گئی پرچیوں کو 100% درست پڑھنے کے لیے جدید ترین AI ماڈل۔"
                            : "Next-gen multimodal vision for reading handwritten Urdu slips, grocery bills, and complex receipts."}
                        </p>
                      </div>
                    </div>

                    {/* Gemini API Key & Model Inputs */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                          <span>Google Gemini API Key</span>
                          {geminiKeyConfigured && (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded ml-1">
                              {isUrdu ? "فعال" : "Configured"} ({geminiKeyMasked})
                            </span>
                          )}
                        </label>
                        <a
                          href="https://aistudio.google.com/app/apikey"
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-bold text-indigo-600 hover:underline"
                        >
                          {isUrdu ? "مفت کلید حاصل کریں ↗" : "Get Free API Key ↗"}
                        </a>
                      </div>

                      <div className="relative">
                        <input
                          type={showApiKey ? "text" : "password"}
                          value={geminiApiKey}
                          onChange={(e) => setGeminiApiKey(e.target.value)}
                          placeholder={geminiKeyConfigured ? `${isUrdu ? "تبدیل کرنے کے لیے نئی کلید لکھیں..." : "Enter new API key to replace..."}` : "AIzaSy..."}
                          className="w-full text-xs px-3 py-2 pr-10 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                        >
                          {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-48">
                          <label className="text-[10px] font-bold text-slate-500 block mb-1">
                            {isUrdu ? "ماڈل" : "Vision Model"}
                          </label>
                          <select
                            value={geminiModel}
                            onChange={(e) => setGeminiModel(e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                          >
                            <option value="gemini-1.5-flash">gemini-1.5-flash (Fast & Accurate)</option>
                            <option value="gemini-1.5-pro">gemini-1.5-pro (High Reasoning)</option>
                          </select>
                        </div>

                        <div className="flex-1 text-[11px] text-slate-500 pt-3">
                          {isUrdu
                            ? "کلید کو فوری محفوظ کریں، بل اپلوڈ کرنے پر خودکار استعمال ہوگی۔"
                            : "Free tier from Google AI Studio works instantly for unlimited live receipt extractions."}
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={savingAI}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-all disabled:opacity-50 shadow-sm flex items-center gap-1.5"
                    >
                      {savingAI ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      <span>{savingAI ? t.common.loading : (isUrdu ? "AI ترتیبات محفوظ کریں" : "Save AI Engine Settings")}</span>
                    </button>
                  </form>
                </div>

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
                      onClick={openCreateCatModal}
                      className="inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-indigo-200 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t.settings.addCategory}</span>
                    </button>
                  </div>

                  {loadingCats ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      {t.common.loading}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {categories.map((cat) => (
                        <div
                          key={cat.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition-all bg-white"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className="w-3.5 h-3.5 rounded-full shrink-0"
                              style={{ backgroundColor: cat.color }}
                            />
                            <span className="text-xs font-semibold text-slate-800 truncate">
                              {getLocalizedCategory(cat.name, language)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => openEditCatModal(cat)}
                              className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                              title={t.common.edit}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(cat.id, cat.name)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                              title={t.common.delete}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB 2: STAFF & USER MANAGEMENT (سپر ایڈمن - اسٹاف کی تفصیلات)  */}
          {/* ------------------------------------------------------------- */}
          {activeTab === "staff" && isSuperAdmin && (
            <div className="space-y-6">
              {/* Header Box & Create Staff Button */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-600 text-white shadow-sm shadow-purple-200 shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      {isUrdu ? "اسٹاف اور یوزرز کی تفصیلات (سپر ایڈمن کنٹرول)" : "Staff Credentials & Access Control"}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {isUrdu 
                        ? "اسٹاف ممبرز کے پاسورڈ دیکھیں، نئے پاسورڈ تفویض کریں یا ترمیم کریں۔"
                        : "Create credentials for staff, reveal plaintext passwords, and manage permissions."}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddStaffModal}
                  className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-purple-200 transition-all shrink-0 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isUrdu ? "+ نیا اسٹاف شامل کریں" : "+ Add New Staff Member"}</span>
                </button>
              </div>

              {/* Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">{isUrdu ? "کل اکاؤنٹس" : "Total Accounts"}</p>
                    <p className="text-lg font-bold text-slate-900">{staffList.length}</p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">{isUrdu ? "فعال اسٹاف" : "Active Staff"}</p>
                    <p className="text-lg font-bold text-slate-900">{staffList.filter((s) => s.is_active).length}</p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">{isUrdu ? "سپر ایڈمن" : "Super Admins"}</p>
                    <p className="text-lg font-bold text-slate-900">{staffList.filter((s) => s.role === "super_admin" || s.is_superuser).length}</p>
                  </div>
                </div>
              </div>

              {/* Search Bar */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-3 shadow-2xs">
                <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
                <input
                  type="text"
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  placeholder={isUrdu ? "نام، ای میل یا رول سے تلاش کریں..." : "Search staff by name, email, or role..."}
                  className="w-full text-xs bg-transparent focus:outline-hidden text-slate-900 placeholder:text-slate-400"
                />
                {staffSearch && (
                  <button onClick={() => setStaffSearch("")} className="text-xs text-slate-400 hover:text-slate-600 px-1">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Error Banner */}
              {staffError && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{staffError}</span>
                </div>
              )}

              {/* Staff Credentials Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                {loadingStaff ? (
                  <div className="p-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                    <span className="text-xs">{isUrdu ? "اسٹاف کی فہرست لوڈ ہو رہی ہے..." : "Loading staff credentials..."}</span>
                  </div>
                ) : filteredStaff.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-xs">
                    {isUrdu ? "کوئی اسٹاف اکاؤنٹ نہیں ملا۔" : "No staff accounts found."}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          <th className="py-3 px-4">{isUrdu ? "اسٹاف کا نام" : "Staff Member"}</th>
                          <th className="py-3 px-4">{isUrdu ? "ای میل / یوزر نیم" : "Username / Email"}</th>
                          <th className="py-3 px-4">{isUrdu ? "پاسورڈ (دیکھیں / کاپی کریں)" : "Password (View & Copy)"}</th>
                          <th className="py-3 px-4">{isUrdu ? "رول" : "Role"}</th>
                          <th className="py-3 px-4">{isUrdu ? "حالت" : "Status"}</th>
                          <th className="py-3 px-4 text-right">{isUrdu ? "ایکشن" : "Actions"}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {filteredStaff.map((staff) => {
                          const isRevealed = !!revealedPasswords[staff.id];
                          const displayPassword = staff.password_display || "••••••••";
                          const isSelf = user?.id === staff.id;
                          const isSuper = staff.role === "super_admin" || staff.is_superuser;

                          return (
                            <tr key={staff.id} className="hover:bg-slate-50/70 transition-colors">
                              {/* Name & Avatar */}
                              <td className="py-3.5 px-4 font-semibold text-slate-900">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs shrink-0">
                                    {staff.full_name ? staff.full_name.charAt(0).toUpperCase() : staff.email.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="truncate font-bold text-slate-900">
                                      {staff.full_name || (isUrdu ? "نام درج نہیں" : "No Name")}
                                    </p>
                                    {isSelf && (
                                      <span className="text-[10px] text-purple-600 font-bold block">
                                        {isUrdu ? "(آپ کا اکاؤنٹ)" : "(You)"}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Username / Email */}
                              <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                                {staff.email}
                              </td>

                              {/* Password with Reveal & Copy */}
                              <td className="py-3.5 px-4">
                                <div className="inline-flex items-center gap-2 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                                  <KeyRound className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span className="font-mono text-[11px] font-semibold text-slate-800 tracking-wide select-all min-w-[70px]">
                                    {isRevealed ? displayPassword : "••••••••"}
                                  </span>

                                  {/* Toggle visibility */}
                                  <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility(staff.id)}
                                    title={isRevealed ? "Hide Password" : "Show Password"}
                                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors"
                                  >
                                    {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>

                                  {/* Copy Password */}
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(displayPassword, staff.id)}
                                    title="Copy Password"
                                    className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                  >
                                    {copiedId === staff.id ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              </td>

                              {/* Role */}
                              <td className="py-3.5 px-4">
                                {isSuper ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-full">
                                    <ShieldCheck className="w-3 h-3" />
                                    <span>Super Admin</span>
                                  </span>
                                ) : staff.role === "accountant" ? (
                                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                                    Accountant
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full">
                                    Staff Member
                                  </span>
                                )}
                              </td>

                              {/* Status */}
                              <td className="py-3.5 px-4">
                                {staff.is_active ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    {isUrdu ? "فعال" : "Active"}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                    {isUrdu ? "غیر فعال" : "Inactive"}
                                  </span>
                                )}
                              </td>

                              {/* Actions */}
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleOpenEditStaffModal(staff)}
                                    title={isUrdu ? "ترمیم کریں" : "Edit Credentials"}
                                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>

                                  {!isSelf && (
                                    <button
                                      onClick={() => handleDeleteStaff(staff)}
                                      title={isUrdu ? "حذف کریں" : "Delete Account"}
                                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD / EDIT CATEGORY                                    */}
      {/* ------------------------------------------------------------- */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Palette className="w-4 h-4 text-indigo-600" />
                <span>{editingCatId ? (isUrdu ? "کیٹیگری میں ترمیم" : "Edit Category") : (isUrdu ? "نئی کیٹیگری" : "New Category")}</span>
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {catError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{catError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCategory} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isUrdu ? "کیٹیگری کا نام" : "Category Name"}
                </label>
                <input
                  type="text"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. Software Subscriptions"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isUrdu ? "رنگ" : "Color"}
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
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

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD NEW STAFF MEMBER                                  */}
      {/* ------------------------------------------------------------- */}
      {isAddStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {isUrdu ? "نیا اسٹاف اکاؤنٹ بنائیں" : "Create New Staff Account"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isUrdu ? "اسٹاف کے لیے لاگ اِن کی تفصیلات درج کریں" : "Assign email and password for staff access"}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsAddStaffModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isUrdu ? "اسٹاف کا پورا نام" : "Full Name"}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tariq Khan"
                  value={addStaffForm.full_name}
                  onChange={(e) => setAddStaffForm({ ...addStaffForm, full_name: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isUrdu ? "ای میل / یوزر نیم" : "Email / Username"}
                </label>
                <input
                  type="email"
                  required
                  placeholder="staff@billintel.com"
                  value={addStaffForm.email}
                  onChange={(e) => setAddStaffForm({ ...addStaffForm, email: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-purple-600 focus:ring-1 focus:ring-purple-600 font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    {isUrdu ? "پاسورڈ" : "Password"}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const num = Math.floor(1000 + Math.random() * 9000);
                      setAddStaffForm({ ...addStaffForm, password: `staff${num}#` });
                    }}
                    className="text-[10px] text-purple-600 hover:underline font-bold"
                  >
                    {isUrdu ? "نیا پاسورڈ بنائیں" : "Generate Password"}
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={addStaffForm.password}
                  onChange={(e) => setAddStaffForm({ ...addStaffForm, password: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-purple-600 focus:ring-1 focus:ring-purple-600 font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  {isUrdu ? "یہ پاسورڈ سپر ایڈمن کسی بھی وقت بعد میں دیکھ اور تبدیل کر سکتا ہے۔" : "You can always view and change this password anytime."}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isUrdu ? "رول منتخب کریں" : "Role"}
                </label>
                <select
                  value={addStaffForm.role}
                  onChange={(e) => setAddStaffForm({ ...addStaffForm, role: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-purple-600 bg-white"
                >
                  <option value="staff">{isUrdu ? "اسٹاف ممبر (Staff Member)" : "Staff Member"}</option>
                  <option value="accountant">{isUrdu ? "اکاؤنٹنٹ (Accountant)" : "Accountant"}</option>
                  <option value="super_admin">{isUrdu ? "سپر ایڈمن (Super Admin)" : "Super Admin"}</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddStaffModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  {isUrdu ? "منسوخ کریں" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={submittingStaff}
                  className="px-4 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-sm shadow-purple-200 transition-all flex items-center gap-1.5"
                >
                  {submittingStaff && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isUrdu ? "محفوظ کریں" : "Create Account"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: EDIT STAFF CREDENTIALS                                 */}
      {/* ------------------------------------------------------------- */}
      {isEditStaffModalOpen && selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {isUrdu ? "اسٹاف اکاؤنٹ میں ترمیم" : "Edit Staff Credentials"}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {selectedStaff.email}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsEditStaffModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isUrdu ? "پورا نام" : "Full Name"}
                </label>
                <input
                  type="text"
                  value={editStaffForm.full_name}
                  onChange={(e) => setEditStaffForm({ ...editStaffForm, full_name: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isUrdu ? "ای میل / یوزر نیم" : "Email / Username"}
                </label>
                <input
                  type="email"
                  required
                  value={editStaffForm.email}
                  onChange={(e) => setEditStaffForm({ ...editStaffForm, email: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-purple-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isUrdu ? "پاسورڈ تبدیل کریں (یا پرانا رہنے دیں)" : "Change Password (or update)"}
                </label>
                <input
                  type="text"
                  placeholder="Enter new password"
                  value={editStaffForm.password}
                  onChange={(e) => setEditStaffForm({ ...editStaffForm, password: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-purple-600 font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  {isUrdu ? "یہاں نیا پاسورڈ درج کرنے سے پاسورڈ تبدیل ہو جائے گا۔" : "Enter a new password to reset it directly."}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isUrdu ? "رول" : "Role"}
                </label>
                <select
                  value={editStaffForm.role}
                  onChange={(e) => setEditStaffForm({ ...editStaffForm, role: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-purple-600 bg-white"
                >
                  <option value="staff">{isUrdu ? "اسٹاف ممبر (Staff Member)" : "Staff Member"}</option>
                  <option value="accountant">{isUrdu ? "اکاؤنٹنٹ (Accountant)" : "Accountant"}</option>
                  <option value="super_admin">{isUrdu ? "سپر ایڈمن (Super Admin)" : "Super Admin"}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isUrdu ? "اکاؤنٹ کی حالت" : "Account Status"}
                </label>
                <select
                  value={editStaffForm.is_active ? "active" : "inactive"}
                  onChange={(e) => setEditStaffForm({ ...editStaffForm, is_active: e.target.value === "active" })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-purple-600 bg-white"
                >
                  <option value="active">{isUrdu ? "فعال (Active)" : "Active"}</option>
                  <option value="inactive">{isUrdu ? "غیر فعال (Inactive / Disabled)" : "Inactive / Disabled"}</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditStaffModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  {isUrdu ? "منسوخ کریں" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={submittingStaff}
                  className="px-4 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-sm shadow-purple-200 transition-all flex items-center gap-1.5"
                >
                  {submittingStaff && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isUrdu ? "تبدیلیاں محفوظ کریں" : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
