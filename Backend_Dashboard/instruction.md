# MASTER PROMPT — MI TRENDS Admin Panel (for Claude Code)

## HOW TO USE THIS FILE
Don't paste the whole thing into Claude Code as a single message. Give Claude Code **Phase 0** first, let it scaffold and confirm, then feed it one phase at a time from the "BUILD PHASES" section near the bottom. Each phase is scoped to be buildable and testable on its own. Keep this whole file in the repo (e.g. `/docs/PROJECT-BRIEF.md`) so Claude Code can re-read it for context in later phases.

---

## 1. PROJECT

You are acting as a senior full-stack engineer and e-commerce architect building the **Admin Panel / back-office system** for **MI TRENDS**, a clothing brand. This is the internal tool staff use to manage products, orders, customers, marketing, and site content — not the customer-facing storefront.

Build it as a real, production-shaped application, not a static mockup. Every table, filter, form, and status control needs actual logic behind it (local state / mock data layer now, swappable for a real API later) — not decorative UI that does nothing when clicked.

## 2. TECH STACK

- **Frontend:** React + Vite, Tailwind CSS, React Router
- **Charts:** Recharts
- **State/data:** local mock data layer behind a clean service/API interface (e.g. `/src/services/*.ts`) so swapping in a real backend later means changing the service layer only, not the components
- **Backend-ready for:** Node.js/Express or Laravel + MySQL/Postgres, REST API, cloud image storage (S3-style), a payment gateway, a shipping API — do not build these now, but keep data shapes and folder structure ready for them
- Modular components, one component = one responsibility, no 2,000-line files

## 3. DESIGN DIRECTION — read this before building any UI

Do not build another generic dark-sidebar-plus-white-cards SaaS admin template. Reference screenshots (Salesai-style dashboards) are useful for *layout mechanics* — sidebar nav, top bar with search/notifications, filter rows, tables with inline progress and toggles — but the **visual language must feel like a fashion brand's internal system**, not a logistics tool.

Direction: **editorial boutique, not corporate SaaS.**

- **Palette:** warm off-white / bone background, near-black ink text, one confident accent color (pick something brand-appropriate — deep clay, forest, or burgundy rather than default SaaS blue/orange). Avoid neon status colors; use muted tones for status (sage for active, warm ochre for low stock, soft rust for out-of-stock).
- **Typography:** pair a serif or high-contrast display face for page titles/product names with a clean grotesk for UI chrome and data. This single choice is what will make it feel like a fashion brand instead of a dashboard template.
- **Density:** generous white space over cramming — this is a boutique brand managing hundreds of SKUs, not an enterprise tool managing millions of rows.
- **Product-first tables:** product rows should foreground the image (bigger thumbnail than typical admin tables), not treat it as an afterthought icon.
- **Micro-interactions:** subtle — row hover lift, smooth toggle/switch animation, sidebar collapse slide, modal fade+scale, toast notifications on save/delete. Nothing bouncy or excessive.
- Sidebar collapses to icon-only on tablet, becomes a slide-over drawer on mobile. Tables become horizontally scrollable or convert to stacked cards on mobile — decide per screen, don't force one pattern everywhere.

## 4. INFORMATION ARCHITECTURE

```
Login
Dashboard
Products
 ├─ Product List
 ├─ Add / Edit Product
 ├─ Categories / Sub-categories
 ├─ Collections & Tags
 ├─ Attributes (size, color, fabric, fit, gender)
 └─ Inventory
Orders
 ├─ All Orders (+ status sub-views: pending, packing, shipped, delivered, cancelled, returned, refunded)
 └─ Order Detail
Customers
 ├─ Customer List
 └─ Customer Detail (profile, orders, addresses, reviews, wishlist)
Reviews
Marketing
 ├─ Coupons / Discounts
 └─ Promotions / Banners
Content (CMS)
 ├─ Hero section
 ├─ Promo banners
 ├─ Featured products / collections
 └─ Announcement bar
Reports
 └─ Sales / Revenue / Orders / Inventory / Customer / Returns (date + category + export filters)
Settings
 ├─ Admin profile
 ├─ Store settings
 ├─ Payment settings (structure only, no real keys)
 └─ Shipping settings (structure only)
```

## 5. KEY SCREENS — functional requirements

**Login:** ID + password, show/hide password, remember me, forgot password, loading state on submit, generic "Invalid User ID or Password" error (never reveal which field is wrong), smooth transition into dashboard on success. No unnecessary signup fields — this is internal-only.

**Dashboard:** KPI cards (today/week/month/total sales & revenue; order counts by status; product counts by stock state; customer counts). Sales-over-time line chart with range toggle (today/7d/30d/12mo). Order-status donut. Top-selling products list. Recent orders table (ID, customer, product, amount, status, date, actions). Low-stock / new-order / pending-review alert panel with badges.

**Product List:** image, name, SKU, category, brand, price, sale price, stock (with the progress-bar style from the reference — current/threshold), color/size chips, status, rating, created date, row actions (view/edit/duplicate/delete/enable-disable). Search, category/price/status/store filters (matching the reference's filter-row pattern), sort, pagination, bulk select + bulk actions.

**Add/Edit Product:** basic info, rich-text description + fabric/care/fit/size-guide fields, drag-and-drop multi-image manager (main/front/back/side/lifestyle, reorder, set-main), pricing with auto-computed discount %, variant matrix (size × color) with per-variant stock, tags, status control.

**Inventory:** per-variant stock table (current/reserved/available/threshold/status), manual stock adjustment with a reason field, and an adjustment history log.

**Orders:** full order detail (customer + shipping/billing + line items with size/color + totals + payment status) and a status pipeline (new → confirmed → packing → ready → shipped → out for delivery → delivered, with cancelled/returned/refunded as branches) represented as an actionable stepper, not just a text label.

**Customers, Reviews, Marketing, Content, Reports, Settings:** as listed in section 4 — build these after the product/order core is solid (see phases below).

## 6. DATA MODEL (for the mock layer now, real DB later)

Entities and their key relationships — model these as TypeScript types/interfaces in the mock service layer:

`AdminUser (roles: super_admin, admin, product_manager, order_manager, content_manager)`, `Product → ProductVariant (size, color, sku, stock) → InventoryLog`, `Category / SubCategory / Collection / Tag`, `Order → OrderItem`, `Customer → Address, Review, Wishlist`, `Coupon / Promotion`, `PageContent (hero, banners, announcement)`.

Keep foreign-key-style relationships explicit in the mock data (e.g. `orderItem.productVariantId`) so the eventual DB migration is a straight mapping, not a redesign.

## 7. MOCK ADMIN CREDENTIALS (for local testing only)

Seed the mock auth service with these accounts so the login page is actually testable on a local server. Have Claude Code create them in `services/auth.ts` (or equivalent) as hardcoded mock users — clearly commented as **dev-only, to be removed once real auth is connected**:

| Role | User ID | Password |
|---|---|---|
| Super Admin | `admin@mitrends.com` | `MiTrends@2025` |
| Product Manager | `products@mitrends.com` | `MiTrends@2025` |
| Order Manager | `orders@mitrends.com` | `MiTrends@2025` |

Instruct Claude Code to:
- Validate login against this in-memory list (case-sensitive password, case-insensitive ID).
- Store the "logged in" state in memory/localStorage for the session only.
- Show the generic invalid-credentials error from §5 for any other input.
- Log the seeded credentials to the terminal on `npm run dev` startup (a simple console message) so they're easy to find without opening the code.
- Add a comment flagging that these must be replaced with real hashed-password auth before any production deploy.

Feel free to swap the emails/passwords above for your own before handing this to Claude Code — the table is just a placeholder set.

## 8. NON-NEGOTIABLES

- No plain-text passwords anywhere, even in mock data — structure auth as if hashing/sessions are real.
- Role-based access is structural: routes/components should check a `currentUser.role` against a permissions map, even though the mock user is hardcoded for now.
- Every form validates input before "submit."
- Every destructive action (delete product, cancel order) confirms first.
- Don't hardcode any real payment/shipping API keys — leave clearly marked config placeholders.

## 9. FOLDER STRUCTURE

```
/src
  /components      (shared UI: Sidebar, Topbar, DataTable, Modal, Toast, StatCard, StatusBadge...)
  /pages           (one folder per IA section from §4)
  /services        (mock data + API-shaped functions — the future backend swap point)
  /types           (shared TS interfaces from §6)
  /hooks
  /assets
/docs
  PROJECT-BRIEF.md (this file)
```

---

## BUILD PHASES — feed these to Claude Code one at a time

**Phase 0 — Scaffold:** Vite + React + Tailwind + Router project, folder structure from §8, design tokens (colors/fonts/spacing) from §3 set up as Tailwind theme config, shared components shell (Sidebar, Topbar, StatCard, DataTable, Modal, Toast) with no real data yet.

**Phase 1 — Auth + Dashboard:** Login page (§5) and Dashboard (§5) wired to mock data from a new `services/dashboard.ts`.

**Phase 2 — Products core:** Product List + Add/Edit Product + Inventory (§5), backed by `services/products.ts` and the `Product`/`ProductVariant` types (§6). This is the largest phase — it's fine for Claude Code to take it in its own sub-steps (list view, then form, then image manager, then variants).

**Phase 3 — Orders:** Order list + detail + status pipeline, `services/orders.ts`.

**Phase 4 — Customers + Reviews:** Customer list/detail, review moderation.

**Phase 5 — Marketing + Content (CMS):** Coupons/promotions, homepage content editor.

**Phase 6 — Reports + Settings:** Report views with filters/export, settings pages.

**Phase 7 — Polish pass:** responsive audit on every screen, animation pass (§3), empty/loading/error states everywhere, accessibility check (focus states, contrast, aria labels on icon-only buttons).

At the start of each phase, tell Claude Code: *"Read /docs/PROJECT-BRIEF.md, then build Phase N only."*