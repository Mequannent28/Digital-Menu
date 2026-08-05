# SOFTWARE REQUIREMENTS SPECIFICATION (SRS)
## ABC Restaurant — Digital Menu System
**Version:** 2.0 | **Date:** August 2, 2026 | **Status:** Final

---

## TABLE OF CONTENTS
1. Introduction
2. Overall Description
3. Technology Stack
4. Database Schema
5. API Endpoints
6. Customer Interface (Frontend)
7. Admin Interface (Backend Panel)
8. System Features — Detailed
9. Non-Functional Requirements
10. Security Requirements
11. Deployment & Environment
12. Acceptance Criteria

---

## 1. INTRODUCTION

### 1.1 Purpose
This document is the complete Software Requirements Specification for the ABC Restaurant Digital Menu System. It defines every feature, screen, API, database table, and business rule. It serves as the binding agreement between the developer and the client (restaurant owner) regarding what the system does and how it works.

### 1.2 Project Scope
The Digital Menu System replaces physical paper menus with a mobile-friendly web application accessible by scanning a QR code at each table. Customers browse the full menu, add items to a cart, place orders, and track their order status in real time — all from their personal phones without downloading any app.

Restaurant staff access a separate, password-protected Admin Panel to manage orders, update the menu, generate QR codes, print receipts, and view sales reports.

### 1.3 Intended Audience
- Restaurant Owner / Management
- Kitchen Staff
- Waiters / Floor Staff
- System Administrator / Developer

### 1.4 Definitions
| Term | Meaning |
|------|---------|
| SPA | Single Page Application — no page reloads |
| ETB | Ethiopian Birr — the currency used |
| QR Code | Quick Response code printed at each table |
| JWT | JSON Web Token — used for admin authentication |
| VAT | Value Added Tax — 15% applied to all orders |
| Service Charge | 10% fee added to all orders |
| Modifier | An add-on option for a menu item (e.g. size, extra topping) |
| Order Ref | Unique alphanumeric order reference number |

---

## 2. OVERALL DESCRIPTION

### 2.1 System Overview
The system has two distinct interfaces sharing one backend:

**Customer Interface** — accessed via QR code on mobile phones. No login required. Customers browse the menu, build a cart, select their table, and submit an order. After placing an order they see a live animated tracking screen showing the order progress from "Received" to "Ready."

**Admin Panel** — accessed at `/admin` on a PC or tablet. Requires email + password login. Staff manage inbound orders, update menu items, print receipts, view reports, generate QR codes, and configure restaurant settings.

### 2.2 User Classes

| User | Access | Login Required | Device |
|------|--------|---------------|--------|
| Customer | Customer menu, cart, checkout, order tracking | No | Mobile phone |
| Admin | Full admin panel — all features | Yes (JWT) | PC / Tablet |
| Kitchen Staff | Kitchen Display screen only | Yes | Kitchen monitor |
| Waiter | Order management, waiter call alerts | Yes | Tablet / PC |

### 2.3 Operating Environment
- **Frontend:** React 18 + Vite, runs in any modern browser (Chrome, Safari, Firefox)
- **Backend:** Node.js 24 + Express.js REST API, port 8000
- **Database:** Microsoft SQL Server (DESKTOP-PV3Q16P\SQL2012), database name: RestaurantDB
- **Local Network:** Both frontend and backend run on the restaurant's local Wi-Fi
- **Frontend Dev Port:** 3000 (Vite dev server)
- **Customer URL:** `http://[server-ip]:3000/menu/[table-number]`
- **Admin URL:** `http://[server-ip]:3000/admin`

---

## 3. TECHNOLOGY STACK

### 3.1 Frontend
| Component | Technology |
|-----------|-----------|
| Framework | React 18 (JSX) |
| Build Tool | Vite 8 |
| Routing | React Router v6 |
| State Management | Zustand (useMenuStore, useCartStore, useOrderStore, useAppStore, useRestaurantStore) |
| Animations | Framer Motion |
| Styling | Tailwind CSS |
| Icons | React Icons (Feather + Bootstrap Icons) |
| Forms | React Hook Form |
| Notifications | React Hot Toast |
| Internationalization | i18next (English + Amharic) |
| Excel Export | SheetJS (xlsx) |
| PDF Export | jsPDF + jspdf-autotable |
| QR Codes | qrcode.react |
| Real-time | Polling every 5–8 seconds |

### 3.2 Backend
| Component | Technology |
|-----------|-----------|
| Runtime | Node.js 24 |
| Framework | Express.js |
| Database Driver | mssql (tedious) |
| Authentication | JWT (jsonwebtoken) |
| Password Hashing | bcryptjs |
| Real-time | Socket.IO |
| Environment Config | dotenv |
| Fallback Store | localStore.js (in-memory) |

### 3.3 Database
| Component | Technology |
|-----------|-----------|
| Engine | Microsoft SQL Server 2012 |
| Instance | DESKTOP-PV3Q16P\SQL2012 |
| Database | RestaurantDB |
| Auth User | menuapp / MenuApp2024! |
| Auth Mode | Mixed (SQL + Windows) |

---

## 4. DATABASE SCHEMA

### 4.1 Tables Overview
| Table | Purpose |
|-------|---------|
| users | Admin and staff accounts |
| restaurant | Restaurant profile, settings, VAT/service rates |
| categories | Menu categories (Breakfast, Pizza, Drinks, etc.) |
| menu_items | Individual food and drink items |
| modifier_groups | Groups of add-on options (e.g. "Choose Size") |
| modifiers | Individual options within a group (e.g. Small, Large) |
| tables | Physical restaurant tables |
| orders | Customer orders with totals |
| order_items | Line items within each order |

### 4.2 Key Relationships
```
categories (1) ──── (many) menu_items
modifier_groups (1) ──── (many) modifiers
orders (1) ──── (many) order_items
```

### 4.3 Order Status Flow (State Machine)
```
new ──► preparing ──► ready ──► served
 └──────────────────────────► cancelled
```
Status can only move forward. A served or cancelled order cannot be changed.

### 4.4 Default Seed Data
- 1 admin user: admin@abc.com / admin123
- 1 restaurant profile: ABC Restaurant
- 9 categories: Breakfast, Lunch, Dinner, Pizza, Burger, Pasta, Drinks, Desserts, Coffee
- 8 tables: Table 1–6, VIP 1, Terrace 1

---

## 5. API ENDPOINTS

### 5.1 Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/login | No | Login with email + password, returns JWT |

### 5.2 Restaurant
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/restaurant | No | Get restaurant profile |
| PUT | /api/restaurant | Yes | Update restaurant settings |

### 5.3 Categories
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/categories | No | List all categories |
| POST | /api/categories | Yes | Create new category |
| PUT | /api/categories/:id | Yes | Update category |
| DELETE | /api/categories/:id | Yes | Delete category |

### 5.4 Menu Items
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/menu-items | No | List all items (public) |
| POST | /api/menu-items | Yes | Create menu item |
| PUT | /api/menu-items/:id | Yes | Update menu item |
| DELETE | /api/menu-items/:id | Yes | Delete menu item |
| PUT | /api/menu-items/:id/toggle | Yes | Toggle availability on/off |

### 5.5 Orders
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/orders | Yes | List all orders |
| GET | /api/orders/:id | No | Get single order (for customer tracking) |
| POST | /api/orders | No | Place a new order (customer) |
| PUT | /api/orders/:id/status | Yes | Update order status |
| DELETE | /api/orders/:id | Yes | Delete order |

### 5.6 Tables
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/tables | No | List all tables (public, for checkout picker) |
| POST | /api/tables | Yes | Create table |
| PUT | /api/tables/:id | Yes | Update table |
| DELETE | /api/tables/:id | Yes | Delete table |

### 5.7 Other Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/modifiers | No | List all modifier groups + options |
| POST | /api/waiter-calls | No | Customer calls a waiter |
| GET | /api/waiter-calls | Yes | Admin views waiter calls |
| GET | /api/network-info | No | Returns server IP (used for QR code generation) |
| GET | /health | No | Health check |

---

## 6. CUSTOMER INTERFACE (FRONTEND)

> Accessed by customers on their mobile phones after scanning the QR code at their table.
> URL format: `http://[server-ip]:3000/menu/[table-number]`
> No login required. Language: English or Amharic (toggle in Profile).

---

### 6.1 SCREEN: Splash Screen
**Route:** `/menu/:tableId`
**Description:** The entry point when a customer scans a QR code. Shows the restaurant branding while loading.

```
┌─────────────────────────────┐
│  ░░░░ Background gradient   │
│     (orange → red)          │
│                             │
│         ┌───────┐           │
│         │  🍽️  │           │
│         └───────┘           │
│                             │
│      ABC Restaurant         │
│   ★ Fine Dining & Fast      │
│         Delivery            │
│                             │
│    ┌──────────────────┐     │
│    │  🪑  Table  3    │     │
│    └──────────────────┘     │
│                             │
│   Welcome to ABC Restaurant │
│      Preparing your menu...  │
│                             │
│        ● ● ●  (dots)        │
│   ████████░░░░ (progress)   │
└─────────────────────────────┘
```

**Behavior:**
- Automatically reads the table number from the URL path or query string
- Saves the table number to the cart state
- After 800ms, auto-navigates to the Home / Menu page
- Animated loading dots and progress bar
- Orange → red gradient background with decorative circles

---

### 6.2 SCREEN: Home / Menu Page
**Route:** `/menu`
**Description:** The main customer menu page. The most feature-rich screen. Contains search, category filter, promotional banners, featured/best-seller strips, and the full item grid.

```
┌─────────────────────────────┐
│ 🍽️ ABC Restaurant    🔍 ≡  │  ← Header (sticky)
├─────────────────────────────┤
│ ┌───────────────────────────┐│
│ │   [Cover Photo]           ││  ← Restaurant hero image
│ │   ABC Restaurant          ││
│ │   Fine Dining & Fast...   ││
│ │  ⭐4.8 · 🕒 7AM-11PM 🟢  ││
│ └───────────────────────────┘│
│                             │
│ ┌────────┐ ┌────────┐       │  ← Promo cards (horizontal scroll)
│ │🎉 20%  │ │🆓 Free │       │
│ │  OFF   │ │Dessert │       │
│ └────────┘ └────────┘       │
│                             │
│ [All][🍳][🥗][🍕][🍔][☕]  │  ← Category pills (sticky)
│                             │
│ 🌟 Today's Special          │
│ ┌─────┐ ┌─────┐ ┌─────┐    │  ← Horizontal scroll strip
│ │[img]│ │[img]│ │[img]│    │
│ │Item │ │Item │ │Item │    │
│ │150₿ │ │200₿ │ │180₿ │    │
│ └─────┘ └─────┘ └─────┘    │
│                             │
│ 🔥 Best Sellers             │
│ ┌─────┐ ┌─────┐ ┌─────┐    │
│ │[img]│ │[img]│ │[img]│    │
│ └─────┘ └─────┘ └─────┘    │
│                             │
│ All Items  (24 items)       │
│ ┌──────┐ ┌──────┐           │  ← 2-column item grid
│ │[img] │ │[img] │           │
│ │Pizza │ │Burger│           │
│ │180₿  │ │220₿  │           │
│ │  [+] │ │  [+] │           │
│ └──────┘ └──────┘           │
├─────────────────────────────┤
│  🏠    🍽️    🛒2   👤       │  ← Bottom nav
└─────────────────────────────┘
```

**Features:**
- Live search bar filters items by name (English or Amharic) and description
- Category pills — tap to filter the item list; "All" shows everything
- Promotions carousel — horizontal scroll banners with gradient backgrounds
- "Today's Special," "Best Sellers," and "Chef Recommends" horizontal strips
- Each strip card shows: image, name, rating, prep time, price, add (+) button
- Main grid switches between 2-column grid and list view
- Tapping any item opens the Item Detail Drawer
- Heart (❤️) button on each card to save as favorite
- Table auto-detected from URL and shown in toast notification

---

### 6.3 SCREEN: Item Detail Drawer
**Route:** Appears as a bottom sheet over any page
**Description:** Slides up from the bottom when a customer taps a menu item. Shows full item details and allows adding to cart with quantity and modifiers.

```
┌─────────────────────────────┐
│                ╳ (close)    │
│ ┌─────────────────────────┐ │
│ │      [Item Image]       │ │
│ │  🌶️ Spicy  🥬 Veg  ⭐  │ │
│ └─────────────────────────┘ │
│                             │
│  Margherita Pizza    180 ETB│
│  ★ 4.7 · ⏱ 20 min · 450cal│
│                             │
│  Fresh tomato sauce with    │
│  mozzarella and basil       │
│                             │
│  ────── Choose Size ──────  │  ← Modifier group (required)
│  ○ Small          +0 ETB   │
│  ● Medium        +30 ETB   │
│  ○ Large         +60 ETB   │
│                             │
│  ──── Extra Toppings ─────  │  ← Modifier group (optional)
│  ☐ Extra Cheese   +20 ETB  │
│  ☑ Mushrooms      +15 ETB  │
│                             │
│  📝 Special Instructions    │
│  ┌─────────────────────┐   │
│  │ No onions please... │   │
│  └─────────────────────┘   │
│                             │
│  ───  Quantity  ───         │
│      [ - ]  2  [ + ]        │
│                             │
│  ┌─────────────────────┐   │
│  │  Add to Cart  410₿  │   │  ← Orange button
│  └─────────────────────┘   │
└─────────────────────────────┘
```

**Features:**
- Full item image at top
- Badge tags: Spicy 🌶️, Vegetarian 🥬, Chef's Pick 👨‍🍳, Best Seller 🔥
- Rating, prep time, calories displayed
- Bilingual name and description (EN / AM)
- Modifier groups rendered dynamically from database
- Required groups must be selected before adding to cart
- Multi-select modifier groups allow multiple choices
- Free-text special instructions field
- Quantity stepper (+/-)
- "Add to Cart" button shows calculated total including modifiers and quantity

---

### 6.4 SCREEN: Categories Page
**Route:** `/categories`
**Description:** Full-page category browser. Shows all active categories as colorful cards.

```
┌─────────────────────────────┐
│  🍽️ Categories    9 cats   │  ← Header
├─────────────────────────────┤
│ ┌──────────┐  ┌──────────┐  │
│ │  🍳      │  │  🥗      │  │
│ │          │  │          │  │
│ │ Breakfast│  │  Lunch   │  │
│ │ 8 items →│  │ 12 items→│  │
│ └──────────┘  └──────────┘  │
│ ┌──────────┐  ┌──────────┐  │
│ │  🍕      │  │  🍔      │  │
│ │          │  │          │  │
│ │  Pizza   │  │  Burger  │  │
│ │ 6 items →│  │ 5 items →│  │
│ └──────────┘  └──────────┘  │
├─────────────────────────────┤
│  🏠    🍽️    🛒2   👤       │
└─────────────────────────────┘
```

**Features:**
- Each card uses the category's custom color as background gradient
- Shows category icon (emoji), name, and item count
- Large ghost emoji in background of each card as decorative element
- Tapping a category drills into a filtered item grid for that category
- Back button returns to the category list
- Bilingual labels (EN/AM)
