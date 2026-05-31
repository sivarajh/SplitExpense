# SplitExpense

A Splitwise-style mobile app to split expenses with friends — create groups, log
shared expenses, split them equally / by exact amounts / by percentage, see who
owes whom (with simplified debts), and settle up.

Built with **React Native + Expo (Expo Router) + TypeScript** on the client and
**Supabase** (Postgres + Auth + Row Level Security) as the backend.

## Features

- Email/password authentication (Supabase Auth).
- **Groups & members** — create groups and add friends by email.
- **Add & split expenses** — choose who paid; split equally, by exact amounts, or
  by percentage. Splits always reconcile to the cent.
- **Balances & settle up** — net balances per person, minimized "who pays whom"
  suggestions, and recorded settlement payments.
- **Activity feed** — a unified, newest-first feed of expenses and settlements
  across all your groups, plus a per-group expense history.

## Tech stack

| Area | Choice |
| --- | --- |
| App framework | Expo SDK 56, Expo Router (file-based routing) |
| Language | TypeScript |
| Server state | TanStack Query (React Query) |
| Backend | Supabase (Postgres, Auth, RLS) |
| Icons | `@expo/vector-icons` |

## Project structure

```
src/
  app/              # Expo Router screens (routes)
    (auth)/         # sign-in / sign-up
    (tabs)/         # Groups · Activity · Account
    group/          # create group, group detail, add-expense, settle, members
    expense/        # expense detail
  components/        # reusable UI (Avatar, Button, SplitEditor, ...)
  lib/
    api/            # Supabase data access (groups, expenses, settlements, ...)
    auth.tsx        # auth context
    supabase.ts     # Supabase client
    splits.ts       # split math (equal / exact / percent) — unit tested
    debts.ts        # balance aggregation + debt simplification — unit tested
  theme/            # colors, spacing tokens
supabase/schema.sql # database schema, RLS policies, triggers, RPC
__tests__/          # Jest unit tests for the pure logic
```

## Setup

### 1. Create a Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**, paste the contents of
   [`supabase/schema.sql`](supabase/schema.sql), and run it. This creates all
   tables, the RLS policies, the new-user trigger, and the
   `add_expense_with_splits` RPC.
3. (Optional, for the smoothest demo) In **Authentication → Providers → Email**,
   you can disable "Confirm email" so new accounts can sign in immediately.

### 2. Configure environment variables

```bash
cp .env.example .env
```

Fill in from **Supabase → Project Settings → API**:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

The anon key is safe to ship in a client — all data access is protected by Row
Level Security on the server.

### 3. Install & run

```bash
npm install
npx expo start          # then press i (iOS), a (Android), or w (web)
```

### Run in GitHub Codespaces

This repo ships a [`.devcontainer`](.devcontainer/devcontainer.json) that installs
dependencies and forwards the Expo dev-server port automatically.

1. On GitHub: **Code → Codespaces → Create codespace** on this branch.
2. Add your Supabase credentials. Either create a `.env` (see above), or set them
   as **Codespaces secrets** (Settings → Codespaces) named `EXPO_PUBLIC_SUPABASE_URL`
   and `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Expo reads `EXPO_PUBLIC_*` from the
   environment.
3. **Preview in the browser (easiest):**
   ```bash
   npx expo start --web
   ```
   Open the forwarded port **8081** (VS Code "Ports" tab → globe icon).
4. **Run on a real phone with Expo Go:** the default LAN QR can't reach your phone
   from a cloud container, so use tunnel mode (installs `@expo/ngrok` on first run):
   ```bash
   npx expo start --tunnel
   ```
   Scan the QR code with Expo Go.

> Note: iOS/Android **simulators** can't run inside Codespaces — use the web
> preview or Expo Go (tunnel) above, or run `npx expo run:ios/android` on a local
> machine.

## Deploy the web app to GitHub Pages

A workflow ([`.github/workflows/deploy-web.yml`](.github/workflows/deploy-web.yml))
builds the Expo web export and publishes it to GitHub Pages on every push to
`main`. One-time setup:

1. **Add Supabase credentials as repo secrets** — Settings → Secrets and variables
   → Actions → New repository secret:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`

   (The anon key is inlined into the public bundle — that's expected and safe; it
   is protected by Row Level Security.)
2. **Enable Pages** — Settings → Pages → **Source: GitHub Actions**.
3. Push to `main` (e.g. merge the PR), or run the workflow manually from the
   **Actions** tab (**Run workflow**).

The site is served at:

```
https://<your-github-username>.github.io/SplitExpense/
```

The build sets the correct base path via `PAGES_BASE_URL` (see `app.config.js`)
and writes a `404.html` SPA fallback so deep links/refreshes work on Pages.

## Tests & type-checking

```bash
npm test                # Jest unit tests for splits/debts logic
npx tsc --noEmit        # type-check
```

## How splitting & balances work

- All money math is done in integer **cents** so shares always sum back exactly
  to the expense total (see `src/lib/splits.ts`).
- A user's **net balance** = what they paid − their share of expenses, adjusted by
  settlements. Positive means they're owed money; negative means they owe.
- **Settle up** suggestions use a greedy largest-creditor/largest-debtor match to
  minimize the number of transfers (`simplifyDebts` in `src/lib/debts.ts`).

## Notes / future work

- Single currency (USD) for the MVP — `src/lib/format.ts` centralizes formatting.
- Members are added by looking up existing users by email; full email invites are
  out of scope for the MVP.
