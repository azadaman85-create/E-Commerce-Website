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
