# Homeboard

Household work-status board for a full-screen NCR touchscreen. Built for Jenny to glance at who Chris is working for, where, and roughly when he’ll be free — without exposing confidential calendar detail.

## Features

- **Today panel** — plain-English summary of today’s schedule
- **Week board** — Monday–Sunday columns with one or more work blocks per day
- **Admin** (`/admin`) — fast create / edit / delete / duplicate
- **Secure API** (`POST /api/schedule`) — upsert-friendly for ChatGPT, Outlook, Power Automate
- **Manual override** — automation cannot silently overwrite protected entries
- **Europe/London** timezone with BST/GMT handled correctly
- **Realtime / polling** — board refreshes without a manual browser reload
- **PWA manifest** — installable / fullscreen-friendly
- **Demo mode** — runs with in-memory seed data when Supabase env vars are missing

## Tech stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Supabase (Postgres + optional Realtime)
- Zod validation
- Vercel-compatible

## 1. Create a Supabase project

1. Create a project at [supabase.com](https://supabase.com)
2. Open **SQL Editor**
3. Run `supabase/migrations/001_schedule_entries.sql`
4. (Optional) Run `supabase/seed.sql` for a sample week
5. Copy the project URL, **anon** key, and **service_role** key from **Settings → API**

If the Realtime `alter publication` line errors because the table is already published, you can ignore that line.

## 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (browser + RLS read) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only writes (never ship to the browser) |
| `HOMEBOARD_API_KEY` | Shared secret for integration `POST /api/schedule` (`SCHEDULE_API_KEY` also accepted) |
| `ADMIN_PASSWORD` | Password for `/admin` |
| `AUTH_SECRET` | Signs the admin session cookie |
| `NEXT_PUBLIC_INACTIVITY_RESET_MS` | Return to current week after inactivity (default `300000`) |

Without Supabase credentials the app starts in **demo mode** with sample data.

## 3. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the board and [http://localhost:3000/admin](http://localhost:3000/admin) for schedule management.

```bash
npm run lint
npm run typecheck
npm run build
```

## 4. Deploy to Vercel

1. Push this repo to GitHub
2. Import the project in Vercel
3. Add the same environment variables
4. Deploy
5. Open the production URL on the NCR PC

## 5. NCR browser (kiosk / full-screen)

Suggested Edge/Chrome setup:

1. Open the Homeboard URL
2. Press `F11` for full-screen, or configure kiosk mode:
   - Chrome: `--kiosk https://your-homeboard.vercel.app`
   - Edge: `--kiosk https://your-homeboard.vercel.app`
3. Disable sleep / screen saver on the PC
4. Optionally pin Homeboard as the startup page

The UI is optimised for a **16:9** touchscreen: large tap targets, large type, no hover-only behaviour.

## 6. Test the ChatGPT / API update flow

```bash
curl -X POST https://YOUR_HOST/api/schedule \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_HOMEBOARD_API_KEY" \
  -d '{
    "date": "2026-08-24",
    "employer": "Post Office",
    "work_mode": "WFH",
    "start_time": "08:30",
    "end_time": "17:00",
    "expected_home_time": "17:30",
    "household_note": "",
    "source": "chatgpt",
    "source_reference": "post-office-2026-08-24"
  }'
```

Upsert again with the same `source` + `source_reference` to update that entry.

Cancel/delete an imported entry:

```bash
curl -X DELETE https://YOUR_HOST/api/schedule \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_HOMEBOARD_API_KEY" \
  -d '{
    "source": "chatgpt",
    "source_reference": "post-office-2026-08-24"
  }'
```

Or POST with `"cancelled": true` and the same source reference.

If `manual_override` is `true` on an entry, automated sources receive `skipped` / `manual_override` instead of overwriting.

Batch example — send an array of entries in one request.

## Privacy

Only store household-safe fields. Do **not** push confidential meeting titles or client detail into `household_note` unless you intentionally want them on the board.

## Project structure

```
src/
  app/                 # Routes: /, /admin, /api/schedule, auth
  components/          # TodaySummary, WeekView, DayCard, ScheduleForm, …
  lib/
    employers.ts       # Central employer/theme mapping
    schedule/          # Zod schemas, formatting, data service
    supabase/          # Browser + service-role clients
supabase/
  migrations/          # SQL schema
  seed.sql             # Optional sample week
```

## Future integrations

The API is designed so ChatGPT (or Power Automate / Microsoft Graph) can send simplified entries. Full Outlook OAuth is intentionally not built yet — keep calendar connectors outside the core dashboard and feed Homeboard via `POST /api/schedule`.
