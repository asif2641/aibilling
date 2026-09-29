"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Language, Translations, translations } from "@/lib/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: Translations;
  isUrdu: boolean;
  dir: "ltr" | "rtl";
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Read from localStorage on mount
    const saved = localStorage.getItem("preferred_language") as Language;
    if (saved && (saved === "en" || saved === "ur")) {
      setLanguageState(saved);
      applyLanguage(saved);
    } else {
      applyLanguage("en");
    }
    setIsInitialized(true);
  }, []);

  const applyLanguage = (lang: Language) => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
      // Root HTML direction stays LTR so Sidebar always stays anchored on the left
      document.documentElement.dir = "ltr";
      document.body.setAttribute("data-lang", lang);
    }
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("preferred_language", lang);
    applyLanguage(lang);
  };

  const toggleLanguage = () => {
    const next = language === "en" ? "ur" : "en";
    setLanguage(next);
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    toggleLanguage,
    t: translations[language] || translations.en,
    isUrdu: language === "ur",
    dir: "ltr",
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
