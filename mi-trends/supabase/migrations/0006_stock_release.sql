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
