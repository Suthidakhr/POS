---
title: Shesha Cafe POS
status: final
created: 2026-05-23
updated: 2026-05-23
finalized: 2026-05-23
---

# PRD: Shesha Cafe POS

## 0. Document Purpose

This PRD is for the owner and developer of the Shesha Cafe POS system. It covers the **v1 production release** — the two capabilities that must be in place before the system can be safely used in a real cafe: **data persistence** (wiring the existing React frontend to the existing Express/PostgreSQL backend so data survives page reloads) and **role-based authentication** (separate cashier and manager access). Downstream: this PRD feeds implementation stories. Vocabulary is anchored to §3 Glossary. Features carry stable FR IDs for reference in stories and commits.

The existing codebase (React 18 + TypeScript + Vite frontend; Express + PostgreSQL backend deployed on Railway) has five working features implemented in-memory. The backend schema and API routes are already implemented but disconnected from the frontend. This PRD does not redesign the existing features — it specifies what it means to connect, secure, and ship them.

---

## 1. Vision

Shesha Cafe POS is a single-device point-of-sale system used by staff at Shesha Cafe to take customer orders, track order status, manage the menu, register and look up members, and review daily sales. It runs in a web browser on a counter device.

The current system works correctly as a demo — all five core features function — but loses all data on every page reload because the frontend runs entirely in-memory. The v1 production release has exactly two jobs: (1) make data permanent by connecting the frontend to the PostgreSQL backend that already exists, and (2) make the system safe to leave unattended by adding a login screen so cashiers cannot access sales data or menu prices.

When v1 ships, a cashier can start a shift, take orders all day, and at the end of the day a manager can review sales — all of which persists correctly whether the page is refreshed, the browser is closed, or the device is restarted.

---

## 2. Target User

### 2.1 Primary Personas

**Cashier** — a part-time staff member (2–3 per shift rotation) who operates the counter device. Their job is to take orders quickly and accurately. They should not need a manual; the interface must be learnable in under 10 minutes. They do not access sales data, menu prices, or membership records beyond phone-lookup at checkout.

**Manager** — the cafe owner or senior staff member (1 person). Uses the system to configure the menu, review daily and historical sales, and manage the membership list. Logs in less frequently but needs full access to all pages.

### 2.2 Jobs To Be Done

- **Cashier:** Take a customer's order without making mistakes; apply a member discount when a regular walks up; confirm payment quickly; hand off to kitchen without printing anything.
- **Manager:** Start the day confident that yesterday's orders are still there; add or price-change a menu item without calling a developer; understand how the cafe performed today in under 60 seconds; register a new member for a customer who asks.

### 2.3 Non-Users (v1)

- Kitchen staff on a dedicated kitchen display screen (no KDS in v1).
- Customers — no self-service kiosk or QR ordering in v1.
- Accountants or external finance systems — no accounting integration in v1.

### 2.4 Key User Journeys

**UJ-1. Cashier opens a shift and takes the first order of the day.**
- **Persona + context:** Cashier arriving in the morning; device may have been off overnight.
- **Entry state:** Browser open to login screen; no active session.
- **Path:** (1) Cashier selects their name and enters PIN → (2) lands on Order page → (3) browses menu, adds items → (4) customer mentions they're a member; cashier enters phone number → (5) discount applies automatically → (6) cashier selects Cash payment → (7) taps Place Order.
- **Climax:** Success toast shows order number; order appears immediately in Manage Orders with status Pending.
- **Resolution:** Order is persisted in PostgreSQL. If the page reloads now, the order is still there.
- **Edge case:** Member phone not found — cashier proceeds without discount; no error blocks the flow.

**UJ-2. Manager reviews yesterday's sales before opening.**
- **Persona + context:** Manager arriving early; wants to know yesterday's revenue before the first customer.
- **Entry state:** Browser closed since yesterday; no active session.
- **Path:** (1) Manager logs in with PIN → (2) navigates to Sales Summary → (3) selects "Yesterday" filter → (4) reads KPI cards and top items.
- **Climax:** Sales data from yesterday is present and accurate.
- **Resolution:** Manager navigates to Order page to prepare for the day.

**UJ-3. Manager updates a menu item price.**
- **Persona + context:** Manager raising the price of a latte mid-week.
- **Entry state:** Logged in as Manager.
- **Path:** (1) Navigates to Menu Management → (2) finds the item → (3) edits price → (4) saves.
- **Climax:** New price is immediately visible on the Order page in the same session and after reload.
- **Resolution:** Any order placed after the save uses the new price; orders placed before retain the old snapshot price.

---

## 3. Glossary

- **Session** — An authenticated browser context created after a successful PIN login. Persists until the user logs out or the token expires. Managed via an httpOnly cookie set by the server.
- **Role** — A set of page-access permissions assigned to a Staff account. Two roles exist: Cashier and Manager.
- **Cashier** (role) — May access: Order, Manage Orders. Cannot access: Menu Management, Membership, Sales Summary.
- **Manager** (role) — May access all pages including Menu Management, Membership, and Sales Summary.
- **PIN** — A numeric passcode used to authenticate a Staff account at the login screen. [ASSUMPTION: 4-digit PIN is sufficient for a small-team single-device cafe environment.]
- **Staff** — A system user (cashier or manager) with a name, hashed PIN, and role. Persisted in a `staff` table (new).
- **Order** — A transaction record containing one or more Order Items, a payment method, optional member discount, and a status. Persisted in the `orders` table.
- **Order Item** — A snapshot of one menu item at the time of order placement (name, price, quantity). Persisted in the `order_items` table. Immutable after creation.
- **Menu Item** — A product sold at the cafe. Has a name, category, price (Thai Baht integer), availability flag, and emoji. Persisted in the `menu_items` table.
- **Member** — A registered customer with a unique phone number. Eligible for a 10% discount on orders. Persisted in the `members` table.

---

## 4. Features

### 4.1 Data Persistence

**Description:** All data mutations that currently update React state in `App.tsx` must instead call the existing backend API (`/api/...` routes in `server/server.js`) and update local state only on a successful response. On app startup, all data (menu items, orders, members) must be loaded from the API. Data must survive page reloads, browser restarts, and Railway container restarts.

The existing API routes are complete and correct — this feature is a frontend wiring job. A loading indicator must be visible while the initial fetch completes, because the first paint will be empty until the API responds. Error states (API unreachable, server error) must surface a user-readable message with a retry option rather than a silent blank screen.

Realizes UJ-1 (order persists after placement), UJ-2 (yesterday's orders present on reload), UJ-3 (menu change persists).

**Functional Requirements:**

#### FR-1: App loads data from API on startup

On mount, the app fetches `/api/menu-items`, `/api/orders`, and `/api/members` in parallel. The UI shows a loading indicator until all three requests complete. If any request fails, the app shows a user-readable error message with a Retry button.

**Consequences (testable):**
- On first render, the Order page shows a loading state and no menu items until the API responds.
- After a full page reload, all orders placed in the previous session appear in Manage Orders.
- If the backend is unreachable, the app shows an error message — not a blank or partially populated screen.

#### FR-2: Order placement persists to PostgreSQL

When a cashier places an order, the app calls `POST /api/orders` with cart contents, payment method, discounts, and member ID (if any). On a 2xx response, the order is added to local state. On a non-2xx response, an error toast is shown and the cart is not cleared.

**Consequences (testable):**
- After placing an order and reloading, the order appears in Manage Orders with correct status, items, and totals.
- If the API returns an error, the cart remains intact and the cashier can retry.

**Out of Scope:** Optimistic UI (displaying the order before server confirmation). [NON-GOAL for MVP]

#### FR-3: Order status changes persist to PostgreSQL

When staff advance or cancel an order status (Pending → Preparing → Ready → Completed / Cancelled), the app calls `PUT /api/orders/:id`. On failure, the status reverts and an error toast is shown.

**Consequences (testable):**
- After changing an order status and reloading, the order shows the updated status.
- A failed status update does not change the displayed status.

#### FR-4: Menu item changes persist to PostgreSQL

When a manager adds, edits, or deletes a menu item, the app calls `POST /api/menu-items`, `PUT /api/menu-items/:id`, or `DELETE /api/menu-items/:id` respectively. On success, local state updates. On failure, an error toast is shown and local state reverts.

**Consequences (testable):**
- After editing a menu item price and reloading, the Order page shows the updated price.
- After deleting a menu item and reloading, the item no longer appears on the Order page.
- A failed save does not silently persist a partial change.

#### FR-5: Member changes persist to PostgreSQL

When a manager registers or deletes a member, the app calls `POST /api/members` or `DELETE /api/members/:id`. Member stats (total orders, total spent) update via the existing transactional order-creation endpoint.

**Consequences (testable):**
- After registering a member and reloading, the member appears in Membership.
- After placing an order with a member discount and reloading, the member's stats are updated.

**Feature-specific NFRs:**
- All API calls use relative `/api/...` paths — no hardcoded hostnames.
- Loading states required on initial data fetch; individual mutations may use optimistic state at developer discretion.
- Every failure path must surface a user-visible message — no silent swallowing of errors.

---

### 4.2 Authentication and Role-Based Access

**Description:** A login screen gates access to the entire app. Staff authenticate by selecting their name and entering a PIN. Two roles — Cashier and Manager — determine which pages are accessible. Sessions persist across reloads until logout or expiry. [ASSUMPTION: 24-hour session expiry is appropriate; cashiers open the app at shift start and close at end of day.]

A `staff` table is added to the database: `id`, `name`, `pin_hash`, `role`, `active`, `created_at`. PINs are hashed server-side (bcrypt). The login endpoint issues a signed JWT as an httpOnly, Secure, SameSite=Strict cookie. The frontend never touches the token directly — the browser sends the cookie automatically on every request. Protected routes return 401 if the cookie is absent or the token is invalid.

On first startup, if the `staff` table is empty, the server seeds one default Manager account (name: "Manager", PIN: 1234) so the system is accessible immediately after deployment. The manager should change this PIN after first login.

Realizes UJ-1 (cashier logs in before first order), UJ-2 (manager logs in to review sales).

**Functional Requirements:**

#### FR-6: Login screen

Unauthenticated users land on a login screen showing the cafe name, a staff name dropdown (populated from active Staff accounts), a PIN input, and a Login button. [ASSUMPTION: A name dropdown — not a free-text field — is preferred to reduce typos at the counter.]

**Consequences (testable):**
- Navigating to any app URL while unauthenticated redirects to the login screen.
- Correct PIN logs the user in and redirects to the Order page.
- Incorrect PIN shows an inline error; the PIN field clears.
- After 5 consecutive failed attempts, the account is locked for 15 minutes and shows a lockout message. [ASSUMPTION: This lockout policy is appropriate for a cafe environment.]

#### FR-7: Role-based page access

Cashier role: Order and Manage Orders only. Manager role: all pages. Attempting to navigate to a restricted page redirects to the Order page with a "Access restricted" toast.

**Consequences (testable):**
- A logged-in Cashier does not see sidebar links for Menu Management, Membership, or Sales Summary.
- Directly navigating to a restricted URL as a Cashier redirects to the Order page.
- A logged-in Manager sees and can access all pages.

#### FR-8: Session persistence

A valid non-expired httpOnly cookie automatically re-authenticates the user on page reload — no PIN re-entry required. The server validates the cookie on every protected request.

**Consequences (testable):**
- After placing an order and reloading, the cashier remains logged in on the Order page.
- After cookie expiry (24 hours), the next page load redirects to the login screen.
- JavaScript cannot read or modify the session cookie (httpOnly enforced).

#### FR-9: Logout

A logout button is accessible from the sidebar for all roles. Tapping Logout calls `POST /api/auth/logout`, which clears the httpOnly cookie server-side, then redirects to the login screen.

**Consequences (testable):**
- After logout, the browser back button does not return to an authenticated page.
- The session cookie is cleared on logout; subsequent API requests return 401.

#### FR-10: Staff account management (Manager only)

A Manager can view, add, and deactivate Staff accounts from a **Settings** screen accessible via a dedicated sidebar link. Adding a Staff account requires: name, role, and PIN (entered twice to confirm). Deactivating an account prevents that account from logging in but does not delete historical data. The default seeded Manager account is visible here and its PIN can be changed.

**Consequences (testable):**
- A Manager can add a new Cashier account; that account can log in immediately.
- A deactivated account cannot log in.
- A Cashier cannot access the staff settings screen.

**Feature-specific NFRs:**
- PINs must be hashed with bcrypt (minimum cost factor 10) before storage; never logged or returned by any API response.
- Session cookie must be set with `httpOnly`, `Secure`, and `SameSite=Strict` flags.
- `JWT_SECRET` must be read from an environment variable; the server must refuse to start if it is absent.
- All protected API routes must validate the session cookie and return 401 on missing or invalid tokens.

---

## 5. Non-Goals (Explicit)

- **Receipt printing** — no print layout, thermal printer, or digital receipt in v1. [NOTE FOR PM: Most commonly requested missing feature; schedule for v2.]
- **Item customization** — no hot/iced, size, or sugar level per Order Item in v1.
- **Membership tiers or points** — fixed 10% member discount only; no tier logic or rewards in v1.
- **Real-time multi-device updates** — single-device system; no WebSocket or polling for cross-device sync in v1.
- **Kitchen display screen (KDS)** — no dedicated kitchen view; verbal handoff only in v1.
- **Sales data export** — no CSV, PDF, or Excel export in v1.
- **Self-service or QR ordering** — counter staff only; no customer-facing interface in v1.
- **Offline mode** — app requires connectivity to Railway-hosted backend; no localStorage fallback for offline use.
- **More than two roles** — exactly Cashier and Manager; no Admin role, no custom permission sets in v1.

---

## 6. MVP Scope

### 6.1 In Scope

- Wire all five existing in-memory features (Order, Manage Orders, Menu Management, Membership, Sales Summary) to the existing PostgreSQL backend API.
- Loading states and error handling on all API calls.
- `staff` database table; `POST /api/auth/login` and `POST /api/auth/logout` endpoints with bcrypt PIN verification and httpOnly cookie session.
- Auto-seed default Manager account (PIN: 1234) on first deploy if `staff` table is empty.
- Login screen with staff name dropdown and PIN entry.
- Role-based sidebar (including Settings link for Manager) and route protection.
- Session persistence via httpOnly cookie; automatic re-auth on reload.
- Logout clears cookie server-side.
- Staff account management screen (add / deactivate / change PIN, Manager only) as a sidebar-linked Settings page.
- `JWT_SECRET` environment variable enforcement at server startup.

### 6.2 Out of Scope for MVP

- Receipt printing (v2). [NOTE FOR PM: Top user-facing gap to close after v1.]
- Item customization options (v2).
- Membership tiers / points system (v2).
- Real-time order updates / WebSocket (v2).
- Kitchen display screen (v2).
- Sales data export (v2).
- Customer-facing interface (future).
- Offline / localStorage fallback (future).

---

## 7. Success Metrics

**Primary**
- **SM-1:** Data survives reload — 100% of orders placed, menu changes made, and members registered in a session are present after a full page reload. Validates FR-1 through FR-5. Target: 100% (hard correctness requirement).
- **SM-2:** Auth gate — unauthenticated access to any protected page is blocked 100% of the time. Validates FR-6, FR-7. Target: 100%.

**Secondary**
- **SM-3:** Login speed — cashier authenticates and reaches the Order page in under 10 seconds from a cold page load. Validates FR-6, FR-8. Target: ≤ 10s on the counter device.
- **SM-4:** Error visibility — every API failure surfaces a user-readable message within 3 seconds. Validates all FR error paths. Target: 100% of error paths covered.

**Counter-metrics (do not optimize)**
- **SM-C1:** Do not shorten PINs or remove lockout policy to optimize login speed. Counterbalances SM-3.
- **SM-C2:** Do not skip loading/error states to optimize perceived speed. Counterbalances SM-1, SM-4.

---

## 8. Cross-Cutting NFRs

**Performance**
- Initial data load (menu + orders + members) must complete in under 3 seconds on stable Wi-Fi to the Railway-hosted backend.
- Navigation between pages must feel instantaneous (< 100ms render) once data is loaded.

**Security**
- All API routes except `POST /api/auth/login` must require a valid session cookie.
- Session cookie must be httpOnly, Secure, SameSite=Strict — JavaScript cannot access it.
- PINs are never stored in plaintext; never returned by any API response; never written to logs.
- `JWT_SECRET` must be a Railway environment variable; server startup fails if absent.
- The `staff` management endpoint must reject Cashier-role tokens.

**Reliability**
- The app must not crash on API errors — every `fetch` call wraps in try/catch with a visible error state.
- A Railway container restart must not corrupt data. [ASSUMPTION: Railway's managed PostgreSQL persists data across container restarts.]

**Observability**
- Server-side errors logged to stdout (Railway captures logs natively); no external logging service required in v1.

---

## 9. Open Questions

1. ~~**Staff name at login**~~ — resolved: dropdown. ✓
2. ~~**Forgotten PIN**~~ — resolved: Manager resets manually via Settings. ✓
3. ~~**Shared device logout**~~ — resolved: explicit logout is sufficient; no auto-logout. ✓
4. ~~**Seed Staff accounts**~~ — resolved: auto-seed default Manager (PIN: 1234) on first deploy; PIN changeable in Settings. ✓
5. **LINE Notify / daily summary** — does the manager want a daily sales push via LINE or email? Out of scope for v1; confirm before v2 planning.

---

## 10. Assumptions Index

All assumptions below have been **confirmed by the product owner (2026-05-23)**:

- **§3 / FR-8:** Session managed via httpOnly cookie (not localStorage) — confirmed.
- **§3 / FR-6:** 4-digit PIN is sufficient for this team size and environment — confirmed.
- **§4.2 / FR-6:** Staff name dropdown at login (not free-text field) — confirmed.
- **§4.2 / FR-6:** Lockout after 5 consecutive failed PIN attempts for 15 minutes — confirmed.
- **§4.2 / FR-8:** 24-hour session expiry — confirmed.
- **§4.2 / FR-10:** Staff management in a Settings screen accessible via sidebar link — confirmed.
- **§4.2 intro:** Default Manager account auto-seeded on first deploy (PIN: 1234) — confirmed.
- **§9 / Q2:** Manager manually resets forgotten PINs; no self-service recovery in v1 — confirmed.
- **§9 / Q3:** Explicit logout between cashiers is sufficient; no idle auto-logout needed — confirmed.
- **§8 / NFRs:** Railway's managed PostgreSQL persists data across container restarts — confirmed.
