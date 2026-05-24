# Shesha Cafe POS — Feature Inventory

> Last updated: 2026-05-24 | Stack: React 18 + TypeScript (frontend) · Express + PostgreSQL/Neon (backend)

---

## Feature Inventory Table

| # | Feature | Current Status | Missing Parts | Technical Risk |
|---|---------|---------------|---------------|----------------|
| 1 | [New Order](#1-new-order) | ✅ Complete | Receipt print, split bill, item customization (size/temp), barcode scan, order edit after submit | **Low** — fully wired to backend API; orders persist to PostgreSQL |
| 2 | [Manage Orders](#2-manage-orders) | ✅ Complete | Real-time push/polling, kitchen display mode, sound alerts, order editing, "cancelled" tab | **Medium** — no polling/WebSocket; elapsed time display is static (no re-render timer) |
| 3 | [Menu Management](#3-menu-management) | ✅ Complete | Image/photo upload (emoji only), new category creation, price history, bulk toggle, drag-to-reorder | **Low** — all CRUD operations fully wired to API; menu changes persist to DB |
| 4 | [Membership](#4-membership) | ✅ Complete | Member edit (name/phone/email), membership tiers, points/rewards system, order history per member, bulk CSV | **Low** — phone lookup is exact-match only; deleting a member sets `member_id = null` on linked orders |
| 5 | [Sales Summary](#5-sales-summary) | ✅ Complete | Date range picker, CSV/PDF export, trend comparison, member analytics, profit margin, daily/weekly breakdown | **Low** — hourly chart bar height is pixel-capped at 80px; all aggregation computed on every render |
| 6 | [Backend API](#6-backend-api) | ✅ Complete | Rate limiting, request validation/sanitization | **Low** — fully connected; all frontend actions go through `src/api.ts` → Express → PostgreSQL |
| 7 | [Data Persistence](#7-data-persistence) | ✅ Complete | — | **Low** — PostgreSQL on Neon; schema auto-created on startup; seed data loads once |
| 8 | [Authentication / Authorization](#8-authentication--authorization) | ✅ Complete | Admin role, PIN change from UI, account deactivation UI | **Low** — JWT sessions via HTTP-only cookie; role-based route access enforced |
| 9 | [Receipt / Print](#9-receipt--print) | ❌ Missing | Receipt generation (HTML/PDF), thermal printer support, email/SMS receipt | **Medium** — no print layout exists; needs CSS `@media print` or PDF library |
| 10 | [Sidebar Navigation](#10-sidebar-navigation) | ✅ Complete | Keyboard navigation / accessibility attributes | **Low** — role-filtered nav fully implemented; badge count is O(n) over a small array |
| 11 | [Settings / Staff Management](#11-settings--staff-management) | ✅ Complete | PIN change from UI | **Low** — managers can create/edit staff accounts and assign roles |

---

## Feature Details

### 1. New Order
**File:** `src/components/OrderPage.tsx`

**What works:**
- Browse all menu items in a grid; search by name; filter by category chip
- Add to cart, adjust quantity, add per-item text note
- Member lookup by phone number → auto-applies 10% discount
- Manual extra discount field (capped at remaining subtotal)
- Payment method: Cash / Card / QR
- 7% Thai VAT calculation on post-discount amount; live subtotal/total
- Order submitted via `POST /api/orders` — persisted to PostgreSQL
- Success toast with order number and savings amount

**Missing:**
- No item customization options (hot/iced, size, sugar level)
- No split bill or partial payment
- No way to edit an order after it is placed
- No receipt printed or emailed at checkout
- No barcode/QR scanner for fast item lookup

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
- Status changes call `PUT /api/orders/:id/status` and persist

**Missing:**
- No real-time updates — changes from another browser tab or device require a page refresh
- Elapsed time display is calculated once at render and never ticks
- No kitchen display (KDS) mode — full-screen, auto-sorted by urgency
- No sound or visual alert when a new pending order arrives
- No ability to modify an order once placed

---

### 3. Menu Management
**File:** `src/components/MenuManagePage.tsx`

**What works:**
- Searchable, filterable table of all items
- Toggle `available` flag inline (hides/shows on Order page instantly)
- Edit any field: name, price, category, emoji, description
- Add new item; delete with inline confirmation
- All changes call the API (`POST/PUT/DELETE /api/menu`) and persist to DB

**Missing:**
- No photo upload — only emoji; no image URL field
- Cannot add new categories (hardcoded: coffee, tea, smoothie, food, bakery)
- No price history or audit log
- No bulk availability toggle
- No drag-to-reorder within a category

---

### 4. Membership
**File:** `src/components/MembershipPage.tsx`

**What works:**
- Register members with name, phone (unique), optional email via `POST /api/members`
- Search by name or phone
- View per-member stats: total orders and total spent (kept in sync by order creation transaction)
- Delete with two-step confirmation; calls `DELETE /api/members/:id`
- Membership badge on sidebar showing total count

**Missing:**
- No edit — once registered, name/phone/email cannot be changed
- No membership tiers or variable discount rates (fixed 10%)
- No points / rewards system
- No per-member order history page
- No bulk CSV import or export

**Technical note:** Phone lookup uses exact-match. `ON DELETE SET NULL` in DB means deleting a member leaves orders with `member_id = null` — no discount rollback.

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

---

### 6. Backend API
**Files:** `server/server.js`, `server/db.js`, `server/routes/`

**What works:**
- Express + PostgreSQL with auto-schema creation on startup via `initDB()`
- Full CRUD: `GET/POST/PUT/DELETE` for menu items, members, orders
- Transactional order creation (order + order_items + member stats update in one `BEGIN/COMMIT`)
- Seed data loads automatically if `menu_items` table is empty
- `order_items` snapshots item name/price/emoji/category at time of order (immune to later menu edits)
- Route structure: `server/routes/menu.js`, `orders.js`, `members.js`, `auth.js`, `staff.js`
- Auth routes: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `GET /api/auth/staff`
- Session handling: JWT stored in HTTP-only cookie; `credentials: 'include'` on all API calls
- All frontend actions flow through `src/api.ts` → `/api/...` proxy → Express → Neon PostgreSQL

**Missing:**
- No request validation or sanitization on Express routes
- No rate limiting
- No CORS configuration (same-origin in production via Express static serving)

---

### 7. Data Persistence
**What works:**
- All orders, menu changes, and members persist to PostgreSQL on Neon
- Database connection via `DATABASE_URL` env var in `server/.env`
- Schema is created idempotently by `initDB()` on every server start — no migration tool needed
- `App.tsx` loads all startup data in a single `Promise.all([fetchMenu(), fetchOrders(), fetchMembers()])` on login
- Optimistic local state updates after mutations; no full re-fetch needed

**Missing:** Nothing critical for production use.

---

### 8. Authentication / Authorization
**Files:** `src/components/LoginPage.tsx`, `server/routes/auth.js`, `server/routes/staff.js`

**What works:**
- Login screen: staff selects their name from a dropdown, enters a 4-digit PIN
- `POST /api/auth/login` validates PIN and issues a JWT in an HTTP-only cookie
- `GET /api/auth/me` restores session on page reload — no re-login required after refresh
- `POST /api/auth/logout` clears the cookie
- Two roles: **Cashier** (New Order + Manage Orders only) and **Manager** (all pages)
- Navigation guard in `App.tsx:navigate()` — cashiers cannot reach restricted pages
- Sidebar filtered by role via `ALL_NAV` array with `roles` field per nav item
- Staff accounts have `active` flag; inactive accounts cannot log in
- `GET /api/auth/staff` returns names only (no PINs) for the login dropdown

**Missing:**
- Admin role (super-manager who can manage other managers)
- PIN change from the UI (requires server support)
- Account deactivation UI (data model supports it; no frontend yet)

---

### 9. Receipt / Print
**What works:** Only a success toast is shown after placing an order.

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
- Nav items filtered by logged-in user's role at render time (`ALL_NAV.filter(item => item.roles.includes(user.role))`)
- Cashier sees: New Order, Manage Orders
- Manager sees: New Order, Manage Orders, Menu, Members, Summary, Settings
- Three responsive layouts: desktop (220px full sidebar), tablet (64px icon-only), mobile (top bar + bottom nav)
- Active-order badge (pending + preparing) on Manage Orders
- Member count badge on Membership (desktop + tablet only)
- Logged-in user name, role label, and Sign Out button shown in all layouts

**Missing:**
- No keyboard navigation / accessibility attributes (`aria-current`, focus management)

---

### 11. Settings / Staff Management
**File:** `src/components/SettingsPage.tsx`

**What works:**
- Manager-only page (Cashier role cannot navigate here)
- View all staff accounts with name, role, and active status
- Add new staff account with name, role, and PIN via `POST /api/staff`
- Edit existing staff (name, role, active status) via `PUT /api/staff/:id`
- Staff data fetched from `GET /api/staff`

**Missing:**
- No PIN change from the UI — staff must ask manager to reset via DB directly
- No account deactivation toggle (data model supports `active` flag)

---

## Summary Scorecard

| Layer | Status |
|-------|--------|
| UI / Frontend pages | ✅ 6/6 complete (+ Login) |
| In-memory state management | ✅ Fully functional |
| Backend server (Express + PG) | ✅ Complete |
| Frontend ↔ Backend integration | ✅ Fully connected |
| Data persistence (Neon PostgreSQL) | ✅ Complete |
| Authentication (JWT + session) | ✅ Complete |
| Role-based access (Cashier / Manager) | ✅ Complete |
| Receipt / Print | ❌ Not implemented |
| Tests (unit / e2e) | ❌ None |
| Error handling (API errors) | ✅ Basic (inline error states, retry) |
