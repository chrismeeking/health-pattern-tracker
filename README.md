# Health Pattern Tracker

Mobile-first Progressive Web App for tracking nutrition, symptoms, and health patterns across household profiles.

## Features

- **Multi-profile** — separate dashboards per person (Chris & Jenny demo data)
- **Modular tracking** — enable only what you need: nutrition, macros, weight, water, exercise, health issues, digestive patterns, goals
- **Profile-specific home** — nutrition-focused or digestive-focused layouts based on enabled modules
- **Bottom navigation** — Home · Meals · Add (FAB) · Health · Settings
- **Meals hub** — daily nutrition summary, exercise log, favourites, weight mini-stat
- **Health hub** — weight chart, goals, weekly progress, insights link
- **Pattern insights** — suspected triggers, tolerated foods, trigger analysis (after 3+ symptom episodes)
- **Meal–symptom timeline** — chronological view of meals and symptoms (last 7 days)
- **Daily check-in** — symptom chips plus active-issue selection; one check-in per day
- **Quick meal add** — essential fields first, expandable full form on edit
- **Cloud sync** (optional) — Supabase push/pull; works fully offline without login
- **Exports** — JSON and CSV per profile or household
- **PWA** — installable with update check in Settings

## Tech Stack

- React 19 + TypeScript
- Vite 6
- Tailwind CSS 4
- React Router 7
- vite-plugin-pwa
- Supabase (optional cloud sync)

## Getting Started

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (typically `http://localhost:5173`).

## Build

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
  components/   AppLayout, BottomNav, MealForm, DailyCheckInForm, etc.
  pages/        Home, Meals, Health, Insights, Settings, Timeline, …
  services/     storage, sync, insight engines, food lookup
  types/        Profile, Meal, HealthIssue, ExerciseEntry, etc.
  data/         Demo seed data (Chris & Jenny)
  hooks/        useAppData, useTheme
  utils/        nutrition, health, profileModules, symptoms
docs/
  supabase-schema.md   Cloud sync table definitions
```

## Demo Data

Load demo data from onboarding or Settings → Advanced → Reload demo data:

- **Chris** — digestive & health patterns (`nutrition`, `healthIssues`, `digestive`)
- **Jenny** — nutrition & fitness (macros, weight, water, exercise, goals)

Switch profiles from the header. App version is shown in Settings → Advanced.

## Cloud Sync

Optional. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (see `docs/supabase-schema.md`). Sign in under Settings → Data & sync. Push local data with **Sync now**, or **Replace local with cloud** when cloud data exists.
