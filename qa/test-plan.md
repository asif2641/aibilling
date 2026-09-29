# QA Test Plan & Validation Strategy

## 1. Quality Objectives & Pass Criteria

The AI Bill Intelligence Platform handles sensitive financial and legal records. A build is declared shippable only when all quality criteria in PRD Section 67–75 & Section 88 are met:
1. **Financial Validation Invariance:** 100% precision on mathematical verification. Decimal arithmetic must never lose precision.
2. **Zero Hallucination Verification:** Any document with missing fields (e.g. absent phone number, absent tax ID) must return `null`. Any model inference that fabricates data fails immediately.
3. **Multi-Tenant Isolation:** Complete barrier between user accounts. No user can access or manipulate another user's documents via ID tampering (100% IDOR protection).
4. **Resilience & Safe Failure:** Corrupt files, blur, rotated documents, or unreadable receipts must fail gracefully with human-friendly guidance, never unhandled 500 exceptions.

---

## 2. Test Execution Levels

```
┌────────────────────────────────────────────────────────┐
│                   E2E & WORKFLOW TESTS                 │
│  (Upload -> Extraction -> Review -> Approve -> Ledger) │
├────────────────────────────────────────────────────────┤
│                    API CONTRACT TESTS                  │
│  (Auth, Documents, Invoices, Vendors, Reports, Export) │
├────────────────────────────────────────────────────────┤
│                 FINANCIAL INTEGRITY TESTS              │
│  (Decimal Math, Tax/GST, Subtotals, Duplicate Checks)  │
├────────────────────────────────────────────────────────┤
│                     UNIT TESTS                         │
│  (Pydantic Models, Adapters, Preprocessors, Storage)   │
└────────────────────────────────────────────────────────┘
```

---

## 3. Test Suites & Execution Tooling

- **Backend:** `pytest`, `pytest-asyncio`, `httpx` (for FastAPI test client), `faker`.
- **Database:** In-memory or temporary SQLite database configured with strict schema recreation between test runs.
- **AI Extraction Testing:** Offline deterministic test suite using `MockAIProvider` with curated real-world Pakistani and international receipt fixtures.
- **Frontend / Integration:** TypeScript type-check (`tsc`), automated component assertions, responsive layout verification.

---

## 4. Test Datasets Specification (Target: 100% Coverage of PRD Scenarios)

1. **Standard Supermarket / Retail Receipt:**
   - Multi-item (Milk, Bread, Eggs), Subtotal, GST 18%, Grand total matching sum.
2. **Restaurant Slip:**
   - Single item, Service Charge 10%, Table number, Cashier name (custom fields).
3. **Pharmacy Bill:**
   - Medicines with Batch Number, Expiry Date, Doctor name, Patient name.
4. **Hardware / Electronics Invoice:**
   - Serial Number, Warranty period, Brand name, Advance payment, Balance due.
5. **Arithmetic Discrepancy Scenario:**
   - Intentionally distorted line totals ($2 \times 250 = 600$) or missing taxes; verifies that deterministic validation engine flags discrepancies and alerts the user.
6. **Zero-Hallucination Scenario:**
   - Document with completely absent customer details; verifies that `customer_name`, `customer_phone`, etc., remain strictly `null`.
7. **Duplicate Detection Scenario:**
   - Same bill uploaded twice; verifies that SHA-256 and metadata matching flag duplicate warnings without automatic deletion.
8. **Security / IDOR Scenario:**
   - User B attempts to access Document A owned by User A; verifies that HTTP 404 is returned.
