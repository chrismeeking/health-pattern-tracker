# Supabase schema — Health Pattern Tracker

Cloud sync uses Supabase Auth plus Postgres tables scoped by **household**.  
Local `localStorage` remains the offline source of truth; sync is optional and never required to use the app.

## Overview

```
auth.users (Supabase managed)
    └── public.users (app profile)
            └── household_members ──► households
                                              └── profiles
                                                    ├── meals
                                                    ├── health_issues
                                                    ├── symptom_episodes
                                                    ├── daily_checkins
                                                    ├── weight_entries
                                                    ├── exercise_entries
                                                    ├── water_entries
                                                    └── goals
```

## Environment variables (frontend)

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

The anon key is safe in the client when Row Level Security (RLS) is enabled. Never expose the service role key in frontend code.

---

## Table: `users`

App-level user record linked to Supabase Auth.

| Column       | Type        | Notes                          |
|-------------|-------------|--------------------------------|
| id          | uuid PK     | FK → `auth.users.id`           |
| email       | text        | Denormalised for display       |
| display_name| text        | Optional                       |
| created_at  | timestamptz | default `now()`                |
| updated_at  | timestamptz | default `now()`                |

```sql
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

---

## Table: `households`

A household groups profiles for shared tracking (e.g. Chris & Jenny).

| Column     | Type        | Notes                    |
|-----------|-------------|--------------------------|
| id        | uuid PK     | default `gen_random_uuid()` |
| name      | text        | e.g. "Our household"     |
| created_by| uuid        | FK → `users.id`          |
| created_at| timestamptz |                          |
| updated_at| timestamptz |                          |

```sql
create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'My household',
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

---

## Table: `household_members`

Links users to households with a role.

| Column       | Type        | Notes                              |
|-------------|-------------|------------------------------------|
| id          | uuid PK     |                                    |
| household_id| uuid        | FK → `households.id`               |
| user_id     | uuid        | FK → `users.id`                    |
| role        | text        | `owner` \| `member`                |
| joined_at   | timestamptz |                                    |

Unique constraint: `(household_id, user_id)`.

```sql
create table public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  unique (household_id, user_id)
);
```

---

## Table: `profiles`

Tracking profiles belong to a household. Maps to app `Profile`.

| Column              | Type        | Notes                    |
|--------------------|-------------|--------------------------|
| id                  | text PK     | Client-generated id      |
| household_id        | uuid        | FK → `households.id`     |
| owner_user_id       | uuid        | FK → `users.id`, nullable|
| name                | text        |                          |
| age                 | int         | nullable                 |
| sex                 | text        | nullable                 |
| height              | numeric     | nullable                 |
| current_weight      | numeric     | nullable                 |
| target_weight       | numeric     | nullable                 |
| activity_level      | text        |                          |
| goal_type           | text        |                          |
| enabled_modules     | jsonb       | string[]                 |
| daily_calorie_target| int         | nullable                 |
| protein_target      | int         | nullable                 |
| carb_target         | int         | nullable                 |
| fat_target          | int         | nullable                 |
| fibre_target        | int         | nullable                 |
| water_target        | int         | nullable                 |
| created_at          | timestamptz |                          |
| updated_at          | timestamptz |                          |

---

## Table: `meals`

| Column       | Type        | Notes                         |
|-------------|-------------|-------------------------------|
| id          | text PK     |                               |
| household_id| uuid        |                               |
| profile_id  | text        | FK → `profiles.id`            |
| date_time   | timestamptz |                               |
| meal_type   | text        |                               |
| meal_name   | text        |                               |
| description | text        | nullable                      |
| source      | text        |                               |
| calories    | numeric     |                               |
| protein     | numeric     |                               |
| carbs       | numeric     |                               |
| fat         | numeric     |                               |
| fibre       | numeric     |                               |
| sugar       | numeric     | nullable                      |
| salt        | numeric     | nullable                      |
| water_ml    | int         | nullable                      |
| portion_size| text        |                               |
| notes       | text        | nullable                      |
| trigger_tags| jsonb       | string[]                      |
| created_at  | timestamptz |                               |
| updated_at  | timestamptz |                               |

---

## Table: `health_issues`

Maps to app `HealthIssue`.

| Column           | Type    | Notes              |
|-----------------|---------|--------------------|
| id              | text PK |                    |
| household_id    | uuid    |                    |
| profile_id      | text    |                    |
| name            | text    |                    |
| description     | text    | nullable           |
| category        | text    |                    |
| possible_triggers | jsonb | string[]           |
| active          | boolean |                    |
| created_at      | timestamptz |              |
| updated_at      | timestamptz |              |

---

## Table: `symptom_episodes`

Maps to app `SymptomEpisode`. Store extended fields in `payload jsonb` for flexibility.

| Column        | Type        | Notes                    |
|--------------|-------------|--------------------------|
| id           | text PK     |                          |
| household_id | uuid        |                          |
| profile_id   | text        |                          |
| issue_id     | text        | nullable                 |
| start_date_time | timestamptz |                       |
| severity     | text        |                          |
| payload      | jsonb       | Full episode detail      |
| created_at   | timestamptz |                          |

---

## Table: `daily_checkins`

| Column        | Type        | Notes                    |
|--------------|-------------|--------------------------|
| id           | text PK     |                          |
| household_id | uuid        |                          |
| profile_id   | text        |                          |
| date         | date        |                          |
| check_in_time| timestamptz |                          |
| payload      | jsonb       | Full check-in fields     |
| created_at   | timestamptz |                          |

---

## Table: `weight_entries`

| Column       | Type    | Notes              |
|-------------|---------|--------------------|
| id          | text PK |                    |
| household_id| uuid    |                    |
| profile_id  | text    |                    |
| date        | date    |                    |
| weight      | numeric |                    |
| notes       | text    | nullable           |
| created_at  | timestamptz |              |

---

## Table: `exercise_entries`

Maps to app `ExerciseEntry`.

| Column           | Type        | Notes              |
|-----------------|-------------|--------------------|
| id              | text PK     |                    |
| household_id    | uuid        |                    |
| profile_id      | text        | FK → `profiles.id` |
| date_time       | timestamptz |                    |
| activity        | text        | Exercise type      |
| duration_minutes| int         |                    |
| calories_burned | numeric     |                    |
| notes           | text        | nullable           |
| created_at      | timestamptz |                    |

```sql
create table public.exercise_entries (
  id text primary key,
  household_id uuid not null references public.households(id) on delete cascade,
  profile_id text not null references public.profiles(id) on delete cascade,
  date_time timestamptz not null,
  activity text not null,
  duration_minutes int not null,
  calories_burned numeric not null,
  notes text,
  created_at timestamptz not null default now()
);
```

---

## Table: `water_entries`

| Column       | Type        | Notes              |
|-------------|-------------|--------------------|
| id          | text PK     |                    |
| household_id| uuid        |                    |
| profile_id  | text        |                    |
| date_time   | timestamptz |                    |
| amount_ml   | int         |                    |
| created_at  | timestamptz |                    |

---

## Table: `goals`

| Column       | Type    | Notes              |
|-------------|---------|--------------------|
| id          | text PK |                    |
| household_id| uuid    |                    |
| profile_id  | text    |                    |
| title       | text    |                    |
| description | text    | nullable           |
| category    | text    |                    |
| status      | text    |                    |
| difficulty  | text    |                    |
| start_date  | date    | nullable           |
| end_date    | date    | nullable           |
| completed_at| timestamptz | nullable       |
| created_at  | timestamptz |                |
| updated_at  | timestamptz |                |

---

## Table: `favourite_meals`

| Column       | Type    | Notes              |
|-------------|---------|--------------------|
| id          | text PK |                    |
| household_id| uuid    |                    |
| profile_id  | text    |                    |
| name        | text    |                    |
| meal_type   | text    |                    |
| source      | text    |                    |
| calories    | numeric |                    |
| protein     | numeric |                    |
| carbs       | numeric |                    |
| fat         | numeric |                    |
| fibre       | numeric |                    |
| sugar       | numeric |                    |
| salt        | numeric |                    |
| portion_size| text    |                    |
| trigger_tags| text[]  |                    |
| notes       | text    | nullable           |
| created_at  | timestamptz |                |
| updated_at  | timestamptz |                |

---

## Table: `saved_foods`

| Column       | Type    | Notes              |
|-------------|---------|--------------------|
| id          | text PK |                    |
| household_id| uuid    |                    |
| profile_id  | text    | nullable (shared foods omit profile) |
| barcode     | text    | nullable           |
| name        | text    |                    |
| brand       | text    | nullable           |
| serving_size| text    |                    |
| calories    | numeric |                    |
| protein     | numeric |                    |
| carbs       | numeric |                    |
| fat         | numeric |                    |
| fibre       | numeric |                    |
| sugar       | numeric |                    |
| salt        | numeric |                    |
| trigger_tags| text[]  |                    |
| source      | text    | openFoodFacts, manual, ai, favourite, unknown |
| created_at  | timestamptz |                |
| updated_at  | timestamptz |                |

---

## Row Level Security (recommended)

Enable RLS on all tables. Example policy pattern:

```sql
-- Members can read/write rows for their household
create policy "household members access profiles"
  on public.profiles for all
  using (
    household_id in (
      select household_id from public.household_members
      where user_id = auth.uid()
    )
  );
```

Apply similar policies to all child tables via `household_id`.

---

## Sync strategy (app)

1. **Local first** — all reads/writes go to `localStorage` immediately.
2. **Optional push** — when signed in and Supabase is configured, `syncService.pushToCloud()` upserts local rows.
3. **Optional pull** — `syncService.pullFromCloud()` merges remote data (future: conflict resolution).
4. **Status** — Settings shows `Local only`, `Synced`, or `Sync error`.
5. **No forced login** — app works fully offline without Supabase env vars.

---

## Client IDs

The app uses client-generated string IDs (`Date.now()-random`). These map 1:1 to primary keys in Supabase for idempotent upserts during sync.
