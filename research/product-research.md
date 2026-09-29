# AI Bill Intelligence Platform — Product Research & Requirements Analysis

## 1. Executive Summary

The **AI Bill Intelligence Platform** is a specialized SaaS application engineered to transform raw, unstructured bills, invoices, receipts, and financial documents (images and PDFs) into validated, structured, auditable, and searchable financial data.

Unlike conventional fixed-template OCR software, the platform utilizes semantic multimodal document intelligence combined with a deterministic financial validation engine and a human-in-the-loop verification workspace. The core product doctrine is:

$$\text{UPLOAD} \longrightarrow \text{UNDERSTAND} \longrightarrow \text{EXTRACT} \longrightarrow \text{VALIDATE} \longrightarrow \text{VERIFY} \longrightarrow \text{STORE} \longrightarrow \text{SEARCH} \longrightarrow \text{ANALYZE}$$

The platform guarantees data integrity through a non-negotiable rule: **Zero Invention / Zero Hallucination**. If a data point (phone number, customer name, tax ID) is absent from the original document, it remains `null` / unknown.

---

## 2. Target Market & User Personas

### 2.1 Primary Market: Pakistan (with Global Architecture)
- **Currency Support:** Primary currency PKR ($\text{Rs.}$), with multi-currency architecture (USD, EUR, GBP, AED, SAR).
- **Taxation Identifiers:** Full support for Pakistan Revenue Automation (FBR) identifiers:
  - **NTN** (National Tax Number): 7 digits + 1 check digit (e.g., `1234567-8`)
  - **STRN** (Sales Tax Registration Number): 13 digits
  - **GST / Provincial Sales Tax** (SRB, PRA, KPRA, BRA): 15%–18% standard rates
- **Invoice Idioms:** Thermal paper receipts (restaurants, grocery stores, pharmacies), computer-generated tax invoices, handwritten additions, mixed Urdu/English bilingual receipts, POS slips.
- **Phone Numbers:** Pakistani format normalization (`0300-1234567`, `+92 300 1234567`).

### 2.2 User Personas

| Persona | Primary Goal | Critical Pain Point | Required Core Feature |
| :--- | :--- | :--- | :--- |
| **Small Business Owner** (Retail, Wholesale, Services) | Digitize vendor/supplier bills, track payables, monitor monthly expenses | Lost paper receipts, disputed supplier balances, manual bookkeeping time | Fast bulk upload, vendor spend analytics, split-screen review, export to Excel/CSV |
| **Freelancer / Independent Professional** | Track project-related deductible expenses, hardware purchases, software subscriptions | Invoices scattered in email and paper, tax audit vulnerability | Multi-currency handling, category assignment, PDF summary reports |
| **Individual Consumer / Household** | Track household grocery, utility bills, medical receipts | Creeping expenses, misplaced warranty receipts | Mobile-friendly review, fast full-text search by product/vendor, weekly expense summaries |

---

## 3. Product Scope & Functional Breakdown

### 3.1 Authentication & Multi-Tenancy
- Secure registration, email/password login, password reset flow.
- Stateless JWT authentication with secure HTTP-only cookies and Bearer token fallback.
- **Strict Tenant / User Isolation:** Every entity query is filtered by authenticated `user_id`. No user can inspect or mutate another user's documents or financial data.

### 3.2 Document Ingestion & Storage Pipeline
- **Supported Formats:** JPG, JPEG, PNG, WEBP, multi-page PDF.
- **File Validation:** Magic-byte mime-type verification, 20MB file size limit, sanitized UUID-based internal storage keys (never storing user filenames directly on disk/object store).
- **Storage Abstraction:** Provider-agnostic storage interface (`LocalStorageProvider`, `S3StorageProvider`, `CloudflareR2Provider`).
- **Image Preprocessing & Quality Checks:** Blur detection, aspect ratio validation, blank/empty page detection, brightness/contrast sanity checks.

### 3.3 Dynamic Document Intelligence Engine
- **Pluggable Architecture:** `DocumentAIProvider` interface supporting Gemini Multimodal Vision, Google Document AI, AWS Textract, and offline Mock/Test providers.
- **Extracted Entities:**
  - **Vendor:** Name, address, phone, email, website, NTN, STRN, tax ID, store/branch.
  - **Invoice Meta:** Document type (Tax Invoice, Retail Receipt, Restaurant Slip, Utility Bill, etc.), invoice number, order number, date, due date, payment method, currency.
  - **Customer:** Name, phone, email, address, customer ID.
  - **Line Items:** Product name, description, SKU, quantity, unit, unit price, line discount, line tax, line total.
  - **Financial Totals:** Subtotal, discount, tax (GST), service charges, shipping, rounding, total amount, amount paid, balance due.
  - **Dynamic/Custom Fields:** Arbitrary key-value extraction for domain-specific information (e.g., table/waiter for restaurants, batch/expiry/doctor for pharmacies, serial/warranty for electronics).
- **Confidence Scoring & Source Evidence:** Each field has a confidence score (0.0 to 1.0) and bounding box / source text snippet mapping.

### 3.4 Deterministic Financial Validation Engine
Before any document is presented for approval, mathematical rules run deterministically:
1. $\text{Line Total Check:} \quad |(\text{quantity} \times \text{unit\_price} - \text{discount}) - \text{line\_total}| \le 0.05$
2. $\text{Subtotal Check:} \quad |\sum(\text{line\_totals}) - \text{subtotal}| \le 0.05$
3. $\text{Grand Total Check:} \quad |\text{subtotal} - \text{discount} + \text{tax} + \text{service\_charge} + \text{shipping} + \text{rounding} - \text{total}| \le 0.05$
4. **Duplicate Detection:** Multi-vector duplicate check using file SHA-256 hash, (vendor + invoice_number + date), and (vendor + date + total).
5. **Sanity Checks:** Future invoice dates flagged; unexpected negative amounts flagged for manual review.

### 3.5 Human-in-the-Loop Review Workspace
- **Side-by-Side Review Screen (Desktop):** Interactive document viewer on the left; structured editable form on the right.
- **Stacked Responsive Layout (Mobile/Tablet):** Optimized toggle between document view and field correction form.
- **Visual Confidence Indicators:** High ($\ge 90\%$), Medium ($70\% - 89\%$), Low ($< 70\%$, flagged with warning badge $\triangle$).
- **One-Click Approval:** Updates status to `VERIFIED` and creates permanent structured ledger records.

### 3.6 Data Management, Search & Reporting
- **Invoices Ledger:** Paginated table with multi-parameter filtering (date range, vendor, category, status, document type, amount range) and multi-column sorting.
- **Global Search:** Fast full-text search across vendor names, invoice numbers, customer details, line item names, and custom fields.
- **Vendor & Customer Management:** Automatic vendor profile aggregation, spending history, average bill size, and manual vendor deduplication/merging.
- **Analytics Dashboard:** Total spending, bills count, monthly/weekly burn rate, category donut charts, vendor bar charts, weekly trend curves.
- **Export Engine:** Export filtered records and line items to CSV, Excel (.xlsx), and formatted PDF summary reports.

---

## 4. Key Architectural & Non-Functional Requirements

| Dimension | Specification | Implementation Strategy |
| :--- | :--- | :--- |
| **Zero Hallucination** | System must never invent missing information | AI prompt strictly commands `null` output; validation flags inferred values |
| **Response Latency** | Upload response $< 800\text{ms}$; asynchronous background processing | FastAPI asynchronous task queue / background worker; status polling |
| **Security & Privacy** | OWASP Top 10 compliance, tenant isolation, zero secret leakage | Parameterized ORM queries, JWT cookie/header validation, hashed passwords (Argon2id/Bcrypt), sanitized file paths |
| **Extensibility** | Pluggable AI and Storage providers | Abstract Base Classes (`DocumentAIProvider`, `StorageProvider`) |
| **Auditability** | Full ledger of create, verify, edit, delete, and merge actions | Dedicated `audit_logs` table tracking before/after delta and actor |
