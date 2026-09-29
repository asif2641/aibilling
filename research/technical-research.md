# Technical Research & Architecture Specification

## 1. Technology Stack Analysis & Selection

### 1.1 Backend Framework: Python FastAPI
- **Choice:** **FastAPI 0.115+** with **Pydantic v2** and **Python 3.14**.
- **Rationale:**
  - Native asynchronous I/O (`asyncio`) allows high-concurrency ingestion and non-blocking background AI dispatch.
  - Pydantic v2 (compiled with Rust) delivers ultra-fast data validation, strict JSON serialization, and automatic OpenAPI v3 documentation generation.
  - Clean dependency injection system simplifies user authentication, database session scoping, and provider swapping.

### 1.2 Database & ORM: SQLAlchemy 2.0 + Dual Database Support (PostgreSQL / SQLite)
- **Choice:** **SQLAlchemy 2.0** with **Alembic** migrations.
- **Dialect Abstraction:**
  - Production targets **PostgreSQL 16+** with JSONB support, connection pooling, and GIN/BTREE indexes.
  - Development and testing seamlessly support **SQLite 3.40+** (with JSON functions and WAL mode enabled), allowing instant out-of-the-box local execution without requiring a local running PostgreSQL instance.
- **Financial Precision:** All monetary amounts (`total`, `subtotal`, `tax`, `unit_price`, `line_total`) utilize `Numeric(12, 2)` (mapped to Python `Decimal`), completely eliminating binary floating-point rounding bugs ($0.1 + 0.2 \neq 0.3$).

### 1.3 File Storage Abstraction
- **Storage Protocol:** Object Storage pattern via an abstract `StorageProvider` class:
  ```python
  class StorageProvider(ABC):
      async def upload(self, file_content: bytes, destination_path: str, mime_type: str) -> str: ...
      async def get(self, storage_key: str) -> bytes: ...
      async def get_url(self, storage_key: str, expires_in: int = 3600) -> str: ...
      async def delete(self, storage_key: str) -> bool: ...
  ```
- **Implementations:**
  - `LocalStorageProvider`: Stores files under a protected `uploads/` directory with sandboxed UUID filenames and SHA-256 checksum verification. Files are served strictly via authenticated streaming endpoints.
  - `S3StorageProvider`: Compatible with AWS S3, Cloudflare R2, MinIO, and Google Cloud Storage via S3 API, supporting pre-signed temporary URLs.

### 1.4 Frontend Framework: Next.js & React Ecosystem
- **Choice:** **Next.js 15** (App Router) + **React 19** + **TypeScript** + **Tailwind CSS**.
- **Component Architecture:**
  - Modern, accessible, minimalist SaaS design inspired by Stripe / Linear / Vercel design systems.
  - Client state managed with React Hooks, TanStack React Query for cached server synchronization, and Lucide React icons.
  - **Split-Screen Workspace:** Left panel renders document viewer (supporting high-resolution image zoom, pan, rotate, and multi-page navigation) with SVG bounding box overlays; right panel provides real-time editable inputs, field confidence badges, and recalculation alerts.
  - Fully responsive: Switches to a tabbed stacked view on tablets and mobile devices.

---

## 2. Background Processing & Job Lifecycle

To ensure API responsiveness ($< 500\text{ms}$ upload response), document processing executes asynchronously:

```
[Client POST /api/documents] 
       │ (multipart/form-data)
       ▼
[FastAPI Ingestion Endpoint] 
       │ 1. Validate MIME type & file signature
       │ 2. Compute SHA-256 checksum & check duplicate
       │ 3. Save to StorageProvider (UUID key)
       │ 4. Insert Document record (status = "QUEUED")
       │ 5. Enqueue background task
       ▼
[Return HTTP 202 Accepted] { document_id, status: "QUEUED" }
       │
       ▼ (Async Background Worker)
[Stage 1: PREPROCESSING] 
       │ • Extract page images from PDF (if multi-page)
       │ • Image blur, aspect ratio, contrast inspection
       ▼
[Stage 2: AI EXTRACTION] 
       │ • Invoke active DocumentAIProvider
       │ • Receive structured JSON output with bounding boxes
       ▼
[Stage 3: VALIDATION ENGINE] 
       │ • Deterministic math check (line totals, tax, subtotal)
       │ • Date & currency normalization
       │ • Assess field confidence thresholds
       ▼
[Stage 4: PERSISTENCE & STATUS UPDATE]
       │ • Populate extraction_fields & provisional invoice record
       │ • Set status: "REVIEW_REQUIRED" (or "EXTRACTED" if high confidence)
       ▼
[Client Polling / Stream] 
       │ GET /api/documents/{id}/status -> Updates UI in real-time
```

---

## 3. Financial Validation & Arithmetic Verification

All extracted calculations must pass deterministic rules before verification:

```python
from decimal import Decimal, ROUND_HALF_UP

def validate_invoice_arithmetic(items: list[dict], totals: dict) -> dict:
    discrepancies = []
    
    # 1. Line item arithmetic
    calculated_subtotal = Decimal("0.00")
    for idx, item in enumerate(items):
        qty = Decimal(str(item.get("quantity") or "1.00"))
        price = Decimal(str(item.get("unit_price") or "0.00"))
        discount = Decimal(str(item.get("discount") or "0.00"))
        expected_line_total = (qty * price) - discount
        actual_line_total = Decimal(str(item.get("line_total") or "0.00"))
        
        if abs(expected_line_total - actual_line_total) > Decimal("0.05"):
            discrepancies.append({
                "item_index": idx,
                "field": "line_total",
                "message": f"Line total mismatch for '{item.get('name')}': Expected {expected_line_total}, got {actual_line_total}"
            })
        calculated_subtotal += actual_line_total

    # 2. Subtotal arithmetic
    stated_subtotal = Decimal(str(totals.get("subtotal") or calculated_subtotal))
    if abs(calculated_subtotal - stated_subtotal) > Decimal("0.05"):
        discrepancies.append({
            "field": "subtotal",
            "message": f"Sum of line items ({calculated_subtotal}) does not match stated subtotal ({stated_subtotal})"
        })

    # 3. Grand total arithmetic
    discount = Decimal(str(totals.get("discount") or "0.00"))
    tax = Decimal(str(totals.get("tax") or "0.00"))
    service_charge = Decimal(str(totals.get("service_charge") or "0.00"))
    shipping = Decimal(str(totals.get("shipping") or "0.00"))
    rounding = Decimal(str(totals.get("rounding") or "0.00"))
    stated_total = Decimal(str(totals.get("total") or "0.00"))

    expected_total = stated_subtotal - discount + tax + service_charge + shipping + rounding
    if abs(expected_total - stated_total) > Decimal("0.05"):
        discrepancies.append({
            "field": "total",
            "message": f"Calculated grand total ({expected_total}) differs from stated total ({stated_total}) by {abs(expected_total - stated_total)}"
        })

    return {
        "is_valid": len(discrepancies) == 0,
        "discrepancies": discrepancies,
        "calculated_total": float(expected_total)
    }
```

---

## 4. Duplicate Detection Strategy

Duplicate detection uses a hierarchical multi-signal matching algorithm:
1. **Level 1 (Exact Binary Match):** Matching `user_id` + `sha256_checksum`. Flags file as an immediate exact duplicate.
2. **Level 2 (Strict Financial Match):** Matching `user_id` + normalized `vendor_id` + `invoice_number` + `invoice_date`.
3. **Level 3 (Heuristic Match):** Matching `user_id` + normalized `vendor_name` + `invoice_date` + `total_amount` (within $\pm 1$ day).

If a match is found, the document is flagged with `duplicate_detected: true` and linked to the existing invoice ID. **Per PRD Rule 14, duplicate documents are never automatically deleted; the user is presented with comparison options ("View Existing" / "Keep Both").**

---

## 5. Security & Isolation Matrix

| Threat Vector | Mitigation Strategy |
| :--- | :--- |
| **Insecure Direct Object Reference (IDOR)** | All document, invoice, and vendor queries strictly enforce `WHERE user_id = :current_user_id`. Endpoint paths with `{id}` execute ownership assertions before returning data. |
| **Malicious File Uploads** | Files validated against whitelist (`image/jpeg`, `image/png`, `image/webp`, `application/pdf`). Header magic-number checks prevent executable spoofing. Files renamed with random UUIDs and stripped of execution flags. |
| **SQL / Injection Vulnerabilities** | 100% parameterized queries via SQLAlchemy 2.0 ORM. Direct string interpolation in queries is strictly prohibited. |
| **Sensitive Credential Exposure** | Zero hardcoded keys. Application settings loaded via Pydantic `BaseSettings` reading environment variables (`.env`). Frontend bundles strictly exclude backend secrets. |
| **Password & Token Security** | Password hashing via **Argon2id** / **Bcrypt** with dynamic salt. Stateless JWTs signed with `HS256`/`RS256` with strict expiration and refresh mechanics. |
