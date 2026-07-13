-- Inventory system for tabacaria
-- Core tables, constraints, RLS and transactional RPCs

create extension if not exists pgcrypto;

-- Extend profiles table used by auth with inventory metadata
alter table public.profiles
  add column if not exists tabacaria_name text,
  add column if not exists updated_at timestamptz not null default now();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  constraint categories_user_name_unique unique (user_id, name)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null,
  normalized_name text generated always as (regexp_replace(lower(trim(name)), '\s+', '', 'g')) stored,
  cost_price numeric(14,2) not null check (cost_price >= 0),
  sale_price numeric(14,2) not null check (sale_price >= 0),
  current_stock integer not null check (current_stock >= 0),
  minimum_stock integer not null check (minimum_stock >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists products_user_normalized_name_unique on public.products(user_id, normalized_name);
create index if not exists products_user_category_idx on public.products(user_id, category_id);
create index if not exists products_user_active_idx on public.products(user_id, active);

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create table if not exists public.inventory_months (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  year integer not null check (year between 2020 and 2100),
  month integer not null check (month between 1 and 12),
  status text not null default 'open' check (status in ('open', 'closed')),
  has_week_5 boolean not null default false,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inventory_months_user_period_unique unique (user_id, year, month)
);

create index if not exists inventory_months_user_status_idx on public.inventory_months(user_id, status);

drop trigger if exists inventory_months_set_updated_at on public.inventory_months;
create trigger inventory_months_set_updated_at
before update on public.inventory_months
for each row execute function public.set_updated_at();

create table if not exists public.inventory_weeks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  inventory_month_id uuid not null references public.inventory_months(id) on delete cascade,
  week_number integer not null check (week_number between 1 and 5),
  start_date date not null,
  end_date date not null,
  is_finalized boolean not null default false,
  finalized_at timestamptz,
  reopened_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inventory_weeks_dates check (end_date >= start_date),
  constraint inventory_weeks_unique unique (inventory_month_id, week_number)
);

create index if not exists inventory_weeks_user_month_idx on public.inventory_weeks(user_id, inventory_month_id);
create index if not exists inventory_weeks_finalized_idx on public.inventory_weeks(user_id, is_finalized);

drop trigger if exists inventory_weeks_set_updated_at on public.inventory_weeks;
create trigger inventory_weeks_set_updated_at
before update on public.inventory_weeks
for each row execute function public.set_updated_at();

create table if not exists public.weekly_inventory_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  inventory_week_id uuid not null references public.inventory_weeks(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  start_stock integer not null check (start_stock >= 0),
  restock_qty integer not null default 0 check (restock_qty >= 0),
  expected_stock integer not null default 0 check (expected_stock >= 0),
  counted_stock integer check (counted_stock >= 0),
  sold_qty integer not null default 0 check (sold_qty >= 0),
  revenue numeric(14,2) not null default 0 check (revenue >= 0),
  cost_amount numeric(14,2) not null default 0 check (cost_amount >= 0),
  gross_profit numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint weekly_inventory_items_unique unique (inventory_week_id, product_id)
);

create index if not exists weekly_inventory_items_week_idx on public.weekly_inventory_items(inventory_week_id);
create index if not exists weekly_inventory_items_user_idx on public.weekly_inventory_items(user_id);

drop trigger if exists weekly_inventory_items_set_updated_at on public.weekly_inventory_items;
create trigger weekly_inventory_items_set_updated_at
before update on public.weekly_inventory_items
for each row execute function public.set_updated_at();

create table if not exists public.restocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  stock_before integer not null check (stock_before >= 0),
  stock_after integer not null check (stock_after >= 0),
  restocked_at timestamptz not null default now(),
  inventory_month_id uuid not null references public.inventory_months(id) on delete restrict,
  inventory_week_id uuid not null references public.inventory_weeks(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists restocks_user_date_idx on public.restocks(user_id, restocked_at desc);
create index if not exists restocks_week_idx on public.restocks(inventory_week_id);

drop trigger if exists restocks_set_updated_at on public.restocks;
create trigger restocks_set_updated_at
before update on public.restocks
for each row execute function public.set_updated_at();

create table if not exists public.monthly_closings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  inventory_month_id uuid not null references public.inventory_months(id) on delete restrict,
  year integer not null,
  month integer not null,
  total_sold_qty integer not null default 0,
  gross_revenue numeric(14,2) not null default 0,
  total_cost numeric(14,2) not null default 0,
  gross_profit numeric(14,2) not null default 0,
  commission_percent numeric(6,2) not null default 30,
  commission_value numeric(14,2) not null default 0,
  net_profit numeric(14,2) not null default 0,
  closed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint monthly_closings_unique unique (user_id, year, month)
);

create index if not exists monthly_closings_user_closed_idx on public.monthly_closings(user_id, closed_at desc);

drop trigger if exists monthly_closings_set_updated_at on public.monthly_closings;
create trigger monthly_closings_set_updated_at
before update on public.monthly_closings
for each row execute function public.set_updated_at();

create table if not exists public.monthly_closing_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  monthly_closing_id uuid not null references public.monthly_closings(id) on delete cascade,
  product_id uuid,
  product_name text not null,
  category_name text,
  start_stock integer not null default 0,
  total_restock integer not null default 0,
  final_stock integer not null default 0,
  sold_qty integer not null default 0,
  revenue numeric(14,2) not null default 0,
  cost_amount numeric(14,2) not null default 0,
  gross_profit numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists monthly_closing_items_month_idx on public.monthly_closing_items(monthly_closing_id);

drop trigger if exists monthly_closing_items_set_updated_at on public.monthly_closing_items;
create trigger monthly_closing_items_set_updated_at
before update on public.monthly_closing_items
for each row execute function public.set_updated_at();

create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  tabacaria_name text not null default 'Minha Tabacaria',
  logo_url text,
  commission_percent numeric(6,2) not null default 30 check (commission_percent between 0 and 100),
  currency text not null default 'BRL',
  date_format text not null default 'dd/MM/yyyy',
  sidebar_collapsed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists settings_user_idx on public.settings(user_id);

drop trigger if exists settings_set_updated_at on public.settings;
create trigger settings_set_updated_at
before update on public.settings
for each row execute function public.set_updated_at();

-- RLS
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.inventory_months enable row level security;
alter table public.inventory_weeks enable row level security;
alter table public.weekly_inventory_items enable row level security;
alter table public.restocks enable row level security;
alter table public.monthly_closings enable row level security;
alter table public.monthly_closing_items enable row level security;
alter table public.settings enable row level security;

create policy if not exists categories_select_own on public.categories for select using (auth.uid() = user_id);
create policy if not exists categories_insert_own on public.categories for insert with check (auth.uid() = user_id);
create policy if not exists categories_update_own on public.categories for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy if not exists categories_delete_own on public.categories for delete using (auth.uid() = user_id);

create policy if not exists products_select_own on public.products for select using (auth.uid() = user_id);
create policy if not exists products_insert_own on public.products for insert with check (auth.uid() = user_id);
create policy if not exists products_update_own on public.products for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy if not exists products_delete_own on public.products for delete using (auth.uid() = user_id);

create policy if not exists inventory_months_select_own on public.inventory_months for select using (auth.uid() = user_id);
create policy if not exists inventory_months_insert_own on public.inventory_months for insert with check (auth.uid() = user_id);
create policy if not exists inventory_months_update_own on public.inventory_months for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy if not exists inventory_months_delete_own on public.inventory_months for delete using (auth.uid() = user_id);

create policy if not exists inventory_weeks_select_own on public.inventory_weeks for select using (auth.uid() = user_id);
create policy if not exists inventory_weeks_insert_own on public.inventory_weeks for insert with check (auth.uid() = user_id);
create policy if not exists inventory_weeks_update_own on public.inventory_weeks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy if not exists inventory_weeks_delete_own on public.inventory_weeks for delete using (auth.uid() = user_id);

create policy if not exists weekly_items_select_own on public.weekly_inventory_items for select using (auth.uid() = user_id);
create policy if not exists weekly_items_insert_own on public.weekly_inventory_items for insert with check (auth.uid() = user_id);
create policy if not exists weekly_items_update_own on public.weekly_inventory_items for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy if not exists weekly_items_delete_own on public.weekly_inventory_items for delete using (auth.uid() = user_id);

create policy if not exists restocks_select_own on public.restocks for select using (auth.uid() = user_id);
create policy if not exists restocks_insert_own on public.restocks for insert with check (auth.uid() = user_id);
create policy if not exists restocks_update_own on public.restocks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy if not exists restocks_delete_own on public.restocks for delete using (auth.uid() = user_id);

create policy if not exists monthly_closings_select_own on public.monthly_closings for select using (auth.uid() = user_id);
create policy if not exists monthly_closings_insert_own on public.monthly_closings for insert with check (auth.uid() = user_id);
create policy if not exists monthly_closings_update_own on public.monthly_closings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy if not exists monthly_closings_delete_own on public.monthly_closings for delete using (auth.uid() = user_id);

create policy if not exists monthly_items_select_own on public.monthly_closing_items for select using (auth.uid() = user_id);
create policy if not exists monthly_items_insert_own on public.monthly_closing_items for insert with check (auth.uid() = user_id);
create policy if not exists monthly_items_update_own on public.monthly_closing_items for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy if not exists monthly_items_delete_own on public.monthly_closing_items for delete using (auth.uid() = user_id);

create policy if not exists settings_select_own on public.settings for select using (auth.uid() = user_id);
create policy if not exists settings_insert_own on public.settings for insert with check (auth.uid() = user_id);
create policy if not exists settings_update_own on public.settings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy if not exists settings_delete_own on public.settings for delete using (auth.uid() = user_id);

-- Auto seed categories and settings
create or replace function public.seed_inventory_user_defaults(p_user_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  category_name text;
  year_value integer;
  month_value integer;
  month_id uuid;
  week_cursor date;
  month_start date;
  month_end date;
  week_number integer := 1;
begin
  insert into public.settings (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  foreach category_name in array array[
    'Essencias', 'Pods', 'Carvao', 'Seda', 'Piteira',
    'Bebidas', 'Carregadores', 'Acessorios', 'Narguile', 'Outros'
  ]
  loop
    insert into public.categories (user_id, name)
    values (p_user_id, category_name)
    on conflict (user_id, name) do nothing;
  end loop;

  year_value := extract(year from now())::int;
  month_value := extract(month from now())::int;

  insert into public.inventory_months (user_id, year, month, has_week_5)
  values (p_user_id, year_value, month_value, extract(day from (date_trunc('month', now()) + interval '1 month - 1 day'))::int > 28)
  on conflict (user_id, year, month) do nothing;

  select id into month_id
  from public.inventory_months
  where user_id = p_user_id and year = year_value and month = month_value;

  month_start := date_trunc('month', make_date(year_value, month_value, 1))::date;
  month_end := (month_start + interval '1 month - 1 day')::date;
  week_cursor := month_start;

  while week_cursor <= month_end loop
    insert into public.inventory_weeks (
      user_id, inventory_month_id, week_number, start_date, end_date
    )
    values (
      p_user_id,
      month_id,
      week_number,
      week_cursor,
      least((week_cursor + interval '6 day')::date, month_end)
    )
    on conflict (inventory_month_id, week_number) do nothing;

    week_number := week_number + 1;
    week_cursor := (week_cursor + interval '7 day')::date;
  end loop;
end;
$$;

create or replace function public.seed_inventory_on_profile_insert()
returns trigger
language plpgsql
security definer
as $$
begin
  perform public.seed_inventory_user_defaults(new.id);
  return new;
end;
$$;

drop trigger if exists profiles_seed_inventory_defaults on public.profiles;
create trigger profiles_seed_inventory_defaults
after insert on public.profiles
for each row execute function public.seed_inventory_on_profile_insert();

-- Ensure weekly rows for all active products
create or replace function public.ensure_weekly_items(p_week_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_week record;
  v_prev_week_id uuid;
begin
  select * into v_week
  from public.inventory_weeks
  where id = p_week_id and user_id = auth.uid();

  if v_week is null then
    raise exception 'Semana nao encontrada';
  end if;

  if v_week.is_finalized then
    return;
  end if;

  select id into v_prev_week_id
  from public.inventory_weeks
  where inventory_month_id = v_week.inventory_month_id
    and week_number = v_week.week_number - 1
    and user_id = v_week.user_id;

  insert into public.weekly_inventory_items (
    user_id,
    inventory_week_id,
    product_id,
    start_stock,
    expected_stock
  )
  select
    v_week.user_id,
    v_week.id,
    p.id,
    coalesce(prev.counted_stock, p.current_stock),
    coalesce(prev.counted_stock, p.current_stock)
  from public.products p
  left join public.weekly_inventory_items prev
    on prev.inventory_week_id = v_prev_week_id and prev.product_id = p.id
  where p.user_id = v_week.user_id and p.active = true
  on conflict (inventory_week_id, product_id) do nothing;
end;
$$;

-- Restock registration with correct month/week association
create or replace function public.register_restock(p_product_id uuid, p_quantity integer)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_product record;
  v_month record;
  v_week record;
  v_now timestamptz := now();
  v_before integer;
  v_after integer;
  v_restock_id uuid;
begin
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Quantidade invalida';
  end if;

  select * into v_product
  from public.products
  where id = p_product_id and user_id = auth.uid() and active = true
  for update;

  if v_product is null then
    raise exception 'Produto nao encontrado';
  end if;

  select * into v_month
  from public.inventory_months
  where user_id = auth.uid() and year = extract(year from v_now)::int and month = extract(month from v_now)::int;

  if v_month is null then
    perform public.seed_inventory_user_defaults(auth.uid());

    select * into v_month
    from public.inventory_months
    where user_id = auth.uid() and year = extract(year from v_now)::int and month = extract(month from v_now)::int;
  end if;

  select * into v_week
  from public.inventory_weeks
  where inventory_month_id = v_month.id
    and user_id = auth.uid()
    and v_now::date between start_date and end_date;

  if v_week is null then
    raise exception 'Semana do periodo nao encontrada';
  end if;

  perform public.ensure_weekly_items(v_week.id);

  v_before := v_product.current_stock;
  v_after := v_before + p_quantity;

  update public.products
  set current_stock = v_after
  where id = p_product_id;

  insert into public.restocks (
    user_id,
    product_id,
    quantity,
    stock_before,
    stock_after,
    restocked_at,
    inventory_month_id,
    inventory_week_id
  ) values (
    auth.uid(),
    p_product_id,
    p_quantity,
    v_before,
    v_after,
    v_now,
    v_month.id,
    v_week.id
  ) returning id into v_restock_id;

  update public.weekly_inventory_items
  set
    restock_qty = restock_qty + p_quantity,
    expected_stock = start_stock + (restock_qty + p_quantity)
  where inventory_week_id = v_week.id and product_id = p_product_id;

  return jsonb_build_object('restock_id', v_restock_id, 'stock_before', v_before, 'stock_after', v_after);
end;
$$;

create or replace function public.recompute_week_item_financials(p_week_id uuid)
returns void
language sql
security definer
as $$
  update public.weekly_inventory_items i
  set
    sold_qty = greatest(i.start_stock + i.restock_qty - coalesce(i.counted_stock, i.expected_stock), 0),
    revenue = greatest(i.start_stock + i.restock_qty - coalesce(i.counted_stock, i.expected_stock), 0) * p.sale_price,
    cost_amount = greatest(i.start_stock + i.restock_qty - coalesce(i.counted_stock, i.expected_stock), 0) * p.cost_price,
    gross_profit = (greatest(i.start_stock + i.restock_qty - coalesce(i.counted_stock, i.expected_stock), 0) * p.sale_price)
      - (greatest(i.start_stock + i.restock_qty - coalesce(i.counted_stock, i.expected_stock), 0) * p.cost_price)
  from public.products p
  where i.product_id = p.id and i.inventory_week_id = p_week_id;
$$;

-- Finalize week with stock transition
create or replace function public.finalize_inventory_week(p_week_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_week record;
  v_pending integer;
  v_over integer;
  v_next_week_id uuid;
begin
  select * into v_week
  from public.inventory_weeks
  where id = p_week_id and user_id = auth.uid()
  for update;

  if v_week is null then
    raise exception 'Semana nao encontrada';
  end if;

  if v_week.is_finalized then
    raise exception 'Semana ja finalizada';
  end if;

  perform public.ensure_weekly_items(v_week.id);

  select count(*) into v_pending
  from public.weekly_inventory_items
  where inventory_week_id = v_week.id and counted_stock is null;

  if v_pending > 0 then
    raise exception 'Existem produtos sem contagem';
  end if;

  select count(*) into v_over
  from public.weekly_inventory_items
  where inventory_week_id = v_week.id and counted_stock > expected_stock;

  if v_over > 0 then
    raise exception 'Estoque contado maior que o esperado; ajuste necessario';
  end if;

  perform public.recompute_week_item_financials(v_week.id);

  update public.products p
  set current_stock = i.counted_stock
  from public.weekly_inventory_items i
  where i.inventory_week_id = v_week.id and i.product_id = p.id and p.user_id = auth.uid();

  update public.inventory_weeks
  set is_finalized = true, finalized_at = now()
  where id = v_week.id;

  select id into v_next_week_id
  from public.inventory_weeks
  where inventory_month_id = v_week.inventory_month_id and week_number = v_week.week_number + 1 and user_id = auth.uid();

  if v_next_week_id is not null then
    perform public.ensure_weekly_items(v_next_week_id);

    update public.weekly_inventory_items next_item
    set
      start_stock = current_item.counted_stock,
      expected_stock = current_item.counted_stock + next_item.restock_qty
    from public.weekly_inventory_items current_item
    where next_item.inventory_week_id = v_next_week_id
      and current_item.inventory_week_id = v_week.id
      and next_item.product_id = current_item.product_id;
  end if;

  return jsonb_build_object('status', 'ok');
end;
$$;

create or replace function public.reopen_inventory_week(p_week_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_week record;
  v_post_count integer;
  v_month_closed integer;
begin
  select * into v_week
  from public.inventory_weeks
  where id = p_week_id and user_id = auth.uid()
  for update;

  if v_week is null then
    raise exception 'Semana nao encontrada';
  end if;

  if not v_week.is_finalized then
    return jsonb_build_object('status', 'already-open');
  end if;

  select count(*) into v_post_count
  from public.inventory_weeks
  where inventory_month_id = v_week.inventory_month_id
    and week_number > v_week.week_number
    and is_finalized = true
    and user_id = auth.uid();

  select count(*) into v_month_closed
  from public.inventory_months
  where id = v_week.inventory_month_id and status = 'closed' and user_id = auth.uid();

  if v_post_count > 0 or v_month_closed > 0 then
    raise exception 'Nao e permitido reabrir semana com periodo posterior fechado';
  end if;

  update public.inventory_weeks
  set is_finalized = false, reopened_at = now(), finalized_at = null
  where id = v_week.id;

  return jsonb_build_object('status', 'ok');
end;
$$;

-- Dashboard metrics and charts payload
create or replace function public.dashboard_metrics(p_month_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_month record;
  v_commission_percent numeric(6,2);
  v_payload jsonb;
begin
  select * into v_month
  from public.inventory_months
  where id = p_month_id and user_id = auth.uid();

  if v_month is null then
    raise exception 'Mes nao encontrado';
  end if;

  select commission_percent into v_commission_percent
  from public.settings
  where user_id = auth.uid();

  v_commission_percent := coalesce(v_commission_percent, 30);

  with products_base as (
    select
      count(*)::int as products_count,
      coalesce(sum(current_stock), 0)::int as total_stock_qty,
      coalesce(sum(current_stock * cost_price), 0)::numeric(14,2) as total_invested,
      coalesce(sum(current_stock * sale_price), 0)::numeric(14,2) as total_potential_revenue,
      coalesce(sum(case when current_stock <= minimum_stock then 1 else 0 end), 0)::int as low_stock_count
    from public.products
    where user_id = auth.uid() and active = true
  ),
  month_totals as (
    select
      coalesce(sum(sold_qty), 0)::int as sold_qty,
      coalesce(sum(revenue), 0)::numeric(14,2) as month_revenue,
      coalesce(sum(cost_amount), 0)::numeric(14,2) as month_cost,
      coalesce(sum(gross_profit), 0)::numeric(14,2) as gross_profit
    from public.weekly_inventory_items i
    join public.inventory_weeks w on w.id = i.inventory_week_id
    where w.inventory_month_id = p_month_id and i.user_id = auth.uid()
  ),
  by_week as (
    select jsonb_agg(
      jsonb_build_object(
        'name', 'Semana ' || w.week_number,
        'receita', coalesce(sum(i.revenue), 0),
        'lucro', coalesce(sum(i.gross_profit), 0)
      )
      order by w.week_number
    ) as payload
    from public.inventory_weeks w
    left join public.weekly_inventory_items i on i.inventory_week_id = w.id and i.user_id = auth.uid()
    where w.inventory_month_id = p_month_id and w.user_id = auth.uid()
    group by w.inventory_month_id
  )
  select jsonb_build_object(
    'products_count', pb.products_count,
    'total_stock_qty', pb.total_stock_qty,
    'total_invested', pb.total_invested,
    'total_potential_revenue', pb.total_potential_revenue,
    'month_revenue', mt.month_revenue,
    'gross_profit', mt.gross_profit,
    'commission_value', mt.month_revenue * (v_commission_percent / 100),
    'net_profit', mt.month_revenue - mt.month_cost - (mt.month_revenue * (v_commission_percent / 100)),
    'low_stock_count', pb.low_stock_count,
    'by_week', coalesce(bw.payload, '[]'::jsonb)
  ) into v_payload
  from products_base pb
  cross join month_totals mt
  left join by_week bw on true;

  return v_payload;
end;
$$;

-- Monthly closing transaction snapshot
create or replace function public.close_inventory_month(p_month_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_month record;
  v_pending integer;
  v_commission_percent numeric(6,2);
  v_closing_id uuid;
  v_next_month date;
begin
  select * into v_month
  from public.inventory_months
  where id = p_month_id and user_id = auth.uid()
  for update;

  if v_month is null then
    raise exception 'Mes nao encontrado';
  end if;

  if v_month.status = 'closed' then
    raise exception 'Mes ja fechado';
  end if;

  select count(*) into v_pending
  from public.inventory_weeks
  where inventory_month_id = p_month_id and user_id = auth.uid() and is_finalized = false;

  if v_pending > 0 then
    raise exception 'Existem semanas nao finalizadas';
  end if;

  select commission_percent into v_commission_percent
  from public.settings
  where user_id = auth.uid();

  v_commission_percent := coalesce(v_commission_percent, 30);

  insert into public.monthly_closings (
    user_id,
    inventory_month_id,
    year,
    month,
    total_sold_qty,
    gross_revenue,
    total_cost,
    gross_profit,
    commission_percent,
    commission_value,
    net_profit,
    closed_at
  )
  select
    auth.uid(),
    v_month.id,
    v_month.year,
    v_month.month,
    coalesce(sum(i.sold_qty), 0),
    coalesce(sum(i.revenue), 0),
    coalesce(sum(i.cost_amount), 0),
    coalesce(sum(i.gross_profit), 0),
    v_commission_percent,
    coalesce(sum(i.revenue), 0) * (v_commission_percent / 100),
    coalesce(sum(i.revenue), 0) - coalesce(sum(i.cost_amount), 0) - (coalesce(sum(i.revenue), 0) * (v_commission_percent / 100)),
    now()
  from public.inventory_weeks w
  left join public.weekly_inventory_items i on i.inventory_week_id = w.id and i.user_id = auth.uid()
  where w.inventory_month_id = v_month.id and w.user_id = auth.uid()
  returning id into v_closing_id;

  insert into public.monthly_closing_items (
    user_id,
    monthly_closing_id,
    product_id,
    product_name,
    category_name,
    start_stock,
    total_restock,
    final_stock,
    sold_qty,
    revenue,
    cost_amount,
    gross_profit
  )
  with month_weeks as (
    select *
    from public.inventory_weeks
    where inventory_month_id = v_month.id and user_id = auth.uid()
  ),
  first_week as (
    select id
    from month_weeks
    order by week_number asc
    limit 1
  ),
  last_week as (
    select id
    from month_weeks
    order by week_number desc
    limit 1
  ),
  base as (
    select
      p.id as product_id,
      p.name as product_name,
      c.name as category_name,
      coalesce((select i1.start_stock from public.weekly_inventory_items i1 where i1.inventory_week_id = (select id from first_week) and i1.product_id = p.id), p.current_stock) as start_stock,
      coalesce((select i2.counted_stock from public.weekly_inventory_items i2 where i2.inventory_week_id = (select id from last_week) and i2.product_id = p.id), p.current_stock) as final_stock,
      coalesce((select sum(i3.restock_qty) from public.weekly_inventory_items i3 join month_weeks mw on mw.id = i3.inventory_week_id where i3.product_id = p.id), 0) as total_restock,
      coalesce((select sum(i4.sold_qty) from public.weekly_inventory_items i4 join month_weeks mw on mw.id = i4.inventory_week_id where i4.product_id = p.id), 0) as sold_qty,
      coalesce((select sum(i5.revenue) from public.weekly_inventory_items i5 join month_weeks mw on mw.id = i5.inventory_week_id where i5.product_id = p.id), 0) as revenue,
      coalesce((select sum(i6.cost_amount) from public.weekly_inventory_items i6 join month_weeks mw on mw.id = i6.inventory_week_id where i6.product_id = p.id), 0) as cost_amount,
      coalesce((select sum(i7.gross_profit) from public.weekly_inventory_items i7 join month_weeks mw on mw.id = i7.inventory_week_id where i7.product_id = p.id), 0) as gross_profit
    from public.products p
    left join public.categories c on c.id = p.category_id
    where p.user_id = auth.uid()
  )
  select
    auth.uid(),
    v_closing_id,
    base.product_id,
    base.product_name,
    base.category_name,
    base.start_stock,
    base.total_restock,
    base.final_stock,
    base.sold_qty,
    base.revenue,
    base.cost_amount,
    base.gross_profit
  from base;

  update public.inventory_months
  set status = 'closed', closed_at = now()
  where id = v_month.id;

  v_next_month := (make_date(v_month.year, v_month.month, 1) + interval '1 month')::date;

  insert into public.inventory_months (user_id, year, month, has_week_5)
  values (
    auth.uid(),
    extract(year from v_next_month)::int,
    extract(month from v_next_month)::int,
    extract(day from (date_trunc('month', v_next_month) + interval '1 month - 1 day'))::int > 28
  )
  on conflict (user_id, year, month) do nothing;

  perform public.seed_inventory_user_defaults(auth.uid());

  return jsonb_build_object('status', 'ok', 'closing_id', v_closing_id);
end;
$$;

-- Keep user_id ownership integrity
create or replace function public.enforce_user_ownership()
returns trigger
language plpgsql
as $$
begin
  if new.user_id is distinct from auth.uid() then
    raise exception 'user_id invalido';
  end if;
  return new;
end;
$$;

drop trigger if exists categories_ownership_tg on public.categories;
create trigger categories_ownership_tg before insert or update on public.categories
for each row execute function public.enforce_user_ownership();

drop trigger if exists products_ownership_tg on public.products;
create trigger products_ownership_tg before insert or update on public.products
for each row execute function public.enforce_user_ownership();

drop trigger if exists inventory_months_ownership_tg on public.inventory_months;
create trigger inventory_months_ownership_tg before insert or update on public.inventory_months
for each row execute function public.enforce_user_ownership();

drop trigger if exists inventory_weeks_ownership_tg on public.inventory_weeks;
create trigger inventory_weeks_ownership_tg before insert or update on public.inventory_weeks
for each row execute function public.enforce_user_ownership();

drop trigger if exists weekly_items_ownership_tg on public.weekly_inventory_items;
create trigger weekly_items_ownership_tg before insert or update on public.weekly_inventory_items
for each row execute function public.enforce_user_ownership();

drop trigger if exists restocks_ownership_tg on public.restocks;
create trigger restocks_ownership_tg before insert or update on public.restocks
for each row execute function public.enforce_user_ownership();

drop trigger if exists monthly_closings_ownership_tg on public.monthly_closings;
create trigger monthly_closings_ownership_tg before insert or update on public.monthly_closings
for each row execute function public.enforce_user_ownership();

drop trigger if exists monthly_items_ownership_tg on public.monthly_closing_items;
create trigger monthly_items_ownership_tg before insert or update on public.monthly_closing_items
for each row execute function public.enforce_user_ownership();

drop trigger if exists settings_ownership_tg on public.settings;
create trigger settings_ownership_tg before insert or update on public.settings
for each row execute function public.enforce_user_ownership();
