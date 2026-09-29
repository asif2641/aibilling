const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

class ApiClient {
  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("bill_auth_token");
  }

  public setToken(token: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("bill_auth_token", token);
    }
  }

  public clearToken(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("bill_auth_token");
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    let res: Response;
    try {
      res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });
    } catch (netErr: any) {
      throw new Error(`Cannot connect to backend server at "${API_BASE}". Ensure the backend is running and NEXT_PUBLIC_API_URL is configured.`);
    }

    if (res.status === 401 && typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      this.clearToken();
      window.location.href = "/login";
    }

    if (!res.ok) {
      let errorMsg = `HTTP Error ${res.status}`;
      try {
        const errorJson = await res.json();
        errorMsg = errorJson.detail || errorMsg;
      } catch {}
      throw new Error(errorMsg);
    }

    if (res.status === 204) {
      return {} as T;
    }

    return res.json();
  }

  // Auth
  async login(formData: FormData): Promise<{ access_token: string; user: any }> {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        body: formData,
      });
    } catch (netErr: any) {
      throw new Error(`Cannot connect to backend server at "${API_BASE}". Please deploy your backend and set NEXT_PUBLIC_API_URL in Vercel.`);
    }
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Login failed");
    }
    const data = await res.json();
    this.setToken(data.access_token);
    return data;
  }

  async register(payload: any): Promise<any> {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getMe(): Promise<any> {
    return this.request("/auth/me");
  }

  async updateUser(payload: { full_name?: string; currency?: string }): Promise<any> {
    return this.request("/auth/me", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  logout(): void {
    this.clearToken();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }

  // Documents
  async uploadDocument(file: File): Promise<any> {
    const formData = new FormData();
    formData.append("file", file);
    return this.request("/documents/upload", {
      method: "POST",
      body: formData,
    });
  }

  async getDocumentStatus(id: string): Promise<any> {
    return this.request(`/documents/${id}/status`);
  }

  async getDocumentDetail(id: string): Promise<any> {
    return this.request(`/documents/${id}`);
  }

  async reprocessDocument(id: string): Promise<any> {
    return this.request(`/documents/${id}/reprocess`, { method: "POST" });
  }

  async listDocuments(params: Record<string, any> = {}): Promise<any> {
    const q = new URLSearchParams(params).toString();
    return this.request(`/documents?${q}`);
  }

  getDocumentFileUrl(id: string): string {
    const token = this.getToken();
    return `${API_BASE}/documents/${id}/file${token ? `?token=${encodeURIComponent(token)}` : ""}`;
  }

  // Invoices
  async approveInvoice(payload: any): Promise<any> {
    return this.request("/invoices/approve", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getInvoices(params: Record<string, any> = {}): Promise<any> {
    const cleanParams: Record<string, string> = {};
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") {
        cleanParams[k] = String(v);
      }
    }
    const q = new URLSearchParams(cleanParams).toString();
    return this.request(`/invoices?${q}`);
  }

  async getInvoice(id: string): Promise<any> {
    return this.request(`/invoices/${id}`);
  }

  async updateInvoice(id: string, payload: any): Promise<any> {
    return this.request(`/invoices/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  async deleteInvoice(id: string): Promise<void> {
    return this.request(`/invoices/${id}`, { method: "DELETE" });
  }

  // Vendors
  async getVendors(): Promise<any[]> {
    return this.request("/vendors");
  }

  async getVendor(id: string): Promise<any> {
    return this.request(`/vendors/${id}`);
  }

  async mergeVendors(primaryVendorId: string, duplicateVendorIds: string[]): Promise<any> {
    return this.request("/vendors/merge", {
      method: "POST",
      body: JSON.stringify({
        primary_vendor_id: primaryVendorId,
        duplicate_vendor_ids: duplicateVendorIds,
      }),
    });
  }

  // Categories
  async getCategories(): Promise<any[]> {
    return this.request("/categories");
  }

  async createCategory(payload: any): Promise<any> {
    return this.request("/categories", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateCategory(id: string, payload: any): Promise<any> {
    return this.request(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  async deleteCategory(id: string): Promise<void> {
    return this.request(`/categories/${id}`, { method: "DELETE" });
  }

  // Customers (PRD Section 24)
  async getCustomers(): Promise<any[]> {
    return this.request("/customers");
  }

  async getCustomer(id: string): Promise<any> {
    return this.request(`/customers/${id}`);
  }

  async updateCustomer(id: string, payload: any): Promise<any> {
    return this.request(`/customers/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  async deleteCustomer(id: string): Promise<void> {
    return this.request(`/customers/${id}`, { method: "DELETE" });
  }

  // Dashboard
  async getDashboardSummary(): Promise<any> {
    return this.request("/dashboard/summary");
  }

  // Reports
  async getReportSummary(type = "monthly", startDate?: string, endDate?: string, vendorId?: string): Promise<any> {
    let url = `/reports/summary?report_type=${type}`;
    if (startDate && endDate) {
      url += `&start_date=${startDate}&end_date=${endDate}`;
    }
    if (vendorId) {
      url += `&vendor_id=${vendorId}`;
    }
    return this.request(url);
  }

  getExportUrl(format: "csv" | "xlsx", params: Record<string, any> = {}): string {
    const cleanParams: Record<string, string> = { format };
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") {
        cleanParams[k] = String(v);
      }
    }
    const q = new URLSearchParams(cleanParams).toString();
    const token = this.getToken();
    return `${API_BASE}/reports/export?${q}&token=${token || ""}`;
  }
}

export const api = new ApiClient();
