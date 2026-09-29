"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  ReceiptText, 
  UploadCloud, 
  Building2, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut, 
  PenTool,
  Sparkles,
  X
} from "lucide-react";
import { api } from "@/lib/api";
import { useEffect, useState } from "react";
import { User } from "@/types";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useSidebar } from "@/context/SidebarContext";

export function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const { isOpen, close } = useSidebar();

  useEffect(() => {
    api.getMe().then(setUser).catch(() => {});
  }, []);

  // Sidebar always stays in English per explicit requirement
  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Invoices & Bills", href: "/invoices", icon: ReceiptText },
    { label: "Upload Bill", href: "/invoices/upload", icon: UploadCloud, highlight: true },
    { label: "Add Manual Bill", href: "/invoices/new", icon: PenTool },
    { label: "Vendors", href: "/vendors", icon: Building2 },
    { label: "Customers", href: "/customers", icon: Users },
    { label: "Reports & Analytics", href: "/reports", icon: BarChart3 },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  const renderContent = (isMobile = false) => (
    <>
      {/* Brand header - Always English */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-slate-900 tracking-tight text-base leading-snug whitespace-nowrap">
              Bill Intelligence
            </span>
            <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wide leading-tight whitespace-nowrap">
              AI Expense Engine
            </span>
          </div>
        </div>

        {isMobile && (
          <button
            onClick={close}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors md:hidden"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation - Always English */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Menu
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                if (isMobile) close();
              }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-indigo-50 text-indigo-700 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              } ${item.highlight && !isActive ? "text-indigo-600 font-semibold" : ""}`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
              <span className="truncate">{item.label}</span>
              {item.highlight && (
                <span className="ml-auto text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold">
                  New
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Language Quick Switcher in Sidebar footer */}
      <div className="px-4 py-2 border-t border-slate-100 flex items-center justify-between shrink-0">
        <span className="text-xs text-slate-500 font-medium">Language:</span>
        <LanguageSwitcher variant="pill" />
      </div>

      {/* User profile & Logout - Always English */}
      <div className="p-4 border-t border-slate-100 shrink-0">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 border border-slate-200/60 mb-2">
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-semibold flex items-center justify-center text-xs shrink-0">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-900 truncate">
              {user?.full_name || "User Account"}
            </p>
            <p className="text-[11px] text-slate-500 truncate">{user?.email || "user@example.com"}</p>
          </div>
        </div>
        <button
          onClick={() => api.logout()}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside 
        dir="ltr"
        className="sidebar-english sidebar-desktop w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 select-none z-30 shrink-0 font-sans"
        style={{ 
          width: '260px', 
          minWidth: '260px', 
          maxWidth: '260px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' 
        }}
      >
        {renderContent(false)}
      </aside>

      {/* Mobile Drawer Backdrop */}
      <div 
        className={`fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={close}
        aria-hidden="true"
      />

      {/* Mobile Drawer Panel - Always anchored rigidly to the LEFT in English */}
      <aside
        dir="ltr"
        className={`sidebar-english fixed top-0 bottom-0 left-0 z-50 w-72 max-w-[85vw] bg-white border-r border-slate-200 flex flex-col md:hidden transition-transform duration-300 ease-in-out shadow-2xl select-none font-sans ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ 
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' 
        }}
      >
        {renderContent(true)}
      </aside>
    </>
  );
}
