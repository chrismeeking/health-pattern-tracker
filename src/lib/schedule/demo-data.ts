import type { ScheduleEntry } from "@/lib/schedule/schema";
import { todayDateString, weekDatesFromMonday, weekStartMonday } from "@/lib/date";

function entry(
  partial: Omit<ScheduleEntry, "created_at" | "updated_at" | "id"> & { id?: string },
): ScheduleEntry {
  const ts = new Date().toISOString();
  return {
    id: partial.id ?? crypto.randomUUID(),
    created_at: ts,
    updated_at: ts,
    ...partial,
  };
}

/** Realistic sample week relative to “today” in Europe/London. */
export function buildDemoEntries(reference = new Date()): ScheduleEntry[] {
  const today = todayDateString(reference);
  const monday = weekStartMonday(today);
  const [mon, tue, wed, thu, fri, sat, sun] = weekDatesFromMonday(monday);

  return [
    entry({
      date: mon,
      employer: "Post Office",
      work_mode: "WFH",
      location: null,
      start_time: "08:30:00",
      end_time: "17:00:00",
      expected_home_time: "17:30:00",
      household_note: null,
      source: "manual",
      source_reference: null,
      priority: 0,
      is_all_day: false,
      manual_override: false,
    }),
    entry({
      date: tue,
      employer: "Wagamama",
      work_mode: "WFH",
      location: null,
      start_time: "05:00:00",
      end_time: "08:00:00",
      expected_home_time: "08:15:00",
      household_note: "Early migration window",
      source: "chatgpt",
      source_reference: `wagamama-early-${tue}`,
      priority: 1,
      is_all_day: false,
      manual_override: false,
    }),
    entry({
      date: tue,
      employer: "Post Office",
      work_mode: "WFH",
      location: null,
      start_time: "09:00:00",
      end_time: "17:00:00",
      expected_home_time: "17:15:00",
      household_note: null,
      source: "manual",
      source_reference: null,
      priority: 0,
      is_all_day: false,
      manual_override: false,
    }),
    entry({
      date: wed,
      employer: "CPM Tech",
      work_mode: "On site",
      location: "Birmingham",
      start_time: "07:30:00",
      end_time: "16:30:00",
      expected_home_time: "18:00:00",
      household_note: null,
      source: "outlook",
      source_reference: `cpm-onsite-${wed}`,
      priority: 0,
      is_all_day: false,
      manual_override: false,
    }),
    entry({
      date: thu,
      employer: "Off",
      work_mode: "Off",
      location: null,
      start_time: null,
      end_time: null,
      expected_home_time: null,
      household_note: "At home",
      source: "manual",
      source_reference: null,
      priority: 0,
      is_all_day: true,
      manual_override: false,
    }),
    entry({
      date: fri,
      employer: "Post Office",
      work_mode: "WFH",
      location: null,
      start_time: "08:30:00",
      end_time: "17:00:00",
      expected_home_time: "17:30:00",
      household_note: null,
      source: "manual",
      source_reference: null,
      priority: 0,
      is_all_day: false,
      manual_override: false,
    }),
    entry({
      date: sat,
      employer: "Personal / Family",
      work_mode: "Off",
      location: null,
      start_time: null,
      end_time: null,
      expected_home_time: null,
      household_note: null,
      source: "manual",
      source_reference: null,
      priority: 0,
      is_all_day: true,
      manual_override: false,
    }),
    // Sunday intentionally empty for empty-state demo
    entry({
      id: "00000000-0000-4000-8000-000000000099",
      date: sun,
      employer: "Other",
      work_mode: "Off",
      location: null,
      start_time: null,
      end_time: null,
      expected_home_time: null,
      household_note: "REMOVE_MARKER",
      source: "system",
      source_reference: "placeholder-remove",
      priority: 0,
      is_all_day: true,
      manual_override: false,
    }),
  ].filter((e) => e.household_note !== "REMOVE_MARKER");
}

export const DEMO_ENTRIES: ScheduleEntry[] = buildDemoEntries();
