"use client";

import Link from "next/link";
import { Plus, Search, Menu } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useSidebar } from "@/context/SidebarContext";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Header({ title }: { title?: string }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const { t, isUrdu } = useLanguage();
  const { toggle } = useSidebar();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/invoices?search=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 transition-all">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        {/* Mobile Hamburger Menu Toggle */}
        <button
          type="button"
          onClick={toggle}
          className="p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg md:hidden transition-colors shrink-0"
          aria-label="Toggle navigation drawer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {title && (
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate max-w-[160px] sm:max-w-xs md:max-w-md">
            {title}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Global Search Bar (Tablet / Desktop) */}
        <form onSubmit={handleSearchSubmit} className="relative w-48 lg:w-64 hidden sm:block">
          <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 left-3" />
          <input
            type="text"
            placeholder={t.header.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all pl-9 pr-3"
          />
        </form>

        {/* Currency tag (Hidden on very small mobile) */}
        <div className="hidden xs:flex px-2 py-1 bg-slate-100 border border-slate-200 rounded-md text-[11px] font-semibold text-slate-700 items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>{t.header.currencyTag}</span>
        </div>

        {/* Language Switcher */}
        <LanguageSwitcher variant="pill" />

        {/* Upload Bill CTA - Compact sleek button */}
        <Link
          href="/invoices/upload"
          className="header-upload-btn inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-xs transition-all shrink-0"
          style={{ 
            height: '2rem',
            paddingLeft: '0.65rem',
            paddingRight: '0.65rem',
            fontSize: isUrdu ? '0.80rem' : '0.75rem',
            lineHeight: '1.2'
          }}
        >
          <Plus className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">{t.header.uploadBill}</span>
          <span className="sm:hidden">{isUrdu ? "اپلوڈ" : "Upload"}</span>
        </Link>
      </div>
    </header>
  );
}
