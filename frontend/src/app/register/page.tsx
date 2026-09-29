"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, ArrowRight, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [currency, setCurrency] = useState("PKR");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { t, isUrdu } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await api.register({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password: password,
        currency: currency,
      });

      // Auto login
      const formData = new FormData();
      formData.append("username", email.trim().toLowerCase());
      formData.append("password", password);
      await api.login(formData);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || (isUrdu ? "رجسٹریشن میں ناکامی۔ معلومات دوبارہ چیک کریں۔" : "Registration failed. Please check your information."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative">
      {/* Top right language switcher */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher variant="pill" />
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-xl bg-indigo-600 items-center justify-center text-white shadow-md shadow-indigo-200 mb-2">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t.auth.registerTitle}</h1>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            {t.auth.signInSub}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">{t.auth.fullNameLabel}</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              placeholder={isUrdu ? "علی احمد" : "Ali Khan"}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">{t.auth.emailLabel}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
              placeholder={t.auth.emailPlaceholder}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">{t.auth.passwordLabel}</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              placeholder="••••••••••••"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">{t.settings.currency}</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="PKR">{isUrdu ? "روپے (PKR)" : "PKR (Rs. - Pakistani Rupee)"}</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-lg shadow-sm shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{isLoading ? t.common.loading : t.auth.registerButton}</span>
            <ArrowRight className={`w-3.5 h-3.5 ${isUrdu ? "rotate-180" : ""}`} />
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          {t.auth.hasAccount}{" "}
          <Link href="/login" className="text-indigo-600 font-bold hover:underline">
            {t.auth.signInButton}
          </Link>
        </p>
      </div>
    </div>
  );
}
