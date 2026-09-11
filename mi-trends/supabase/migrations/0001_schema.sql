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
