-- KOI Phase 3 — paste into Supabase SQL Editor (run in order).
-- Requires: Supabase project with Auth enabled.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  role text not null default 'student',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- trades
-- ---------------------------------------------------------------------------
create table if not exists public.trades (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,

  symbol text not null,
  entry numeric not null,
  stop numeric not null,
  target numeric not null,
  target2 numeric null,

  target1_allocation_pct numeric null,
  target2_allocation_pct numeric null,

  size numeric not null,
  side text not null,
  status text not null,

  imbalance_quality text not null,
  freshness text not null,
  htf_alignment text not null,
  location_quality text not null,

  setup_score numeric not null,
  setup_grade text not null,

  reward_risk numeric not null,
  r_multiple numeric null,

  execution_score numeric null,
  total_score numeric null,
  final_grade text null,

  exit_price numeric null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists trades_user_id_created_at_idx
  on public.trades (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- trade_mistakes
-- ---------------------------------------------------------------------------
create table if not exists public.trade_mistakes (
  id bigint generated always as identity primary key,
  trade_id bigint not null references public.trades (id) on delete cascade,
  mistake text not null,
  created_at timestamptz not null default now()
);

create index if not exists trade_mistakes_trade_id_idx
  on public.trade_mistakes (trade_id);

-- ---------------------------------------------------------------------------
-- updated_at on trades
-- ---------------------------------------------------------------------------
create or replace function public.set_trades_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trades_set_updated_at on public.trades;
create trigger trades_set_updated_at
  before update on public.trades
  for each row
  execute procedure public.set_trades_updated_at();

-- ---------------------------------------------------------------------------
-- profile on signup (auth.users -> profiles)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'student');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.trades enable row level security;
alter table public.trade_mistakes enable row level security;

-- profiles
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- trades
drop policy if exists "trades_select_own" on public.trades;
create policy "trades_select_own"
  on public.trades for select
  using (auth.uid() = user_id);

drop policy if exists "trades_insert_own" on public.trades;
create policy "trades_insert_own"
  on public.trades for insert
  with check (auth.uid() = user_id);

drop policy if exists "trades_update_own" on public.trades;
create policy "trades_update_own"
  on public.trades for update
  using (auth.uid() = user_id);

drop policy if exists "trades_delete_own" on public.trades;
create policy "trades_delete_own"
  on public.trades for delete
  using (auth.uid() = user_id);

-- trade_mistakes (via owning trade)
drop policy if exists "trade_mistakes_select_own" on public.trade_mistakes;
create policy "trade_mistakes_select_own"
  on public.trade_mistakes for select
  using (
    exists (
      select 1 from public.trades t
      where t.id = trade_mistakes.trade_id
        and t.user_id = auth.uid()
    )
  );

drop policy if exists "trade_mistakes_insert_own" on public.trade_mistakes;
create policy "trade_mistakes_insert_own"
  on public.trade_mistakes for insert
  with check (
    exists (
      select 1 from public.trades t
      where t.id = trade_mistakes.trade_id
        and t.user_id = auth.uid()
    )
  );

drop policy if exists "trade_mistakes_update_own" on public.trade_mistakes;
create policy "trade_mistakes_update_own"
  on public.trade_mistakes for update
  using (
    exists (
      select 1 from public.trades t
      where t.id = trade_mistakes.trade_id
        and t.user_id = auth.uid()
    )
  );

drop policy if exists "trade_mistakes_delete_own" on public.trade_mistakes;
create policy "trade_mistakes_delete_own"
  on public.trade_mistakes for delete
  using (
    exists (
      select 1 from public.trades t
      where t.id = trade_mistakes.trade_id
        and t.user_id = auth.uid()
    )
  );
