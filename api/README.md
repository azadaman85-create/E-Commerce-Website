# MI TRENDS API

The server both front-ends talk to. Express + Prisma + SQLite.

    Frontend_Dashboard/mi-trends  :3000  storefront   ─┐
                                                       ├─→  api  :4000  ─→  mitrends.db
    Backend_Dashboard             :5173  admin panel  ─┘

## First run

```bash
cp .env.example .env
npm install
npm run setup     # creates the database, then seeds it
npm run dev       # http://localhost:4000
```

`npm run setup` is `prisma db push` followed by the seed. Re-running the seed
wipes the product tables and rebuilds them, so anything added through the admin
panel is lost — run it only when you want to start over.

## Where the seed data comes from

`prisma/seed.ts` imports the storefront's own `lib/catalog.ts` and writes those
72 products into the database. That is why the shop looks unchanged after the
switch. Once seeded, the database is the source of truth and `lib/catalog.ts`
is no longer read by the storefront at all — it only feeds this seed.

## Routes

Public, used by the storefront:

    GET    /api/health
    GET    /api/products
    GET    /api/products/:slug
    GET    /api/collections

Admin, used by the admin panel:

    GET    /api/admin/products
    GET    /api/admin/products/:id
    POST   /api/admin/products
    PUT    /api/admin/products/:id
    PATCH  /api/admin/products/:id/status
    DELETE /api/admin/products/:id
    GET    /api/admin/categories      POST, DELETE
    GET    /api/admin/brands          POST, DELETE
    GET    /api/admin/collections
    GET    /api/admin/inventory/logs
    PATCH  /api/admin/inventory/:variantId

## Not built yet

The admin routes are unauthenticated — anyone who can reach port 4000 can write
to them. Customers, orders, reviews, marketing and content are still mock data
in the admin panel. Those are the next phases.
