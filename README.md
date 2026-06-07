# Health Pattern Tracker

Mobile-first Progressive Web App foundation for tracking nutrition, symptoms, and health patterns.

## Foundation (current)

- Mobile-first layout (375px-first)
- Bottom navigation: Home · Meals · Add · Insights · Profile
- Quick Add actions (placeholder screens)
- Multi-profile support with Chris & Jenny demo data
- localStorage persistence
- TypeScript types and reusable UI components

## Tech Stack

- React 19 + TypeScript
- Vite 6
- Tailwind CSS 4
- React Router 7
- vite-plugin-pwa

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
  components/   AppLayout, BottomNav, Card, Button, etc.
  pages/        Home, Meals, Add, Insights, Profile
  services/     storage.ts (localStorage helpers)
  types/        Profile, Meal, HealthIssue, etc.
  data/         Demo seed data (Chris & Jenny)
  hooks/        App context and profile state
  utils/        Shared helpers
```

## Demo Data

On first launch, demo data loads automatically with two profiles:

- **Chris** — digestive/health issue tracking focus
- **Jenny** — nutrition and macro tracking focus

Switch profiles from the header or Profile page. Reload demo data from Profile → Reload demo data.
