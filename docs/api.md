# REST API Specification (OpenAPI Compatible)

## 1. Authentication & Security Conventions

- **Base URL:** `/api/v1`
- **Auth Header:** `Authorization: Bearer <access_token>` (or secure HTTP-only cookie `access_token`).
- **Standard Error Response:**
  ```json
  {
    "detail": "Error description message",
    "error_code": "INVALID_CREDENTIALS",
    "validation_errors": []
  }
  ```

---

## 2. API Endpoints

### 2.1 Authentication (`/auth`)

#### `POST /auth/register`
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "StrongPassword123!",
    "full_name": "Ali Khan",
    "currency": "PKR"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "id": "uuid-string",
    "email": "user@example.com",
    "full_name": "Ali Khan",
    "currency": "PKR",
    "created_at": "2026-09-28T10:00:00Z"
  }
  ```

#### `POST /auth/login`
- **Request Body (OAuth2 Form / JSON):**
  ```json
  {
    "username": "user@example.com",
    "password": "StrongPassword123!"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "access_token": "eyJhbG...",
    "token_type": "bearer",
    "expires_in": 86400,
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "Ali Khan",
      "currency": "PKR"
    }
  }
  ```

#### `GET /auth/me`
- **Response (200 OK):** Current user profile.

---

### 2.2 Documents Ingestion & Processing (`/documents`)

#### `POST /documents/upload`
- **Content-Type:** `multipart/form-data`
- **Form Fields:** `file` (File binary: JPG, PNG, WEBP, PDF)
- **Response (202 Accepted):**
  ```json
  {
    "id": "doc-uuid",
    "original_filename": "supermarket_bill.jpg",
    "mime_type": "image/jpeg",
    "file_size": 184520,
    "sha256_checksum": "a3f5...",
    "status": "QUEUED",
    "duplicate_detected": false,
    "existing_invoice_id": null,
    "created_at": "2026-09-28T10:05:00Z"
  }
  ```

#### `GET /documents/{id}/status`
- **Response (200 OK):** Lightweight polling endpoint.
  ```json
  {
    "id": "doc-uuid",
    "status": "REVIEW_REQUIRED", // QUEUED, PROCESSING, EXTRACTED, REVIEW_REQUIRED, VERIFIED, FAILED
    "processing_stage": "validation_complete",
    "error_message": null
  }
  ```

#### `GET /documents/{id}`
- **Response (200 OK):** Full document review payload.
  ```json
  {
    "id": "doc-uuid",
    "status": "REVIEW_REQUIRED",
    "original_filename": "supermarket_bill.jpg",
    "page_count": 1,
    "file_url": "/api/v1/documents/doc-uuid/file",
    "extracted_data": {
      "document_type": "retail_receipt",
      "vendor_name": { "value": "ABC Super Store", "confidence": 0.98, "bounding_box": { "x": 0.2, "y": 0.05, "width": 0.6, "height": 0.04 } },
      "invoice_number": { "value": "INV-1025", "confidence": 0.95 },
      "invoice_date": { "value": "2026-09-25", "confidence": 0.99 },
      "currency": { "value": "PKR", "confidence": 1.0 },
      "customer_name": { "value": null, "confidence": 1.0 },
      "customer_phone": { "value": null, "confidence": 1.0 },
      "items": [
        {
          "name": "Milk",
          "quantity": 2,
          "unit_price": 250.00,
          "discount": 0.00,
          "tax": 0.00,
          "line_total": 500.00,
          "confidence": 0.97
        }
      ],
      "totals": {
        "subtotal": { "value": 1850.00, "confidence": 0.99 },
        "discount": { "value": 0.00, "confidence": 1.0 },
        "tax": { "value": 333.00, "confidence": 0.96 },
        "total": { "value": 2183.00, "confidence": 0.99 }
      },
      "custom_fields": {}
    },
    "validation_result": {
      "is_valid": true,
      "discrepancies": [],
      "calculated_total": 2183.00
    }
  }
  ```

#### `GET /documents/{id}/file`
- Streams the raw or preprocessed image/pdf with authorization check and appropriate `Content-Type`.

---

### 2.3 Invoice Ledger & Verification (`/invoices`)

#### `POST /invoices/approve`
- Approves extracted or edited bill and commits it to permanent ledger.
- **Request Body:**
  ```json
  {
    "document_id": "doc-uuid",
    "vendor_name": "ABC Super Store",
    "vendor_phone": null,
    "vendor_address": "Lahore, Pakistan",
    "vendor_ntn": null,
    "customer_name": null,
    "customer_phone": null,
    "invoice_number": "INV-1025",
    "invoice_date": "2026-09-25",
    "currency": "PKR",
    "category_id": "cat-uuid",
    "subtotal": 1850.00,
    "discount": 0.00,
    "tax": 333.00,
    "service_charge": 0.00,
    "shipping": 0.00,
    "rounding": 0.00,
    "total": 2183.00,
    "payment_method": "Cash",
    "items": [
      {
        "name": "Milk 1L",
        "quantity": 2,
        "unit": "pack",
        "unit_price": 250.00,
        "discount": 0.00,
        "tax": 0.00,
        "line_total": 500.00
      }
    ],
    "custom_fields": {}
  }
  ```
- **Response (201 Created):** Created `Invoice` entity.

#### `GET /invoices`
- **Query Parameters:** `page`, `page_size`, `search`, `start_date`, `end_date`, `vendor_id`, `category_id`, `status`, `min_total`, `max_total`, `sort_by`, `sort_order`.
- **Response (200 OK):** Paginated invoice list with summary counts.

#### `GET /invoices/{id}`
- **Response (200 OK):** Full invoice details with line items and source document preview link.

#### `PUT /invoices/{id}`
- Updates existing invoice and triggers audit log record.

#### `DELETE /invoices/{id}`
- Soft deletes or archives invoice record.

---

### 2.4 Vendors & Categories (`/vendors`, `/categories`)

#### `GET /vendors`
- Returns vendor list with aggregate stats (`total_invoices`, `total_spend`, `last_invoice_date`).

#### `POST /vendors/merge`
- **Request Body:** `{ "primary_vendor_id": "uuid", "duplicate_vendor_ids": ["uuid2", "uuid3"] }`
- Reassigns invoices from duplicates to primary vendor and creates aliases.

#### `GET /categories`
- List user's available spending categories.

---

### 2.5 Analytics & Reports (`/dashboard`, `/reports`)

#### `GET /dashboard/summary`
- Total spend, total bills, weekly spend, monthly spend, category breakdown, top 5 vendors, recent 5 bills.

#### `GET /reports/{type}` (`type` = `weekly` | `monthly` | `yearly` | `custom`)
- Detailed financial breakdown across the designated time window.

#### `GET /reports/export`
- **Query Parameters:** `format` (`csv` | `xlsx`), plus standard invoice filter params.
- **Response:** Downloadable spreadsheet binary.
