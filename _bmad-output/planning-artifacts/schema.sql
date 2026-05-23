-- =============================================================================
-- Shesha Cafe POS — PostgreSQL Schema
-- Designed: 2026-05-23 | Author: Winston (System Architect)
-- Target: PostgreSQL 14+
-- =============================================================================
-- Design principles:
--   • UUID primary keys on all domain tables (safe for distributed inserts)
--   • Price values stored as INTEGER (Thai Baht, no fractional currency)
--   • Order items snapshot item name/price — historical orders survive menu edits
--   • Soft delete on menu_items and members (deleted_at IS NULL = active)
--   • CHECK constraints enforce all enum-like columns at DB level
--   • Every table has created_at + updated_at; trigger keeps updated_at fresh
--   • Indexes cover every FK and every column that appears in WHERE/ORDER BY
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Extensions
-- ---------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- provides gen_random_uuid()


-- ---------------------------------------------------------------------------
-- 1. Utility: auto-update updated_at on any row change
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


-- ---------------------------------------------------------------------------
-- 2. CATEGORIES
--    Normalises the hard-coded category strings into a managed table.
--    Allows adding new categories (e.g. "seasonal") without a schema change.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS categories (
  id         SERIAL       PRIMARY KEY,
  code       VARCHAR(30)  NOT NULL UNIQUE,  -- 'coffee', 'tea', 'smoothie', …
  name       VARCHAR(50)  NOT NULL,          -- display name
  emoji      VARCHAR(10)  NOT NULL DEFAULT '🍽️',
  sort_order SMALLINT     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Seed built-in categories
INSERT INTO categories (code, name, emoji, sort_order) VALUES
  ('coffee',   'Coffee',   '☕', 1),
  ('tea',      'Tea',      '🍵', 2),
  ('smoothie', 'Smoothie', '🥤', 3),
  ('food',     'Food',     '🍽️', 4),
  ('bakery',   'Bakery',   '🥐', 5)
ON CONFLICT (code) DO NOTHING;


-- ---------------------------------------------------------------------------
-- 3. MENU_ITEMS
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS menu_items (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id INTEGER      NOT NULL REFERENCES categories(id),
  name        VARCHAR(100) NOT NULL,
  price       INTEGER      NOT NULL CHECK (price >= 0),
  description TEXT         NOT NULL DEFAULT '',
  emoji       VARCHAR(10)  NOT NULL DEFAULT '☕',
  available   BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ  -- soft delete; NULL = active
);

CREATE INDEX IF NOT EXISTS idx_menu_items_category  ON menu_items (category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items (available) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_menu_items_active    ON menu_items (deleted_at) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON COLUMN menu_items.deleted_at IS
  'NULL = active. Set to NOW() to soft-delete. Filter with: WHERE deleted_at IS NULL';
COMMENT ON COLUMN menu_items.price IS
  'Price in Thai Baht (integer). No fractional currency.';


-- ---------------------------------------------------------------------------
-- 4. MEMBERS
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS members (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) NOT NULL,
  phone         VARCHAR(20)  NOT NULL UNIQUE,
  email         VARCHAR(150),
  discount_rate NUMERIC(5,2) NOT NULL DEFAULT 10.00
                CHECK (discount_rate BETWEEN 0 AND 100),
                                         -- stored as %; 10.00 = 10%
                                         -- allows tiered membership later
  joined_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  total_orders  INTEGER      NOT NULL DEFAULT 0 CHECK (total_orders >= 0),
  total_spent   INTEGER      NOT NULL DEFAULT 0 CHECK (total_spent  >= 0),
                                         -- denormalized for fast display;
                                         -- kept in sync by placeOrder transaction
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ  -- soft delete; NULL = active
);

CREATE INDEX IF NOT EXISTS idx_members_phone      ON members (phone);
CREATE INDEX IF NOT EXISTS idx_members_active     ON members (deleted_at) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_members_updated_at
  BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON COLUMN members.discount_rate IS
  'Discount percentage applied at order time. Default 10.00 (10%). Allows future tier changes.';
COMMENT ON COLUMN members.total_spent IS
  'Denormalized cache. Updated atomically inside placeOrder transaction. Do not update manually.';


-- ---------------------------------------------------------------------------
-- 5. ORDERS
-- ---------------------------------------------------------------------------

CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1 INCREMENT 1;

CREATE TABLE IF NOT EXISTS orders (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number    INTEGER     NOT NULL DEFAULT nextval('order_number_seq') UNIQUE,
                                       -- sequential display number shown to staff
  member_id       UUID        REFERENCES members(id) ON DELETE SET NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'preparing', 'ready', 'completed', 'cancelled')),
  table_number    SMALLINT,            -- NULL = takeaway
  customer_name   VARCHAR(100),

  -- ── Financials (all in Thai Baht, integer) ──────────────────────────────
  subtotal        INTEGER     NOT NULL CHECK (subtotal >= 0),
                                       -- sum of (item_price × qty) before any discount
  member_discount INTEGER     NOT NULL DEFAULT 0 CHECK (member_discount >= 0),
  manual_discount INTEGER     NOT NULL DEFAULT 0 CHECK (manual_discount >= 0),
  tax             INTEGER     NOT NULL DEFAULT 0 CHECK (tax >= 0),
  total           INTEGER     NOT NULL CHECK (total >= 0),
                                       -- subtotal - member_discount - manual_discount + tax

  payment_method  VARCHAR(10) CHECK (payment_method IN ('cash', 'card', 'qr')),
  notes           TEXT,                -- order-level note (e.g. "seat outside")

  -- ── Timestamps ───────────────────────────────────────────────────────────
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,         -- set when status → 'completed'
  cancelled_at    TIMESTAMPTZ          -- set when status → 'cancelled'
);

CREATE INDEX IF NOT EXISTS idx_orders_member_id    ON orders (member_id);
CREATE INDEX IF NOT EXISTS idx_orders_status       ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at   ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders (order_number);

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON COLUMN orders.subtotal IS
  'Raw sum before discounts. Stored so the receipt can show the breakdown.';
COMMENT ON COLUMN orders.member_discount IS
  'Amount in ฿ saved by member discount (member.discount_rate × subtotal).';
COMMENT ON COLUMN orders.manual_discount IS
  'Extra cashier-applied discount in ฿.';
COMMENT ON COLUMN orders.total IS
  'Final charged amount: subtotal - member_discount - manual_discount + tax.';


-- ---------------------------------------------------------------------------
-- 6. ORDER_ITEMS
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS order_items (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID         NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id  UUID         REFERENCES menu_items(id) ON DELETE SET NULL,
                                          -- nullable: menu item may be deleted later
                                          -- snapshot columns below preserve history

  -- ── Point-in-time snapshot (immutable after insert) ──────────────────────
  item_name     VARCHAR(100) NOT NULL,    -- name at time of order
  item_price    INTEGER      NOT NULL CHECK (item_price >= 0),
  item_emoji    VARCHAR(10)  NOT NULL DEFAULT '',
  item_category VARCHAR(30)  NOT NULL DEFAULT '',

  -- ── Quantity & customisation ─────────────────────────────────────────────
  quantity      SMALLINT     NOT NULL DEFAULT 1 CHECK (quantity > 0),
  line_total    INTEGER      NOT NULL CHECK (line_total >= 0),
                                          -- item_price × quantity; stored to avoid
                                          -- recomputation in reporting queries
  note          TEXT         NOT NULL DEFAULT '',

  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id     ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item_id ON order_items (menu_item_id);

COMMENT ON COLUMN order_items.menu_item_id IS
  'FK to menu_items. SET NULL if the item is later deleted. item_name/item_price preserve the history.';
COMMENT ON COLUMN order_items.line_total IS
  'item_price × quantity. Stored for reporting efficiency.';


-- ---------------------------------------------------------------------------
-- 7. Relationships summary (visual)
-- ---------------------------------------------------------------------------
--
--  categories ──< menu_items
--                     │
--                     │ (nullable FK, SET NULL on delete)
--                     ▼
--  members ─────── orders ──< order_items
--   (nullable,        │
--    SET NULL)        │  order_number (UNIQUE, sequential)
--
-- ---------------------------------------------------------------------------


-- ---------------------------------------------------------------------------
-- 8. Helpful views
-- ---------------------------------------------------------------------------

-- Active menu: excludes soft-deleted items, joins category details
CREATE OR REPLACE VIEW active_menu AS
SELECT
  m.id,
  m.name,
  c.code   AS category,
  c.name   AS category_name,
  c.emoji  AS category_emoji,
  m.price,
  m.description,
  m.emoji,
  m.available,
  m.created_at
FROM  menu_items m
JOIN  categories c ON c.id = m.category_id
WHERE m.deleted_at IS NULL;

-- Order totals with member info (useful for Summary page queries)
CREATE OR REPLACE VIEW order_summary AS
SELECT
  o.id,
  o.order_number,
  o.status,
  o.table_number,
  o.customer_name,
  o.subtotal,
  o.member_discount,
  o.manual_discount,
  o.tax,
  o.total,
  o.payment_method,
  o.created_at,
  o.completed_at,
  o.cancelled_at,
  m.name  AS member_name,
  m.phone AS member_phone
FROM  orders o
LEFT JOIN members m ON m.id = o.member_id;
