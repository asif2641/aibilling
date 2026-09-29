"use client";

import { useLanguage } from "@/context/LanguageContext";
import { Languages, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function LanguageSwitcher({ 
  variant = "pill" 
}: { 
  variant?: "pill" | "dropdown" | "buttons" 
}) {
  const { language, setLanguage, isUrdu } = useLanguage();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (variant === "buttons") {
    return (
      <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
        <button
          type="button"
          onClick={() => setLanguage("en")}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
            language === "en"
              ? "bg-white text-indigo-700 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          English
        </button>
        <button
          type="button"
          onClick={() => setLanguage("ur")}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all font-urdu ${
            language === "ur"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          اردو (Urdu)
        </button>
      </div>
    );
  }

  if (variant === "dropdown") {
    return (
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors"
          title="Switch Language / زبان تبدیل کریں"
        >
          <Languages className="w-3.5 h-3.5 text-indigo-600" />
          <span>{language === "ur" ? "اردو" : "English"}</span>
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50">
            <button
              type="button"
              onClick={() => {
                setLanguage("en");
                setDropdownOpen(false);
              }}
              className={`w-full px-3 py-2 text-left text-xs font-medium flex items-center justify-between hover:bg-slate-50 ${
                language === "en" ? "text-indigo-600 font-bold bg-indigo-50/50" : "text-slate-700"
              }`}
            >
              <span>English</span>
              {language === "en" && <Check className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => {
                setLanguage("ur");
                setDropdownOpen(false);
              }}
              className={`w-full px-3 py-2 text-right font-urdu text-xs font-medium flex items-center justify-between hover:bg-slate-50 ${
                language === "ur" ? "text-indigo-600 font-bold bg-indigo-50/50" : "text-slate-700"
              }`}
            >
              <span>اردو (Urdu)</span>
              {language === "ur" && <Check className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Default: interactive pill toggle
  return (
    <div className="inline-flex items-center p-0.5 bg-slate-100 border border-slate-200/80 rounded-lg shadow-2xs h-7 shrink-0">
      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={`px-2.5 h-6 flex items-center justify-center text-[11px] font-bold rounded-md transition-all ${
          language === "en"
            ? "bg-white text-indigo-700 shadow-xs"
            : "text-slate-500 hover:text-slate-800"
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage("ur")}
        className={`px-2.5 h-6 flex items-center justify-center text-[11px] font-bold rounded-md transition-all ${
          language === "ur"
            ? "bg-white text-indigo-700 shadow-xs"
            : "text-slate-500 hover:text-slate-800"
        }`}
        style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
      >
        اردو
      </button>
    </div>
  );
}
