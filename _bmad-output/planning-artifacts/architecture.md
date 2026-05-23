# Shesha Cafe POS — High-Level Architecture Overview

> Author: Winston (System Architect) · Date: 2026-05-23
> Status: **Current State + Gap Analysis** (not yet a target-state design)

---

## 1. System Overview

Shesha Cafe POS is a browser-based Point-of-Sale application for a single-location cafe. It covers the complete order lifecycle: menu browsing → cart → order placement → kitchen status tracking → sales reporting, with a membership discount system layered on top.

### Deployment context

```
┌─────────────────────────────────────────────────┐
│  Browser (single tab / single device)           │
│                                                 │
│  React SPA (Vite build, served static)          │
│  All state lives in React memory                │
│  Data resets on every page refresh              │
└────────────────────┬────────────────────────────┘
                     │ HTTP /api/*  (NOT currently wired)
                     ▼
┌─────────────────────────────────────────────────┐
│  Express 4 server  (server/server.js)           │
│  Single-file, CommonJS, port 3001               │
│  Raw SQL via `pg` Pool                          │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│  PostgreSQL                                     │
│  4 tables: menu_items, members, orders,         │
│            order_items                          │
└─────────────────────────────────────────────────┘
```

---

## 2. Frontend Architecture

### 2.1 Technology

| Concern | Choice | Notes |
|---------|--------|-------|
| UI framework | React 18 + TypeScript 5 | Functional components only |
| Build tool | Vite 5 | ESM, fast HMR |
| Styling | Inline CSS (`style={}`) | Zero external CSS dependency; consistent but verbose |
| Routing | Manual `useState<Page>` | No router library; page is a string union |
| State management | `useState` + `useCallback` lifted to `App.tsx` | Suitable for current 5-page scope |
| Icons | Emoji (native) | `lucide-react` installed but unused |
| Charts | Hand-rolled bar divs | No chart library |

### 2.2 Component Tree

```
App.tsx                         ← all shared state lives here
├── Sidebar.tsx                 ← navigation + badges
├── OrderPage.tsx               ← menu grid + cart panel
│   ├── MenuCard (local)
│   └── CartItem (local)
├── ManageOrderPage.tsx         ← order status board
├── MenuManagePage.tsx          ← menu CRUD table
├── MembershipPage.tsx          ← member register + list
│   └── MemberCard (local)
└── SummaryPage.tsx             ← analytics dashboard
    ├── KpiCard (local)
    └── StatBox (local)
```

### 2.3 State Model

All shared state is held in `App.tsx` as five `useState` slices:

| State slice | Type | Owner | How it flows |
|-------------|------|-------|--------------|
| `orders` | `Order[]` | App.tsx | Passed as props; mutated via callbacks |
| `cart` | `OrderItem[]` | App.tsx | Passed to OrderPage only |
| `managedMenu` | `MenuItem[]` | App.tsx | Derived from seed data; passed to Order + Menu pages |
| `members` | `Member[]` | App.tsx | Passed to Order + Membership pages |
| `page` | `Page` (string union) | App.tsx | Controls which page renders |

**Observation:** This is a valid "state at the top" pattern for a single-device, single-user app. It does not scale to multi-tab or multi-device use because state is not persisted.

### 2.4 Dead Code

`src/api.ts` contains a complete, well-typed REST client (fetch wrapper for all menu/member/order endpoints) that is **never imported anywhere**. It represents the intended integration layer but was never wired up.

---

## 3. Backend Architecture

### 3.1 Technology

| Concern | Choice | Notes |
|---------|--------|-------|
| Runtime | Node.js (CommonJS) | `server/server.js`, single file |
| HTTP framework | Express 4 | No middleware beyond `express.json()` |
| Database client | `pg` (Pool) | Raw SQL, no ORM or query builder |
| Schema management | `CREATE TABLE IF NOT EXISTS` on startup | No migration tool |
| ID generation | `Math.random().toString(36)` | Not UUID; collision probability low but non-zero at scale |
| Configuration | `dotenv` / `.env` file | `DATABASE_URL` only |

### 3.2 API Surface

All routes under `/api`. No versioning prefix.

```
GET    /api/menu
POST   /api/menu
PUT    /api/menu/:id
DELETE /api/menu/:id

GET    /api/members
GET    /api/members/phone/:phone
POST   /api/members
DELETE /api/members/:id

GET    /api/orders
POST   /api/orders          ← transactional: order + items + member stats
PUT    /api/orders/:id/status
DELETE /api/orders/:id
```

### 3.3 Database Schema

```
menu_items
  id (PK), name, category, price, description, emoji, available

members
  id (PK), name, phone (UNIQUE), email, joined_at,
  total_spent, total_orders

orders
  id (PK), order_number (SEQUENCE), status, table_number,
  customer_name, created_at, completed_at, total, discount,
  member_discount, tax, payment_method,
  member_id → members(id) ON DELETE SET NULL

order_items
  id (SERIAL PK), order_id → orders(id) ON DELETE CASCADE,
  menu_item_id, item_name, item_price, item_emoji, item_category,
  quantity, note
```

**Notable design choice:** `order_items` stores a snapshot of `item_name` and `item_price` at order time. This is correct — it means historical orders are unaffected by future menu edits.

**Notable gap:** `member_discount` is stored per order, but deleting a member sets `member_id = NULL` and does not roll back `total_spent` / `total_orders` on the member record (moot after deletion, but worth noting for soft-delete scenarios).

---

## 4. Integration Gap — The Critical Disconnect

This is the most important architectural finding.

### Why the API is not wired up

Two separate blockers exist simultaneously:

**Blocker 1 — Vite has no `/api` proxy configured**

`vite.config.ts` contains only:
```ts
export default defineConfig({ plugins: [react()] })
```

In development, `fetch('/api/menu')` goes to `http://localhost:5173/api/menu` — the Vite dev server — which returns 404. The Express server runs separately on port 3001. Without a proxy stanza, API calls cannot reach the backend during development.

Fix required in `vite.config.ts`:
```ts
server: {
  proxy: {
    '/api': 'http://localhost:3001'
  }
}
```

**Blocker 2 — `api.ts` is never imported**

Even with the proxy fixed, `App.tsx` does not import `src/api.ts`. The callbacks it passes down (`placeOrder`, `addMember`, etc.) are synchronous, in-memory functions. They would need to become `async` and call the API client.

### Integration effort estimate

| Task | Complexity |
|------|-----------|
| Add Vite proxy | Trivial (3 lines) |
| Add loading/error state to App.tsx | Low |
| Replace `placeOrder` with async API call | Low |
| Replace `addMember` / `deleteMember` with async calls | Low |
| Replace `updateMenuItem` / `addMenuItem` / `deleteMenuItem` | Low |
| Replace `updateOrderStatus` / `deleteOrder` | Low |
| Initial data load (fetch on mount instead of seed constants) | Low |
| Error boundary / fallback UI | Medium |
| **Total** | **~1–2 days of focused work** |

---

## 5. Key Architectural Gaps (Priority-Ordered)

| Priority | Gap | Impact | Recommended Fix |
|----------|-----|--------|----------------|
| P0 | No data persistence (API not wired) | All data lost on refresh | Wire `api.ts` into `App.tsx`; add Vite proxy |
| P0 | No authentication | Any user can access sales + admin screens | Add a simple PIN/password gate; role-based page guard |
| P1 | No real-time order updates | Kitchen misses new orders without manual refresh | Short-interval polling (`setInterval` + `fetchOrders`) or SSE |
| P1 | No CORS header on Express | Production deployment with separate domains will fail | Add `cors` middleware with allowed origins |
| P2 | No input validation on API routes | Malformed payloads can corrupt DB | Add schema validation (zod or express-validator) |
| P2 | No database migrations | `CREATE IF NOT EXISTS` is not safe for schema changes | Adopt a lightweight tool (node-pg-migrate or Flyway) |
| P3 | No error handling in UI | API failures are silent | Add try/catch + toast on every API call |
| P3 | No tests | Regressions go undetected | Add Vitest unit tests for price/discount math; Playwright for e2e |
| P4 | Single-file server | Hard to maintain as features grow | Split into `routes/`, `db/`, `middleware/` directories |
| P4 | `orderCounter` is module-level var | Resets on server restart if backend is not used | Use the DB sequence; remove the frontend counter |

---

## 6. Current vs. Target State

### Current state (demo)

```
Browser
  └── React SPA (in-memory state)
        All data lives here. Ephemeral.
```

### Target state (production-ready)

```
Browser
  └── React SPA
        ├── Async API calls (src/api.ts — already written)
        ├── Loading / error states
        └── Auth guard (PIN or JWT)

Vite dev proxy → Express (port 3001)
  ├── CORS middleware
  ├── Auth middleware
  ├── Input validation (zod)
  └── Route handlers (menu / members / orders)
        └── pg Pool → PostgreSQL
              ├── menu_items
              ├── members
              ├── orders
              └── order_items

Deployment (Railway)
  ├── Static frontend (Vite build served by Express or CDN)
  └── PostgreSQL managed database
```

The gap between current and target is smaller than it looks. The backend is complete and correct. The API client is written. The main work is: configure the proxy, make `App.tsx` async, and add auth.

---

## 7. Immediate Next Steps (Recommended Sequence)

1. **Add Vite proxy** (`vite.config.ts`) — 5 minutes, unblocks everything.
2. **Wire `api.ts` into `App.tsx`** — replace seed constants with `useEffect` fetch; replace callbacks with async API calls. Add minimal error toast. (~1 day)
3. **Add PIN-based auth** — a simple `useState('locked')` gate with a hardcoded or env-var PIN is sufficient for a single-cafe deployment. (~2 hours)
4. **Add polling for new orders** — `setInterval(fetchOrders, 15000)` in `ManageOrderPage`. (~30 minutes)
5. **Add CORS config to Express** — `app.use(cors({ origin: process.env.FRONTEND_URL }))`. (~15 minutes)

Steps 1–5 transform the app from a demo into a production-usable system without any architectural redesign.

---

## 8. Architecture Decisions Log

| Decision | Rationale | Trade-off |
|----------|-----------|-----------|
| Lifted state in `App.tsx` | Simple, no extra dependencies, appropriate for single-user scope | Prop-drilling increases as app grows; context or Zustand may be needed at 10+ pages |
| Inline CSS | No build-time CSS dependency, portable | Verbose; theming is copy-paste; hard to enforce consistency |
| Raw SQL in Express | No ORM overhead, full control | Manual query construction; schema changes require careful coordination |
| Order item snapshot | Historical orders accurate after menu edits | Slight data duplication; acceptable trade-off |
| Single-file server | Fast to write and reason about | Will need splitting once auth middleware, validation, and more routes are added |
| `Math.random()` IDs | No UUID library needed | Not cryptographically unique; fine at cafe scale, not for multi-tenant SaaS |
