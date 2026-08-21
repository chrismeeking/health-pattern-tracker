import type { SupabaseClient } from "@supabase/supabase-js";
import {
  type ScheduleEntry,
  type ScheduleEntryInput,
} from "@/lib/schedule/schema";
import { weekDatesFromMonday, weekStartMonday } from "@/lib/date";
import { DEMO_ENTRIES } from "@/lib/schedule/demo-data";

const TABLE = "schedule_entries";

function demoStoreEnabled(): boolean {
  return (
    process.env.HOMEBOARD_DEMO_MODE === "true" ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/** In-memory demo store for local UI/API testing without Supabase. */
const demoStore: { entries: ScheduleEntry[] } = {
  entries: structuredClone(DEMO_ENTRIES),
};

function nowIso() {
  return new Date().toISOString();
}

function rowToEntry(row: Record<string, unknown>): ScheduleEntry {
  return {
    id: String(row.id),
    date: String(row.date),
    employer: String(row.employer),
    work_mode: String(row.work_mode),
    location: (row.location as string | null) ?? null,
    start_time: row.start_time ? String(row.start_time).slice(0, 8) : null,
    end_time: row.end_time ? String(row.end_time).slice(0, 8) : null,
    expected_home_time: row.expected_home_time
      ? String(row.expected_home_time).slice(0, 8)
      : null,
    household_note: (row.household_note as string | null) ?? null,
    source: String(row.source),
    source_reference: (row.source_reference as string | null) ?? null,
    priority: Number(row.priority ?? 0),
    is_all_day: Boolean(row.is_all_day),
    manual_override: Boolean(row.manual_override),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export type UpsertResult =
  | { status: "created" | "updated"; entry: ScheduleEntry }
  | { status: "skipped"; reason: string; entry?: ScheduleEntry }
  | { status: "deleted"; id: string }
  | { status: "error"; message: string };

function inputToRow(input: ScheduleEntryInput) {
  return {
    date: input.date,
    employer: input.employer,
    work_mode: input.work_mode,
    location: input.location ?? null,
    start_time: input.start_time ?? null,
    end_time: input.end_time ?? null,
    expected_home_time: input.expected_home_time ?? null,
    household_note: input.household_note ?? null,
    source: input.source,
    source_reference: input.source_reference ?? null,
    priority: input.priority ?? 0,
    is_all_day: input.is_all_day ?? false,
    manual_override: input.manual_override ?? false,
    updated_at: nowIso(),
  };
}

async function demoListByRange(from: string, to: string): Promise<ScheduleEntry[]> {
  return demoStore.entries
    .filter((e) => e.date >= from && e.date <= to)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function listEntriesByRange(
  client: SupabaseClient | null,
  from: string,
  to: string,
): Promise<ScheduleEntry[]> {
  if (demoStoreEnabled() || !client) {
    return demoListByRange(from, to);
  }

  const { data, error } = await client
    .from(TABLE)
    .select("*")
    .gte("date", from)
    .lte("date", to)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    console.error("[schedule] listEntriesByRange", error.message);
    throw new Error("Failed to load schedule");
  }

  return (data ?? []).map((row) => rowToEntry(row as Record<string, unknown>));
}

export async function listEntriesForWeek(
  client: SupabaseClient | null,
  mondayOrAnyDate: string,
): Promise<ScheduleEntry[]> {
  const monday = weekStartMonday(mondayOrAnyDate);
  const dates = weekDatesFromMonday(monday);
  return listEntriesByRange(client, dates[0], dates[6]);
}

export async function getEntryById(
  client: SupabaseClient | null,
  id: string,
): Promise<ScheduleEntry | null> {
  if (demoStoreEnabled() || !client) {
    return demoStore.entries.find((e) => e.id === id) ?? null;
  }
  const { data, error } = await client.from(TABLE).select("*").eq("id", id).maybeSingle();
  if (error) {
    console.error("[schedule] getEntryById", error.message);
    throw new Error("Failed to load entry");
  }
  return data ? rowToEntry(data as Record<string, unknown>) : null;
}

async function findBySourceRef(
  client: SupabaseClient | null,
  source: string,
  sourceReference: string,
): Promise<ScheduleEntry | null> {
  if (demoStoreEnabled() || !client) {
    return (
      demoStore.entries.find(
        (e) => e.source === source && e.source_reference === sourceReference,
      ) ?? null
    );
  }
  const { data, error } = await client
    .from(TABLE)
    .select("*")
    .eq("source", source)
    .eq("source_reference", sourceReference)
    .maybeSingle();
  if (error) {
    console.error("[schedule] findBySourceRef", error.message);
    throw new Error("Failed to look up entry");
  }
  return data ? rowToEntry(data as Record<string, unknown>) : null;
}

function shouldProtectManual(existing: ScheduleEntry, incomingSource: string): boolean {
  return existing.manual_override && incomingSource !== "manual";
}

export async function upsertEntry(
  client: SupabaseClient | null,
  input: ScheduleEntryInput,
): Promise<UpsertResult> {
  // Cancel / delete imported entries
  if (input.cancelled) {
    return deleteOrCancel(client, input);
  }

  let existing: ScheduleEntry | null = null;

  if (input.id) {
    existing = await getEntryById(client, input.id);
  } else if (input.source_reference) {
    existing = await findBySourceRef(client, input.source, input.source_reference);
  }

  if (existing && shouldProtectManual(existing, input.source)) {
    return {
      status: "skipped",
      reason: "manual_override",
      entry: existing,
    };
  }

  const row = inputToRow(input);

  // When automation updates an existing manual-looking entry via source_ref,
  // preserve manual_override if already set unless source is manual.
  if (existing && input.source !== "manual") {
    row.manual_override = existing.manual_override;
  }

  if (demoStoreEnabled() || !client) {
    if (existing) {
      const updated: ScheduleEntry = {
        ...existing,
        ...row,
        id: existing.id,
        created_at: existing.created_at,
        updated_at: nowIso(),
      };
      demoStore.entries = demoStore.entries.map((e) =>
        e.id === existing!.id ? updated : e,
      );
      return { status: "updated", entry: updated };
    }
    const created: ScheduleEntry = {
      id: crypto.randomUUID(),
      ...row,
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    demoStore.entries.push(created);
    return { status: "created", entry: created };
  }

  if (existing) {
    const { data, error } = await client
      .from(TABLE)
      .update(row)
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) {
      console.error("[schedule] update", error.message);
      return { status: "error", message: "Failed to update entry" };
    }
    return { status: "updated", entry: rowToEntry(data as Record<string, unknown>) };
  }

  const { data, error } = await client
    .from(TABLE)
    .insert({ ...row, created_at: nowIso() })
    .select("*")
    .single();

  if (error) {
    // Race on unique (source, source_reference) — retry as update
    if (error.code === "23505" && input.source_reference) {
      const again = await findBySourceRef(client, input.source, input.source_reference);
      if (again) {
        if (shouldProtectManual(again, input.source)) {
          return { status: "skipped", reason: "manual_override", entry: again };
        }
        const { data: updated, error: upErr } = await client
          .from(TABLE)
          .update(row)
          .eq("id", again.id)
          .select("*")
          .single();
        if (upErr) {
          console.error("[schedule] upsert retry", upErr.message);
          return { status: "error", message: "Failed to upsert entry" };
        }
        return {
          status: "updated",
          entry: rowToEntry(updated as Record<string, unknown>),
        };
      }
    }
    console.error("[schedule] insert", error.message);
    return { status: "error", message: "Failed to create entry" };
  }

  return { status: "created", entry: rowToEntry(data as Record<string, unknown>) };
}

async function deleteOrCancel(
  client: SupabaseClient | null,
  input: ScheduleEntryInput,
): Promise<UpsertResult> {
  let existing: ScheduleEntry | null = null;
  if (input.id) existing = await getEntryById(client, input.id);
  else if (input.source_reference) {
    existing = await findBySourceRef(client, input.source, input.source_reference);
  }

  if (!existing) {
    return { status: "skipped", reason: "not_found" };
  }

  if (shouldProtectManual(existing, input.source)) {
    return { status: "skipped", reason: "manual_override", entry: existing };
  }

  return deleteEntry(client, existing.id);
}

export async function deleteEntry(
  client: SupabaseClient | null,
  id: string,
): Promise<UpsertResult> {
  if (demoStoreEnabled() || !client) {
    const before = demoStore.entries.length;
    demoStore.entries = demoStore.entries.filter((e) => e.id !== id);
    if (demoStore.entries.length === before) {
      return { status: "skipped", reason: "not_found" };
    }
    return { status: "deleted", id };
  }

  const { error } = await client.from(TABLE).delete().eq("id", id);
  if (error) {
    console.error("[schedule] delete", error.message);
    return { status: "error", message: "Failed to delete entry" };
  }
  return { status: "deleted", id };
}

export async function duplicateEntry(
  client: SupabaseClient | null,
  id: string,
  targetDate?: string,
): Promise<UpsertResult> {
  const existing = await getEntryById(client, id);
  if (!existing) return { status: "skipped", reason: "not_found" };

  const input: ScheduleEntryInput = {
    date: targetDate ?? existing.date,
    employer: existing.employer,
    work_mode: existing.work_mode as ScheduleEntryInput["work_mode"],
    location: existing.location,
    start_time: existing.start_time,
    end_time: existing.end_time,
    expected_home_time: existing.expected_home_time,
    household_note: existing.household_note,
    source: "manual",
    source_reference: null,
    priority: existing.priority,
    is_all_day: existing.is_all_day,
    manual_override: true,
    cancelled: false,
  };

  return upsertEntry(client, input);
}

export function isDemoMode(): boolean {
  return demoStoreEnabled();
}
