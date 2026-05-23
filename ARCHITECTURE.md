---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments:
  - src/App.tsx
  - src/api.ts
  - src/types/index.ts
  - src/components/OrderPage.tsx
  - src/components/ManageOrderPage.tsx
  - src/components/MenuManagePage.tsx
  - src/components/MembershipPage.tsx
  - src/components/SummaryPage.tsx
  - server/server.js
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/schema-improvements.md
  - FEATURES.md
workflowType: architecture
project_name: Shesha Cafe POS
user_name: Suthidakhrueanak
date: '2026-05-23'
---

# ARCHITECTURE.md — Shesha Cafe POS

> Version: 1.0 · Date: 2026-05-23  
> Status: Current state documentation  
> Source: Full codebase analysis + live database audit

---

## Table of Contents

1. [Frontend Flow](#1-frontend-flow)
2. [State Flow](#2-state-flow)
3. [PostgreSQL Integration](#3-postgresql-integration)
4. [Order Lifecycle](#4-order-lifecycle)
5. [Member Flow](#5-member-flow)
6. [Future Backend Separation Considerations](#6-future-backend-separation-considerations)

---

## 1. Frontend Flow

### Runtime Architecture

The frontend is a single-page application (SPA). There is no client-side router — page navigation is controlled entirely by a `page` string in React state. Vite serves the app on port `5173` and proxies all `/api/*` requests to Express on port `3001`.

```
index.html
  └── main.tsx            (React root mount)
        └── App.tsx        (state owner + page switcher)
              ├── Sidebar.tsx
              └── <ActivePage />  (one of 5 page components)
```

### Component Tree

```
App.tsx  ← owns ALL shared state
│
├── Sidebar.tsx
│     • Reads: orders[], members[]
│     • Renders: nav badges (pending count, member count)
│
├── OrderPage.tsx          [page === 'order']
│     • Reads:  menuItems[], cart[]
│     • Calls:  onAddToCart, onUpdateCartItem, onClearCart
│     │         onPlaceOrder (async), onFindMember
│     └── MenuCard (local)
│     └── CartItem (local, has per-item note toggle)
│
├── ManageOrderPage.tsx    [page === 'manage']
│     • Reads:  orders[]
│     • Calls:  onUpdateStatus (async), onDeleteOrder (async)
│
├── MenuManagePage.tsx     [page === 'menu']
│     • Reads:  menuItems[]
│     • Calls:  onUpdateItem (async), onAddItem (async), onDeleteItem (async)
│     └── ItemForm (local, handles both add and edit)
│
├── MembershipPage.tsx     [page === 'members']
│     • Reads:  members[]
│     • Calls:  onAddMember (async), onDeleteMember (async)
│     └── MemberCard (local)
│
└── SummaryPage.tsx        [page === 'summary']
      • Reads:  orders[] (derives all analytics locally)
      • Calls:  none (read-only page)
```

### Page Rendering Pattern

No React Router — `App.tsx` uses conditional rendering:

```tsx
// App.tsx
{page === 'order'   && <OrderPage   ... />}
{page === 'manage'  && <ManageOrderPage ... />}
{page === 'menu'    && <MenuManagePage  ... />}
{page === 'summary' && <SummaryPage    ... />}
{page === 'members' && <MembershipPage ... />}
```

When a page is not active its component is **unmounted** — local UI state
(search text, open forms, etc.) resets on every navigation. This is intentional
for simplicity at current scale.

### Styling

All styles are inline `style={{}}` objects — no CSS files, no Tailwind, no CSS
modules. Theme tokens are repeated inline across components. The color palette:

| Token | Hex | Semantic use |
|-------|-----|-------------|
| primary | `#758650` | Sidebar, headings, confirm buttons |
| accent | `#B5C267` | Category chips, active state |
| highlight | `#FFE27C` | Badges, order numbers |
| cta | `#E8B634` | Place Order, Register buttons, prices |
| surface | `#F8F9F8` | Page backgrounds |
| muted | `#C9B6A1` | Placeholder text, subtle borders |

### Loading & Error States

`App.tsx` owns the top-level async lifecycle:

```
mount → setLoading(true)
      → Promise.all([fetchMenu, fetchOrders, fetchMembers])
      → success: setLoading(false), populate state
      → failure: setError(message), show ErrorScreen with Retry
```

`<LoadingScreen />` and `<ErrorScreen />` are rendered at the App level and
replace the entire UI until the initial load resolves.

---

## 2. State Flow

### Ownership Model

All shared state lives in `App.tsx`. Child components receive data as props
and mutate it only through callback props. No context, no external store.

```
App.tsx state slices
┌─────────────────────────────────────────────┐
│  managedMenu   MenuItem[]   ← from DB        │
│  orders        Order[]      ← from DB        │
│  members       Member[]     ← from DB        │
│  cart          OrderItem[]  ← local only     │
│  page          Page         ← local only     │
│  loading       boolean      ← boot only      │
│  error         string|null  ← boot only      │
└─────────────────────────────────────────────┘
         │ props + callbacks
         ▼
    Child components
    (read-only view of state,
     mutate via async callbacks)
```

### Data Flow Direction

```
DB → fetchOnMount → App state → props → Component renders

User action → Component calls async callback
                    → callback calls api.ts
                          → HTTP to Express
                                → SQL to PostgreSQL
                          ← Order/Member/MenuItem returned
                    → App state updated (optimistic local update)
               ← Component re-renders with new state
```

### Callback Signatures (App.tsx → Child)

Every mutation callback is `async` and calls the API before updating state.
On API failure the callback throws — the child component catches and shows
an inline error toast.

| Callback | Signature | State updated |
|----------|-----------|---------------|
| `placeOrder` | `(items, opts) => Promise<Order>` | orders, cart, members |
| `updateOrderStatus` | `(id, status) => Promise<void>` | orders |
| `deleteOrder` | `(id) => Promise<void>` | orders |
| `updateMenuItem` | `(item) => Promise<void>` | managedMenu |
| `addMenuItem` | `(item) => Promise<void>` | managedMenu |
| `deleteMenuItem` | `(id) => Promise<void>` | managedMenu |
| `addMember` | `(data) => Promise<Member>` | members |
| `deleteMember` | `(id) => Promise<void>` | members |
| `findMemberByPhone` | `(phone) => Member\|undefined` | — (read-only) |

### Cart State

`cart` is the only state slice that never touches the API. It lives entirely
in the browser and is cleared by `placeOrder` on success.

```
addToCart(item)
  → if item already in cart: increment quantity
  → else: append { menuItem, quantity: 1 }

updateCartItem(id, qty, note?)
  → qty <= 0: remove item
  → qty > 0:  update quantity and optional note

clearCart()  → []
```

### State Update After placeOrder

```tsx
// 1. API call succeeds → server returns the saved Order
const order = await api.createOrder(payload)

// 2. Prepend new order to list (newest first)
setOrders(prev => [order, ...prev])

// 3. Clear cart
setCart([])

// 4. Optimistically update member stats (mirrors what the DB did)
if (memberId) {
  setMembers(prev => prev.map(m =>
    m.id === memberId
      ? { ...m, totalOrders: m.totalOrders + 1,
                totalSpent:  m.totalSpent  + total }
      : m
  ))
}
```

---

## 3. PostgreSQL Integration

### Connection Architecture

```
server.js
  └── pg.Pool({ connectionString: process.env.DATABASE_URL })
        • Pool manages multiple connections
        • Most routes use pool.query() (auto-acquire/release)
        • placeOrder uses pool.connect() for manual transaction control
```

### Schema (Live — confirmed 2026-05-23)

```sql
menu_items
  id            VARCHAR(20)   PK
  name          VARCHAR(100)  NOT NULL
  category      VARCHAR(20)   NOT NULL
  price         INTEGER       NOT NULL        -- Thai Baht, no decimals
  description   TEXT          DEFAULT ''
  emoji         VARCHAR(10)   DEFAULT '☕'
  available     BOOLEAN       DEFAULT true

members
  id            VARCHAR(20)   PK
  name          VARCHAR(100)  NOT NULL
  phone         VARCHAR(20)   NOT NULL  UNIQUE
  email         VARCHAR(100)
  joined_at     TIMESTAMPTZ   DEFAULT now()
  total_spent   INTEGER       DEFAULT 0
  total_orders  INTEGER       DEFAULT 0

orders
  id              VARCHAR(20)   PK
  order_number    INTEGER       DEFAULT nextval('order_number_seq')
  status          VARCHAR(20)   DEFAULT 'pending'
  table_number    INTEGER
  customer_name   VARCHAR(100)
  created_at      TIMESTAMPTZ   DEFAULT now()
  completed_at    TIMESTAMPTZ
  total           INTEGER       NOT NULL
  discount        INTEGER       DEFAULT 0
  member_discount INTEGER       DEFAULT 0
  tax             INTEGER       DEFAULT 0
  payment_method  VARCHAR(10)
  member_id       VARCHAR(20)   FK → members(id)  ON DELETE SET NULL

order_items
  id             SERIAL        PK
  order_id       VARCHAR(20)   NOT NULL  FK → orders(id)  ON DELETE CASCADE
  menu_item_id   VARCHAR(20)             -- no FK (loose reference)
  item_name      VARCHAR(100)  NOT NULL  -- snapshot at order time
  item_price     INTEGER       NOT NULL  -- snapshot at order time
  item_emoji     VARCHAR(10)   DEFAULT ''
  item_category  VARCHAR(20)   DEFAULT ''
  quantity       INTEGER       NOT NULL  DEFAULT 1
  note           TEXT          DEFAULT ''
```

### Relationship Map

```
menu_items
    │
    │ menu_item_id (nullable, no FK enforced — loose reference)
    ▼
order_items ──── order_id ────► orders ──── member_id ────► members
   ON DELETE                  ON DELETE                   ON DELETE
   CASCADE                    SET NULL                    SET NULL
```

### API Route → SQL Mapping

| HTTP | Route | SQL operation |
|------|-------|---------------|
| GET | `/api/menu` | `SELECT * FROM menu_items ORDER BY category, name` |
| POST | `/api/menu` | `INSERT INTO menu_items … RETURNING *` |
| PUT | `/api/menu/:id` | `UPDATE menu_items SET … WHERE id=$1 RETURNING *` |
| DELETE | `/api/menu/:id` | `DELETE FROM menu_items WHERE id=$1` |
| GET | `/api/members` | `SELECT * FROM members ORDER BY joined_at DESC` |
| GET | `/api/members/phone/:phone` | `SELECT * FROM members WHERE phone=$1` |
| POST | `/api/members` | `INSERT INTO members … RETURNING *` |
| DELETE | `/api/members/:id` | `DELETE FROM members WHERE id=$1` |
| GET | `/api/orders` | `SELECT orders + order_items JOIN` |
| POST | `/api/orders` | Transaction: INSERT orders + order_items + UPDATE members |
| PUT | `/api/orders/:id/status` | `UPDATE orders SET status=$1 WHERE id=$2` |
| DELETE | `/api/orders/:id` | `DELETE FROM orders WHERE id=$1` (cascades items) |

### Schema Initialization

On every server start, `initDB()` runs:

```
CREATE TABLE IF NOT EXISTS menu_items  …
CREATE TABLE IF NOT EXISTS members     …
CREATE SEQUENCE IF NOT EXISTS order_number_seq …
CREATE TABLE IF NOT EXISTS orders      …
CREATE TABLE IF NOT EXISTS order_items …

SELECT COUNT(*) FROM menu_items
  → if 0: INSERT 26 seed items
```

Safe to restart — `IF NOT EXISTS` makes it idempotent.

### Known Integrity Gaps (fix roadmap in schema-improvements.md)

| Gap | Risk |
|-----|------|
| No `CHECK` on `orders.status` | Invalid status strings accepted |
| No `CHECK` on `orders.payment_method` | Invalid payment strings accepted |
| No FK on `order_items.menu_item_id` | Stale IDs undetected |
| Nullable `status`, `order_number` | Can be set to NULL explicitly |
| `total_spent` not decremented on cancel/delete | Member stats drift over time |

---

## 4. Order Lifecycle

### Status State Machine

```
         ┌─────────┐
         │ pending │ ◄── created by placeOrder
         └────┬────┘
              │ "Start Preparing"
         ┌────▼────────┐
         │  preparing  │
         └────┬────────┘
              │ "Mark Ready"
         ┌────▼────┐
         │  ready  │
         └────┬────┘
              │ "Complete"
         ┌────▼──────────┐
         │   completed   │ ◄── completedAt timestamp set
         └───────────────┘

  Any active state ──► cancelled  (Cancel button)
  completed / cancelled ──► deleted (Remove button)
```

### Creation Flow (detailed)

```
1. BROWSER — OrderPage.tsx:77
   handlePlaceOrder() fires on button click
   Guards: cart.length === 0 → abort | submitting → abort (debounce)

2. BROWSER — OrderPage.tsx:48–54
   Local total calculation:
   subtotal        = Σ(price × qty)
   memberDiscount  = subtotal × 0.10  (if member active)
   manualDiscount  = cashier input (capped at remaining subtotal)
   tax             = Math.round((subtotal - discounts) × 0.07)
   total           = subtotal - discounts + tax

3. BROWSER — App.tsx:57
   api.createOrder({ items, total, tax, discount, memberDiscount,
                     paymentMethod, tableNumber, customerName, memberId })

4. NETWORK — fetch POST /api/orders
   Vite proxy forwards: localhost:5173/api → localhost:3001/api

5. SERVER — server.js:244
   pool.connect() → dedicated connection for transaction
   BEGIN

   INSERT INTO orders (id, table_number, customer_name, discount,
     member_discount, tax, total, payment_method, member_id)
   VALUES (genId(), …) RETURNING *
   → order_number auto-assigned by SEQUENCE

   for each item in items:
     INSERT INTO order_items (order_id, menu_item_id,
       item_name, item_price, item_emoji, item_category, quantity, note)
     → item_name/item_price are SNAPSHOTS — immune to future menu edits

   if memberId:
     UPDATE members
     SET total_orders = total_orders + 1,
         total_spent  = total_spent  + total
     WHERE id = memberId

   COMMIT  (all three writes succeed, or all roll back)

6. SERVER — server.js:125
   mapOrder() converts snake_case DB columns → camelCase JS object
   HTTP 200 JSON response

7. BROWSER — App.tsx:69
   setOrders(prev => [order, ...prev])   prepend to list
   setCart([])                           clear cart
   setMembers(prev => update stats)      sync member display

8. BROWSER — OrderPage.tsx:90
   setLastOrder(order)
   setShowSuccess(true)  → toast "✓ Order #N placed — ฿XXX"
   setTimeout(hide toast, 3500ms)
```

### Cancellation & Deletion

```
Cancel order
  → onUpdateStatus(id, 'cancelled')
  → api.updateOrderStatus  PUT /api/orders/:id/status
  → UPDATE orders SET status='cancelled' WHERE id=$1
  → Local: setOrders(map status)
  ⚠ member.total_spent is NOT decremented (known gap)

Delete order (completed or cancelled only)
  → onDeleteOrder(id)
  → api.deleteOrder  DELETE /api/orders/:id
  → DELETE FROM orders WHERE id=$1
  → order_items CASCADE deleted automatically
  → Local: setOrders(filter out)
```

---

## 5. Member Flow

### Registration Flow

```
1. MembershipPage — "Register Member" button
   → setShowForm(true)

2. User fills: name (required), phone (required, unique), email (optional)

3. validate()
   → name empty?  → error
   → phone empty? → error
   → phone already in members[]? → "Phone already registered" error
      (Note: checked against local state, not DB — race condition possible
       if two tabs are open simultaneously)

4. onAddMember({ name, phone, email })
   → api.createMember  POST /api/members
   → INSERT INTO members (id, name, phone, email)
      phone UNIQUE constraint enforced at DB level (authoritative check)
   → Returns new Member with server-assigned id, joined_at

5. App.tsx: setMembers(prev => [member, ...prev])
   Success toast: "✓ {name} registered as member!"
```

### Order-time Lookup Flow

```
OrderPage — cashier types phone number in Member Lookup box

onFindMember(phone)
  → members.find(m => m.phone === phone.trim())
  → SYNCHRONOUS local search (no API call)
  → returns Member | undefined

Found:
  setActiveMember(member)
  setCustomerName(member.name)     ← auto-fills customer name
  memberDiscountAmt = Math.round(subtotal × 0.1)

Not found:
  setMemberNotFound(true)          ← red border + "No member found" hint
```

### Discount Calculation

```
subtotal          = Σ(item.price × qty)
memberDiscount    = activeMember ? Math.round(subtotal × 0.10) : 0
manualDiscount    = Math.min(cashierInput, subtotal - memberDiscount)
discounted        = subtotal - memberDiscount - manualDiscount
tax               = Math.round(discounted × 0.07)
total             = discounted + tax
```

Both discount amounts are stored separately in the `orders` table
(`member_discount` and `discount`) so receipts can show the full breakdown.

### Stats Update Flow

```
Order placed with member:
  DB:    UPDATE members SET total_orders+1, total_spent+total
  Local: setMembers(map → update matching member)

Order cancelled:
  DB:    no change to members ← known gap
  Local: no change to members

Order deleted:
  DB:    no change to members ← known gap
  Local: no change to members

Member deleted:
  DB:    UPDATE orders SET member_id = NULL (ON DELETE SET NULL)
         member stats row is gone
  Local: setMembers(filter out deleted member)
         orders in state still show memberId (until next page load)
```

### Member Data Diagram

```
Member
  id            VARCHAR(20)
  name          VARCHAR(100)
  phone         VARCHAR(20)   UNIQUE  ← authoritative dedup
  email         VARCHAR(100)  optional
  joined_at     TIMESTAMPTZ
  total_orders  INTEGER       denormalized ← can drift
  total_spent   INTEGER       denormalized ← can drift
       │
       │ member_id FK (SET NULL on delete)
       ▼
    orders (many)
```

---

## 6. Future Backend Separation Considerations

The current architecture couples frontend and backend tightly:
one repo, one deploy, one Express process. As the system grows, here
are the considerations for separating them cleanly.

### Current Coupling Points

| Coupling | File | What it means |
|----------|------|---------------|
| Vite proxy | `vite.config.ts` | Dev-only workaround — production must use a real reverse proxy or CORS |
| Shared types | `src/types/index.ts` | TypeScript interfaces exist only in the frontend package |
| Single repo | `package.json` | Frontend and backend share one `npm install` |
| ID format | `server.js genId()` + frontend | Short random strings — no UUID contract |
| No auth layer | everywhere | Any separation requires auth to be added first |

### Option A — Monorepo Split (Recommended First Step)

Keep one repo, separate the packages:

```
POS/
├── packages/
│   ├── frontend/         (React + Vite)
│   │   └── package.json
│   ├── backend/          (Express + pg)
│   │   └── package.json
│   └── shared/           (TypeScript types)
│       └── package.json  ← MenuItem, Order, Member interfaces
└── package.json          (workspace root)
```

**Benefits:**
- Shared TypeScript types become a contract between frontend and backend
- Independent `npm install` and deploy per package
- No circular dependencies
- Types stay in sync without duplication

**Steps to get there:**
1. Extract `src/types/index.ts` → `packages/shared/types.ts`
2. Update imports in both frontend and server
3. Configure npm workspaces in root `package.json`
4. Add `shared` as a dependency in both `frontend` and `backend`

### Option B — Separate Repositories

When the team grows or CI pipelines diverge:

```
shesha-pos-frontend/   (React SPA → deploy to CDN / Vercel)
shesha-pos-api/        (Express → deploy to Railway / Render)
shesha-pos-types/      (shared npm package, versioned)
```

**Additional requirements before this is viable:**

1. **CORS** — Add `cors` middleware to Express:
   ```js
   app.use(cors({ origin: process.env.FRONTEND_URL }))
   ```

2. **Auth** — API routes must be protected. Recommended: JWT issued
   on login, sent as `Authorization: Bearer <token>` header.
   Frontend stores token in memory (not localStorage — XSS risk).

3. **Environment config** — Frontend needs `VITE_API_URL` env var
   instead of the Vite proxy:
   ```ts
   // api.ts
   const BASE = import.meta.env.VITE_API_URL || '/api'
   ```

4. **Versioned API** — Prefix all routes with `/v1/` before publishing
   as a standalone API to avoid breaking changes:
   ```
   /api/v1/menu
   /api/v1/orders
   /api/v1/members
   ```

### Option C — BFF Pattern (Backend for Frontend)

If a mobile app or third-party integrations are added later, a
Backend-for-Frontend layer can sit between the React app and a
core API service:

```
React SPA
    │
    ▼
BFF (Express — cafe-specific logic, auth, aggregation)
    │
    ▼
Core API (pure REST — menu, orders, members CRUD)
    │
    ▼
PostgreSQL
```

The current `server.js` already plays the BFF role — it handles
business logic (discount calculation, member stat updates) on top
of raw DB operations. Separating "business logic" from "data access"
is the natural split line.

### Real-time Order Updates (Required for Multi-device Use)

Whichever separation path is taken, real-time order push is the
highest-value feature to add. Current approach is manual refresh.

**Option 1 — Polling (simplest):**
```ts
// ManageOrderPage.tsx
useEffect(() => {
  const interval = setInterval(async () => {
    const fresh = await api.fetchOrders()
    setOrders(fresh)           // or lift to App.tsx
  }, 15_000)                   // every 15 seconds
  return () => clearInterval(interval)
}, [])
```

**Option 2 — Server-Sent Events (medium complexity):**
```js
// server.js — new route
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  // push on every order INSERT/UPDATE
})
```

**Option 3 — WebSocket (full duplex, highest complexity):**
Use `ws` or `socket.io`. Required if kitchen staff need
to push back "item 86'd" notifications to the cashier screen.

### Database Scalability Path

Current schema is appropriate for a single-cafe deployment.
For multi-location or SaaS scenarios:

```
Current:  single cafe_pos database
↓
Step 1:   add locations table + location_id FK on orders/menu_items
↓
Step 2:   Row-level security in PostgreSQL per location_id
↓
Step 3:   Schema-per-tenant (separate PostgreSQL schemas)
↓
Step 4:   Database-per-tenant (for full data isolation)
```

### Summary — Recommended Sequence

| Phase | Action | Unlocks |
|-------|--------|---------|
| Now | Apply `schema-improvements.md` constraints | Data integrity |
| Now | Add PIN auth gate to Express routes | Security baseline |
| Soon | Extract shared types to `packages/shared` | Type-safe API contract |
| Soon | Add CORS config + `VITE_API_URL` env var | Deploy frontend separately |
| Later | Add `/v1/` route prefix | Stable public API |
| Later | Add SSE or polling for real-time orders | Multi-device kitchen display |
| Future | Add `location_id` to support multi-site | SaaS/franchise expansion |
