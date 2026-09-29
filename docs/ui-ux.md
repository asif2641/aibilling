# UI/UX Specification & Design System

## 1. Design System Tokens & Aesthetics

The UI follows a professional, high-density, accessible SaaS aesthetic (inspired by Stripe, Linear, and modern fintech products):
- **Typography:** Inter / system sans-serif font stack. Clean weights: 400 (regular), 500 (medium), 600 (semibold).
- **Color Palette:**
  - **Background:** Primary canvas `slate-50` (`#F8FAFC`), Surface cards `white` (`#FFFFFF`), Dark borders `slate-200` (`#E2E8F0`).
  - **Brand / Primary:** Deep Indigo `indigo-600` (`#4F46E5`), Hover `indigo-700` (`#4338CA`).
  - **Success / High Confidence:** Emerald `emerald-600` (`#059669`), Light `emerald-50` (`#ECFDF5`).
  - **Warning / Review Required:** Amber `amber-600` (`#D97706`), Light `amber-50` (`#FFFBEB`).
  - **Danger / Invalid Math:** Rose `rose-600` (`#E11D48`), Light `rose-50` (`#FFF1F2`).
  - **Text:** Dark slate `slate-900` (`#0F172A`), Muted slate `slate-500` (`#64748B`).

---

## 2. Core Workflows & Screen Specifications

### 2.1 Navigation & Layout Shell
- **Desktop:** Collapsible left sidebar with links:
  - 📊 Dashboard (`/dashboard`)
  - 📄 Invoices & Bills (`/invoices`)
  - ⬆️ Upload Bills (`/invoices/upload`)
  - 🏢 Vendors (`/vendors`)
  - 📈 Reports & Analytics (`/reports`)
  - ⚙️ Settings (`/settings`)
  - User profile drawer with quick logout.
- **Header:** Global search bar (`Cmd/Ctrl + K`), currency switcher (`PKR`, `USD`), notifications badge, and prominent primary action: **"+ Upload Bill"**.
- **Mobile:** Fixed bottom navigation bar with responsive drawer sheet for deep navigation.

### 2.2 Upload & Batch Ingestion Experience (`/invoices/upload`)
- **Drag-and-Drop Zone:** Large receptive area supporting multi-file drops (JPG, PNG, WEBP, PDF).
- **Batch Processing List:** Each file renders as an individual progress row:
  - Thumbnail, filename, file size.
  - Granular state indicator:
    - `Uploading...` (with real network progress)
    - `Preparing document...`
    - `Reading document & understanding layout...`
    - `Validating financial calculations...`
    - `Review Required` (Action button: `Review Bill →`)
    - `Verified` (Green checkmark)
  - Non-blocking: Errors on file 3 do not stall files 1, 2, or 4.

### 2.3 Document Review Workspace (`/invoices/[id]/review`) — THE CORE PRODUCT EXPERIENCE
Desktop: Dedicated 50/50 split-screen layout maximizing review speed and data fidelity.

```
┌───────────────────────────────────────┬───────────────────────────────────────┐
│           DOCUMENT VIEWER             │        EXTRACTED INFORMATION         │
│  [Zoom In] [Zoom Out] [Reset] [Rotate]│ Status: Review Required (1 Warning)   │
│ ┌───────────────────────────────────┐ │ ┌───────────────────────────────────┐ │
│ │                                   │ │ │ Document Type: [ Retail Receipt ▾]│ │
│ │         ABC Super Store           │ │ ├───────────────────────────────────┤ │
│ │       ┌───────────────────┐       │ │ │ VENDOR DETAILS                    │ │
│ │       │ Total: Rs. 2,183  │◄──────┼─┼─┤ Name:    [ ABC Super Store     ]  │ │
│ │       └───────────────────┘       │ │ │ Phone:   [ Not Found           ]  │ │
│ │                                   │ │ ├───────────────────────────────────┤ │
│ │                                   │ │ │ INVOICE DETAILS                   │ │
│ │                                   │ │ │ Number:  [ INV-1025            ]  │ │
│ │                                   │ │ │ Date:    [ 2026-09-25          ]  │ │
│ │                                   │ │ ├───────────────────────────────────┤ │
│ │                                   │ │ │ LINE ITEMS (1 item)               │ │
│ │                                   │ │ │ Milk 1L   2 x 250 = 500  [Edit]   │ │
│ │                                   │ │ ├───────────────────────────────────┤ │
│ │                                   │ │ │ FINANCIAL TOTALS                  │ │
│ │                                   │ │ │ Subtotal: [ 1850.00 ]             │ │
│ │                                   │ │ │ GST (Tax):[ 333.00  ]             │ │
│ │                                   │ │ │ Total:    [ 2183.00 ]             │ │
│ │                                   │ │ ├───────────────────────────────────┤ │
│ │                                   │ │ │ ✓ Math Valid: 1850 + 333 = 2183   │ │
│ └───────────────────────────────────┘ │ └───────────────────────────────────┘ │
│                                       │ [Reject / Delete]    [Approve & Save] │
└───────────────────────────────────────┴───────────────────────────────────────┘
```

#### Interactive Behavior & UX Details:
1. **Bidirectional Highlighting:** Focusing on any field on the right smoothly highlights the corresponding bounding box rectangle on the document image on the left.
2. **Visual Confidence Badges:**
   - 90–100%: Green dot `✓ 98%`
   - 70–89%: Slate dot `82%`
   - < 70%: Amber badge `⚠ 52% (Low Confidence)`
3. **Real-time Recalculation:** Editing quantity or unit price immediately recalculates line total and displays a live validation badge showing whether subtotal and total balance.
4. **Mobile Responsive State:** On viewports $< 1024\text{px}$, the review screen shifts to a full-width tabbed layout (`[📄 View Document]` / `[📝 Edit Data]`) with a sticky floating toolbar containing the quick approval button.

### 2.4 Invoices Ledger (`/invoices`)
- Paginated table with fast client-side sorting and debounce-filtered server queries.
- Inline status chips: `Verified` (Emerald), `Review Required` (Amber), `Processing` (Blue).
- Quick filters: Date Presets (`This Week`, `This Month`, `This Year`, `Custom`), Vendor multi-select, Status multi-select, Category dropdown.
- Batch actions: `Export Selected to CSV/Excel`, `Batch Delete`.

### 2.5 Analytics Dashboard (`/dashboard`)
- 4 Primary Metric Cards: Total Spend, Total Bills Count, This Month's Spend (with % change vs last month), Average Bill Amount.
- Spending by Category: Donut chart with category legend and monetary totals.
- Top Vendors by Spend: Clean horizontal bar chart.
- Monthly / Weekly Trend: Area chart tracking spending momentum over time.
- Recent Bills quick table with direct link to view and edit.

### 2.6 Empty, Loading, and Error States
- **Loading:** Subtle shimmer / skeleton loaders matching exact table and card geometries (no jarring layout shifts).
- **Empty States:** Friendly contextual illustrations with actionable guidance (e.g., `"No bills found for September. [Upload a Bill]"`).
- **Error States:** Actionable alerts with "Retry" buttons, never raw system stack traces.
