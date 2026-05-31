-- =========================================================================
-- SplitExpense DEMO SEED (development/testing only — do NOT run in production)
-- =========================================================================
-- Run this in the Supabase SQL editor AFTER running schema.sql.
--
-- It creates three demo users you can sign in as, a shared group, two split
-- expenses, and leaves a clean balance to demo "settle up":
--
--   Login (email / password):
--     alice@demo.test / password123
--     bob@demo.test   / password123
--     carol@demo.test / password123
--
--   Resulting balances in "Goa Trip":
--     Alice: settled (0)   Bob: +30 (is owed)   Carol: -30 (owes)
--     => Settle-up suggestion: Carol pays Bob $30
--
-- Re-running is safe (idempotent via fixed UUIDs + ON CONFLICT DO NOTHING).
--
-- NOTE: Seeding auth users via SQL depends on Supabase's internal auth tables.
-- If the auth.users / auth.identities INSERTs below error on your Supabase
-- version, instead create the three users manually in
-- Dashboard -> Authentication -> Users -> "Add user" (set the same emails,
-- password "password123", and "Auto Confirm"), then run ONLY the
-- "APP DATA" section at the bottom.
-- =========================================================================

-- Fixed UUIDs so the script is idempotent and the APP DATA section can refer to them.
-- alice = aaaaaaaa..., bob = bbbbbbbb..., carol = cccccccc...

-- ---------------------------------------------------------------------------
-- AUTH USERS
-- ---------------------------------------------------------------------------
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
values
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'authenticated', 'authenticated', 'alice@demo.test', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Alice"}', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'authenticated', 'authenticated', 'bob@demo.test',   crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Bob"}',   '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'authenticated', 'authenticated', 'carol@demo.test', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Carol"}', '', '', '', '')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- AUTH IDENTITIES (required for email/password sign-in)
-- ---------------------------------------------------------------------------
insert into auth.identities (
  id, user_id, identity_data, provider, provider_id,
  last_sign_in_at, created_at, updated_at
)
values
  (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","email":"alice@demo.test"}', 'email', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', now(), now(), now()),
  (gen_random_uuid(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","email":"bob@demo.test"}',   'email', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', now(), now(), now()),
  (gen_random_uuid(), 'cccccccc-cccc-cccc-cccc-cccccccccccc', '{"sub":"cccccccc-cccc-cccc-cccc-cccccccccccc","email":"carol@demo.test"}', 'email', 'cccccccc-cccc-cccc-cccc-cccccccccccc', now(), now(), now())
on conflict do nothing;

-- The handle_new_user() trigger creates profiles automatically on user insert.
-- This upsert is a safety net in case users were created another way.
insert into public.profiles (id, email, full_name)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'alice@demo.test', 'Alice'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bob@demo.test',   'Bob'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'carol@demo.test', 'Carol')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- APP DATA (group, members, expenses, splits)
-- Safe to run on its own if you created the three users manually — it looks up
-- ids by email so it works regardless of how the users were created.
-- ---------------------------------------------------------------------------
do $$
declare
  v_alice uuid;
  v_bob uuid;
  v_carol uuid;
  v_group uuid := 'dddddddd-dddd-dddd-dddd-dddddddddddd';
  v_dinner uuid := 'e1111111-1111-1111-1111-111111111111';
  v_hotel uuid := 'e2222222-2222-2222-2222-222222222222';
begin
  select id into v_alice from public.profiles where email = 'alice@demo.test';
  select id into v_bob   from public.profiles where email = 'bob@demo.test';
  select id into v_carol from public.profiles where email = 'carol@demo.test';

  if v_alice is null or v_bob is null or v_carol is null then
    raise exception 'Demo users not found. Create them first (see header notes).';
  end if;

  -- Group + members
  insert into public.groups (id, name, created_by)
  values (v_group, 'Goa Trip', v_alice)
  on conflict (id) do nothing;

  insert into public.group_members (group_id, user_id)
  values (v_group, v_alice), (v_group, v_bob), (v_group, v_carol)
  on conflict (group_id, user_id) do nothing;

  -- Expense 1: Alice paid 30 for Dinner, split equally (10 each)
  insert into public.expenses (id, group_id, description, amount, paid_by, category, expense_date, created_by)
  values (v_dinner, v_group, 'Dinner', 30, v_alice, 'Food', current_date, v_alice)
  on conflict (id) do nothing;
  insert into public.expense_splits (expense_id, user_id, amount)
  values (v_dinner, v_alice, 10), (v_dinner, v_bob, 10), (v_dinner, v_carol, 10)
  on conflict do nothing;

  -- Expense 2: Bob paid 60 for Hotel, split equally (20 each)
  insert into public.expenses (id, group_id, description, amount, paid_by, category, expense_date, created_by)
  values (v_hotel, v_group, 'Hotel', 60, v_bob, 'Lodging', current_date, v_bob)
  on conflict (id) do nothing;
  insert into public.expense_splits (expense_id, user_id, amount)
  values (v_hotel, v_alice, 20), (v_hotel, v_bob, 20), (v_hotel, v_carol, 20)
  on conflict do nothing;
end $$;
