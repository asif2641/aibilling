# QA Bug Log & Resolution History

| Bug ID | Component | Description | Root Cause | Resolution | Verified |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **BUG-001** | Validation | Currency normalization failed for `"Rs. 2500"` | `normalize_currency` performed strict list equality on cleaned string instead of searching currency tokens | Updated `normalize_currency` to search token occurrences (`RS`, `PKR`, `RUPEE`, `$`, `USD`, `EUR`, `GBP`) | **VERIFIED** |
| **BUG-002** | Schema | Pydantic V2 deprecation warnings on `class Config:` and `.dict()` | Legacy Pydantic v1 syntax used in schemas and service calls | Migrated all schemas to `model_config = ConfigDict(from_attributes=True)` and replaced `.dict()` with `.model_dump()` | **VERIFIED** |
| **BUG-003** | Invoices | Float vs string comparison in test assertions | Pydantic v2 serializes `Decimal` fields to string by default to preserve precision | Added `float()` conversion in test comparisons | **VERIFIED** |
| **BUG-004** | Auth | `email-validator` missing in virtual environment | `EmailStr` in Pydantic v2 requires `email-validator` | Installed `email-validator` and updated `backend/requirements.txt` | **VERIFIED** |
| **BUG-005** | Reports | FastAPI deprecated `regex=` in `Query()` | FastAPI 0.115+ deprecates `regex` in favor of `pattern` | Updated query definitions in `backend/app/api/v1/reports.py` | **VERIFIED** |
| **BUG-006** | Servers | `ERR_CONNECTION_REFUSED` on `localhost:3000` | Neither FastAPI backend (8000) nor Next.js frontend (3000) was running | Launched FastAPI backend and Next.js frontend dev servers as daemon processes | **VERIFIED** |
| **BUG-007** | Configuration | Database & storage path divergence when running from project root vs backend folder | Relative paths `./bill_intelligence.db` and `uploads` caused creation of duplicate empty DB in root | Anchored `DATABASE_URL` and `STORAGE_LOCAL_PATH` to backend base directory in `config.py` and linked UniversalExtractor for OCR parsing | **VERIFIED** |

