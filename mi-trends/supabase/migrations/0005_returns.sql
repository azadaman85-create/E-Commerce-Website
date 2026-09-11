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
