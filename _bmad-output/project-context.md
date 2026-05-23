---
project_name: 'POS'
user_name: 'Suthidakhrueanak'
date: '2026-05-23'
sections_completed: ['technology-stack', 'language-specific-rules', 'framework-specific-rules', 'code-quality-style', 'workflow', 'critical-rules']
status: 'complete'
rule_count: 68
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

**Frontend**
- React 18.3.1
- TypeScript 5.5.3 (`strict`, `noUnusedLocals`, `noUnusedParameters` — enforced at build time, not just editor warnings)
- Vite 5.4.1 (`moduleResolution: "bundler"` — TS is Vite-compiled only, never run with ts-node or tsx directly)
- lucide-react 0.436.0 (icons)

**Backend**
- Node.js + Express — plain `.js` files, **CommonJS only** (`require()`/`module.exports`)
- pg (PostgreSQL client — connection via `DATABASE_URL` env var)
- dotenv (loaded at server startup; port via `process.env.PORT`, defaults to `3001`)

**Dev tooling**
- concurrently 9.2.1 — `npm run dev:all` runs both processes
- Vite proxies `/api` → `http://localhost:3001` **in dev only**
- Validation gate: `npm run build` (tsc + vite build). No test framework. No lint config.

---

## Critical Implementation Rules

### Module System — by Directory

- `src/` → ESM only (`import`/`export`). Root `package.json` has `"type": "module"`.
- `server/` → CommonJS only (`require()`/`module.exports`). `server/package.json` omits `"type"` to default to CJS. Never add `"type": "module"` to it.
- No TypeScript in `server/` — plain `.js` only. Do not create `.ts` files or a second `tsconfig.json` under `server/`.
- No shared types between frontend and backend — define shapes independently in each.

### Prices & Money

- All price/amount columns are `INTEGER` in PostgreSQL (Thai Baht — no satang, no decimals).
- Display as `฿${price}` — never `toFixed(2)`, never `parseFloat()`, never divide by 100.
- Tax: `Math.round(discounted * 0.07)` computed on the frontend before posting to the server. Result stays integer.

### TypeScript Build Rules

- `noUnusedLocals` + `noUnusedParameters` are **build-breaking errors**. Prefix intentionally unused parameters with `_` (e.g., `_event`, `_index`).
- No path aliases — `@/...` is NOT configured. Use relative imports only.

### Styling

- All styling uses React inline `style={{}}` props exclusively.
- No Tailwind, no CSS modules, no `.css` files, no `className` for visual styling.

### State Management

- All shared state lives in `App.tsx`. Children receive data via props and setter callbacks passed down.
- Do not use `useState` in a child for data that other components need — pass it up through callbacks instead.

### API & Networking

- Always use relative `/api/...` paths in `fetch()` — never hardcode `http://localhost:3001`.
- In production (Railway), Express serves both the static build and `/api` routes from the same process. The Vite proxy does not exist in production.

### Language-Specific Rules

**TypeScript (frontend `src/`)**
- All types and interfaces live in `src/types/index.ts` — add new shared types there, not inline or in component files.
- `src/types/menu.ts` exists for menu-specific seed data — check before adding menu-related constants elsewhere.
- Use `interface` for object shapes (Order, Member, MenuItem), `type` for unions and primitives (Page, Category, OrderStatus).
- Async operations: use `async/await` in callbacks (e.g., `placeOrder`), not raw `.then()` chains. Error propagation is handled by the caller (`try/catch` in the component).
- `useCallback` is used for all event handlers in `App.tsx` to prevent unnecessary re-renders — continue this pattern for new handlers.

**JavaScript (backend `server/`)**
- Server structure: `server.js` (entry point, 21 lines) → `db.js` (shared pool, helpers, schema) → `routes/menu.js`, `routes/members.js`, `routes/orders.js`.
- All IDs generated with `genId()` in `server/db.js`: `Math.random().toString(36).slice(2, 9)` — 7-char alphanumeric. Use this function for new entities; do not use `uuid` or `crypto.randomUUID()`.
- Shared DB utilities (`pool`, `genId`, `initDB`, `mapMenuItem`, `mapMember`, `mapOrder`) all live in `server/db.js` — import from there, not from route files.
- New route files go in `server/routes/` and are mounted in `server/server.js` via `app.use('/api/<resource>', require('./routes/<resource>'))`.
- `req.body` values arrive as strings or numbers depending on JSON parsing — always validate/coerce before SQL (e.g., `parseInt(req.body.price)`).
- Error handling: wrap every route in `try/catch` and pass to `next(e)` — the global error handler in `server.js` sends `{ error: e.message }`.
- DB column names are `snake_case`; TypeScript interfaces are `camelCase`. All mapping is done in `mapMenuItem()`, `mapMember()`, `mapOrder()` helpers in `db.js` — never return raw DB rows directly to the client.

### Framework-Specific Rules

**Component structure**
- Components live flat in `src/components/` — no subdirectories. Page-level components: `OrderPage`, `ManageOrderPage`, `MenuManagePage`, `SummaryPage`, `MembershipPage`, `Sidebar`. Keep this flat structure.
- Small presentational components live at the bottom of the file that uses them, not in separate files.
- Components are default exports (`export default function FooPage`).
- Props typed as an inline `type FooProps = { ... }` directly above the component.

**Hooks usage**
- `useCallback` for every function in `App.tsx` that is passed as a prop.
- `useEffect` for initial data fetching only — do not use it for derived state; compute derived values inline during render.
- No `React.memo` or `useMemo` — the component tree is shallow and data sets are small. Do not add memoization.
- Do not add `<React.StrictMode>` in `main.tsx` — effects fire once; the codebase is not StrictMode-tolerant.

**Page routing**
- Routing is a single `Page` union type. Navigation via `setPage()`. No React Router.
- Adding a page: update `Page` type in `src/types/index.ts` → add nav item in `Sidebar.tsx` → add conditional render block in `App.tsx`.

**Initial data loading**
- `App.tsx` fetches all startup data in one `Promise.all([fetchMenu(), fetchOrders(), fetchMembers()])` inside a single `useEffect([])`.
- Adding a new startup data source: add it to this same `Promise.all` call.
- Pages always receive pre-loaded data as props — they do not manage their own loading state for initial data. Per-action loading (e.g., submitting) uses local `useState`.

**API calls from components**
- Components never import `src/api.ts` — they receive callbacks from `App.tsx` via props. Only `App.tsx` does `import * as api`.

**Color palette (use these values exactly)**
- `#758650` — primary green (buttons, headers, accents)
- `#C9B6A1` — cream (secondary text, borders)
- `#F8F9F8` — background
- `#4a5240` — dark green (hover states, text)
- Error/destructive: `#c0392b`

**Styling rules**
- All styling is inline `style={{}}` — no CSS files, no CSS variables, no Tailwind, no `className` for visual styling.
- Root layout: `App.tsx` renders `display: flex, height: 100vh, overflow: hidden`. Page components fill remaining space with `flex: 1, overflow: hidden` and manage their own internal scroll. Do not alter the root flex container.
- No shared `<Button>` component — replicate inline button styles from an existing button. Do not introduce a button abstraction.

**OrderPage anatomy**
- `OrderPage.tsx` is one large component managing cart state, member lookup, and order submission as a co-located unit. New UI within the order flow must be added as internal state + inline JSX — do not extract sub-components that need access to cart state.

**User feedback patterns**
- Async action buttons: disable while in-flight (`disabled={loading}`) with a visually distinct style (reduced opacity + `cursor: not-allowed`).
- Inline errors: render as `<p style={{ color: '#c0392b' }}>` immediately below the action that caused them. Clear on next user interaction.
- No toast library. No modal library. Confirmations are inline conditional renders ("Are you sure? Yes / Cancel") shown adjacent to the triggering element.

**`src/data/` is reference-only**
- Contains seed data for DB population only. Never import it in components.

### Code Quality & Style Rules

**Naming conventions**
- Files: `PascalCase` for components (`OrderPage.tsx`), `camelCase` for utilities (`api.ts`).
- Functions/variables: `camelCase`. Event handlers: `handle` prefix for local handlers (`handleSubmit`), `on` prefix for props (`onPlaceOrder`).
- Types/interfaces: `PascalCase` (`MenuItem`, `OrderStatus`).
- DB columns: `snake_case` (enforced in SQL only — never leak into TS code).

**No comments by default**
- Do not add comments explaining what code does. Only comment when the WHY is non-obvious (a workaround, a subtle invariant, a hidden constraint).
- No JSDoc blocks, no multi-line comment headers.

**Import ordering**
- React imports first, then third-party, then local (`./types`, `./api`, `./components/...`). No barrel files (`index.ts` re-exports) — import directly from the source file.

**Function style**
- Named function declarations for components (`function OrderPage(...)`).
- Arrow functions for callbacks and utilities (`const handleClick = () => {}`).
- No class components.

**File length**
- No enforced limit, but `OrderPage.tsx` is intentionally large. When adding to a page component, co-locate within the existing file rather than splitting unless the new feature is entirely self-contained and shares no local state.

**Build is the only gate**
- Run `npm run build` to validate. A clean build (no TS errors) = the work is done. There are no lint rules, no test suites to satisfy.

### Development Workflow Rules

**Running the project**
- `npm run dev:all` — starts both Vite dev server (port 5173) and Express backend (port 3001) concurrently. Always use this; running only one side will produce API errors or a stale frontend.
- `npm run build` — TypeScript compile + Vite production build. Run this to verify changes before committing.
- `npm start` — serves the production build via `vite preview` (used on Railway).

**Environment variables**
- Required: `DATABASE_URL`. Optional: `PORT` (defaults to `3001`). Both set in `server/.env`, not the project root. Use `server/.env.example` as a reference.
- `.env` is gitignored. Never commit it.

**Database**
- PostgreSQL. Schema is auto-created by `initDB()` on server startup — no migration files, no migration tool.
- Adding a new table or column: add `CREATE TABLE IF NOT EXISTS` / `ALTER TABLE ADD COLUMN IF NOT EXISTS` to the `initDB()` function in `server/db.js`.
- Seed data for menu items runs automatically on first startup if `menu_items` is empty.

**Deployment (Railway)**
- The production build is static files served by Express via `express.static`. Both the API and frontend are served from the same Express process on one port.
- Do not introduce a separate static file server or reverse proxy.

**Git workflow**
- Single `main` branch. No enforced branch naming convention currently.
- Commit messages use conventional format where applied: `fix:`, `feat:`, `chore:`.

### Critical Don't-Miss Rules

**Business logic — pricing & tax**
- Tax (7% Thai VAT) is applied AFTER all discounts — never on the original subtotal.
  Formula: `tax = Math.round((subtotal - discount - memberDiscount) * 0.07)`
- `discount` and `memberDiscount` are separate DB columns; both can be non-zero on the same order. Do not consolidate them into one field.
- `memberDiscount` amount is passed in from the frontend — the server does not calculate or validate it. Do not add server-side member discount logic.
- Payment method is a closed enum: `cash | card | qr`. No other values are valid.

**Order status rules**
- Status flow (`pending → preparing → ready → completed | cancelled`) is a convention only — no FSM is enforced in code. Do not add transition validation.
- `completedAt` is set only when status = `completed`. It is NULL for all other statuses including `cancelled`.
- Orders are hard-deleted with CASCADE to `order_items`. No soft-delete, no void, no audit log. Do not add soft-delete or `deleted_at` without explicit instruction.

**Silent data bugs**
- Never store prices as floats or decimals — integer arithmetic only.
- Never display prices with `.toFixed(2)` — amounts are whole Thai Baht. `฿${price}` is correct.
- `order_items` stores a snapshot of menu item data at order time (`item_name`, `item_price`, `item_emoji`, `item_category`) — NOT a FK to `menu_items`. This preserves historical order accuracy. Do not replace snapshot columns with a join.

**Database gotchas**
- `initDB()` in `server/db.js` uses `CREATE TABLE IF NOT EXISTS` — idempotent for tables only. New columns require `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` added to `initDB()`. Editing the `CREATE TABLE` block has no effect on existing databases.
- `members.phone` has a `UNIQUE` constraint → PG error `23505`. Already handled in POST `/api/members`. New unique constraints need their own error code check.
- Order creation uses a DB transaction (`BEGIN/COMMIT/ROLLBACK`). Any new multi-step write must do the same.
- `order_number` uses a PostgreSQL sequence. Never manually set it on insert.
- `mapOrder()` builds `items[]` by filtering pre-fetched `order_items`. If called without fetching `order_items` first, it silently returns `items: []`.
- `fetchOrders()` loads ALL orders and ALL order_items in two full-table queries — no pagination. Grows unboundedly with data.

**Server & runtime gotchas**
- Global error handler at the bottom of `server.js` sends `{ error: e.message }`. Do NOT add `res.status(500)` in route handlers — propagate via `next(e)` only.
- `req.params` and `req.query` values are always strings. Always use `parseInt()` or `Number()` before arithmetic or SQL. `req.body` values are typed correctly only when `Content-Type: application/json`.
- `express.json()` is the only body parser. `multipart/form-data` is not parsed — `req.body` will be undefined for file uploads. Add `multer` before adding any file upload route.
- `pg.Pool` silently queues queries when all connections are busy (default max: 10). A missing `await` or slow query in a loop will exhaust the pool and hang all subsequent requests — no error is thrown. Always `await` every DB call.
- `node --watch` only restarts when files in the require graph change. A new file that isn't `require()`d will not trigger restarts — old code stays live until the server is manually restarted.

**State management traps**
- `App.tsx` optimistically updates local state after API calls — do not replace with a full re-fetch after mutations.
- `Member.totalSpent` and `totalOrders` are updated in both the DB (in the order POST route) and local React state (in `placeOrder` in `App.tsx`). If you add a new Member stat, update both places.

**Production deployment**
- Express serves the frontend from `dist/` via `express.static`. The frontend must be built (`npm run build`) before starting the server. If `dist/` is absent, Express silently serves nothing — no error is thrown.
- Do not change `outDir` in `vite.config.ts` without updating the `express.static` path in `server.js`.

**Security**
- No auth layer exists and none should be added — the app is designed for trusted local network operation only. Do not expose `DATABASE_URL` to the frontend.

**Things that look wrong but are correct**
- `genId()` uses `Math.random()` — not cryptographically secure but sufficient.
- `.env` lives in `server/`, not the project root. This is correct.
- `server.js` is only 21 lines — all logic is in `db.js` and `routes/`. This is the intended structure.

---

## Usage Guidelines

**For AI Agents:**
- Read this file before implementing any code in this project.
- Follow ALL rules exactly as documented — especially the Critical Don't-Miss Rules.
- When in doubt, prefer the more restrictive option.
- Run `npm run build` after every change to validate.

**For Humans:**
- Keep this file lean and focused on agent needs — remove rules that become obvious over time.
- Update when the technology stack changes or new patterns are established.
- The Party Mode roundtable approach was used to validate each section — re-run it when adding major new rules.

_Last Updated: 2026-05-23 (re-scanned server directory — updated for routes/ split and db.js extraction)_
