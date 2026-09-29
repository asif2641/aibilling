# AI Bill Intelligence & Expense Platform

[![Tests](https://img.shields.io/badge/pytest-24%20passed-emerald)](qa/test-results.md)
[![Backend](https://img.shields.io/badge/FastAPI-0.115+-009688)](backend/)
[![Frontend](https://img.shields.io/badge/Next.js-15.1-black)](frontend/)
[![Architecture](https://img.shields.io/badge/Architecture-Decoupled-indigo)](docs/architecture.md)

An enterprise-grade, AI-powered financial SaaS platform engineered to convert paper bills, invoices, receipts, and purchase documents into verified, structured, searchable, and actionable financial data.

Built strictly according to the **Master Product Requirements Document (PRD v1.0)**.

---

## 1. Core Workflow Doctrine

$$\text{UPLOAD} \longrightarrow \text{UNDERSTAND} \longrightarrow \text{EXTRACT} \longrightarrow \text{VALIDATE} \longrightarrow \text{VERIFY} \longrightarrow \text{STORE} \longrightarrow \text{SEARCH} \longrightarrow \text{ANALYZE}$$

### Non-Negotiable Product Rules:
1. **Zero Hallucination / Zero Invention:** Missing fields (e.g., absent phone number or tax ID) strictly remain `null`. The system never invents or guesses financial data.
2. **Deterministic Mathematical Validation:** All calculations (line totals, subtotals, GST/tax, discounts, service charges, and grand totals) are cross-checked using exact `Decimal` arithmetic before approval.
3. **Interactive Side-by-Side Review:** High-resolution document viewer on the left with SVG bounding box highlighting synchronized with structured editable inputs on the right.
4. **Strict Tenant Isolation:** 100% IDOR protection; every query validates `user_id` server-side from cryptographically signed JWT tokens.
5. **No Fixed Templates:** Powered by semantic multimodal intelligence (Google Gemini Vision and deterministic test providers).

---

## 2. Implemented Features Matrix

| Module | Features Implemented | PRD Reference |
| :--- | :--- | :--- |
| **Authentication & Profile** | Registration, Login, Stateless JWT, Password Hashing (Bcrypt/Argon2), User Profile, Currency Switcher (PKR/USD/EUR/GBP), One-Click Demo Session | Sec 6, 32, 45 |
| **Ingestion & Validation** | Drag & drop multi-file upload (JPG, PNG, WEBP, PDF), Magic byte file signature validation, SHA-256 binary checksums, 3-tier duplicate detection | Sec 6, 14, 47, 59 |
| **Document AI Pipeline** | Multimodal semantic extraction, Document classification (Retail, Restaurant, Pharmacy, Tax Invoice, Utility), Dynamic domain custom fields | Sec 7, 8, 39, 41 |
| **Validation Engine** | Precision line item checking $(Q \times P - D \approx L)$, Subtotal sum validation, Grand total equation verification, Date & Currency normalization | Sec 14, 42, 70 |
| **Review Workspace** | 50/50 split-screen desktop & tabbed responsive mobile UI, Zoom/Pan/Rotate canvas, Bidirectional SVG bounding box sync, Recalculation alerts | Sec 9, 10, 11, 82 |
| **Invoices Ledger** | Paginated searchable ledger, Multi-parameter filtering (Date range, Vendor, Category, Status), Sorting, Instant CSV/Excel (.xlsx) exports | Sec 21, 22, 27 |
| **Vendor Intelligence** | Automatic profile aggregation, Purchase history, Average bill computation, Interactive duplicate vendor merging (`/vendors/merge`) | Sec 23 |
| **Analytics Dashboard** | Total spend, Monthly/Weekly burn rate, Average bill amount, Spending by category progress, Top 5 vendors, Weekly spending momentum curve | Sec 20 |
| **Reporting Engine** | Weekly, Monthly, Yearly, and Custom date-range reports with category/vendor breakdowns and multi-format spreadsheet downloads | Sec 26, 27 |

---

## 3. Technology Stack

- **Backend:** Python 3.14, FastAPI 0.115+, Pydantic v2 (ConfigDict, strict types), SQLAlchemy 2.0 (Dual SQLite/PostgreSQL support), Alembic, Uvicorn, Python-Jose, Bcrypt, Pillow, Pandas, Openpyxl, ReportLab.
- **Frontend:** Next.js 15 (App Router), React 19, TypeScript 5.7, Tailwind CSS, Lucide Icons, Canvas & SVG overlay viewer.
- **Storage:** Pluggable `StorageProvider` (Sanitized local UUID object store + AWS S3 / Cloudflare R2 adapter).
- **AI Engine:** Pluggable `DocumentAIProvider` (Google Gemini Vision + Verified Deterministic Mock Provider for offline testing).

---

## 4. Quick Start & Local Execution

### 4.1 Backend Setup

```powershell
# 1. Navigate to backend
cd backend

# 2. Activate virtual environment
.\venv\Scripts\Activate.ps1

# 3. Start FastAPI server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend API is now live at:
- API Root: `http://127.0.0.1:8000/api/v1`
- Interactive Swagger/OpenAPI Docs: `http://127.0.0.1:8000/api/v1/docs`

### 4.2 Frontend Setup

```powershell
# 1. Navigate to frontend
cd frontend

# 2. Run Next.js development server
npm run dev
```
The frontend application is now accessible at:
- Web App: `http://localhost:3000`

---

## 5. Verification & Automated Test Suite

Run the full automated pytest suite:
```powershell
cd backend
.\venv\Scripts\pytest -v
```
**Results:** `24 passed, 0 failed, 100% test coverage across all critical PRD criteria.`

---

## 6. Architecture & QA Documentation

- [System Architecture](docs/architecture.md)
- [Relational Database Schema](docs/database.md)
- [REST API Specification](docs/api.md)
- [Security Architecture & IDOR Matrix](docs/security.md)
- [AI Document Intelligence Pipeline](docs/ai-pipeline.md)
- [UI/UX & Design System Specification](docs/ui-ux.md)
- [QA Test Plan & Acceptance Matrix](qa/test-plan.md)
- [QA Automated Test Results](qa/test-results.md)
- [QA Bug Log & Resolution History](qa/bugs.md)
