# Security Architecture & Threat Mitigation Matrix

## 1. Core Security Principles

Financial SaaS applications handle sensitive commercial, personal, and fiscal records. The AI Bill Intelligence Platform adheres to the principle of **Defense in Depth**:
1. **Zero-Trust Multi-Tenancy:** The backend assumes client input is untrusted. No client-supplied `user_id` is ever honored; identity is derived exclusively from cryptographically verified tokens.
2. **Safe File Handling:** Binaries are sanitized, hashed, isolated, and never executed.
3. **Immutability & Audit Logging:** Critical operations create permanent audit traces.

---

## 2. Threat Vector Mitigation Specifications

### 2.1 Insecure Direct Object References (IDOR)
- **Risk:** An authenticated attacker alters the document or invoice ID in the URL to inspect or manipulate another company's invoices.
- **Enforcement:**
  - Every ORM query retrieving a tenant-owned entity includes the `user_id` constraint:
    ```python
    async def get_user_invoice(db: AsyncSession, invoice_id: str, user_id: str) -> Invoice:
        stmt = select(Invoice).where(Invoice.id == invoice_id, Invoice.user_id == user_id)
        result = await db.execute(stmt)
        record = result.scalar_one_or_none()
        if not record:
            raise HTTPException(status_code=404, detail="Invoice not found")
        return record
    ```
  - Reusable FastAPI dependencies enforce this check automatically across routes.

### 2.2 File Upload & Malware Defense
- **MIME & Magic Byte Verification:** In addition to checking the `Content-Type` header, file headers are verified using binary signatures:
  - JPEG: `\xFF\xD8\xFF`
  - PNG: `\x89PNG\r\n\x1a\n`
  - PDF: `%PDF-`
  - WEBP: `RIFF....WEBP`
- **Filename Sanitization:** The original filename is preserved purely for UI display in a database column. On storage media, files are assigned randomized UUIDv4 paths: `uploads/{user_id}/{uuidv4}.{ext}`. Path traversal characters (`../`, `..\\`) are strictly stripped.
- **Execution Prevention:** The file storage directory is non-executable and served exclusively through authenticated streaming endpoints that inject `Content-Security-Policy: default-src 'none'`, `X-Content-Type-Options: nosniff`, and `Content-Disposition: inline`.

### 2.3 Authentication, Passwords & Secrets
- **Password Hashing:** Passwords are never stored in plaintext. They are hashed using **Argon2id** or **Bcrypt** with individual salts and high work factors.
- **JWT Architecture:** Tokens are signed using HMAC-SHA256 (`HS256`) with a cryptographically secure random key. Expiration is strictly enforced.
- **Environment Separation:** All secrets (`SECRET_KEY`, `AI_API_KEY`, `DATABASE_URL`) are read from `.env` files via Pydantic `BaseSettings`. The `.env` file is included in `.gitignore` and `.env.example` provides safe templates.

### 2.4 SQL Injection Defense
- 100% of database queries use SQLAlchemy 2.0 ORM expressions or parameterized queries. Dynamic string formatting (`f"SELECT * FROM invoices WHERE id = '{id}'"`) is prohibited across the codebase.

### 2.5 Controlled Query Layer for AI Assistants (Phase 2 Readiness)
- Per **PRD Rule 11 & Section 30**, AI assistants are never permitted to generate or execute arbitrary SQL statements. Natural language inquiries map to parameterized domain functions with pre-validated filter constraints.
