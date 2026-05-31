-- SplitExpense database schema for Supabase (Postgres).
-- Run this in the Supabase SQL editor (Dashboard -> SQL -> New query) on a fresh project.
-- It is idempotent-ish: safe to re-run, but dropping is left to you if you change columns.

-- =========================================================================
-- Tables
-- =========================================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (group_id, user_id)
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  description text not null,
  amount numeric(12, 2) not null check (amount > 0),
  paid_by uuid not null references public.profiles (id),
  category text,
  expense_date date not null default current_date,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create table if not exists public.expense_splits (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses (id) on delete cascade,
  user_id uuid not null references public.profiles (id),
  amount numeric(12, 2) not null check (amount >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.settlements (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  from_user uuid not null references public.profiles (id),
  to_user uuid not null references public.profiles (id),
  amount numeric(12, 2) not null check (amount > 0),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_group_members_group on public.group_members (group_id);
create index if not exists idx_group_members_user on public.group_members (user_id);
create index if not exists idx_expenses_group on public.expenses (group_id);
create index if not exists idx_expense_splits_expense on public.expense_splits (expense_id);
create index if not exists idx_settlements_group on public.settlements (group_id);

-- =========================================================================
-- Membership helper (SECURITY DEFINER avoids recursive RLS on group_members)
-- =========================================================================

create or replace function public.is_group_member(p_group_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = p_user_id
  );
$$;

-- =========================================================================
-- New-user trigger: create a profile row when an auth user is created.
-- =========================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================================
-- Atomic expense + splits insert
-- =========================================================================

create or replace function public.add_expense_with_splits(
  p_group_id uuid,
  p_description text,
  p_amount numeric,
  p_paid_by uuid,
  p_category text,
  p_expense_date date,
  p_splits jsonb -- array of { "user_id": uuid, "amount": numeric }
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_expense_id uuid;
  v_split jsonb;
begin
  if not public.is_group_member(p_group_id, auth.uid()) then
    raise exception 'not a member of this group';
  end if;

  insert into public.expenses (group_id, description, amount, paid_by, category, expense_date, created_by)
  values (p_group_id, p_description, p_amount, p_paid_by, p_category, coalesce(p_expense_date, current_date), auth.uid())
  returning id into v_expense_id;

  for v_split in select * from jsonb_array_elements(p_splits)
  loop
    insert into public.expense_splits (expense_id, user_id, amount)
    values (v_expense_id, (v_split ->> 'user_id')::uuid, (v_split ->> 'amount')::numeric);
  end loop;

  return v_expense_id;
end;
$$;

-- =========================================================================
-- Row Level Security
-- =========================================================================

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_splits enable row level security;
alter table public.settlements enable row level security;

-- profiles: any authenticated user can read (to show co-member names); update only your own.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated using (true);

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert to authenticated with check (id = auth.uid());

-- groups: members can read; any authenticated user can create (as creator); creator can update/delete.
drop policy if exists groups_select on public.groups;
create policy groups_select on public.groups
  for select to authenticated using (public.is_group_member(id, auth.uid()));

drop policy if exists groups_insert on public.groups;
create policy groups_insert on public.groups
  for insert to authenticated with check (created_by = auth.uid());

drop policy if exists groups_update on public.groups;
create policy groups_update on public.groups
  for update to authenticated using (created_by = auth.uid());

drop policy if exists groups_delete on public.groups;
create policy groups_delete on public.groups
  for delete to authenticated using (created_by = auth.uid());

-- group_members: members can read the membership of their groups.
drop policy if exists members_select on public.group_members;
create policy members_select on public.group_members
  for select to authenticated using (public.is_group_member(group_id, auth.uid()));

-- Insert allowed if you are already a member, OR you are the group's creator
-- (covers adding yourself when you just created the group).
drop policy if exists members_insert on public.group_members;
create policy members_insert on public.group_members
  for insert to authenticated with check (
    public.is_group_member(group_id, auth.uid())
    or exists (select 1 from public.groups g where g.id = group_id and g.created_by = auth.uid())
  );

drop policy if exists members_delete on public.group_members;
create policy members_delete on public.group_members
  for delete to authenticated using (
    public.is_group_member(group_id, auth.uid())
  );

-- expenses: members of the group can read/write.
drop policy if exists expenses_select on public.expenses;
create policy expenses_select on public.expenses
  for select to authenticated using (public.is_group_member(group_id, auth.uid()));

drop policy if exists expenses_insert on public.expenses;
create policy expenses_insert on public.expenses
  for insert to authenticated with check (
    public.is_group_member(group_id, auth.uid()) and created_by = auth.uid()
  );

drop policy if exists expenses_delete on public.expenses;
create policy expenses_delete on public.expenses
  for delete to authenticated using (public.is_group_member(group_id, auth.uid()));

-- expense_splits: readable/writable if you can access the parent expense's group.
drop policy if exists splits_select on public.expense_splits;
create policy splits_select on public.expense_splits
  for select to authenticated using (
    exists (
      select 1 from public.expenses e
      where e.id = expense_id and public.is_group_member(e.group_id, auth.uid())
    )
  );

drop policy if exists splits_insert on public.expense_splits;
create policy splits_insert on public.expense_splits
  for insert to authenticated with check (
    exists (
      select 1 from public.expenses e
      where e.id = expense_id and public.is_group_member(e.group_id, auth.uid())
    )
  );

-- settlements: members of the group can read/write.
drop policy if exists settlements_select on public.settlements;
create policy settlements_select on public.settlements
  for select to authenticated using (public.is_group_member(group_id, auth.uid()));

drop policy if exists settlements_insert on public.settlements;
create policy settlements_insert on public.settlements
  for insert to authenticated with check (public.is_group_member(group_id, auth.uid()));
