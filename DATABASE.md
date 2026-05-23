---
title: Shesha Cafe POS — Database Reference
created: 2026-05-23
status: Live (current schema) + Target (planned improvements)
source: server/server.js (CREATE TABLE), _bmad-output/planning-artifacts/schema.sql (target)
---

# Database Reference

PostgreSQL 16 · Database `cafe_pos` · 4 tables, 1 sequence

---

## Schema Diagram

```
categories (target only)
    │ 1:N  FK ON DELETE RESTRICT
    │
menu_items                          members
  id (PK)                             id (PK)
  category VARCHAR(20)                name
  name                                phone (UNIQUE)
  price                               email
  description                         joined_at
  emoji                               total_spent     ◄── denormalized counter
  available                           total_orders    ◄── denormalized counter
    │
    │  (menu_item_id — string ref, no FK in live schema)
    ▼
order_items ◄──── orders
  id (PK)           id (PK)
  order_id ─────────┘  order_number (from sequence)
  menu_item_id         member_id ────────────────────► members
  item_name (snapshot) status
  item_price (snap.)   table_number
  item_emoji (snap.)   customer_name
  item_category (snap) discount
  quantity             member_discount
  note                 tax
                       total
                       payment_method
                       created_at
                       completed_at

order_number_seq → orders.order_number (auto-increment)
```

---

## Sequence

### `order_number_seq`

| Property | Value |
|----------|-------|
| Type | PostgreSQL sequence |
| Start | 1 |
| Increment | 1 |
| Purpose | Generates sequential, human-readable order numbers |

**Business purpose:** Every order gets a short sequential number (e.g., `#42`) that staff can call out to customers. This is separate from the primary key `id` (a random 7-char string) because sequential numbering resets expectations (staff expect #43 after #42), while random IDs serve only as database keys and are never shown in the UI.

---

## Tables

### 1. `menu_items`

Catalog of all drinks and food available for sale.

```sql
CREATE TABLE menu_items (
  id          VARCHAR(20) PRIMARY KEY,   -- random 7-char string, e.g. 'c1', 'abc1234'
  name        VARCHAR(100) NOT NULL,
  category    VARCHAR(20)  NOT NULL,     -- 'coffee' | 'tea' | 'smoothie' | 'food' | 'bakery'
  price       INTEGER      NOT NULL,     -- Thai Baht, whole number only (฿55, ฿85, etc.)
  description TEXT         DEFAULT '',
  emoji       VARCHAR(10)  DEFAULT '☕',
  available   BOOLEAN      DEFAULT TRUE
);
```

#### Column Reference

| Column | Type | Nullable | Default | Business Meaning |
|--------|------|----------|---------|-----------------|
| `id` | VARCHAR(20) | No | — | Primary key. Seeded items use short codes (`c1`–`c8`, `t1`–`t4`, etc.). New items get a 7-char random string. |
| `name` | VARCHAR(100) | No | — | Display name on the Order page menu grid. |
| `category` | VARCHAR(20) | No | — | Groups items into filter chips. One of: `coffee`, `tea`, `smoothie`, `food`, `bakery`. Stored as a plain string — no FK to a categories table in the live schema. |
| `price` | INTEGER | No | — | Selling price in Thai Baht (฿). Stored as an integer because Thai Baht has no sub-unit used in cafe pricing. |
| `description` | TEXT | No | `''` | Short description shown on the menu card. Optional. |
| `emoji` | VARCHAR(10) | No | `'☕'` | Single emoji displayed on menu card. Allows visual scanning without images. |
| `available` | BOOLEAN | No | `TRUE` | When `FALSE`, item is hidden on the Order page but not deleted. Toggled by staff via Menu Management. |

#### Seeded Data

26 items are inserted automatically on first run if the table is empty:
- 8 Coffee items (Espresso ฿55 → Cold Brew ฿95)
- 4 Tea items (Thai Milk Tea ฿75 → Earl Grey ฿65)
- 4 Smoothie items (Mango ฿85 → Banana Oat ฿80)
- 5 Food items (Avocado Toast ฿130 → Granola Bowl ฿110)
- 5 Bakery items (Croissant ฿65 → Lemon Tart ฿85)

#### Key Behaviours

- **Availability toggle** is instant and reversible — it only sets `available = FALSE`, never deletes. This means the item reappears in the Order page immediately when toggled back on.
- **Delete** (Menu Management) issues a hard `DELETE FROM menu_items`. Existing `order_items` rows that reference this item have their `menu_item_id` set to `NULL` (once the FK from Change 3 in `schema-improvements.md` is applied). The `item_name` / `item_price` snapshot columns on `order_items` preserve the historical display data regardless.
- **Edit** (PUT `/api/menu/:id`) updates in place. Any future orders will use the new price; past `order_items` snapshots are unaffected.

---

### 2. `members`

Registered loyalty program members who receive a 10% discount on every order.

```sql
CREATE TABLE members (
  id           VARCHAR(20) PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  phone        VARCHAR(20)  UNIQUE NOT NULL,
  email        VARCHAR(100),
  joined_at    TIMESTAMPTZ  DEFAULT NOW(),
  total_spent  INTEGER      DEFAULT 0,
  total_orders INTEGER      DEFAULT 0
);
```

#### Column Reference

| Column | Type | Nullable | Default | Business Meaning |
|--------|------|----------|---------|-----------------|
| `id` | VARCHAR(20) | No | — | Primary key (7-char random string). |
| `name` | VARCHAR(100) | No | — | Member's full name. Displayed on the Membership page card. |
| `phone` | VARCHAR(20) | No | — | Mobile phone number. **Must be unique** — used as the lookup key when a cashier searches for a member during order placement. |
| `email` | VARCHAR(100) | Yes | NULL | Optional contact email. Not used for any automated communication in the current version. |
| `joined_at` | TIMESTAMPTZ | No | `NOW()` | Timestamp when the member registered. Displayed as "Member since" on the card. |
| `total_spent` | INTEGER | No | `0` | Denormalized running total of ฿ spent across all orders associated with this member. **Incremented** when an order is placed; **not decremented** on cancellation — see Known Gaps. |
| `total_orders` | INTEGER | No | `0` | Denormalized count of orders associated with this member. Same drift gap as `total_spent`. |

#### Key Behaviours

- **Phone uniqueness** is enforced at both the DB level (`UNIQUE NOT NULL`) and in the frontend (`MembershipPage.tsx:35` pre-checks before submit).
- **Discount application** — at order time, the `POST /api/orders` handler reads `member_id` and applies a hardcoded 10% discount. The rate is not stored per-member in the live schema (it is in the target schema as `discount_rate`).
- **Deletion** — `DELETE FROM members WHERE id = $1`. The `orders.member_id` FK uses `ON DELETE SET NULL`, so all past orders of the deleted member remain intact but lose the member reference.
- **Stats drift** — `total_spent` and `total_orders` are incremented inside the atomic `placeOrder` transaction but are never decremented if an order is later cancelled or deleted. The fix (live JOIN query) is documented in `schema-improvements.md` Change 7.

---

### 3. `orders`

One row per customer transaction. Stores the financial totals, status, and links to the member and line items.

```sql
CREATE TABLE orders (
  id              VARCHAR(20) PRIMARY KEY,
  order_number    INTEGER     DEFAULT nextval('order_number_seq'),
  status          VARCHAR(20) DEFAULT 'pending',
  table_number    INTEGER,
  customer_name   VARCHAR(100),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  total           INTEGER     NOT NULL,
  discount        INTEGER     DEFAULT 0,
  member_discount INTEGER     DEFAULT 0,
  tax             INTEGER     DEFAULT 0,
  payment_method  VARCHAR(10),
  member_id       VARCHAR(20) REFERENCES members(id) ON DELETE SET NULL
);
```

#### Column Reference

| Column | Type | Nullable | Default | Business Meaning |
|--------|------|----------|---------|-----------------|
| `id` | VARCHAR(20) | No | — | Primary key (7-char random string). |
| `order_number` | INTEGER | No | `nextval(seq)` | Sequential display number shown to staff (`#1`, `#2`, …). Never reused. Human-readable alternative to the random `id`. |
| `status` | VARCHAR(20) | No | `'pending'` | Current kitchen/cashier status. Valid values: `pending → preparing → ready → completed`, or `cancelled` at any stage. No CHECK constraint in live schema (integrity gap). |
| `table_number` | INTEGER | Yes | NULL | Dine-in table number. `NULL` indicates a takeaway or counter order. |
| `customer_name` | VARCHAR(100) | Yes | NULL | Optional customer name for display on the kitchen board. |
| `created_at` | TIMESTAMPTZ | No | `NOW()` | When the order was placed. Used for Sales Summary date filters (today / last 7 days). |
| `completed_at` | TIMESTAMPTZ | Yes | NULL | Timestamp set when status transitions to `completed`. Used for completion-time reporting. Not currently set by `server.js` — tracked only via `created_at`. |
| `total` | INTEGER | No | — | Final charged amount in ฿ after all discounts and tax. `total = (subtotal - discount - member_discount) + tax`. |
| `discount` | INTEGER | No | `0` | Cashier-applied manual extra discount in ฿. |
| `member_discount` | INTEGER | No | `0` | Discount earned by member loyalty (10% of subtotal before manual discount). Stored separately so receipts can show each line of savings. |
| `tax` | INTEGER | No | `0` | 7% VAT calculated on the discounted subtotal. Stored as a snapshot at order time. |
| `payment_method` | VARCHAR(10) | Yes | NULL | How the order was paid. Values in practice: `cash`, `card`, `qr`. No CHECK constraint in live schema (integrity gap). |
| `member_id` | VARCHAR(20) | Yes | NULL | FK → `members.id`. `NULL` for guest orders. Set to `NULL` on member deletion (history preserved). |

#### Status State Machine

```
         ┌──────────┐
  start ─►  pending  ├──────────────────────────────┐
         └────┬─────┘                               │
              │ staff advances                      │ cancel (any stage)
              ▼                                     ▼
         ┌───────────┐                        ┌──────────┐
         │ preparing  ├───────────────────────►          │
         └────┬──────┘                        │cancelled │
              │                               │          │
              ▼                               └──────────┘
         ┌─────────┐
         │  ready  ├───────────────────────────────┐
         └────┬────┘                               │ cancel
              │                                    ▼
              ▼                              ┌──────────┐
         ┌───────────┐                       │cancelled │
         │ completed │                       └──────────┘
         └───────────┘
```

#### Financial Calculation

```
subtotal        = Σ (item_price × quantity)  for each order_item
member_discount = subtotal × 0.10            (if member_id present)
discounted      = subtotal - member_discount - discount
tax             = ROUND(discounted × 0.07)
total           = discounted + tax
```

Note: `subtotal` is not stored as a column in the live schema — only `total`, `discount`, `member_discount`, and `tax` are stored. The target schema (`schema.sql`) adds an explicit `subtotal` column for receipt display and reporting accuracy.

---

### 4. `order_items`

One row per item in an order. Stores a **point-in-time snapshot** of the menu item's name and price at the moment the order was placed.

```sql
CREATE TABLE order_items (
  id            SERIAL       PRIMARY KEY,
  order_id      VARCHAR(20)  NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id  VARCHAR(20),            -- plain string, no FK in live schema
  item_name     VARCHAR(100) NOT NULL,  -- snapshot
  item_price    INTEGER      NOT NULL,  -- snapshot
  item_emoji    VARCHAR(10)  DEFAULT '',
  item_category VARCHAR(20)  DEFAULT '',
  quantity      INTEGER      NOT NULL DEFAULT 1,
  note          TEXT         DEFAULT ''
);
```

#### Column Reference

| Column | Type | Nullable | Default | Business Meaning |
|--------|------|----------|---------|-----------------|
| `id` | SERIAL | No | auto | Auto-incremented integer PK. Line items have no independent business identity beyond their parent order. |
| `order_id` | VARCHAR(20) | No | — | FK → `orders.id` with `ON DELETE CASCADE`. When an order is deleted, all its line items are deleted automatically. |
| `menu_item_id` | VARCHAR(20) | Yes | NULL | Soft reference to `menu_items.id`. Not a foreign key in the live schema — no referential integrity enforced. Set to `NULL` if the menu item is deleted after the order was placed. |
| `item_name` | VARCHAR(100) | No | — | **Snapshot** of `menu_items.name` at order time. Frozen — never changes even if the menu item is later renamed or deleted. |
| `item_price` | INTEGER | No | — | **Snapshot** of `menu_items.price` at order time. Preserves historical receipt accuracy. |
| `item_emoji` | VARCHAR(10) | No | `''` | **Snapshot** of the item emoji at order time. Used to render line items in the order detail card. |
| `item_category` | VARCHAR(20) | No | `''` | **Snapshot** of the item category. Enables category-level reporting on historical orders even if the item is recategorized. |
| `quantity` | INTEGER | No | `1` | Number of units ordered. Always ≥ 1. |
| `note` | TEXT | No | `''` | Per-item customisation note entered by the cashier (e.g., "no sugar", "extra hot"). |

#### Why Snapshots Matter

```
Day 1: Latte priced at ฿85, order #10 placed — order_items.item_price = 85
Day 5: Staff raises Latte price to ฿95 (PUT /api/menu/c3)
       → menu_items.price = 95
       → order #10 order_items.item_price still = 85  ✓ correct receipt
```

Without the snapshot, retroactively changing a menu item's price would alter all historical order totals and corrupt the Sales Summary.

---

## Relationships

| Relationship | Type | FK Column | On Delete | Business Rule |
|---|---|---|---|---|
| `orders` → `members` | Many-to-one | `orders.member_id` | SET NULL | A member can have many orders. If the member is deleted, orders survive with `member_id = NULL`. The discount earned at order time is already recorded in `orders.member_discount`. |
| `order_items` → `orders` | Many-to-one | `order_items.order_id` | CASCADE | An order has 1–N line items. Deleting an order deletes all its items — there is no purpose for orphaned line items. |
| `order_items` → `menu_items` | Many-to-one | `order_items.menu_item_id` | *(no FK in live schema)* | A line item originates from a menu item, but the link is informational only. The snapshot columns preserve all display data. FK with `ON DELETE SET NULL` is planned in `schema-improvements.md` Change 3. |

---

## Design Decisions

### Prices as Integers

All monetary values (`price`, `total`, `discount`, `member_discount`, `tax`, `item_price`) are stored as `INTEGER` representing Thai Baht. Thai Baht has no sub-unit used in cafe pricing, so integer arithmetic produces exact results with no floating-point rounding error. All calculations (tax, discounts) use `Math.round()` or `ROUND()` to produce whole-baht results.

### Snapshot Pattern on `order_items`

The four snapshot columns (`item_name`, `item_price`, `item_emoji`, `item_category`) are written once at INSERT time and never updated. This decouples historical order records from live menu state. The trade-off is slight data duplication per row (~130 bytes extra), which is negligible at cafe scale.

### Denormalized Member Stats

`members.total_spent` and `members.total_orders` are running totals incremented inside the same database transaction that creates the order. This avoids a JOIN on every Membership page load (fast reads) at the cost of potential drift if an order is cancelled after placement. The fix — recomputing stats via a live JOIN — is documented and ready to apply in `schema-improvements.md` Change 7.

### Random String IDs

Primary keys are generated as 7-character base-36 random strings (`Math.random().toString(36).slice(2, 9)`) in `server.js`. This is simple and collision-resistant at cafe scale (~100 orders/day). The target schema migrates all IDs to UUID v4 (`gen_random_uuid()`), which eliminates collision probability entirely. The migration path is documented in `schema-improvements.md` Change 9.

### `order_number` as Separate Display Key

The `id` (random string) is the database key used in API URLs and foreign keys. The `order_number` (sequential integer from `order_number_seq`) is the display key shown to staff and called out to customers. Separating them means the human-visible number is always predictable and sequential, while the URL-safe key avoids enumeration.

---

## Known Integrity Gaps

The live schema is functional but missing several constraints. All fixes are SQL-ready in [`_bmad-output/planning-artifacts/schema-improvements.md`](/_bmad-output/planning-artifacts/schema-improvements.md).

| Gap | Impact | Fix | Priority |
|-----|--------|-----|----------|
| No CHECK on `orders.status` | Invalid status values (e.g., `'shipped'`) accepted silently | Change 1 — `CHECK (status IN (…))` | High |
| No CHECK on `orders.payment_method` | Invalid payment methods break Summary page breakdown | Change 2 — `CHECK (payment_method IN (…))` | High |
| No FK on `order_items.menu_item_id` | Deleted menu item IDs leave dangling string references | Change 3 — FK with `ON DELETE SET NULL` | Medium |
| `orders.status`, `order_number`, `created_at` are nullable | Explicit `NULL` INSERT bypasses defaults, breaks all status filters | Change 4 — `SET NOT NULL` | Medium |
| `members.total_spent`, `total_orders` are nullable | NULL causes `NaN` in Summary page `reduce()` | Change 5 — `SET NOT NULL` with zero backfill | Low |
| No price/quantity range guards | Negative prices or zero quantities accepted, producing negative totals | Change 6 — CHECK constraints | Medium |
| Member stats not decremented on cancel | `total_spent` / `total_orders` inflate on cancelled orders | Change 7 — live JOIN query on GET `/api/members` | Medium |

---

## Target Schema Evolution

The file [`_bmad-output/planning-artifacts/schema.sql`](./_bmad-output/planning-artifacts/schema.sql) defines the production-hardened target schema. Key additions over the live schema:

| Feature | Current Live Schema | Target Schema |
|---------|--------------------|----|
| Primary key type | `VARCHAR(20)` random string | `UUID` (`gen_random_uuid()`) |
| Categories | Hardcoded VARCHAR in `menu_items.category` | Separate `categories` table with FK |
| CHECK constraints | None | Status, payment_method, price, quantity |
| Soft deletes | None (hard delete only) | `deleted_at TIMESTAMPTZ` on `menu_items` and `members` |
| `subtotal` column | Not stored | `orders.subtotal` for receipt breakdown |
| `discount_rate` per member | Hardcoded 10% in app code | `members.discount_rate NUMERIC(5,2)` |
| Indexes | None beyond PKs | 8 indexes covering all FK and WHERE/ORDER BY columns |
| Auto-update trigger | None | `set_updated_at()` trigger on all domain tables |
| Helpful views | None | `active_menu` and `order_summary` views |
| `line_total` on items | Not stored | `order_items.line_total` (pre-computed for reporting) |

---

## Quick Reference: API ↔ Table Mapping

| API Route | Tables Read | Tables Written |
|-----------|-------------|----------------|
| `GET /api/menu` | `menu_items` | — |
| `POST /api/menu` | — | `menu_items` |
| `PUT /api/menu/:id` | — | `menu_items` |
| `DELETE /api/menu/:id` | — | `menu_items` |
| `GET /api/members` | `members` | — |
| `GET /api/members/phone/:phone` | `members` | — |
| `POST /api/members` | — | `members` |
| `DELETE /api/members/:id` | — | `members` |
| `GET /api/orders` | `orders`, `order_items` | — |
| `POST /api/orders` | `members` (lookup) | `orders`, `order_items`, `members` (stats) |
| `PUT /api/orders/:id/status` | — | `orders` |
| `DELETE /api/orders/:id` | — | `orders` (CASCADE → `order_items`) |

---

## Database Access

```bash
# Connect via psql
psql -U suthidakhrueanak -d cafe_pos

# Useful inspection queries
\dt                                    -- list all tables
\d orders                              -- show orders columns and constraints
SELECT * FROM menu_items WHERE available = TRUE;
SELECT o.order_number, o.status, o.total, m.name AS member
  FROM orders o
  LEFT JOIN members m ON m.id = o.member_id
  ORDER BY o.created_at DESC LIMIT 10;
SELECT order_id, SUM(quantity) AS items, COUNT(*) AS lines
  FROM order_items GROUP BY order_id;
```
