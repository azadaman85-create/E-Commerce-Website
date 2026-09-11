-- =========================================================================
-- MI TRENDS — complete setup.
--
-- Paste this whole file into the Supabase SQL editor and run it once.
-- Every statement is idempotent: it is safe on a fresh project AND on one
-- that already has the tables. Nothing is dropped and no data is deleted.
--
-- Order: schema -> gender column -> returns -> RLS + storage -> seed data.
-- =========================================================================


-- ///////////////////////////////////////////////////////////////////////
-- 0001_schema.sql
-- ///////////////////////////////////////////////////////////////////////

-- ===========================================================================
-- MI TRENDS — core schema
-- Run in the Supabase SQL editor, or via `supabase db push`.
-- ===========================================================================

create extension if not exists "uuid-ossp";
create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('customer', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type product_status as enum ('draft', 'active');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('pending', 'paid', 'failed', 'refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type fulfillment_status as enum
    ('pending', 'processing', 'shipped', 'delivered', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type coupon_type as enum ('percentage', 'fixed');
exception when duplicate_object then null; end $$;

-- Which storefront section a product belongs to. 'unisex' appears in both.
do $$ begin
  create type product_gender as enum ('men', 'women', 'unisex');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 1. profiles
-- ---------------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  avatar_url text,
  role user_role not null default 'customer',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated on profiles;
create trigger trg_profiles_updated before update on profiles
  for each row execute function set_updated_at();

-- New auth users get a profile automatically.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Role check used throughout the RLS policies below. SECURITY DEFINER so the
-- policy can read profiles without recursing into profiles' own policies.
create or replace function is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- 2. site_settings (single row)
-- ---------------------------------------------------------------------------
create table if not exists site_settings (
  id uuid primary key default uuid_generate_v4(),
  site_name text not null default 'MI TRENDS',
  tagline text default 'Considered essentials for the modern wardrobe.',
  logo_url text,
  logo_inverted_url text,
  favicon_url text,
  contact_email text default 'hello@mitrends.com',
  contact_phone text,
  business_address text,
  currency_code text not null default 'INR',
  currency_symbol text not null default '₹',
  tax_rate numeric(5,2) not null default 18.00,
  tax_inclusive boolean not null default false,
  announcement_bar_active boolean not null default true,
  announcement_bar_text text default 'Complimentary shipping on orders over ₹2,000',
  announcement_bar_link text,
  announcement_bar_color text default '#1A1A1A',
  social_instagram text,
  social_facebook text,
  social_twitter text,
  social_tiktok text,
  social_youtube text,
  sale_active boolean not null default false,
  sale_headline text,
  sale_ends_at timestamptz,
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_site_settings_updated on site_settings;
create trigger trg_site_settings_updated before update on site_settings
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 3. seo_settings (single row)
-- ---------------------------------------------------------------------------
create table if not exists seo_settings (
  id uuid primary key default uuid_generate_v4(),
  meta_title_template text not null default '{page} | {site}',
  default_meta_description text default 'Considered essentials, made to last.',
  og_default_image_url text,
  ga_tracking_id text,
  fb_pixel_id text,
  search_console_meta text,
  robots_txt text default E'User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /account\nDisallow: /checkout',
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_seo_settings_updated on seo_settings;
create trigger trg_seo_settings_updated before update on seo_settings
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. page_seo
-- ---------------------------------------------------------------------------
create table if not exists page_seo (
  id uuid primary key default uuid_generate_v4(),
  page_slug text unique not null,
  meta_title text,
  meta_description text,
  og_image_url text
);

-- ---------------------------------------------------------------------------
-- 5. categories
-- ---------------------------------------------------------------------------
create table if not exists categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  description text,
  image_url text,
  parent_id uuid references categories(id) on delete set null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_categories_parent on categories(parent_id);
create index if not exists idx_categories_slug on categories(slug);

-- ---------------------------------------------------------------------------
-- 6. products
-- ---------------------------------------------------------------------------
create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  slug text unique not null,
  description text,
  short_description text,
  category_id uuid references categories(id) on delete set null,
  gender product_gender not null default 'unisex',
  price numeric(12,2) not null default 0 check (price >= 0),
  sale_price numeric(12,2) check (sale_price >= 0),
  sale_start timestamptz,
  sale_end timestamptz,
  sku text unique,
  stock_quantity int not null default 0,
  track_inventory boolean not null default true,
  allow_backorders boolean not null default false,
  status product_status not null default 'draft',
  meta_title text,
  meta_description text,
  og_image_url text,
  tags text[] default '{}',
  units_sold int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_products_updated on products;
create trigger trg_products_updated before update on products
  for each row execute function set_updated_at();

create index if not exists idx_products_status on products(status);
create index if not exists idx_products_category on products(category_id);
-- The gender index lives in 0004_gender.sql: on an install that predates
-- that migration the column does not exist yet, and indexing it here would
-- fail before 0004 has had a chance to add it.
create index if not exists idx_products_created on products(created_at desc);
create index if not exists idx_products_units_sold on products(units_sold desc);
create index if not exists idx_products_price on products(price);
create index if not exists idx_products_title_trgm on products using gin (title gin_trgm_ops);
create index if not exists idx_products_tags on products using gin (tags);

-- ---------------------------------------------------------------------------
-- 7-10. product media, options, variants
-- ---------------------------------------------------------------------------
create table if not exists product_images (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  image_url text not null,
  sort_order int not null default 0,
  alt_text text
);
create index if not exists idx_product_images_product on product_images(product_id, sort_order);

create table if not exists product_options (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  name text not null,
  sort_order int not null default 0
);
create index if not exists idx_product_options_product on product_options(product_id);

create table if not exists product_option_values (
  id uuid primary key default uuid_generate_v4(),
  option_id uuid not null references product_options(id) on delete cascade,
  value text not null,
  sort_order int not null default 0
);
create index if not exists idx_option_values_option on product_option_values(option_id);

create table if not exists product_variants (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  sku text,
  price numeric(12,2),
  stock_quantity int not null default 0,
  option_values jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_variants_product on product_variants(product_id);

-- ---------------------------------------------------------------------------
-- 11. addresses
-- ---------------------------------------------------------------------------
create table if not exists addresses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  full_name text not null,
  phone text,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state text not null,
  zip text not null,
  country text not null default 'India',
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_addresses_user on addresses(user_id);

-- Only one default address per user.
create or replace function enforce_single_default_address()
returns trigger
language plpgsql
as $$
begin
  if new.is_default then
    update addresses
      set is_default = false
      where user_id = new.user_id and id <> new.id and is_default;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_single_default_address on addresses;
create trigger trg_single_default_address after insert or update of is_default on addresses
  for each row when (new.is_default) execute function enforce_single_default_address();

-- ---------------------------------------------------------------------------
-- 12-14. orders
-- ---------------------------------------------------------------------------
create sequence if not exists order_number_seq start with 10001;

create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  order_number text unique not null default ('ORD-' || nextval('order_number_seq')),
  user_id uuid references profiles(id) on delete set null,
  email text not null,
  shipping_address jsonb not null,
  billing_address jsonb,
  shipping_method text,
  shipping_cost numeric(12,2) not null default 0,
  subtotal numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  coupon_code text,
  payment_status payment_status not null default 'pending',
  fulfillment_status fulfillment_status not null default 'pending',
  razorpay_order_id text,
  razorpay_payment_id text,
  tracking_number text,
  tracking_carrier text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_orders_updated on orders;
create trigger trg_orders_updated before update on orders
  for each row execute function set_updated_at();

create index if not exists idx_orders_user on orders(user_id);
create index if not exists idx_orders_created on orders(created_at desc);
create index if not exists idx_orders_payment_status on orders(payment_status);
create index if not exists idx_orders_fulfillment_status on orders(fulfillment_status);
create index if not exists idx_orders_number on orders(order_number);
create index if not exists idx_orders_rzp_order on orders(razorpay_order_id);

create table if not exists order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  variant_id uuid references product_variants(id) on delete set null,
  title text not null,
  slug text,
  image_url text,
  variant_info jsonb,
  quantity int not null check (quantity > 0),
  unit_price numeric(12,2) not null,
  line_total numeric(12,2) not null
);
create index if not exists idx_order_items_order on order_items(order_id);
create index if not exists idx_order_items_product on order_items(product_id);

create table if not exists order_timeline (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  status text not null,
  note text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_timeline_order on order_timeline(order_id, created_at);

-- Stock decrement + units_sold increment when an order line is created.
create or replace function apply_order_item_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.variant_id is not null then
    update product_variants
      set stock_quantity = greatest(0, stock_quantity - new.quantity)
      where id = new.variant_id;
  end if;

  if new.product_id is not null then
    update products
      set stock_quantity = case
            when track_inventory then greatest(0, stock_quantity - new.quantity)
            else stock_quantity
          end,
          units_sold = units_sold + new.quantity
      where id = new.product_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_order_item_stock on order_items;
create trigger trg_order_item_stock after insert on order_items
  for each row execute function apply_order_item_stock();

-- Coupon usage counter + opening timeline entry on order creation.
create or replace function handle_new_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.coupon_code is not null then
    update coupons
      set times_used = times_used + 1
      where upper(code) = upper(new.coupon_code);
  end if;

  insert into order_timeline (order_id, status, note)
  values (new.id, 'pending', 'Order placed');

  return new;
end;
$$;

drop trigger if exists trg_new_order on orders;
create trigger trg_new_order after insert on orders
  for each row execute function handle_new_order();

-- ---------------------------------------------------------------------------
-- 15. reviews
-- ---------------------------------------------------------------------------
create table if not exists reviews (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  rating int not null check (rating between 1 and 5),
  title text,
  body text,
  is_verified boolean not null default false,
  author_name text,
  created_at timestamptz not null default now(),
  unique (product_id, user_id)
);
create index if not exists idx_reviews_product on reviews(product_id, created_at desc);

-- Flags the review as verified when the user has actually bought the product.
create or replace function mark_review_verified()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.user_id is not null then
    new.is_verified := exists (
      select 1
      from order_items oi
      join orders o on o.id = oi.order_id
      where oi.product_id = new.product_id
        and o.user_id = new.user_id
        and o.payment_status = 'paid'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_review_verified on reviews;
create trigger trg_review_verified before insert on reviews
  for each row execute function mark_review_verified();

-- ---------------------------------------------------------------------------
-- 16-20. coupons, subscribers, hero slides, wishlist, media
-- ---------------------------------------------------------------------------
create table if not exists coupons (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  type coupon_type not null default 'percentage',
  value numeric(12,2) not null check (value >= 0),
  min_order_amount numeric(12,2) not null default 0,
  usage_limit int,
  per_customer_limit int,
  times_used int not null default 0,
  valid_from timestamptz,
  valid_to timestamptz,
  applicable_products uuid[] default '{}',
  applicable_categories uuid[] default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_coupons_code on coupons(upper(code));

create table if not exists subscribers (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists hero_slides (
  id uuid primary key default uuid_generate_v4(),
  image_url text not null,
  heading text not null,
  subheading text,
  cta_text text,
  cta_link text,
  sort_order int not null default 0,
  is_active boolean not null default true
);

create table if not exists banners (
  id uuid primary key default uuid_generate_v4(),
  image_url text,
  heading text,
  text text,
  link text,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true
);

create table if not exists shipping_methods (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  price numeric(12,2) not null default 0,
  estimated_delivery text,
  free_shipping_threshold numeric(12,2),
  sort_order int not null default 0,
  is_active boolean not null default true
);

create table if not exists wishlist (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);
create index if not exists idx_wishlist_user on wishlist(user_id);

create table if not exists media (
  id uuid primary key default uuid_generate_v4(),
  url text not null,
  filename text not null,
  size bigint,
  mime_type text,
  uploaded_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists testimonials (
  id uuid primary key default uuid_generate_v4(),
  author_name text not null,
  author_role text,
  quote text not null,
  rating int not null default 5 check (rating between 1 and 5),
  avatar_url text,
  sort_order int not null default 0,
  is_active boolean not null default true
);

create table if not exists social_posts (
  id uuid primary key default uuid_generate_v4(),
  image_url text not null,
  link text,
  caption text,
  sort_order int not null default 0,
  is_active boolean not null default true
);

create table if not exists contact_messages (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null,
  subject text,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ///////////////////////////////////////////////////////////////////////
-- 0004_gender.sql
-- ///////////////////////////////////////////////////////////////////////

-- ===========================================================================
-- MI TRENDS — add the men/women section split
--
-- Safe on an existing install: the enum, the column and the index are all
-- created only if they are missing, and no existing data is touched.
-- ===========================================================================

do $$ begin
  create type product_gender as enum ('men', 'women', 'unisex');
exception when duplicate_object then null; end $$;

alter table products
  add column if not exists gender product_gender not null default 'unisex';

create index if not exists idx_products_gender on products(gender);

-- Backfill from the SKU convention used by the seed (MT-M-* / MT-W-*), so an
-- install that already has products lands in the right sections.
update products set gender = 'men'
  where gender = 'unisex' and sku like 'MT-M-%';

update products set gender = 'women'
  where gender = 'unisex' and sku like 'MT-W-%';

-- ///////////////////////////////////////////////////////////////////////
-- 0005_returns.sql
-- ///////////////////////////////////////////////////////////////////////

-- ===========================================================================
-- MI TRENDS — returns
--
-- The returns policy page promises customers a "Request a return" action.
-- This gives that promise something to call.
-- ===========================================================================

do $$ begin
  create type return_status as enum (
    'requested', 'approved', 'rejected', 'received', 'refunded'
  );
exception when duplicate_object then null; end $$;

create table if not exists returns (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  -- Denormalised so the admin list does not need a join to show it, and so
  -- the record still reads sensibly if the order is ever removed.
  order_number text not null,
  email text not null,
  reason text not null,
  comment text,
  -- [{ order_item_id, title, variant_info, quantity }]
  items jsonb not null default '[]'::jsonb,
  refund_amount numeric(12,2) not null default 0,
  status return_status not null default 'requested',
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_returns_order on returns(order_id);
create index if not exists idx_returns_user on returns(user_id);
create index if not exists idx_returns_status on returns(status);
create index if not exists idx_returns_created on returns(created_at desc);

drop trigger if exists trg_returns_updated on returns;
create trigger trg_returns_updated before update on returns
  for each row execute function set_updated_at();

-- One open request per order: a customer should amend an existing request
-- rather than stack duplicates while the first is still being handled.
create unique index if not exists idx_returns_one_open
  on returns(order_id)
  where status in ('requested', 'approved');

-- Every status change is written to the order's own timeline, so the order
-- view tells the whole story without cross-referencing another table.
create or replace function log_return_to_timeline()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into order_timeline (order_id, status, note)
    values (new.order_id, 'processing',
            'Return requested: ' || new.reason);
  elsif new.status is distinct from old.status then
    insert into order_timeline (order_id, status, note)
    values (new.order_id,
            case when new.status = 'refunded' then 'cancelled' else 'processing' end,
            'Return ' || new.status ||
            coalesce(' — ' || new.admin_note, ''));
  end if;
  return new;
end;
$$;

drop trigger if exists trg_return_timeline on returns;
create trigger trg_return_timeline after insert or update on returns
  for each row execute function log_return_to_timeline();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table returns enable row level security;

drop policy if exists "returns read own" on returns;
create policy "returns read own" on returns
  for select using (user_id = auth.uid() or is_admin());

-- Customers may only open a return against an order that is theirs and paid.
drop policy if exists "returns insert own paid order" on returns;
create policy "returns insert own paid order" on returns
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from orders o
      where o.id = returns.order_id
        and o.user_id = auth.uid()
        and o.payment_status = 'paid'
    )
  );

-- Only admins move a return through its lifecycle.
drop policy if exists "returns admin update" on returns;
create policy "returns admin update" on returns
  for update using (is_admin()) with check (is_admin());

drop policy if exists "returns admin delete" on returns;
create policy "returns admin delete" on returns
  for delete using (is_admin());

-- ///////////////////////////////////////////////////////////////////////
-- 0002_rls.sql
-- ///////////////////////////////////////////////////////////////////////

-- ===========================================================================
-- MI TRENDS — Row Level Security
-- ===========================================================================

alter table profiles              enable row level security;
alter table site_settings         enable row level security;
alter table seo_settings          enable row level security;
alter table page_seo              enable row level security;
alter table categories            enable row level security;
alter table products              enable row level security;
alter table product_images        enable row level security;
alter table product_options       enable row level security;
alter table product_option_values enable row level security;
alter table product_variants      enable row level security;
alter table addresses             enable row level security;
alter table orders                enable row level security;
alter table order_items           enable row level security;
alter table order_timeline        enable row level security;
alter table reviews               enable row level security;
alter table coupons               enable row level security;
alter table subscribers           enable row level security;
alter table hero_slides           enable row level security;
alter table banners               enable row level security;
alter table shipping_methods      enable row level security;
alter table wishlist              enable row level security;
alter table media                 enable row level security;
alter table testimonials          enable row level security;
alter table social_posts          enable row level security;
alter table contact_messages      enable row level security;

-- --------------------------------------------------------------------------
-- profiles — own row read/update; admins see everyone.
-- --------------------------------------------------------------------------
drop policy if exists "profiles read own" on profiles;
create policy "profiles read own" on profiles
  for select using (id = auth.uid() or is_admin());

drop policy if exists "profiles update own" on profiles;
create policy "profiles update own" on profiles
  for update using (id = auth.uid() or is_admin())
  with check (id = auth.uid() or is_admin());

drop policy if exists "profiles insert own" on profiles;
create policy "profiles insert own" on profiles
  for insert with check (id = auth.uid());

-- --------------------------------------------------------------------------
-- Public catalogue: readable by anyone, writable by admins only.
-- --------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'categories','product_images','product_options',
    'product_option_values','product_variants','hero_slides','banners',
    'shipping_methods','testimonials','social_posts'
  ]
  loop
    execute format('drop policy if exists "%s public read" on %I', t, t);
    execute format('create policy "%s public read" on %I for select using (true)', t, t);

    execute format('drop policy if exists "%s admin write" on %I', t, t);
    execute format(
      'create policy "%s admin write" on %I for all using (is_admin()) with check (is_admin())',
      t, t
    );
  end loop;
end $$;

-- products: only 'active' rows are public; admins see drafts too.
drop policy if exists "products public read" on products;
create policy "products public read" on products
  for select using (status = 'active' or is_admin());

drop policy if exists "products admin write" on products;
create policy "products admin write" on products
  for all using (is_admin()) with check (is_admin());

-- --------------------------------------------------------------------------
-- Settings — public read (the storefront renders from them), admin write.
-- --------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['site_settings','seo_settings','page_seo']
  loop
    execute format('drop policy if exists "%s public read" on %I', t, t);
    execute format('create policy "%s public read" on %I for select using (true)', t, t);

    execute format('drop policy if exists "%s admin write" on %I', t, t);
    execute format(
      'create policy "%s admin write" on %I for all using (is_admin()) with check (is_admin())',
      t, t
    );
  end loop;
end $$;

-- --------------------------------------------------------------------------
-- addresses — strictly own rows.
-- --------------------------------------------------------------------------
drop policy if exists "addresses own" on addresses;
create policy "addresses own" on addresses
  for all using (user_id = auth.uid() or is_admin())
  with check (user_id = auth.uid());

-- --------------------------------------------------------------------------
-- orders — customers read their own; admins read and write all.
-- Inserts happen server-side via the service role, so no public insert policy.
-- --------------------------------------------------------------------------
drop policy if exists "orders read own" on orders;
create policy "orders read own" on orders
  for select using (user_id = auth.uid() or is_admin());

drop policy if exists "orders admin write" on orders;
create policy "orders admin write" on orders
  for all using (is_admin()) with check (is_admin());

drop policy if exists "order_items read own" on order_items;
create policy "order_items read own" on order_items
  for select using (
    exists (
      select 1 from orders o
      where o.id = order_items.order_id
        and (o.user_id = auth.uid() or is_admin())
    )
  );

drop policy if exists "order_items admin write" on order_items;
create policy "order_items admin write" on order_items
  for all using (is_admin()) with check (is_admin());

drop policy if exists "order_timeline read own" on order_timeline;
create policy "order_timeline read own" on order_timeline
  for select using (
    exists (
      select 1 from orders o
      where o.id = order_timeline.order_id
        and (o.user_id = auth.uid() or is_admin())
    )
  );

drop policy if exists "order_timeline admin write" on order_timeline;
create policy "order_timeline admin write" on order_timeline
  for all using (is_admin()) with check (is_admin());

-- --------------------------------------------------------------------------
-- reviews — public read; a customer may review a product they have bought.
-- --------------------------------------------------------------------------
drop policy if exists "reviews public read" on reviews;
create policy "reviews public read" on reviews for select using (true);

drop policy if exists "reviews insert purchased" on reviews;
create policy "reviews insert purchased" on reviews
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1
      from order_items oi
      join orders o on o.id = oi.order_id
      where oi.product_id = reviews.product_id
        and o.user_id = auth.uid()
        and o.payment_status = 'paid'
    )
  );

drop policy if exists "reviews update own" on reviews;
create policy "reviews update own" on reviews
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "reviews delete own or admin" on reviews;
create policy "reviews delete own or admin" on reviews
  for delete using (user_id = auth.uid() or is_admin());

-- --------------------------------------------------------------------------
-- coupons — no public read (codes are validated server-side). Admin only.
-- --------------------------------------------------------------------------
drop policy if exists "coupons admin all" on coupons;
create policy "coupons admin all" on coupons
  for all using (is_admin()) with check (is_admin());

-- --------------------------------------------------------------------------
-- subscribers / contact_messages — anyone may submit, admins may read.
-- --------------------------------------------------------------------------
drop policy if exists "subscribers public insert" on subscribers;
create policy "subscribers public insert" on subscribers
  for insert with check (true);

drop policy if exists "subscribers admin read" on subscribers;
create policy "subscribers admin read" on subscribers
  for select using (is_admin());

drop policy if exists "subscribers admin delete" on subscribers;
create policy "subscribers admin delete" on subscribers
  for delete using (is_admin());

drop policy if exists "contact public insert" on contact_messages;
create policy "contact public insert" on contact_messages
  for insert with check (true);

drop policy if exists "contact admin manage" on contact_messages;
create policy "contact admin manage" on contact_messages
  for select using (is_admin());

drop policy if exists "contact admin update" on contact_messages;
create policy "contact admin update" on contact_messages
  for update using (is_admin()) with check (is_admin());

drop policy if exists "contact admin delete" on contact_messages;
create policy "contact admin delete" on contact_messages
  for delete using (is_admin());

-- --------------------------------------------------------------------------
-- wishlist — strictly own rows.
-- --------------------------------------------------------------------------
drop policy if exists "wishlist own" on wishlist;
create policy "wishlist own" on wishlist
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- --------------------------------------------------------------------------
-- media — public read, admin write.
-- --------------------------------------------------------------------------
drop policy if exists "media public read" on media;
create policy "media public read" on media for select using (true);

drop policy if exists "media admin write" on media;
create policy "media admin write" on media
  for all using (is_admin()) with check (is_admin());

-- ===========================================================================
-- Storage buckets
-- ===========================================================================
insert into storage.buckets (id, name, public)
values
  ('product-images', 'product-images', true),
  ('brand-assets',   'brand-assets',   true),
  ('media-library',  'media-library',  true),
  ('avatars',        'avatars',        true)
on conflict (id) do nothing;

-- Public read on every bucket above.
drop policy if exists "storage public read" on storage.objects;
create policy "storage public read" on storage.objects
  for select using (
    bucket_id in ('product-images', 'brand-assets', 'media-library', 'avatars')
  );

-- Admin write on the three catalogue/brand buckets.
drop policy if exists "storage admin write" on storage.objects;
create policy "storage admin write" on storage.objects
  for all using (
    bucket_id in ('product-images', 'brand-assets', 'media-library')
    and is_admin()
  )
  with check (
    bucket_id in ('product-images', 'brand-assets', 'media-library')
    and is_admin()
  );

-- Avatars: each user may write only inside a folder named after their uid.
drop policy if exists "storage avatars own folder" on storage.objects;
create policy "storage avatars own folder" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "storage avatars update own" on storage.objects;
create policy "storage avatars update own" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "storage avatars delete own" on storage.objects;
create policy "storage avatars delete own" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ///////////////////////////////////////////////////////////////////////
-- 0003_seed.sql
-- ///////////////////////////////////////////////////////////////////////

-- ===========================================================================
-- MI TRENDS — seed data
-- Mirrors the demo catalogue in src/lib/demo/catalogue.ts.
-- Safe to re-run: every insert is guarded by a conflict/existence check.
-- ===========================================================================

insert into site_settings (site_name, tagline, contact_email, contact_phone, business_address,
  social_instagram, social_facebook, social_twitter, social_youtube,
  announcement_bar_active, announcement_bar_text, sale_active, sale_headline, sale_ends_at)
select 'MI TRENDS',
       'Considered essentials for men and women.',
       'hello@mitrends.com',
       '+91 98765 43210',
       '4th Floor, Prestige Atrium, MG Road, Bengaluru 560001, India',
       'https://instagram.com/mitrends',
       'https://facebook.com/mitrends',
       'https://x.com/mitrends',
       'https://youtube.com/@mitrends',
       true,
       'Complimentary shipping on orders over ₹2,000',
       true,
       'Mid-season sale — up to 30% off',
       now() + interval '6 days'
where not exists (select 1 from site_settings);

insert into seo_settings (meta_title_template, default_meta_description)
select '{page} | MI TRENDS',
       'MI TRENDS — considered essentials for men and women. Free shipping over ₹2,000.'
where not exists (select 1 from seo_settings);

-- --------------------------------------------------------------------------
-- Categories
-- --------------------------------------------------------------------------
insert into categories (name, slug, description, image_url, sort_order) values
  ('Shirts', 'shirts', 'Japanese cotton and silk blends, cut for everyday wear.',
   'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=1200&q=80', 1),
  ('Knitwear', 'knitwear', 'Merino and cashmere, finished by hand.',
   'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=1200&q=80', 2),
  ('Outerwear', 'outerwear', 'Weatherproof layers built for the long haul.',
   'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=1200&q=80', 3),
  ('Trousers', 'trousers', 'Considered tailoring with room to move.',
   'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=1200&q=80', 4),
  ('Dresses', 'dresses', 'Silk, poplin and crepe, cut to last.',
   'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=1200&q=80', 5),
  ('Footwear', 'footwear', 'Resoleable construction, Italian leather.',
   'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1200&q=80', 6),
  ('Accessories', 'accessories', 'The quiet details that finish a wardrobe.',
   'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200&q=80', 7)
on conflict (slug) do nothing;

-- --------------------------------------------------------------------------
-- Products — 10 men, 10 women, 2 unisex
-- --------------------------------------------------------------------------
insert into products (title, slug, description, short_description, category_id, gender,
  price, sale_price, sku, stock_quantity, status, tags, units_sold, created_at)
select v.title, v.slug, v.description, v.short_description,
       (select id from categories where slug = v.category_slug),
       v.gender::product_gender, v.price, v.sale_price, v.sku, v.stock,
       'active'::product_status, v.tags, v.units_sold, now() - (v.days_old || ' days')::interval
from (values
  -- ------------------------------------------------------------------ MEN --
  ('Oxford Shirt — Ecru', 'oxford-shirt-ecru',
   '<p>Woven in Japan from long-staple cotton, then washed once so it arrives soft rather than stiff. Unfused collar, single-needle side seams, and a box pleat at the back yoke.</p>',
   'Japanese long-staple cotton oxford, washed soft.', 'shirts', 'men',
   6500::numeric, null::numeric, 'MT-M-SHT-001', 140, array['cotton','shirt','japanese'], 420, 8),

  ('Camp Collar Shirt', 'camp-collar-shirt',
   '<p>A boxy camp-collar shirt in a breathable cotton-linen slub. Cut short enough to wear untucked, with a single chest pocket.</p>',
   'Cotton-linen camp collar, cut boxy.', 'shirts', 'men',
   5900, 4200, 'MT-M-SHT-002', 74, array['linen','summer','shirt'], 196, 22),

  ('Garment-Dyed Tee', 'garment-dyed-tee',
   '<p>A heavyweight 240gsm cotton tee, dyed after construction so the colour settles unevenly in the best way. Ribbed collar that will not twist.</p>',
   '240gsm cotton, dyed after construction.', 'shirts', 'men',
   3200, 2400, 'MT-M-SHT-003', 260, array['cotton','tee','everyday'], 731, 3),

  ('Hokkaido Merino Crew', 'hokkaido-merino-crew',
   '<p>Spun from 19.5-micron extrafine merino and knitted on vintage gauge machines. Fully fashioned shoulders mean the seams follow the body.</p>',
   'Extrafine merino crew, fully fashioned.', 'knitwear', 'men',
   8900, 6900, 'MT-M-KNT-001', 96, array['merino','knitwear','everyday'], 312, 15),

  ('Cashmere Half-Zip', 'cashmere-half-zip',
   '<p>Two-ply Inner Mongolian cashmere in a relaxed half-zip. Ribbed cuffs and hem hold their shape; the collar stands without a facing.</p>',
   'Two-ply cashmere half-zip in a relaxed cut.', 'knitwear', 'men',
   21500, null, 'MT-M-KNT-002', 27, array['cashmere','knitwear','luxury'], 88, 40),

  ('The Alpine Shell', 'the-alpine-shell',
   '<p>A three-layer waterproof shell built with a recycled face fabric and fully taped seams. Articulated sleeves and a two-way centre zip.</p>',
   'Three-layer recycled shell with taped seams.', 'outerwear', 'men',
   18900, 14900, 'MT-M-OUT-001', 42, array['waterproof','recycled','outerwear'], 128, 5),

  ('Kyoto Overcoat', 'kyoto-overcoat',
   '<p>An unstructured overcoat in a Japanese wool-cashmere melton. Raglan sleeves and a single patch pocket at each hip keep the silhouette quiet.</p>',
   'Unstructured wool-cashmere overcoat, half-lined.', 'outerwear', 'men',
   32000, null, 'MT-M-OUT-002', 18, array['wool','cashmere','overcoat'], 64, 60),

  ('Wide-Leg Chino', 'wide-leg-chino',
   '<p>A high-rise, wide-leg chino in garment-dyed Italian twill. Pleated front, extended tab closure, and a clean finish through the seat.</p>',
   'Garment-dyed Italian twill, pleated and wide.', 'trousers', 'men',
   9500, null, 'MT-M-TRS-001', 88, array['chino','trousers','italian'], 173, 30),

  ('Leather Derby — Chestnut', 'leather-derby-chestnut',
   '<p>Goodyear-welted derbies on a rounded last, made in a family workshop outside Florence. Resoleable, so they can be kept going indefinitely.</p>',
   'Goodyear-welted derby, made in Italy.', 'footwear', 'men',
   28900, 23100, 'MT-M-FTW-001', 31, array['leather','shoes','italian'], 112, 45),

  ('Full-Grain Leather Belt', 'full-grain-leather-belt',
   '<p>Cut from a single length of vegetable-tanned full-grain hide and finished with a solid brass buckle.</p>',
   'Vegetable-tanned hide, solid brass buckle.', 'accessories', 'men',
   4500, null, 'MT-M-ACC-001', 210, array['leather','belt','accessories'], 508, 70),

  -- ---------------------------------------------------------------- WOMEN --
  ('Silk Slip Dress', 'silk-slip-dress',
   '<p>Cut on the bias from sand-washed 19-momme silk, so it falls rather than clings. French seams throughout and an adjustable strap.</p>',
   'Sand-washed silk, cut on the bias.', 'dresses', 'women',
   16500, null, 'MT-W-DRS-001', 46, array['silk','dress','occasion'], 204, 4),

  ('Poplin Midi Dress', 'poplin-midi-dress',
   '<p>A crisp organic cotton poplin midi with a self-tie waist and a gently gathered skirt. Deep side pockets.</p>',
   'Crisp cotton poplin with a tie waist.', 'dresses', 'women',
   11900, 8900, 'MT-W-DRS-002', 62, array['cotton','dress','everyday'], 288, 11),

  ('Pleated Tea Dress', 'pleated-tea-dress',
   '<p>Knife-pleated from the waist in a soft recycled crepe. The pleats are heat-set so they hold through a wash.</p>',
   'Knife-pleated crepe with a covered placket.', 'dresses', 'women',
   13500, null, 'MT-W-DRS-003', 38, array['crepe','dress','pleated'], 141, 26),

  ('Silk-Blend Blouse', 'silk-blend-blouse',
   '<p>A fluid silk-cotton blend with a concealed placket and a collar that sits softly open. Cut long enough to tuck.</p>',
   'Fluid silk-cotton with a concealed placket.', 'shirts', 'women',
   8900, null, 'MT-W-SHT-001', 84, array['silk','blouse','workwear'], 267, 9),

  ('Boxy Cotton Shirt', 'boxy-cotton-shirt',
   '<p>Washed organic cotton cut square through the body, with a dropped shoulder and a curved hem.</p>',
   'Washed cotton, cut square and easy.', 'shirts', 'women',
   6900, 5200, 'MT-W-SHT-002', 110, array['cotton','shirt','everyday'], 322, 18),

  ('Cashmere Boat Neck', 'cashmere-boat-neck',
   '<p>Grade-A Inner Mongolian cashmere knitted to a fine gauge, with a wide boat neck that holds its line.</p>',
   'Grade-A cashmere in a wide boat neck.', 'knitwear', 'women',
   18900, null, 'MT-W-KNT-001', 34, array['cashmere','knitwear','luxury'], 158, 13),

  ('Merino Rib Cardigan', 'merino-rib-cardigan',
   '<p>A fine-gauge merino rib that skims rather than clings, finished with corozo buttons turned from tagua nut.</p>',
   'Fine-gauge merino rib with corozo buttons.', 'knitwear', 'women',
   12500, 9900, 'MT-W-KNT-002', 57, array['merino','cardigan','layering'], 219, 21),

  ('Belted Wool Coat', 'belted-wool-coat',
   '<p>Double-faced Italian wool with no lining needed — the reverse is finished as neatly as the face. A wide self-belt cinches it.</p>',
   'Double-faced Italian wool, fully belted.', 'outerwear', 'women',
   29500, null, 'MT-W-OUT-001', 21, array['wool','coat','italian'], 97, 35),

  ('Quilted Liner Jacket', 'quilted-liner-jacket-w',
   '<p>A diamond-quilted liner that works alone through the shoulder seasons or under a coat when it turns. Recycled fill, corduroy collar.</p>',
   'Diamond-quilted liner with recycled fill.', 'outerwear', 'women',
   12500, 9900, 'MT-W-OUT-002', 58, array['quilted','layering','recycled'], 203, 28),

  ('High-Rise Wide Trouser', 'high-rise-wide-trouser',
   '<p>A fluid Tencel twill cut high at the waist and wide to the floor. Side-seam pockets sit flat.</p>',
   'Fluid tencel twill with a clean high waist.', 'trousers', 'women',
   10900, null, 'MT-W-TRS-001', 72, array['tencel','trousers','tailoring'], 186, 16),

  -- --------------------------------------------------------------- UNISEX --
  ('Lambswool Scarf', 'lambswool-scarf',
   '<p>Woven in the Scottish Borders from soft lambswool, with hand-tied fringing at both ends.</p>',
   'Scottish lambswool with hand-tied fringe.', 'accessories', 'unisex',
   5500, null, 'MT-U-ACC-001', 130, array['wool','scarf','scotland'], 267, 50),

  ('Canvas Weekender', 'canvas-weekender',
   '<p>A 20oz waxed canvas holdall with bridle leather handles and a brass zip. Sized to clear most carry-on limits.</p>',
   'Waxed canvas holdall with bridle leather trim.', 'accessories', 'unisex',
   16500, null, 'MT-U-ACC-002', 24, array['bag','canvas','travel'], 77, 55)
) as v(title, slug, description, short_description, category_slug, gender,
       price, sale_price, sku, stock, tags, units_sold, days_old)
on conflict (slug) do nothing;

-- --------------------------------------------------------------------------
-- Product images — two per product, matching the demo catalogue
-- --------------------------------------------------------------------------
insert into product_images (product_id, image_url, sort_order, alt_text)
select (select id from products where slug = v.slug),
       'https://images.unsplash.com/' || v.photo || '?w=1400&q=80',
       v.sort_order,
       (select title from products where slug = v.slug)
from (values
  ('oxford-shirt-ecru','photo-1602810318383-e386cc2a3ccf',0),
  ('oxford-shirt-ecru','photo-1596755094514-f87e34085b2c',1),
  ('camp-collar-shirt','photo-1566174053879-31528523f8ae',0),
  ('camp-collar-shirt','photo-1495121605193-b116b5b9c5fe',1),
  ('garment-dyed-tee','photo-1521572163474-6864f9cf17ab',0),
  ('garment-dyed-tee','photo-1572804013309-59a88b7e92f1',1),
  ('hokkaido-merino-crew','photo-1576871337622-98d48d1cf531',0),
  ('hokkaido-merino-crew','photo-1591047139829-d91aecb6caea',1),
  ('cashmere-half-zip','photo-1620799140408-edc6dcb6d633',0),
  ('cashmere-half-zip','photo-1515886657613-9f3515b0c78f',1),
  ('the-alpine-shell','photo-1551028719-00167b16eac5',0),
  ('the-alpine-shell','photo-1544923246-77307dd654cb',1),
  ('kyoto-overcoat','photo-1539533018447-63fcce2678e3',0),
  ('kyoto-overcoat','photo-1608234807905-4466023792f5',1),
  ('wide-leg-chino','photo-1594633312681-425c7b97ccd1',0),
  ('wide-leg-chino','photo-1473966968600-fa801b869a1a',1),
  ('leather-derby-chestnut','photo-1549298916-b41d501d3772',0),
  ('leather-derby-chestnut','photo-1614252235316-8c857d38b5f4',1),
  ('full-grain-leather-belt','photo-1553062407-98eeb64c6a62',0),
  ('full-grain-leather-belt','photo-1583496661160-fb5886a0aaaa',1),
  ('silk-slip-dress','photo-1539008835657-9e8e9680c956',0),
  ('silk-slip-dress','photo-1595777457583-95e059d581b8',1),
  ('poplin-midi-dress','photo-1554568218-0f1715e72254',0),
  ('poplin-midi-dress','photo-1611312449408-fcece27cdbb7',1),
  ('pleated-tea-dress','photo-1583496661160-fb5886a0aaaa',0),
  ('pleated-tea-dress','photo-1618354691373-d851c5c3a990',1),
  ('silk-blend-blouse','photo-1485968579580-b6d095142e6e',0),
  ('silk-blend-blouse','photo-1487412720507-e7ab37603c6f',1),
  ('boxy-cotton-shirt','photo-1496747611176-843222e1e57c',0),
  ('boxy-cotton-shirt','photo-1479064555552-3ef4979f8908',1),
  ('cashmere-boat-neck','photo-1581044777550-4cfa60707c03',0),
  ('cashmere-boat-neck','photo-1564557287817-3785e38ec1f5',1),
  ('merino-rib-cardigan','photo-1502716119720-b23a93e5fe1b',0),
  ('merino-rib-cardigan','photo-1617137968427-85924c800a22',1),
  ('belted-wool-coat','photo-1434389677669-e08b4cac3105',0),
  ('belted-wool-coat','photo-1490114538077-0a7f8cb49891',1),
  ('quilted-liner-jacket-w','photo-1509319117193-57bab727e09d',0),
  ('quilted-liner-jacket-w','photo-1485462537746-965f33f7f6a7',1),
  ('high-rise-wide-trouser','photo-1594633312681-425c7b97ccd1',0),
  ('high-rise-wide-trouser','photo-1445205170230-053b83016050',1),
  ('lambswool-scarf','photo-1520903074185-8eca362b3dce',0),
  ('lambswool-scarf','photo-1469334031218-e382a71b716b',1),
  ('canvas-weekender','photo-1553062407-98eeb64c6a62',0),
  ('canvas-weekender','photo-1441984904996-e0b6ba687e04',1)
) as v(slug, photo, sort_order)
where exists (select 1 from products where slug = v.slug)
  and not exists (
    select 1 from product_images pi
    join products p on p.id = pi.product_id
    where p.slug = v.slug
  );

-- --------------------------------------------------------------------------
-- Size + colour options and variants for apparel
-- --------------------------------------------------------------------------
do $$
declare
  r record;
  opt_size uuid;
  opt_colour uuid;
  s text;
  c text;
  sizes text[] := array['XS','S','M','L','XL'];
  colours text[] := array['Ecru','Charcoal','Navy'];
  i int;
begin
  for r in
    select p.id, p.sku from products p
    join categories cat on cat.id = p.category_id
    where cat.slug in ('knitwear','shirts','outerwear','trousers','dresses')
  loop
    if exists (select 1 from product_options where product_id = r.id) then
      continue;
    end if;

    insert into product_options (product_id, name, sort_order)
      values (r.id, 'Size', 0) returning id into opt_size;
    insert into product_options (product_id, name, sort_order)
      values (r.id, 'Colour', 1) returning id into opt_colour;

    i := 0;
    foreach s in array sizes loop
      insert into product_option_values (option_id, value, sort_order) values (opt_size, s, i);
      i := i + 1;
    end loop;

    i := 0;
    foreach c in array colours loop
      insert into product_option_values (option_id, value, sort_order) values (opt_colour, c, i);
      i := i + 1;
    end loop;

    i := 0;
    foreach s in array sizes loop
      foreach c in array colours loop
        insert into product_variants (product_id, sku, stock_quantity, option_values)
        values (
          r.id,
          coalesce(r.sku, 'MT') || '-' || s || '-' || upper(left(c, 3)),
          -- one combination deliberately sold out, so the PDP shows that state
          case when s = 'XL' and c = 'Navy' then 0 else 6 + (i * 3) end,
          jsonb_build_array(
            jsonb_build_object('option_name', 'Size', 'value', s),
            jsonb_build_object('option_name', 'Colour', 'value', c)
          )
        );
      end loop;
      i := i + 1;
    end loop;
  end loop;
end $$;

-- Footwear gets numeric sizes only.
do $$
declare
  r record;
  opt_size uuid;
  s text;
  sizes text[] := array['6','7','8','9','10','11'];
  i int;
begin
  for r in
    select p.id, p.sku from products p
    join categories cat on cat.id = p.category_id
    where cat.slug = 'footwear'
  loop
    if exists (select 1 from product_options where product_id = r.id) then
      continue;
    end if;

    insert into product_options (product_id, name, sort_order)
      values (r.id, 'Size', 0) returning id into opt_size;

    i := 0;
    foreach s in array sizes loop
      insert into product_option_values (option_id, value, sort_order) values (opt_size, s, i);
      insert into product_variants (product_id, sku, stock_quantity, option_values)
      values (
        r.id,
        coalesce(r.sku, 'MT') || '-' || s,
        case when s = '11' then 0 else 4 + i end,
        jsonb_build_array(jsonb_build_object('option_name', 'Size', 'value', s))
      );
      i := i + 1;
    end loop;
  end loop;
end $$;

-- --------------------------------------------------------------------------
-- Hero slides, shipping, coupons, testimonials, social, page SEO
-- --------------------------------------------------------------------------
insert into hero_slides (image_url, heading, subheading, cta_text, cta_link, sort_order)
select * from (values
  ('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=2000&q=80',
   'Built for the long run',
   'Autumn/Winter essentials for men and women, cut from fabrics chosen to outlast the season.',
   'Shop the collection', '/products', 0),
  ('https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=2000&q=80',
   'The women''s edit', 'Silk, cashmere and cotton poplin — pieces that do the work of five.',
   'Shop women', '/women', 1),
  ('https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=2000&q=80',
   'The men''s edit', 'Japanese shirting, Italian tailoring and outerwear that earns its keep.',
   'Shop men', '/men', 2)
) as v
where not exists (select 1 from hero_slides);

insert into shipping_methods (name, price, estimated_delivery, free_shipping_threshold, sort_order)
select * from (values
  ('Standard', 99.00, '4–6 business days', 2000.00, 0),
  ('Express', 249.00, '2–3 business days', null::numeric, 1),
  ('Next Day', 499.00, 'Next business day', null::numeric, 2)
) as v
where not exists (select 1 from shipping_methods);

insert into coupons (code, type, value, min_order_amount, usage_limit, per_customer_limit, is_active)
values
  ('WELCOME10', 'percentage', 10, 2000, 500, 1, true),
  ('FLAT500',   'fixed',     500, 5000, 200, 2, true)
on conflict (code) do nothing;

insert into testimonials (author_name, author_role, quote, rating, sort_order)
select * from (values
  ('Ananya R.', 'Bengaluru', 'The merino crew has been in weekly rotation for eight months and still looks new. Worth every rupee.', 5, 0),
  ('Devansh K.', 'Mumbai', 'Fit and finish you normally pay three times as much for. The oxford is the best shirt I own.', 5, 1),
  ('Priya M.', 'Delhi', 'Ordered the slip dress on a Tuesday, wearing it by Thursday. Packaging was lovely and entirely recyclable.', 5, 2),
  ('Rohan S.', 'Pune', 'The derbies needed a week to break in and now they feel custom. Resoleable, so they are staying.', 4, 3)
) as v
where not exists (select 1 from testimonials);

insert into social_posts (image_url, link, caption, sort_order)
select * from (values
  ('https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&q=80', '/products', 'In store, Bengaluru', 0),
  ('https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=80', '/products', 'AW essentials', 1),
  ('https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80', '/products', 'The knitwear edit', 2),
  ('https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=800&q=80', '/products', 'On the road', 3),
  ('https://images.unsplash.com/photo-1509319117193-57bab727e09d?w=800&q=80', '/products', 'Detail study', 4),
  ('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80', '/products', 'Behind the seams', 5)
) as v
where not exists (select 1 from social_posts);

insert into page_seo (page_slug, meta_title, meta_description) values
  ('home',     'MI TRENDS — Considered essentials', 'Modern wardrobe essentials for men and women. Free shipping over ₹2,000.'),
  ('about',    'About MI TRENDS', 'How we choose fabrics, the workshops we partner with, and why we make fewer things.'),
  ('contact',  'Contact MI TRENDS', 'Questions about an order, sizing or a return? We answer within one business day.'),
  ('faq',      'Frequently asked questions', 'Sizing, shipping, returns and care — answered.'),
  ('shipping-policy', 'Shipping Policy', 'Delivery timelines, costs and tracking.'),
  ('returns-policy',  'Returns Policy', 'Thirty-day returns on unworn items.'),
  ('privacy-policy',  'Privacy Policy', 'What we collect, why, and how to have it removed.'),
  ('terms',           'Terms of Service', 'The terms that govern use of this store.')
on conflict (page_slug) do nothing;
