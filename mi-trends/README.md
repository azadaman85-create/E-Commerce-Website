# MI TRENDS

A production-grade e-commerce platform built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Framer Motion**, **Supabase** (Auth + Postgres + Storage) and **Razorpay**.

Everything is wired to the database — there are no mocked screens. The admin panel can change the brand, catalogue, pricing, shipping, SEO and homepage content without touching code.

---

## Quick start

```bash
npm install
cp .env.example .env.local   # then fill in the values below
npm run dev
```

The app runs at <http://localhost:3000>. The admin panel is at `/admin`.

---

## 1. Supabase setup

Create a project at [supabase.com](https://supabase.com), then in **SQL Editor** run the three migrations **in order**:

| File | What it does |
| --- | --- |
| `supabase/migrations/0001_schema.sql` | Tables, enums, indexes, triggers and database functions |
| `supabase/migrations/0002_rls.sql` | Row Level Security policies and the four storage buckets |
| `supabase/migrations/0003_seed.sql` | 22 products (10 men, 10 women, 2 unisex) with images, variants, categories, hero slides, coupons and shipping methods |
| `supabase/migrations/0004_gender.sql` | Adds the men/women section split to an existing install |

Or paste **`supabase/SETUP.sql`** — all four concatenated in the right order — and run it once. Everything is idempotent and safe to re-run; nothing is dropped.

### Already have the tables, just need data?

If the schema is already applied and you only need to load the catalogue, run
`0004_gender.sql` in the SQL editor (it is the one thing that needs DDL), then:

```bash
npm run seed
```

That inserts everything over the REST API using your service-role key. It
checks each table first, so re-running it is harmless. `npm run seed -- --reset`
clears the seeded rows before reinserting.

### Storage buckets

`0002_rls.sql` creates these automatically:

| Bucket | Read | Write |
| --- | --- | --- |
| `product-images` | public | admin |
| `brand-assets` | public | admin |
| `media-library` | public | admin |
| `avatars` | public | each user, inside their own `{user_id}/` folder |

### Google OAuth (optional)

Supabase → **Authentication → Providers → Google**. Add `https://<your-project>.supabase.co/auth/v1/callback` as the redirect URI in the Google Cloud console. Without this the Google button returns a clear error and email/password sign-in still works.

---

## 2. Environment variables

Copy `.env.example` to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # server-only, bypasses RLS

NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret

NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`SUPABASE_SERVICE_ROLE_KEY` is only ever imported from route handlers (`src/lib/supabase/admin.ts`). It must never reach the browser.

---

## 3. Making yourself an admin

Sign up through the storefront at `/auth`, then run this in the Supabase SQL editor:

```sql
update profiles set role = 'admin' where email = 'you@example.com';
```

Sign out and back in. `/admin` is now reachable.

---

## 4. Razorpay

> **A note on the original spec.** The brief described "Razorpay Elements (CardElement)", "Payment Intents" and a `payment_intent.succeeded` webhook. Those are **Stripe** concepts and do not exist in Razorpay. This project implements the Razorpay-native equivalent of the same flow.

**How payment works here:**

1. `POST /api/checkout/create-order` re-prices the whole cart from the database, creates a Razorpay **Order**, and saves a Supabase order with `payment_status: 'pending'`.
2. The browser opens **Razorpay Checkout.js** with that order id. Card details are entered on Razorpay's own form and never touch this server.
3. On success, `POST /api/checkout/verify` validates the HMAC-SHA256 signature (`order_id|payment_id` keyed with the API secret) before marking the order paid.
4. `POST /api/webhooks/razorpay` is the backstop — it handles `payment.captured`, `payment.failed` and `refund.processed`, verifies the `X-Razorpay-Signature` header, and is idempotent so redelivery is safe.

**Webhook setup:** Razorpay Dashboard → Settings → Webhooks → add `https://your-domain.com/api/webhooks/razorpay`, subscribe to those three events, and put the secret in `RAZORPAY_WEBHOOK_SECRET`.

**Without Razorpay keys** the checkout still completes end to end — the order is created as `pending` and you land on the confirmation page. This keeps the project demoable on a fresh clone.

Test cards are in the [Razorpay test-mode docs](https://razorpay.com/docs/payments/payments/test-card-details/).

---

## Project structure

```
src/
  app/
    (storefront)/          # storefront layout: header, footer, cart drawer
      page.tsx             #   homepage
      products/            #   PLP + PDP
      cart/ checkout/      #   cart and multi-step checkout
      order-confirmation/  #   post-payment
      account/             #   dashboard, orders, addresses, profile, wishlist
      search/ about/ contact/ faq/ *-policy/ terms/
    (admin)/admin/         # separate layout: sidebar, no storefront chrome
      products/ categories/ orders/ customers/
      coupons/ media/ analytics/ settings/ seo/
    api/                   # search, subscribe, contact, reviews,
                           # coupons/validate, checkout/*, webhooks/razorpay
    sitemap.ts robots.ts   # generated from the live catalogue and admin settings
  components/
    ui/                    # Button, Input, Modal, Toast, Skeleton, Accordion…
    storefront/            # Header, Footer, ProductCard, CartDrawer, Hero…
    admin/                 # AdminShell, DataTable, StatCard, Charts, forms
  context/                 # Cart, Auth, Settings providers
  hooks/                   # useDebounce, useWishlist, useCountUp, useScrolled…
  lib/                     # supabase clients, queries, pricing, razorpay, utils
  types/                   # shared TypeScript interfaces
supabase/migrations/       # 0001 schema · 0002 RLS · 0003 seed
```

---

## How a few things work

**Money is computed server-side.** `src/lib/pricing.ts` is the single source of truth for subtotal, discount, shipping, tax and total. The checkout API recomputes every line price, the coupon and the tax from the database and ignores whatever the client sent. A tampered cart cannot produce a total the server disagrees with.

**Cart state** lives in React Context with `localStorage` persistence (`src/context/CartContext.tsx`), and syncs across browser tabs via the `storage` event. The fly-to-cart animation clones the product image and animates it along a bezier arc using the Web Animations API — cheaper than mounting a React portal for something that lives 750ms — and is skipped entirely under `prefers-reduced-motion`.

**Access control is layered.** `src/middleware.ts` refreshes the session and gates `/admin` and `/account`; the admin layout re-checks the role server-side; and RLS enforces it a third time at the database. A stale cookie or a changed route matcher cannot expose admin data.

**Reviews are gated by purchase.** The RLS policy on `reviews` only permits an insert when the user has a `paid` order containing that product, and a trigger sets `is_verified` from the same check.

**Variant availability** is computed against the other selected options — picking "XL" greys out only the colours that are genuinely unavailable in XL, rather than every out-of-stock colour.

---

## Deploying to Vercel

1. Push to GitHub and import the repo at [vercel.com/new](https://vercel.com/new).
2. Add all seven environment variables from `.env.example`. Set `NEXT_PUBLIC_SITE_URL` to your production domain — OG tags, `sitemap.xml` and `robots.txt` are built from it.
3. Deploy. No `vercel.json` is needed.
4. Add the production webhook URL in the Razorpay dashboard.
5. In Supabase → Authentication → URL Configuration, add your production domain to the redirect allowlist.

---

## Known limitations

- **First-load JS is ~240 KB on catalogue pages**, above the 200 KB target in the brief. Roughly 90 KB of that is Framer Motion, which the brief also requires for every animated element (`<motion.div>` rather than CSS). The two constraints pull against each other; the animation requirement was treated as the higher priority since it is the specified design system. Recharts and TipTap are already dynamically imported and are not in any storefront bundle. Dropping to CSS transitions for scroll reveals would recover most of the gap.
- **Next.js 14.2.35** is the newest release on the 14 line and still carries unpatched advisories (including an RCE in the Image Optimization API when AVIF is used); those are only fixed in Next 15+. The brief pinned Next 14. Upgrading is a small change — mainly `params`/`searchParams` becoming async — and is worth doing before this handles real traffic.
- **Stock is decremented when the order row is created**, not when payment is captured, per the brief's trigger spec. An abandoned payment therefore holds stock until the row is cleaned up. A scheduled job that releases `pending` orders older than ~30 minutes would close this.
- **Order confirmation emails are not sent** — the brief listed no email provider. The confirmation page and order records are complete; wiring Resend or Supabase's SMTP into `/api/checkout/verify` is the remaining step.
- **Rich text is rendered with `dangerouslySetInnerHTML`** on the PDP. Product descriptions come from TipTap in the admin panel and are therefore admin-authored, but a sanitiser (`isomorphic-dompurify`) on write would be prudent defence in depth.

---

## Scripts

```bash
npm run dev     # development server
npm run build   # production build
npm run start   # serve the production build
npm run lint    # ESLint
npm run seed    # load the catalogue into Supabase over the REST API
```

## Demo mode

With no Supabase credentials (or `NEXT_PUBLIC_DEMO_MODE=1`) the storefront
serves a complete in-memory catalogue, so a fresh clone is fully browsable —
including cart, checkout and order confirmation — without a database.

In development only, the same fallback kicks in when Supabase is connected but
has no products yet, and logs a warning saying so. It is disabled in
production, where an empty catalogue is a real problem and should look like
one.
