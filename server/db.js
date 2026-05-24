const { Pool } = require('pg')
const bcrypt = require('bcrypt')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : false
})

function genId() {
  return Math.random().toString(36).slice(2, 9)
}

function mapMenuItem(r) {
  return { id: r.id, name: r.name, category: r.category, price: r.price, description: r.description, emoji: r.emoji, available: r.available }
}

function mapMember(r) {
  return { id: r.id, name: r.name, phone: r.phone, email: r.email, joinedAt: r.joined_at, totalSpent: r.total_spent, totalOrders: r.total_orders }
}

function mapOrder(o, items = []) {
  return {
    id: o.id,
    orderNumber: o.order_number,
    status: o.status,
    tableNumber: o.table_number,
    customerName: o.customer_name,
    createdAt: o.created_at,
    completedAt: o.completed_at,
    total: o.total,
    discount: o.discount,
    memberDiscount: o.member_discount,
    tax: o.tax,
    paymentMethod: o.payment_method,
    memberId: o.member_id,
    items: items.filter(i => i.order_id === o.id).map(i => ({
      menuItem: {
        id: i.menu_item_id || '',
        name: i.item_name,
        price: i.item_price,
        emoji: i.item_emoji,
        category: i.item_category,
        description: '',
        available: true,
      },
      quantity: i.quantity,
      note: i.note || undefined,
    }))
  }
}

async function initDB() {
  const client = await pool.connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id          VARCHAR(20) PRIMARY KEY,
        name        VARCHAR(100) NOT NULL,
        category    VARCHAR(20)  NOT NULL,
        price       INTEGER      NOT NULL,
        description TEXT         DEFAULT '',
        emoji       VARCHAR(10)  DEFAULT '☕',
        available   BOOLEAN      DEFAULT TRUE
      );

      CREATE TABLE IF NOT EXISTS members (
        id           VARCHAR(20) PRIMARY KEY,
        name         VARCHAR(100) NOT NULL,
        phone        VARCHAR(20)  UNIQUE NOT NULL,
        email        VARCHAR(100),
        joined_at    TIMESTAMPTZ  DEFAULT NOW(),
        total_spent  INTEGER      DEFAULT 0,
        total_orders INTEGER      DEFAULT 0
      );

      CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

      CREATE TABLE IF NOT EXISTS orders (
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

      CREATE TABLE IF NOT EXISTS order_items (
        id            SERIAL      PRIMARY KEY,
        order_id      VARCHAR(20) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        menu_item_id  VARCHAR(20),
        item_name     VARCHAR(100) NOT NULL,
        item_price    INTEGER      NOT NULL,
        item_emoji    VARCHAR(10)  DEFAULT '',
        item_category VARCHAR(20)  DEFAULT '',
        quantity      INTEGER      NOT NULL DEFAULT 1,
        note          TEXT         DEFAULT ''
      );

      CREATE TABLE IF NOT EXISTS staff (
        id         VARCHAR(20) PRIMARY KEY,
        name       VARCHAR(100) NOT NULL UNIQUE,
        pin_hash   VARCHAR(100) NOT NULL,
        role       VARCHAR(10)  NOT NULL DEFAULT 'cashier',
        active     BOOLEAN      DEFAULT TRUE,
        created_at TIMESTAMPTZ  DEFAULT NOW()
      );
    `)

    const { rows } = await client.query('SELECT COUNT(*) FROM menu_items')
    if (parseInt(rows[0].count) === 0) {
      const items = [
        { id: 'c1', name: 'Espresso',         category: 'coffee',  price: 55,  description: 'Rich single shot',           emoji: '☕', available: true },
        { id: 'c2', name: 'Americano',         category: 'coffee',  price: 65,  description: 'Espresso with hot water',    emoji: '☕', available: true },
        { id: 'c3', name: 'Latte',             category: 'coffee',  price: 85,  description: 'Espresso with steamed milk', emoji: '🥛', available: true },
        { id: 'c4', name: 'Cappuccino',        category: 'coffee',  price: 85,  description: 'Espresso with foam',         emoji: '☕', available: true },
        { id: 'c5', name: 'Flat White',        category: 'coffee',  price: 90,  description: 'Double ristretto with milk', emoji: '☕', available: true },
        { id: 'c6', name: 'Cold Brew',         category: 'coffee',  price: 95,  description: '12-hour cold extraction',    emoji: '🧊', available: true },
        { id: 'c7', name: 'Matcha Latte',      category: 'coffee',  price: 95,  description: 'Japanese matcha with milk',  emoji: '🍵', available: true },
        { id: 'c8', name: 'Mocha',             category: 'coffee',  price: 95,  description: 'Espresso with chocolate',    emoji: '🍫', available: true },
        { id: 't1', name: 'Thai Milk Tea',     category: 'tea',     price: 75,  description: 'Classic Thai tea blend',     emoji: '🧋', available: true },
        { id: 't2', name: 'Chamomile',         category: 'tea',     price: 65,  description: 'Calming herbal tea',         emoji: '🌼', available: true },
        { id: 't3', name: 'Earl Grey',         category: 'tea',     price: 65,  description: 'Bergamot black tea',         emoji: '🫖', available: true },
        { id: 't4', name: 'Green Tea',         category: 'tea',     price: 60,  description: 'Light Japanese green tea',   emoji: '🍵', available: true },
        { id: 's1', name: 'Mango Smoothie',    category: 'smoothie',price: 95,  description: 'Fresh mango blend',          emoji: '🥭', available: true },
        { id: 's2', name: 'Berry Blast',       category: 'smoothie',price: 100, description: 'Mixed berry blend',          emoji: '🫐', available: true },
        { id: 's3', name: 'Green Detox',       category: 'smoothie',price: 110, description: 'Spinach, apple, ginger',     emoji: '🥗', available: true },
        { id: 's4', name: 'Banana Oat',        category: 'smoothie',price: 90,  description: 'Banana with oat milk',       emoji: '🍌', available: true },
        { id: 'f1', name: 'Avocado Toast',     category: 'food',    price: 145, description: 'Sourdough with avocado',     emoji: '🥑', available: true },
        { id: 'f2', name: 'Club Sandwich',     category: 'food',    price: 165, description: 'Triple-decker sandwich',     emoji: '🥪', available: true },
        { id: 'f3', name: 'Caesar Salad',      category: 'food',    price: 155, description: 'Romaine, croutons, parmesan',emoji: '🥗', available: true },
        { id: 'f4', name: 'Egg Benedict',      category: 'food',    price: 185, description: 'Poached egg & hollandaise',  emoji: '🍳', available: true },
        { id: 'f5', name: 'Granola Bowl',      category: 'food',    price: 130, description: 'Yogurt, granola, fruits',    emoji: '🫙', available: true },
        { id: 'b1', name: 'Croissant',         category: 'bakery',  price: 65,  description: 'Buttery French pastry',      emoji: '🥐', available: true },
        { id: 'b2', name: 'Blueberry Muffin',  category: 'bakery',  price: 75,  description: 'Fresh baked daily',          emoji: '🫐', available: true },
        { id: 'b3', name: 'Banana Bread',      category: 'bakery',  price: 70,  description: 'Moist & sweet slice',        emoji: '🍌', available: true },
        { id: 'b4', name: 'Cinnamon Roll',     category: 'bakery',  price: 85,  description: 'Warm with cream cheese',     emoji: '🌀', available: true },
        { id: 'b5', name: 'Lemon Tart',        category: 'bakery',  price: 90,  description: 'Tangy pastry cream',         emoji: '🍋', available: true },
      ]
      for (const item of items) {
        await client.query(
          'INSERT INTO menu_items (id,name,category,price,description,emoji,available) VALUES ($1,$2,$3,$4,$5,$6,$7)',
          [item.id, item.name, item.category, item.price, item.description, item.emoji, item.available]
        )
      }
      console.log('✓ Menu seeded with', items.length, 'items')
    }

    const { rows: staffRows } = await client.query('SELECT COUNT(*) FROM staff')
    if (parseInt(staffRows[0].count) === 0) {
      const pinHash = await bcrypt.hash('1234', 10)
      await client.query(
        'INSERT INTO staff (id, name, pin_hash, role) VALUES ($1, $2, $3, $4)',
        [genId(), 'Manager', pinHash, 'manager']
      )
      console.log('✓ Default Manager account seeded (PIN: 1234)')
    }
  } finally {
    client.release()
  }
}

module.exports = { pool, genId, initDB, mapMenuItem, mapMember, mapOrder }
