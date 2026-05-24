<div align="center">

<img src="https://img.shields.io/badge/Shesha-Cafe%20POS-758650?style=for-the-badge&logo=coffeescript&logoColor=FFE27C" alt="Shesha Cafe POS" height="40"/>

# Shesha Cafe POS

**A modern, full-featured Point of Sale system built for cafes**  
Clean UI · PostgreSQL persistence · Role-based auth · Member discounts · Real-time sales summary

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Express](https://img.shields.io/badge/Express-4.19-000000?style=flat-square&logo=express)](https://expressjs.com)

</div>

---

## Screenshots

| Login | New Order |
|-------|-----------|
| ![Login](docs/screenshots/00-login.png) | ![New Order](docs/screenshots/01-order.png) |

| Manage Orders | Menu Management |
|---------------|-----------------|
| ![Manage Orders](docs/screenshots/02-manage.png) | ![Menu Management](docs/screenshots/03-menu.png) |

| Members | Sales Summary |
|---------|---------------|
| ![Members](docs/screenshots/04-members.png) | ![Sales Summary](docs/screenshots/05-summary.png) |

| Staff Settings |
|----------------|
| ![Staff Settings](docs/screenshots/06-settings.png) |

---

## 1. Project Overview

**Shesha Cafe POS** is a browser-based Point-of-Sale system designed for single-location cafe operations. It covers the full order lifecycle — from browsing the menu and building a cart, through kitchen status tracking, to daily sales reporting — with all data persisted in a PostgreSQL database.

The system runs as two processes: a **React SPA** served by Vite on port `5173`, and an **Express REST API** backed by PostgreSQL on port `3001`. Vite proxies all `/api/*` requests to Express in development, so the browser only ever talks to one origin.

```
Browser (React SPA :5173)
  └── /api/* proxied by Vite
        └── Express API (:3001)
              └── PostgreSQL (cafe_pos :5432)
```

---

## 2. Tech Stack

### Frontend

| Layer | Technology | Version |
|-------|-----------|---------|
| UI Framework | React | 18.3 |
| Language | TypeScript | 5.5 |
| Build Tool | Vite | 5.4 |
| Styling | Inline CSS (`style={}`) | — |
| State Management | React `useState` + `useCallback` | — |
| HTTP Client | Native `fetch` (`src/api.ts`) | — |
| Icons | Emoji (native, no library) | — |

### Backend

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Node.js | 20 |
| HTTP Framework | Express | 4.19 |
| Database Client | node-postgres (`pg`) | 8.12 |
| Database | PostgreSQL | 16 |
| Authentication | jsonwebtoken + bcrypt | — |
| Session | httpOnly cookie (JWT, 24 h) | — |
| Configuration | dotenv | 16 |

### Developer Tools

| Tool | Purpose |
|------|---------|
| `concurrently` | Run Vite + Express in one terminal |
| `puppeteer` | Screenshot capture script |
| `tsc` | TypeScript type checking |

---

## 3. Features

### New Order
- Browse 26 menu items across 5 categories: Coffee, Tea, Smoothie, Food, Bakery
- Search by name in real time; filter by category chip
- Add items to cart, adjust quantity, attach a per-item note
- **Member lookup** — enter phone number to auto-apply 10% member discount
- Manual extra discount field (cashier-controlled)
- Payment method selector: Cash / Card / QR
- Table number and customer name fields
- Live subtotal → discount → 7% tax → total calculation
- Success toast showing order number and amount saved

### Manage Orders
- Three tabs: **Active** (pending / preparing / ready), **Completed**, **All Orders**
- Live badge count on sidebar for pending and preparing orders
- Advance order through status stages: `Pending → Preparing → Ready → Completed`
- Cancel orders at any active stage
- Expand order card to see full item breakdown, discounts, tax, payment method
- Remove completed / cancelled orders from the board

### Menu Management
- Searchable, filterable table of all 26 menu items
- Toggle item **availability** with one click (hides / shows on Order page instantly)
- **Edit** any item: name, price, category, emoji, description
- **Add** new menu items via an inline form with emoji picker
- **Delete** items with two-step confirmation
- All changes are persisted immediately to PostgreSQL

### Membership
- Register members with name, phone (unique), optional email
- Members automatically receive **10% discount** on every order
- Lookup member by phone directly from the order screen
- View per-member stats: total orders and total spent (updated with each order)
- Search members by name or phone
- Remove members with confirmation

### Sales Summary
- Period filter: **Today / Last 7 Days / All Time**
- KPI cards: Revenue, Orders Completed, Avg. Order Value, Items Sold
- Active orders count, Cancelled count, Total tax collected
- Revenue by Hour bar chart (7 am – 8 pm)
- Payment method breakdown with progress bars (Cash / Card / QR)
- Top 8 selling items ranked by quantity
- Revenue by category with colour-coded bars
- Recent 10 completed orders table

### Authentication & Access Control
- Login screen with staff name dropdown and 4-digit PIN entry
- Two roles: **Cashier** (Order + Manage Orders) and **Manager** (all pages)
- Session persists across reloads via httpOnly JWT cookie (24-hour expiry)
- Lockout after 5 consecutive failed PIN attempts (15 minutes)
- Logout clears the session cookie server-side
- Role-filtered sidebar — restricted links are hidden, not just disabled

### Staff Settings *(Manager only)*
- View all staff accounts with role and active/inactive status
- Add new Cashier or Manager accounts (name, role, PIN with confirmation)
- Change PIN for any account
- Deactivate accounts to block login without deleting history
- Default Manager account (PIN: `1234`) seeded on first deploy

---

## 4. Setup Instructions

### Prerequisites

| Requirement | Minimum version |
|-------------|----------------|
| Node.js | 20+ |
| npm | 9+ |
| PostgreSQL | 14+ (16 recommended) |

### Install

```bash
# Clone the repo
git clone https://github.com/Suthidakhr/POS.git
cd POS

# Install frontend dependencies
npm install

# Install server dependencies
cd server && npm install && cd ..
```

### Configure environment

```bash
# Copy the example and edit with your credentials
cp server/.env.example server/.env
```

Open `server/.env` and fill in your values:

```env
DATABASE_URL=postgresql://<user>@localhost:5432/cafe_pos
PORT=3001
JWT_SECRET=change-this-to-a-long-random-string
```

> **Important:** `JWT_SECRET` must be set — the server refuses to start without it. Use any long random string in development; generate a strong secret for production (e.g. `openssl rand -hex 32`).

### Start

```bash
# Start both Vite (frontend) and Express (backend) together
npm run dev:all
```

| URL | Service |
|-----|---------|
| http://localhost:5173 | React frontend |
| http://localhost:3001 | Express API |

The server auto-creates all tables, seeds the 26 menu items, and creates a default Manager account (PIN: `1234`) on first run. Open http://localhost:5173 — log in as **Manager** with PIN `1234` to get started.

### Other scripts

```bash
npm run dev          # Frontend only (Vite)
npm run dev:server   # Backend only (Express with --watch)
npm run build        # Production build (tsc + vite build)
npm run preview      # Preview production build locally
```

---

## 5. PostgreSQL Setup

### macOS — Homebrew

```bash
# Install PostgreSQL if not already installed
brew install postgresql@16

# Start the service
brew services start postgresql@16

# Create the database
psql -U $(whoami) -d postgres -c "CREATE DATABASE cafe_pos;"
```

Connection string (no password required on Homebrew installs):

```env
DATABASE_URL=postgresql://<your-macos-username>@localhost:5432/cafe_pos
```

### Ubuntu / Debian

```bash
sudo apt install postgresql postgresql-contrib

sudo -u postgres psql -c "CREATE USER cafe_owner WITH PASSWORD 'yourpassword';"
sudo -u postgres psql -c "CREATE DATABASE cafe_pos OWNER cafe_owner;"
```

```env
DATABASE_URL=postgresql://cafe_owner:yourpassword@localhost:5432/cafe_pos
```

### Railway (cloud deployment)

Railway provisions a PostgreSQL instance automatically. Copy the `DATABASE_URL`
from the Railway dashboard into your service environment variables.
The server reads `process.env.DATABASE_URL` and auto-connects on startup.

### Database schema

The server runs `CREATE TABLE IF NOT EXISTS` on startup — no manual migration needed.
Four tables are created automatically:

| Table | Description |
|-------|-------------|
| `menu_items` | All menu items (seeded with 26 items on first run) |
| `members` | Registered members and their lifetime stats |
| `orders` | Order header — totals, payment method, status, timestamps |
| `order_items` | Line items — stores a price/name snapshot at order time |
| `staff` | Staff accounts — name, bcrypt PIN hash, role, active flag |

Relationships:

```
menu_items          members
    │                  │
    │ SET NULL          │ SET NULL
    ▼                  ▼
order_items ◄──── orders
   (CASCADE on order delete)
```

### Inspecting the database

**Terminal (psql):**

```bash
psql -U <your-username> -d cafe_pos

\dt                           -- list all tables
\d orders                     -- show columns and constraints
SELECT * FROM menu_items;     -- view menu
SELECT * FROM orders;         -- view orders
SELECT * FROM members;        -- view members
SELECT * FROM order_items;    -- view order lines
\q                            -- quit
```

**pgAdmin 4** (free GUI — [pgadmin.org](https://www.pgadmin.org)):

Register a new server with these connection details:

| Field | Value |
|-------|-------|
| Host | `localhost` |
| Port | `5432` |
| Maintenance database | `postgres` |
| Username | your system username |
| Password | *(leave blank on Homebrew)* |

After connecting: **Databases → cafe_pos → Schemas → public → Tables**

---

## 6. Current Limitations

The following gaps are known and documented with fix plans in
[`_bmad-output/planning-artifacts/schema-improvements.md`](./_bmad-output/planning-artifacts/schema-improvements.md).

| Limitation | Impact | Priority |
|------------|--------|----------|
| **No real-time order updates** | A second device or browser tab does not receive new orders without a manual refresh — kitchen display will miss orders | High |
| **No receipt or print support** | No printable receipt, thermal printer integration, or digital receipt (email / SMS) | Medium |
| **No API input validation** | Express routes do not validate request bodies — malformed payloads reach PostgreSQL unchecked | Medium |
| **No CHECK constraints on status / payment_method** | Invalid strings (e.g. `status = 'shipped'`) are accepted silently by the database | Medium |
| **Member stats drift on cancel/delete** | `total_spent` increments on order creation but never decrements on cancellation or deletion | Medium |
| **No item customisation** | No size variants, temperature (hot/iced), or sugar level options per item | Low |
| **Hardcoded categories** | The five categories are a TypeScript union — new categories require a code change | Low |
| **Short random IDs** | Primary keys are 7-char random strings, not UUIDs — collision risk negligible at cafe scale | Low |

---

## Project Structure

```
POS/
├── src/
│   ├── api.ts                       # Typed fetch client for all REST endpoints + auth
│   ├── App.tsx                      # Root — auth state, session check, page routing
│   ├── types/index.ts               # TypeScript interfaces (MenuItem, Order, Member, AuthUser…)
│   ├── data/menu.ts                 # Category list
│   └── components/
│       ├── LoginPage.tsx            # Login screen — name dropdown + PIN entry
│       ├── Sidebar.tsx              # Role-filtered navigation + user chip + logout
│       ├── OrderPage.tsx            # New order — menu grid + cart
│       ├── ManageOrderPage.tsx      # Order status board
│       ├── MenuManagePage.tsx       # Menu CRUD
│       ├── MembershipPage.tsx       # Member registration + list
│       ├── SummaryPage.tsx          # Sales analytics
│       └── SettingsPage.tsx         # Staff account management (Manager only)
│
├── server/
│   ├── server.js                    # Express entry — JWT guard + route wiring
│   ├── db.js                        # DB pool, schema init, seed, row mappers
│   ├── middleware/
│   │   └── auth.js                  # requireAuth — verifies httpOnly JWT cookie
│   ├── routes/
│   │   ├── auth.js                  # POST /login, POST /logout, GET /me, GET /staff
│   │   ├── staff.js                 # Manager-only staff CRUD
│   │   ├── menu.js                  # Menu item CRUD
│   │   ├── members.js               # Member CRUD + phone lookup
│   │   └── orders.js                # Order creation, status, delete
│   ├── .env                         # DATABASE_URL + JWT_SECRET (gitignored)
│   └── package.json
│
├── docs/screenshots/                # UI screenshots (7 pages)
├── scripts/capture-screenshots.cjs  # Puppeteer screenshot helper
├── vite.config.ts                   # Vite config with /api proxy
└── package.json
```

---

## Color Palette

| Hex | Usage |
|-----|-------|
| `#758650` Olive Green | Sidebar, headings, primary buttons |
| `#B5C267` Yellow-Green | Category chips, active states |
| `#FFE27C` Light Yellow | Highlights, order number badges |
| `#E8B634` Golden | Prices, CTA buttons, accents |
| `#F8F9F8` Off-White | Page backgrounds |
| `#C9B6A1` Beige | Muted text, subtle borders |

---

## Menu Categories

| Category | Items |
|----------|-------|
| ☕ Coffee | Espresso, Americano, Latte, Cappuccino, Flat White, Cold Brew, Matcha Latte, Mocha |
| 🍵 Tea | Thai Milk Tea, Chamomile, Earl Grey, Green Tea |
| 🥤 Smoothie | Mango, Berry Blast, Green Detox, Banana Oat |
| 🍽️ Food | Avocado Toast, Club Sandwich, Caesar Salad, Egg Benedict, Granola Bowl |
| 🥐 Bakery | Croissant, Blueberry Muffin, Banana Bread, Cinnamon Roll, Lemon Tart |

---

<div align="center">

Made with ☕ for **Shesha Cafe**

</div>
