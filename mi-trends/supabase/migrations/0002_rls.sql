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
