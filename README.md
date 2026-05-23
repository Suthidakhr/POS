<div align="center">

<img src="https://img.shields.io/badge/Shesha-Cafe%20POS-758650?style=for-the-badge&logo=coffeescript&logoColor=FFE27C" alt="Shesha Cafe POS" height="40"/>

# Shesha Cafe POS

**A modern, full-featured Point of Sale system built for cafes**  
Clean UI · Fast workflow · Member discounts · Real-time sales summary

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)

</div>

---

## Overview

**Shesha Cafe POS** is a fully functional, browser-based Point of Sale application designed for cafe and restaurant use. It covers the complete order lifecycle — from browsing the menu and placing orders to tracking kitchen status and reviewing daily sales performance.

---

## Screenshots

| New Order | Manage Orders |
|:---------:|:-------------:|
| ![New Order](docs/screenshots/01-order.png) | ![Manage Orders](docs/screenshots/02-manage.png) |

| Menu Management | Membership |
|:---------:|:-----------:|
| ![Menu](docs/screenshots/03-menu.png) | ![Members](docs/screenshots/04-members.png) |

<div align="center">

| Sales Summary |
|:-------------:|
| ![Summary](docs/screenshots/05-summary.png) |

</div>

> **Generate screenshots:** Make sure the dev server is running, then run:
> ```bash
> npm install puppeteer --save-dev
> node scripts/capture-screenshots.js
> ```

---

## Features

### 🛒 New Order
- Browse **26 menu items** across 5 categories: Coffee, Tea, Smoothie, Food, Bakery
- Search menu by name in real-time
- Filter by category with one click
- Add items to cart, adjust quantity, add per-item notes
- **Member Lookup** — enter phone number to auto-apply **10% member discount**
- Manual extra discount field
- Payment method selector: **Cash / Card / QR**
- Set table number and customer name
- Live subtotal, tax (7%), and total calculation
- Success toast showing order number and savings

### 📋 Manage Orders
- View orders grouped by **Active / Completed / All Orders**
- Live badge count on sidebar for pending/preparing orders
- Advance order through status stages:
  - `Pending` → `Preparing` → `Ready` → `Completed`
- Cancel orders at any stage
- Expand order card to see full item breakdown, discounts, payment method
- Remove completed/cancelled orders from the board

### 🍽️ Menu Management
- View all menu items in a searchable, filterable table
- Toggle item **availability** (show/hide from ordering screen) with one click
- **Edit** any item: name, price, category, emoji, description
- **Add** new menu items with emoji picker
- **Delete** items with confirmation
- Changes reflect instantly on the New Order page

### 👤 Membership
- Register members with **name, phone, and optional email**
- Members automatically receive **10% discount** on every order
- Lookup member by phone number directly from the order screen
- View each member's **total orders** and **total spent**
- Stats auto-update after each order placed with the member
- Search members by name or phone
- Remove members with confirmation

### 📊 Sales Summary
- **Period filter**: Today / Last 7 Days / All Time
- **KPI cards**: Revenue, Orders Completed, Avg. Order Value, Items Sold
- **Revenue by Hour** bar chart (7am–8pm)
- **Payment method breakdown** with progress bars (Cash / Card / QR)
- **Top Selling Items** ranked list
- **Revenue by Category** with color-coded bars
- Recent completed orders table with payment info

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript |
| Build Tool | Vite 5 |
| Styling | Inline CSS (no dependencies) |
| State | React `useState` + `useCallback` (in-memory) |
| Icons | Emoji-native |
| Backend (optional) | Node.js + Express + PostgreSQL — see `server/` |

---

## Color Palette

Inspired by a fresh farmers-market aesthetic:

| Swatch | Hex | Usage |
|--------|-----|-------|
| 🟩 Olive Green | `#758650` | Sidebar, headings, primary buttons |
| 🟨 Yellow-Green | `#B5C267` | Category chips, active states |
| 🟡 Light Yellow | `#FFE27C` | Highlights, order number badges |
| 🟠 Golden | `#E8B634` | Prices, CTA buttons, accents |
| ⬜ Off-White | `#F8F9F8` | Page backgrounds |
| 🟫 Beige | `#C9B6A1` | Muted text, subtle borders |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Installation

```bash
# Clone the repo
git clone https://github.com/Suthidakhr/POS.git
cd POS

# Install frontend dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Project Structure

```
POS/
├── src/
│   ├── components/
│   │   ├── Sidebar.tsx          # Navigation + logo
│   │   ├── OrderPage.tsx        # New order + cart
│   │   ├── ManageOrderPage.tsx  # Order status board
│   │   ├── MenuManagePage.tsx   # Menu CRUD
│   │   ├── MembershipPage.tsx   # Member registration
│   │   └── SummaryPage.tsx      # Sales analytics
│   ├── data/
│   │   └── menu.ts              # Default 26 menu items
│   ├── types/
│   │   └── index.ts             # TypeScript interfaces
│   ├── App.tsx                  # Root component + state
│   └── main.tsx
├── server/                      # Optional PostgreSQL backend
│   ├── server.js                # Express API (menu, orders, members)
│   ├── .env.example
│   └── package.json
├── scripts/
│   └── capture-screenshots.js   # Puppeteer screenshot helper
└── docs/
    └── screenshots/             # UI screenshots
```

---

## Optional: PostgreSQL Backend

The app works fully with **in-memory state** by default (data resets on refresh).  
A production-ready Express + PostgreSQL backend is included in `server/`.

```bash
# 1. Create database
psql -U postgres -c "CREATE DATABASE cafe_pos;"

# 2. Set connection string
echo "DATABASE_URL=postgresql://user:pass@localhost:5432/cafe_pos" > server/.env

# 3. Install server dependencies
cd server && npm install

# 4. Start both servers together
cd .. && npm run dev:all
```

The server auto-creates all tables and seeds the menu on first run.

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
