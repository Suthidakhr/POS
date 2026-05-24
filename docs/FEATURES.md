# Shesha Cafe POS — Feature Inventory

> Generated: 2026-05-23 | Codebase: React 18 + TypeScript (frontend) · Express + PostgreSQL (backend, optional)

---

## Feature Inventory Table

| # | Feature | Current Status | Missing Parts | Technical Risk |
|---|---------|---------------|---------------|----------------|
| 1 | [New Order](#1-new-order) | ✅ Complete | Receipt print, split bill, item customization (size/temp), barcode scan, order edit after submit | **Medium** — `orderCounter` is a module-level var (resets on reload); `api.ts` exists but is dead code, not wired into `App.tsx` |
| 2 | [Manage Orders](#2-manage-orders) | ✅ Complete | Real-time push/polling, kitchen display mode, sound alerts for new orders, order editing, "cancelled" tab | **High** — elapsed time display is static (no re-render timer); no auto-refresh means kitchen staff miss new orders silently |
| 3 | [Menu Management](#3-menu-management) | ✅ Complete | Image/photo upload (emoji only), new category creation, price history, bulk toggle availability, drag-to-reorder | **Medium** — menu changes are in-memory only; `api.ts` CRUD calls exist but `App.tsx` never imports them |
| 4 | [Membership](#4-membership) | ✅ Complete | Member edit (name/phone/email), membership tiers, points/rewards system, order history per member, bulk import/CSV | **Low-Medium** — phone lookup is exact-match only; deleting a member silently nullifies linked order records (`ON DELETE SET NULL` in DB) |
| 5 | [Sales Summary](#5-sales-summary) | ✅ Complete | Date range picker, CSV/PDF export, trend comparison (period vs prior period), member analytics, profit margin, daily/weekly breakdown | **Low** — all aggregation computed on every render from in-memory state; hourly chart bar height is pixel-hardcoded (`max 80px`), breaks with very high revenue |
| 6 | [Backend API](#6-backend-api) | ⚠️ Partial | **Frontend never calls the API** — `App.tsx` uses in-memory state only; `api.ts` is completely unused | **Critical** — `server/server.js` and `src/api.ts` are implemented but disconnected; all data is lost on page refresh |
| 7 | [Data Persistence](#7-data-persistence) | ❌ Missing | No localStorage fallback; no backend integration from frontend; seed data hardcoded in `App.tsx` | **Critical** — every page reload wipes all orders, members, and menu changes |
| 8 | [Authentication / Authorization](#8-authentication--authorization) | ❌ Missing | Login screen, role management (cashier / manager / admin), session handling, protected routes | **Critical** — any user can access all pages including sales data and menu edits |
| 9 | [Receipt / Print](#9-receipt--print) | ❌ Missing | Receipt generation (HTML/PDF), thermal printer support, email/SMS receipt to customer | **Medium** — no print layout exists; adding one requires careful CSS `@media print` or a PDF library |
| 10 | [Sidebar Navigation](#10-sidebar-navigation) | ✅ Complete | Active-order badge shows all statuses (could filter to pending+preparing only) | **Low** — badge count loops all orders on every render; fine at current scale |

---

## Feature Details

### 1. New Order
**File:** `src/components/OrderPage.tsx`

**What works:**
- Browse 26 menu items in a grid; search by name; filter by category chip
- Add to cart, adjust quantity, add per-item text note
- Member lookup by phone number → auto-applies 10% discount
- Manual extra discount field (capped at remaining subtotal)
- Payment method: Cash / Card / QR
- 7% tax calculation; live subtotal/total
- Success toast with order number and savings amount

**Missing:**
- No item customization options (hot/iced, size, sugar level)
- No split bill or partial payment
- No way to edit an order after it is placed
- No receipt printed or emailed at checkout
- No barcode/QR scanner for fast item lookup

**Technical risk:** `orderCounter` is a module-level `let` in `App.tsx:11` — resets to 5 every reload. The `api.ts` file (`src/api.ts`) has all the API calls needed to persist orders but is **never imported** in `App.tsx`.

---

### 2. Manage Orders
**File:** `src/components/ManageOrderPage.tsx`

**What works:**
- Three tabs: Active (pending/preparing/ready) · Completed · All Orders
- Live badge counts per tab on sidebar
- Status progression: Pending → Preparing → Ready → Completed
- Cancel at any active stage
- Expand card to see full item list, discounts, tax, payment method
- Remove completed/cancelled orders from board

**Missing:**
- No real-time updates — new orders from the Order page only appear because they share the same React state; a second browser tab or a different device will not see them
- Elapsed time display (`ManageOrderPage.tsx:28–33`) is calculated once at render and never ticks
- No kitchen display (KDS) mode — full-screen, auto-sorted by urgency
- No sound or visual alert when a new pending order arrives
- No ability to modify an order once placed

**Technical risk:** Without a polling or WebSocket mechanism, the kitchen has no live view. This is acceptable for a single-device setup but breaks entirely in multi-device use.

---

### 3. Menu Management
**File:** `src/components/MenuManagePage.tsx`

**What works:**
- Searchable, filterable table of all items
- Toggle `available` flag inline (hides/shows on Order page instantly)
- Edit any field: name, price, category, emoji, description
- Add new item with a free-text emoji picker
- Delete with inline confirmation

**Missing:**
- No photo upload — only emoji; no image URL field
- Cannot add new categories (hardcoded: coffee, tea, smoothie, food, bakery in `src/types/index.ts:1`)
- No price history or audit log
- No bulk availability toggle (e.g., "hide all bakery items")
- No drag-to-reorder within a category

**Technical risk:** `handleAddNew` generates an ID with `Math.random()` (`MenuManagePage.tsx:36`). The backend uses its own `genId()` — these would collide if the API were ever wired up. `api.ts` exports `updateMenuItem`, `createMenuItem`, `deleteMenuItem` but `App.tsx` uses local callbacks only.

---

### 4. Membership
**File:** `src/components/MembershipPage.tsx`

**What works:**
- Register members with name, phone (unique), optional email
- Search by name or phone
- View per-member stats: total orders and total spent
- Stats update atomically when an order is placed (`App.tsx:126–131`)
- Delete with two-step confirmation
- Membership badge on sidebar showing total count

**Missing:**
- No edit — once registered, name/phone/email cannot be changed
- No membership tiers or variable discount rates (fixed 10%)
- No points / rewards system
- No per-member order history page
- No bulk CSV import or export

**Technical risk:** Phone lookup is exact-match (`App.tsx:178`). A trailing space or different format fails silently and shows "No member found." In the database schema, `ON DELETE SET NULL` means deleting a member leaves orphaned order records with `member_id = null` and no discount rollback.

---

### 5. Sales Summary
**File:** `src/components/SummaryPage.tsx`

**What works:**
- Period filter: Today / Last 7 Days / All Time
- KPI cards: Revenue, Orders Completed, Avg. Order Value, Items Sold
- Status row: Active orders count, Cancelled orders count, Total tax collected
- Revenue by Hour bar chart (7am–8pm)
- Payment method breakdown with progress bars (Cash / Card / QR)
- Top 8 selling items by quantity
- Revenue by category with color-coded bars
- Recent 10 completed orders table

**Missing:**
- No custom date range picker
- No export to CSV, Excel, or PDF
- No period-over-period comparison (e.g., today vs. yesterday)
- No member-specific analytics (top spenders, discount totals)
- No profit margin or cost tracking
- Summary is read-only; no drill-down into individual items from the chart

**Technical risk:** The hourly bar height is computed as `pct * 80` pixels (`SummaryPage.tsx:129`). With large revenue values this is fine, but the 80px max cap means all bars look similar in busy periods. All aggregations are recalculated on every render from the full orders array — acceptable for current seed data, would slow down with thousands of orders.

---

### 6. Backend API
**Files:** `server/server.js`, `src/api.ts`

**What works (server only):**
- Express + PostgreSQL with auto-schema creation on startup
- Full CRUD: GET/POST/PUT/DELETE for menu items, members, orders
- Transactional order creation (order + order_items + member stats update in one transaction)
- Seed data loads automatically if `menu_items` table is empty
- `member_discount` stored separately from manual `discount`
- `order_items` stores a snapshot of item name/price at time of order (safe against menu edits)

**What is missing / broken:**
- `src/api.ts` is **never imported** in `App.tsx` — the entire API layer is dead code
- No CORS configuration (would fail in production with a separate frontend domain)
- No request validation or sanitization on the Express routes
- No authentication on any API endpoint
- No rate limiting
- `railway.toml` references deployment but there is no CI/CD pipeline

**Technical risk — Critical:** The disconnect between `App.tsx` (in-memory) and `server/server.js` (PostgreSQL) means the project has two complete but incompatible data layers. Wiring them together requires replacing all `useState` callbacks in `App.tsx` with `async` API calls and handling loading/error states that do not currently exist.

---

### 7. Data Persistence
**What works:** Nothing persists beyond the current browser session.

**What is missing:**
- No `localStorage` / `sessionStorage` fallback for in-memory state
- `App.tsx` seed data (`SEED_ORDERS`, `SEED_MEMBERS`) is hardcoded and resets every reload
- Backend exists but frontend does not call it (see [Backend API](#6-backend-api))

**Technical risk — Critical:** All orders placed, members added, and menu changes made during a session are lost on refresh. This is acceptable for a demo but is a blocker for production use.

---

### 8. Authentication / Authorization
**What works:** Nothing — the app opens directly to the Order page with no login.

**What is missing:**
- Login screen (PIN or username/password)
- Role-based access: Cashier (order + manage), Manager (+ menu + members + summary), Admin (everything)
- Session persistence (JWT or cookie)
- Protected routes per role

**Technical risk — Critical:** Sales summary, member data, and menu prices are accessible to anyone who opens the URL.

---

### 9. Receipt / Print
**What works:** Nothing — only a success toast is shown after placing an order.

**What is missing:**
- Printable receipt layout (HTML or PDF)
- Thermal printer integration (ESC/POS protocol or browser print dialog)
- Digital receipt option (email or SMS)
- Re-print from order history

**Technical risk — Medium:** Adding `window.print()` with a CSS `@media print` stylesheet is straightforward. Thermal printer support requires a native bridge or a service like Star Micronics / Epson ePOS SDK.

---

### 10. Sidebar Navigation
**File:** `src/components/Sidebar.tsx`

**What works:**
- Five navigation items: New Order, Manage Orders, Menu, Summary, Members
- Active-order badge (pending + preparing + ready count) on Manage Orders
- Member count badge on Membership

**Missing:**
- Active badge includes `ready` orders — kitchen staff may want "ready" to display separately or not count as urgent
- No keyboard navigation / accessibility attributes (`aria-current`, focus management)

**Technical risk — Low:** Badge count (`orders.filter(...)`) runs on every render but is O(n) over a small array.

---

## Summary Scorecard

| Layer | Status |
|-------|--------|
| UI / Frontend pages | ✅ 5/5 complete |
| In-memory state management | ✅ Fully functional |
| Backend server (Express + PG) | ✅ Implemented |
| Frontend ↔ Backend integration | ❌ Not connected |
| Data persistence | ❌ None (in-memory only) |
| Authentication | ❌ Not implemented |
| Receipt / Print | ❌ Not implemented |
| Tests (unit / e2e) | ❌ None |
| Error handling (API errors) | ❌ None in UI |
