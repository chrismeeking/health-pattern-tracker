-- Homeboard schedule schema
-- Run in the Supabase SQL editor (or via CLI migration).

create extension if not exists "pgcrypto";

create table if not exists public.schedule_entries (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  employer text not null,
  work_mode text not null
    check (work_mode in ('WFH', 'On site', 'Office', 'Travelling', 'Off')),
  location text,
  start_time time,
  end_time time,
  expected_home_time time,
  household_note text,
  source text not null default 'manual'
    check (source in ('manual', 'chatgpt', 'outlook', 'import', 'system')),
  source_reference text,
  priority integer not null default 0,
  is_all_day boolean not null default false,
  manual_override boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.schedule_entries is
  'Household-safe work schedule blocks for Homeboard display';

comment on column public.schedule_entries.household_note is
  'Only household-friendly notes — never confidential meeting titles';

comment on column public.schedule_entries.source_reference is
  'Stable external id for upserts (e.g. chatgpt/outlook event key)';

comment on column public.schedule_entries.manual_override is
  'When true, automated sources must not silently overwrite';

-- Upsert key for automation: one row per source + reference
create unique index if not exists schedule_entries_source_ref_uidx
  on public.schedule_entries (source, source_reference)
  where source_reference is not null;

create index if not exists schedule_entries_date_idx
  on public.schedule_entries (date);

create index if not exists schedule_entries_date_start_idx
  on public.schedule_entries (date, start_time);

-- Keep updated_at fresh
create or replace function public.set_schedule_entries_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists schedule_entries_set_updated_at on public.schedule_entries;
create trigger schedule_entries_set_updated_at
  before update on public.schedule_entries
  for each row
  execute function public.set_schedule_entries_updated_at();

-- RLS: public read for the household display; writes via service role / API only
alter table public.schedule_entries enable row level security;

drop policy if exists "Public read schedule" on public.schedule_entries;
create policy "Public read schedule"
  on public.schedule_entries
  for select
  to anon, authenticated
  using (true);

-- No insert/update/delete policies for anon — service role bypasses RLS

-- Realtime
do $$ begin
  alter publication supabase_realtime add table public.schedule_entries;
exception when duplicate_object then null;
end $$;
