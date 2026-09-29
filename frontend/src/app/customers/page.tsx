"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Users, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  Receipt, 
  Edit3, 
  Eye, 
  X
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { api } from "@/lib/api";
import { Customer, CustomerDetail } from "@/types";
import { formatCurrency, formatDate, getLocalizedCustomer } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { t, language, isUrdu } = useLanguage();

  // Customer Detail Modal
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerDetail, setCustomerDetail] = useState<CustomerDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Edit Customer Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCust, setEditingCust] = useState<Customer | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchCustomers = () => {
    setLoading(true);
    api.getCustomers()
      .then(setCustomers)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const openDetail = async (id: string) => {
    setSelectedCustomerId(id);
    setLoadingDetail(true);
    try {
      const data = await api.getCustomer(id);
      setCustomerDetail(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const openEdit = (c: Customer) => {
    setEditingCust(c);
    setName(c.name);
    setPhone(c.phone || "");
    setEmail(c.email || "");
    setAddress(c.address || "");
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCust) return;
    setSaving(true);
    try {
      await api.updateCustomer(editingCust.id, {
        name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
      });
      setEditModalOpen(false);
      fetchCustomers();
    } catch (err: any) {
      alert((isUrdu ? "کسٹمر محفوظ کرنے میں خرابی: " : "Failed to update customer: ") + err.message);
    } finally {
      setSaving(false);
    }
  };

  const filtered = customers.filter((c) => {
    const urduName = getLocalizedCustomer(c.name, "ur");
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      urduName.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="app-layout-container flex min-h-screen bg-slate-50" dir="ltr">
      <Sidebar />
      <div className={`right-content-panel flex-1 flex flex-col min-w-0 ${isUrdu ? "font-urdu" : ""}`} dir="ltr">
        <Header title={t.customers.title} />

        <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{t.customers.title}</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {t.customers.subtitle}
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 left-3" />
            <input
              type="text"
              placeholder={t.customers.searchCustomers}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 pl-9 pr-4"
            />
          </div>

          {/* Customers Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">{t.customers.customerName}</th>
                    <th className="py-3 px-4">{t.customers.phone}</th>
                    <th className="py-3 px-4">{isUrdu ? "ای میل / پتہ" : "Email / Address"}</th>
                    <th className="py-3 px-4">{t.customers.totalBills}</th>
                    <th className="py-3 px-4 text-right">{isUrdu ? "کل خریداری" : "Total Purchases"}</th>
                    <th className="py-3 px-4">{isUrdu ? "آخری تاریخ" : "Last Activity"}</th>
                    <th className="py-3 px-4 text-right">{t.common.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        {t.common.loading}
                      </td>
                    </tr>
                  ) : filtered.length > 0 ? (
                    filtered.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-700 font-semibold flex items-center justify-center text-xs border border-indigo-200 shrink-0">
                            {isUrdu ? getLocalizedCustomer(c.name, language).charAt(0) : c.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="truncate text-slate-900 font-bold">{getLocalizedCustomer(c.name, language)}</span>
                            {isUrdu && getLocalizedCustomer(c.name, language) !== c.name && (
                              <span className="text-[10px] text-slate-400 font-mono font-normal truncate">{c.name}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-mono">
                          {c.phone || "—"}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 truncate max-w-xs">
                          {c.email || c.address || "—"}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            <Receipt className="w-3 h-3 text-slate-500" />
                            <span>{c.total_invoices} {isUrdu ? "بلز" : "bills"}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-900 font-mono">
                          {formatCurrency(c.total_spend, "PKR", language)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                          {c.last_purchase_date ? formatDate(c.last_purchase_date, language) : "—"}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                          <button
                            onClick={() => openDetail(c.id)}
                            className="p-1 text-slate-400 hover:text-indigo-600 transition-colors inline-block"
                            title={isUrdu ? "بلز کی تاریخ دیکھیں" : "View Invoices History"}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEdit(c)}
                            className="p-1 text-slate-400 hover:text-indigo-600 transition-colors inline-block"
                            title={isUrdu ? "کسٹمر میں ترمیم کریں" : "Edit Contact"}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-2">
                          <Users className="w-8 h-8 text-slate-300" />
                          <p className="text-xs font-semibold text-slate-600">{t.customers.noCustomersFound}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Customer Detail Drawer / Modal */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {customerDetail ? getLocalizedCustomer(customerDetail.name, language) : (isUrdu ? "کسٹمر پروفائل" : "Customer Profile")}
                </h3>
                {isUrdu && customerDetail?.name && getLocalizedCustomer(customerDetail.name, language) !== customerDetail.name && (
                  <span className="text-[11px] text-slate-400 font-mono block">{customerDetail.name}</span>
                )}
                <p className="text-xs text-slate-500 mt-0.5">{isUrdu ? "خریداری کی تاریخ اور منسلک بلز" : "Purchase History & Linked Invoices"}</p>
              </div>
              <button
                onClick={() => setSelectedCustomerId(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {loadingDetail ? (
                <div className="py-8 text-center text-slate-400 text-xs">{t.common.loading}</div>
              ) : customerDetail ? (
                <>
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="text-[11px] font-bold text-slate-500 uppercase block">{isUrdu ? "کل خریداری" : "Total Purchases"}</span>
                      <span className="text-sm font-bold text-slate-900 font-mono">
                        {formatCurrency(customerDetail.total_spend, "PKR", language)}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="text-[11px] font-bold text-slate-500 uppercase block">{isUrdu ? "کل بلز" : "Total Bills"}</span>
                      <span className="text-sm font-bold text-slate-900 font-mono">
                        {customerDetail.total_invoices}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="text-[11px] font-bold text-slate-500 uppercase block">{isUrdu ? "آخری خریداری" : "Last Purchase"}</span>
                      <span className="text-sm font-bold text-slate-900">
                        {customerDetail.last_purchase_date ? formatDate(customerDetail.last_purchase_date, language) : "—"}
                      </span>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-lg text-xs space-y-1 text-slate-700">
                    {customerDetail.phone && <p><strong>{t.customers.phone}:</strong> <span className="font-mono">{customerDetail.phone}</span></p>}
                    {customerDetail.email && <p><strong>{isUrdu ? "ای میل:" : "Email:"}</strong> {customerDetail.email}</p>}
                    {customerDetail.address && <p><strong>{t.customers.address}:</strong> {customerDetail.address}</p>}
                  </div>

                  {/* Bills list */}
                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">{isUrdu ? "منسلک بلز" : "Linked Invoices"}</h4>
                    {customerDetail.invoices && customerDetail.invoices.length > 0 ? (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {customerDetail.invoices.map((inv) => (
                          <div key={inv.id} className="p-2.5 rounded-lg border border-slate-200/80 bg-slate-50 flex items-center justify-between text-xs">
                            <div>
                              <span className="font-mono font-bold text-slate-900">{inv.invoice_number || "—"}</span>
                              <span className="text-slate-400 text-[11px] ml-2">{formatDate(inv.invoice_date, language)}</span>
                            </div>
                            <span className="font-bold text-slate-900 font-mono">
                              {formatCurrency(inv.total, inv.currency, language)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">{isUrdu ? "کوئی منسلک بل نہیں ملا۔" : "No invoices found for this customer."}</p>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {isUrdu 
                  ? (editingCust?.name ? `کسٹمر ترمیم: ${getLocalizedCustomer(editingCust.name, language)}` : "کسٹمر کی تفصیلات میں ترمیم") 
                  : "Edit Customer"}
              </h3>
              <button onClick={() => setEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-5 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">{t.customers.customerName}</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">{t.customers.phone}</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">{isUrdu ? "ای میل" : "Email"}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">{t.customers.address}</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900"
                />
              </div>
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-1.5 rounded-lg disabled:opacity-50"
                >
                  {saving ? t.common.loading : t.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
