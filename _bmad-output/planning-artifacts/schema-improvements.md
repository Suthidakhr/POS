# Schema Improvements & Future Changes

> Created: 2026-05-23
> Status: Pending implementation
> Based on: Live integrity audit of `cafe_pos` PostgreSQL database

All SQL in this document is safe to run against the existing schema in the order listed.
Each section is independent — they can be applied one at a time.

---

## How to apply

```bash
# Open the database
psql -U suthidakhrueanak -d cafe_pos

# Then paste any SQL block from this document
# Or run a specific migration file:
# psql -U suthidakhrueanak -d cafe_pos -f migration-name.sql
```

---

## Change 1 — Add CHECK constraint on `orders.status`

**Risk addressed:** Any string is currently accepted as a status value.
A typo or rogue API call can insert `status = 'shipped'` with no error.

**Priority:** High

```sql
ALTER TABLE orders
  ADD CONSTRAINT chk_orders_status
  CHECK (status IN ('pending', 'preparing', 'ready', 'completed', 'cancelled'));
```

**Verify:**
```sql
-- Should error: ERROR: new row violates check constraint
UPDATE orders SET status = 'shipped' WHERE id = (SELECT id FROM orders LIMIT 1);
```

---

## Change 2 — Add CHECK constraint on `orders.payment_method`

**Risk addressed:** `payment_method` accepts any string. Values like `'crypto'`
or `'venmo'` would silently enter the DB and break the Summary page payment breakdown.

**Priority:** High

```sql
ALTER TABLE orders
  ADD CONSTRAINT chk_orders_payment_method
  CHECK (payment_method IN ('cash', 'card', 'qr'));
```

**Note:** Run this only after confirming no existing rows have unexpected values:
```sql
SELECT DISTINCT payment_method FROM orders;
-- Should return only: cash, card, qr, or NULL
```

---

## Change 3 — Add FK on `order_items.menu_item_id`

**Risk addressed:** `menu_item_id` is a plain string with no foreign key.
Deleted or mistyped menu item IDs are silently accepted.

**Priority:** Medium

```sql
ALTER TABLE order_items
  ADD CONSTRAINT fk_order_items_menu_item
  FOREIGN KEY (menu_item_id)
  REFERENCES menu_items(id)
  ON DELETE SET NULL;
```

**Why SET NULL and not CASCADE:** Deleting a menu item should not delete the
historical order line. The `item_name` and `item_price` snapshot columns already
preserve the display data. `menu_item_id` becomes NULL, which is correct — it
signals "this item no longer exists in the menu."

**Verify:**
```sql
-- Should error after applying the constraint
INSERT INTO order_items (order_id, menu_item_id, item_name, item_price, quantity)
VALUES (
  (SELECT id FROM orders LIMIT 1),
  'NONEXISTENT',
  'Ghost Item', 99, 1
);
```

---

## Change 4 — Add NOT NULL on critical `orders` columns

**Risk addressed:** `status`, `order_number`, and `created_at` all have DEFAULT
values but are nullable. An explicit `NULL` insert bypasses the default and
creates a row with `status = NULL`, which breaks every status filter in the app.

**Priority:** Medium

```sql
-- Confirm no existing NULLs first (must return 0 before proceeding)
SELECT COUNT(*) FROM orders
WHERE status IS NULL OR order_number IS NULL OR created_at IS NULL;

-- Then apply
ALTER TABLE orders ALTER COLUMN status       SET NOT NULL;
ALTER TABLE orders ALTER COLUMN order_number SET NOT NULL;
ALTER TABLE orders ALTER COLUMN created_at   SET NOT NULL;
```

---

## Change 5 — Add NOT NULL on `members` counter columns

**Risk addressed:** `total_spent` and `total_orders` are nullable. A NULL value
causes `NaN` in the Summary page calculation:
`members.reduce((s, m) => s + m.totalSpent, 0)`.

**Priority:** Low

```sql
-- Confirm no existing NULLs first
SELECT COUNT(*) FROM members
WHERE total_spent IS NULL OR total_orders IS NULL;

-- Set any accidental NULLs to 0 before adding NOT NULL
UPDATE members SET total_spent  = 0 WHERE total_spent  IS NULL;
UPDATE members SET total_orders = 0 WHERE total_orders IS NULL;

-- Then apply
ALTER TABLE members ALTER COLUMN total_spent  SET NOT NULL;
ALTER TABLE members ALTER COLUMN total_orders SET NOT NULL;
```

---

## Change 6 — Add CHECK constraints on price and quantity

**Risk addressed:** Negative prices and zero/negative quantities are accepted,
which would produce negative order totals on receipts.

**Priority:** Medium

```sql
-- menu_items: price must be 0 or positive
ALTER TABLE menu_items
  ADD CONSTRAINT chk_menu_price_non_negative
  CHECK (price >= 0);

-- order_items: quantity must be at least 1
ALTER TABLE order_items
  ADD CONSTRAINT chk_order_item_quantity_positive
  CHECK (quantity > 0);

-- order_items: snapshot price must be 0 or positive
ALTER TABLE order_items
  ADD CONSTRAINT chk_order_item_price_non_negative
  CHECK (item_price >= 0);
```

---

## Change 7 — Fix drifting member stats on order cancel/delete

**Risk addressed:** `total_spent` and `total_orders` on `members` are incremented
when an order is placed (`server.js:267–272`) but are never decremented when an
order is cancelled or deleted. A member who places and cancels an order will show
inflated stats permanently.

**Priority:** Medium

### Option A — Recompute stats from orders (recommended)

Replace the raw `total_spent` / `total_orders` display with a live query.
Update `server.js` `GET /api/members` route:

```js
// Replace current query in server.js:198–203
app.get('/api/members', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        m.*,
        COUNT(o.id)::int                  AS total_orders,
        COALESCE(SUM(o.total), 0)::int    AS total_spent
      FROM members m
      LEFT JOIN orders o
        ON o.member_id = m.id
        AND o.status = 'completed'
      GROUP BY m.id
      ORDER BY m.joined_at DESC
    `)
    res.json(rows.map(mapMember))
  } catch (e) { next(e) }
})
```

**Trade-off:** Slightly slower query on every members load; always accurate.
At cafe scale (hundreds of members) this is fine.

### Option B — Add a trigger (alternative)

```sql
CREATE OR REPLACE FUNCTION sync_member_stats()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Recalculate from completed orders whenever an order changes
  UPDATE members
  SET
    total_orders = (
      SELECT COUNT(*) FROM orders
      WHERE member_id = COALESCE(NEW.member_id, OLD.member_id)
        AND status = 'completed'
    ),
    total_spent = (
      SELECT COALESCE(SUM(total), 0) FROM orders
      WHERE member_id = COALESCE(NEW.member_id, OLD.member_id)
        AND status = 'completed'
    )
  WHERE id = COALESCE(NEW.member_id, OLD.member_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_member_stats
  AFTER INSERT OR UPDATE OF status OR DELETE ON orders
  FOR EACH ROW
  WHEN (COALESCE(NEW.member_id, OLD.member_id) IS NOT NULL)
  EXECUTE FUNCTION sync_member_stats();
```

**Trade-off:** Always accurate, no query change needed, but adds DB complexity.

---

## Change 8 — Add missing indexes for query performance

**Risk addressed:** Only primary key indexes exist. Columns used in WHERE clauses
and JOINs have no indexes, causing full table scans as data grows.

**Priority:** Low (negligible at current scale, important at 10k+ orders)

```sql
-- orders: filter by status (Manage Orders page)
CREATE INDEX idx_orders_status      ON orders (status);

-- orders: sort by date (Summary page, recent orders)
CREATE INDEX idx_orders_created_at  ON orders (created_at DESC);

-- orders: member lookup (member order history)
CREATE INDEX idx_orders_member_id   ON orders (member_id);

-- order_items: join back to orders
CREATE INDEX idx_order_items_order  ON order_items (order_id);

-- menu_items: filter by availability (Order page)
CREATE INDEX idx_menu_available     ON menu_items (available);
```

---

## Change 9 — Migrate IDs to UUID (long-term)

**Risk addressed:** Current IDs are 7-character base-36 random strings from
`Math.random()`. Collision probability is low but non-zero. Not suitable for
any future multi-device or multi-tenant scenario.

**Priority:** Low (safe to defer until a larger schema version)

**Requires:** PostgreSQL `pgcrypto` extension (available on all standard installs).

```sql
-- Step 1: Enable extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Step 2: Add UUID columns alongside existing VARCHAR IDs
ALTER TABLE menu_items  ADD COLUMN uuid UUID DEFAULT gen_random_uuid() UNIQUE;
ALTER TABLE members     ADD COLUMN uuid UUID DEFAULT gen_random_uuid() UNIQUE;
ALTER TABLE orders      ADD COLUMN uuid UUID DEFAULT gen_random_uuid() UNIQUE;

-- Step 3: Backfill (generates UUIDs for all existing rows)
UPDATE menu_items SET uuid = gen_random_uuid() WHERE uuid IS NULL;
UPDATE members    SET uuid = gen_random_uuid() WHERE uuid IS NULL;
UPDATE orders     SET uuid = gen_random_uuid() WHERE uuid IS NULL;

-- Step 4: Full migration (swap PKs) is a larger operation —
-- coordinate with application code changes in api.ts and server.js
-- before completing this step.
```

---

## Recommended Apply Order

Apply changes in this sequence to minimise risk. Each step is independently
safe to apply on an empty or populated database.

| Step | Change | When |
|------|--------|------|
| 1 | Changes 1 + 2 (CHECK on status + payment_method) | Before first real orders |
| 2 | Changes 4 + 5 (NOT NULL columns) | Before first real orders |
| 3 | Change 6 (price + quantity CHECK) | Before first real orders |
| 4 | Change 3 (FK on menu_item_id) | Before first real orders |
| 5 | Change 7 Option A (member stats recompute query) | Before first real members |
| 6 | Change 8 (indexes) | After ~1 000 orders accumulate |
| 7 | Change 9 (UUID migration) | Next major schema version |

---

## Quick-apply script — Changes 1–6 together

Run this block to apply all high and medium priority structural fixes at once.
Safe on an empty database. On a populated database, run the `SELECT COUNT(*)` checks first.

```sql
BEGIN;

-- Status and payment_method CHECK constraints
ALTER TABLE orders
  ADD CONSTRAINT chk_orders_status
  CHECK (status IN ('pending','preparing','ready','completed','cancelled'));

ALTER TABLE orders
  ADD CONSTRAINT chk_orders_payment_method
  CHECK (payment_method IN ('cash','card','qr'));

-- FK on order_items.menu_item_id
ALTER TABLE order_items
  ADD CONSTRAINT fk_order_items_menu_item
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE SET NULL;

-- NOT NULL on orders
ALTER TABLE orders ALTER COLUMN status       SET NOT NULL;
ALTER TABLE orders ALTER COLUMN order_number SET NOT NULL;
ALTER TABLE orders ALTER COLUMN created_at   SET NOT NULL;

-- NOT NULL on members counters
UPDATE members SET total_spent  = 0 WHERE total_spent  IS NULL;
UPDATE members SET total_orders = 0 WHERE total_orders IS NULL;
ALTER TABLE members ALTER COLUMN total_spent  SET NOT NULL;
ALTER TABLE members ALTER COLUMN total_orders SET NOT NULL;

-- Price and quantity checks
ALTER TABLE menu_items
  ADD CONSTRAINT chk_menu_price_non_negative
  CHECK (price >= 0);

ALTER TABLE order_items
  ADD CONSTRAINT chk_order_item_quantity_positive
  CHECK (quantity > 0);

ALTER TABLE order_items
  ADD CONSTRAINT chk_order_item_price_non_negative
  CHECK (item_price >= 0);

COMMIT;
```

---

## Related documents

- [`architecture.md`](./architecture.md) — system architecture overview
- [`schema.sql`](./schema.sql) — target schema design (reference)
