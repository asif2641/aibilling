import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { SidebarProvider } from "@/context/SidebarContext";

export const metadata: Metadata = {
  title: "AI Bill Intelligence & Expense Platform",
  description: "Convert bills, invoices, and receipts into verified, structured, searchable financial data.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-slate-50 text-slate-900 min-h-screen antialiased transition-colors">
        <LanguageProvider>
          <SidebarProvider>
            {children}
          </SidebarProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
