# System Architecture & Component Design

## 1. System Topology Overview

The AI Bill Intelligence Platform is designed with a modern, decoupled three-tier architecture:
- **Presentation Tier:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons, and Canvas/SVG document viewer.
- **Application Services Tier:** Python 3.14 + FastAPI REST API with Pydantic v2 validation, background workers, and business service layers.
- **Data & Storage Tier:** PostgreSQL 16+ (or SQLite 3.40+ in development/testing), Local/S3-compatible Object Storage, and Alembic migrations.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js / React)                      │
│  ┌───────────────┐  ┌──────────────────┐  ┌─────────────────────────┐  │
│  │ Auth & Profile│  │ Upload & Queues  │  │ Review & Split-Screen UI│  │
│  └───────┬───────┘  └────────┬─────────┘  └────────────┬────────────┘  │
│  ┌───────┴───────┐  ┌────────┴─────────┐  ┌────────────┴────────────┐  │
│  │ Dashboard KPIs│  │ Invoices Ledger  │  │ Reports & CSV/Excel/PDF │  │
│  └───────────────┘  └──────────────────┘  └─────────────────────────┘  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS / REST (JSON + Multipart)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        BACKEND API (Python FastAPI)                    │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Security & Tenant Middleware (JWT, CORS, Rate Limiter, Scoping)  │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│  ┌──────────────────────────────────┴───────────────────────────────┐  │
│  │ API Routers: /auth, /documents, /invoices, /vendors, /reports    │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     ▼                                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Domain Service Layer                                             │  │
│  │  • DocumentService   • ExtractionPipeline   • ValidationEngine   │  │
│  │  • InvoiceService    • DuplicateDetector    • AnalyticsService   │  │
│  │  • VendorService     • ExportService        • AuditLogger        │  │
│  └──────────────────┬───────────────────────────────┬───────────────┘  │
│                     │                               │                  │
│                     ▼                               ▼                  │
│  ┌──────────────────────────────┐     ┌─────────────────────────────┐  │
│  │ Storage Abstraction (Storage)│     │ AI Adapter (DocumentAI)     │  │
│  │  • LocalStorageProvider      │     │  • GeminiVisionProvider     │  │
│  │  • S3StorageProvider         │     │  • MockAIProvider (Testing) │  │
│  └──────────────┬───────────────┘     └─────────────┬───────────────┘  │
└─────────────────┼───────────────────────────────────┼──────────────────┘
                  ▼                                   ▼
┌─────────────────────────────────┐     ┌────────────────────────────────┐
│   PERSISTENT STORAGE / DISK     │     │     AI VISION FOUNDATION       │
│  (Sanitized UUID File Store)    │     │  (Multimodal Document Models)  │
└─────────────────────────────────┘     └────────────────────────────────┘
                  │
                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   RELATIONAL DATABASE (PostgreSQL / SQLite)            │
│  • Users & Profiles      • Documents & Pages       • Invoices & Items  │
│  • Extraction Fields     • Vendors & Customers     • Audit Logs        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Layer Responsibilities & Design Patterns

### 2.1 Router Layer (`api/v1/`)
- HTTP protocol handling, path parameter parsing, status code mappings.
- Dependency injection of authenticated user context (`Depends(get_current_user)`).
- Strict Pydantic input request and output response schema enforcement.

### 2.2 Domain Service Layer (`services/`)
- Pure business logic independent of transport protocols.
- Handles atomic transactions, entity state machines, validation calls, and cross-cutting audit logging.
- Orchestrates background extraction lifecycle.

### 2.3 Repository & Data Layer (`repositories/` & `models/`)
- SQLAlchemy 2.0 ORM models with strict relationship constraints (`foreign_key`, `cascade="all, delete-orphan"`).
- Tenant-scoped data access helpers guaranteeing that no query can bypass `user_id`.

### 2.4 Integration Adapters (`core/providers/`)
- **`StorageProvider`**: Encapsulates binary file storage, streaming, and signed download URLs.
- **`DocumentAIProvider`**: Standardized interface for OCR and semantic multimodal extraction.

---

## 3. Directory Layout Standard

```text
/
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI routers (auth, documents, invoices, etc.)
│   │   ├── core/            # Configuration, security, database session, base classes
│   │   ├── models/          # SQLAlchemy ORM models
│   │   ├── schemas/         # Pydantic v2 validation schemas
│   │   ├── services/        # Business logic services (AI, validation, analytics)
│   │   ├── providers/       # Pluggable storage & AI adapters
│   │   └── main.py          # FastAPI application entrypoint
│   ├── tests/               # Pytest suite (unit, integration, financial validation)
│   ├── alembic/             # Database migrations
│   ├── requirements.txt     # Python dependencies
│   └── .env.example         # Template configuration
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js App Router pages
│   │   ├── components/      # UI components (ReviewScreen, DocumentViewer, Charts)
│   │   ├── hooks/           # Custom React hooks (useAuth, useDocumentStatus)
│   │   ├── lib/             # API client, formatting utilities, decimal math
│   │   └── types/           # TypeScript interfaces matching backend schemas
│   ├── package.json
│   └── tailwind.config.ts
├── research/                # Product & technical research documents
├── docs/                    # Architecture, DB schema, API, Security specs
└── qa/                      # QA test plans, test cases, and audit reports
```
