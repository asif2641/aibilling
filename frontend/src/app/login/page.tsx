"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { t, isUrdu } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("username", email.trim().toLowerCase());
      formData.append("password", password);
      await api.login(formData);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || (isUrdu ? "لاگ ان میں ناکامی۔ برائے مہربانی اپنا ای میل اور پاس ورڈ چیک کریں۔" : "Failed to sign in. Please verify your credentials."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    setError(null);
    const demoEmail = "demo@billintel.com";
    const demoPass = "Demo12345!";

    try {
      try {
        await api.register({
          email: demoEmail,
          password: demoPass,
          full_name: "Demo Account",
          currency: "PKR",
        });
      } catch {}

      const formData = new FormData();
      formData.append("username", demoEmail);
      formData.append("password", demoPass);
      await api.login(formData);
      router.push("/dashboard");
    } catch (err: any) {
      setError((isUrdu ? "ڈیمو سیشن شروع نہیں ہو سکا: " : "Unable to launch demo session: ") + err.message);
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
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-xl bg-indigo-600 items-center justify-center text-white shadow-md shadow-indigo-200 mb-2">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t.brand.name}</h1>
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              placeholder="••••••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-lg shadow-sm shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{isLoading ? t.common.loading : t.auth.signInButton}</span>
            <ArrowRight className={`w-3.5 h-3.5 ${isUrdu ? "rotate-180" : ""}`} />
          </button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-[11px] uppercase">
            <span className="bg-white px-2 text-slate-400 font-bold">{t.common.or}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={isLoading}
          className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs py-2.5 rounded-lg transition-all flex items-center justify-center gap-2"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>{t.auth.demoButton}</span>
        </button>

        <p className="text-center text-xs text-slate-500">
          {t.auth.noAccount}{" "}
          <Link href="/register" className="text-indigo-600 font-bold hover:underline">
            {t.auth.createOne}
          </Link>
        </p>
      </div>
    </div>
  );
}
