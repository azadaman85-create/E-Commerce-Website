-- =========================================================================
-- MI TRENDS — outstanding migrations
--
-- Your project already has 0001-0004 and the seed data. These two are new.
-- Paste the whole file into the Supabase SQL editor and run it once.
-- Idempotent and additive: nothing is dropped, no data is deleted.
--
--   0005  returns  — the table behind 'Request a return'
--   0006  stock    — gives back inventory held by abandoned checkouts,
--                    and stops unpaid orders inflating best sellers
-- =========================================================================


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
-- 0006_stock_release.sql
-- ///////////////////////////////////////////////////////////////////////

-- ===========================================================================
-- MI TRENDS — release stock held by abandoned orders
--
-- Stock is deliberately decremented when the order is created: that reserves
-- it for the duration of checkout and is what stops two people buying the last
-- item at once. The gap was that nothing ever gave it back. A customer who
-- opened the payment window and walked away held that stock permanently.
--
-- This adds the other half of the reservation, and corrects units_sold, which
-- was counting unpaid orders and so inflating the best-sellers ranking.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. Reserve stock only. units_sold now moves when money does.
-- ---------------------------------------------------------------------------
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
          end
      where id = new.product_id;
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. units_sold follows payment, not order creation.
-- ---------------------------------------------------------------------------
create or replace function sync_units_sold_on_payment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Became paid: count the sale.
  if new.payment_status = 'paid' and old.payment_status is distinct from 'paid' then
    update products p
      set units_sold = p.units_sold + oi.total_qty
      from (
        select product_id, sum(quantity) as total_qty
        from order_items
        where order_id = new.id and product_id is not null
        group by product_id
      ) oi
      where p.id = oi.product_id;

  -- Was paid and no longer is (refund or chargeback): take it back off.
  elsif old.payment_status = 'paid' and new.payment_status is distinct from 'paid' then
    update products p
      set units_sold = greatest(0, p.units_sold - oi.total_qty)
      from (
        select product_id, sum(quantity) as total_qty
        from order_items
        where order_id = new.id and product_id is not null
        group by product_id
      ) oi
      where p.id = oi.product_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_units_sold_on_payment on orders;
create trigger trg_units_sold_on_payment after update of payment_status on orders
  for each row execute function sync_units_sold_on_payment();

-- ---------------------------------------------------------------------------
-- 3. Give reserved stock back.
-- ---------------------------------------------------------------------------
create or replace function restore_order_stock(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update product_variants v
    set stock_quantity = v.stock_quantity + oi.total_qty
    from (
      select variant_id, sum(quantity) as total_qty
      from order_items
      where order_id = p_order_id and variant_id is not null
      group by variant_id
    ) oi
    where v.id = oi.variant_id;

  update products p
    set stock_quantity = p.stock_quantity + oi.total_qty
    from (
      select product_id, sum(quantity) as total_qty
      from order_items
      where order_id = p_order_id and product_id is not null
      group by product_id
    ) oi
    where p.id = oi.product_id and p.track_inventory;
end;
$$;

-- Cancelling an order returns its stock to the shelf.
create or replace function release_stock_on_cancel()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.fulfillment_status = 'cancelled'
     and old.fulfillment_status is distinct from 'cancelled' then
    perform restore_order_stock(new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_release_stock_on_cancel on orders;
create trigger trg_release_stock_on_cancel
  after update of fulfillment_status on orders
  for each row execute function release_stock_on_cancel();

-- ---------------------------------------------------------------------------
-- 4. Sweep abandoned checkouts.
-- ---------------------------------------------------------------------------
/**
 * Releases stock held by orders that are still unpaid after p_minutes and
 * marks them failed. Returns how many were swept.
 *
 * Thirty minutes is comfortably longer than any real payment attempt while
 * still freeing a sold-out item the same hour.
 */
create or replace function release_abandoned_orders(p_minutes int default 30)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  swept int := 0;
begin
  for r in
    select id from orders
    where payment_status = 'pending'
      and fulfillment_status = 'pending'
      and created_at < now() - (p_minutes || ' minutes')::interval
  loop
    perform restore_order_stock(r.id);

    -- Set fulfillment first: the cancel trigger would otherwise restore the
    -- same stock a second time.
    update orders
      set fulfillment_status = 'cancelled',
          payment_status = 'failed'
      where id = r.id;

    insert into order_timeline (order_id, status, note)
    values (r.id, 'cancelled',
            'Abandoned at checkout — stock returned after ' || p_minutes || ' minutes');

    swept := swept + 1;
  end loop;

  return swept;
end;
$$;

-- The sweep restores stock itself, so the cancel trigger must not double it.
create or replace function release_stock_on_cancel()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.fulfillment_status = 'cancelled'
     and old.fulfillment_status is distinct from 'cancelled'
     -- A sweep sets payment_status to 'failed' in the same statement; an
     -- admin cancelling by hand does not.
     and not (new.payment_status = 'failed' and old.payment_status = 'pending') then
    perform restore_order_stock(new.id);
  end if;
  return new;
end;
$$;
