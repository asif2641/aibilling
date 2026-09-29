# QA Test Cases & Acceptance Criteria Matrix

| Test Case ID | Category | Scenario / Description | Input / Trigger | Expected Result | PRD Reference |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-AUTH-01** | Auth | User Registration | Valid email, password, name | HTTP 201 Created, user stored with hashed password | Sec 6, Sec 32 |
| **TC-AUTH-02** | Auth | Login & Token Generation | Correct credentials | HTTP 200 OK, JWT returned with valid expiration | Sec 6, Sec 45 |
| **TC-AUTH-03** | Auth | Invalid Password Attempt | Incorrect password | HTTP 401 Unauthorized, no user enumeration info | Sec 45 |
| **TC-DOC-01** | Upload | Valid Image Upload | Valid JPEG/PNG file ($< 20\text{MB}$) | HTTP 202 Accepted, Document created with status `QUEUED` | Sec 6, Sec 50 |
| **TC-DOC-02** | Upload | Invalid File Type | Upload of `.exe` or executable file | HTTP 400 Bad Request, rejected at magic-byte check | Sec 47, Sec 72 |
| **TC-DOC-03** | Upload | File Size Exceeded | File $> 20\text{MB}$ | HTTP 413 Payload Too Large | Sec 47 |
| **TC-AI-01** | Extraction | Retail Receipt Extraction | Standard retail receipt image | Status `REVIEW_REQUIRED`, vendor, line items, totals extracted | Sec 6, Sec 41 |
| **TC-AI-02** | Extraction | Dynamic Fields Extraction | Pharmacy bill with batch/expiry | Dynamic fields populated in `custom_fields` JSON | Sec 7 |
| **TC-AI-03** | Extraction | Zero Hallucination Check | Document missing customer info | `customer_name` and `customer_phone` strictly `null` | Sec 2, Sec 43, Sec 74 |
| **TC-VAL-01** | Validation | Accurate Arithmetic Check | Bill where items sum to subtotal | Validation reports `is_valid: true`, 0 discrepancies | Sec 14, Sec 70 |
| **TC-VAL-02** | Validation | Inaccurate Arithmetic Check | Bill where sum is off by Rs. 5 | Validation reports `is_valid: false`, discrepancy flagged | Sec 14, Sec 70 |
| **TC-DUP-01** | Duplicate | Exact Duplicate Upload | Re-upload same file binary | `duplicate_detected: true`, links to original invoice | Sec 14, Sec 59 |
| **TC-REV-01** | Review | Field Correction & Approval | User edits total and approves | Status transitions to `VERIFIED`, committed to `invoices` | Sec 10, Sec 88 |
| **TC-SEC-01** | Security | IDOR Access Prevention | User B fetches User A's document | HTTP 404 Not Found (or 403 Forbidden) | Sec 45, Sec 46, Sec 72 |
| **TC-REP-01** | Reports | Monthly Analytics & Export | Filter bills by current month | Accurate aggregate sum, correct CSV/Excel generation | Sec 26, Sec 27 |
| **TC-VEN-01** | Vendors | Automatic Profile Aggregation| Approve bill with new vendor | Vendor profile created; subsequent bills aggregate total | Sec 23 |
| **TC-VEN-02** | Vendors | Manual Vendor Merge | Merge 2 vendor profiles | Invoices reassigned, primary vendor spend updated | Sec 23 |
