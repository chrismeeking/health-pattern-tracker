import { format, parseISO } from "date-fns";
import { formatTimeDisplay } from "@/lib/date";
import { isOffDayEmployer } from "@/lib/employers";
import type { ScheduleEntry } from "@/lib/schedule/schema";

const MATERIAL_KEYS = [
  "date",
  "employer",
  "work_mode",
  "location",
  "start_time",
  "end_time",
  "expected_home_time",
  "household_note",
  "is_all_day",
] as const;

type MaterialKey = (typeof MATERIAL_KEYS)[number];

export type MaterialSnapshot = Pick<
  ScheduleEntry,
  | "id"
  | "date"
  | "employer"
  | "work_mode"
  | "location"
  | "start_time"
  | "end_time"
  | "expected_home_time"
  | "household_note"
  | "is_all_day"
>;

export type FieldChange = {
  field: MaterialKey;
  from: string;
  to: string;
};

export type EntryChange =
  | { type: "created"; entry: MaterialSnapshot }
  | { type: "deleted"; entry: MaterialSnapshot }
  | { type: "updated"; before: MaterialSnapshot; after: MaterialSnapshot; fields: FieldChange[] };

export type ScheduleNotification = {
  title: string;
  subtitle?: string;
  lines: string[];
  kind: "created" | "updated" | "deleted" | "batch";
};

function normTime(t: string | null): string {
  return formatTimeDisplay(t) ?? "";
}

function displayValue(key: MaterialKey, entry: MaterialSnapshot): string {
  switch (key) {
    case "start_time":
    case "end_time":
    case "expected_home_time":
      return normTime(entry[key]);
    case "location":
      return entry.location?.trim() || "";
    case "household_note":
      return entry.household_note?.trim() || "";
    case "is_all_day":
      return entry.is_all_day ? "all day" : "";
    default:
      return String(entry[key] ?? "");
  }
}

function fieldLabel(key: MaterialKey): string {
  switch (key) {
    case "expected_home_time":
      return "Expected home";
    case "start_time":
      return "Start";
    case "end_time":
      return "Finish";
    case "work_mode":
      return "Mode";
    case "household_note":
      return "Note";
    case "is_all_day":
      return "All day";
    case "employer":
      return "Employer";
    case "location":
      return "Location";
    case "date":
      return "Date";
    default:
      return key;
  }
}

export function toMaterialSnapshot(entry: ScheduleEntry): MaterialSnapshot {
  return {
    id: entry.id,
    date: entry.date,
    employer: entry.employer,
    work_mode: entry.work_mode,
    location: entry.location,
    start_time: entry.start_time,
    end_time: entry.end_time,
    expected_home_time: entry.expected_home_time,
    household_note: entry.household_note,
    is_all_day: entry.is_all_day,
  };
}

export function snapshotMap(
  entries: ScheduleEntry[],
): Map<string, MaterialSnapshot> {
  const map = new Map<string, MaterialSnapshot>();
  for (const e of entries) {
    map.set(e.id, toMaterialSnapshot(e));
  }
  return map;
}

function diffFields(
  before: MaterialSnapshot,
  after: MaterialSnapshot,
): FieldChange[] {
  const changes: FieldChange[] = [];
  for (const key of MATERIAL_KEYS) {
    const from = displayValue(key, before);
    const to = displayValue(key, after);
    // Compare raw for times with normalisation
    let same = false;
    if (key === "start_time" || key === "end_time" || key === "expected_home_time") {
      same = normTime(before[key]) === normTime(after[key]);
    } else if (key === "location" || key === "household_note") {
      same = (before[key] ?? "").trim() === (after[key] ?? "").trim();
    } else {
      same = before[key] === after[key];
    }
    if (!same) {
      changes.push({ field: key, from: from || "—", to: to || "—" });
    }
  }
  return changes;
}

export function detectScheduleChanges(
  previous: Map<string, MaterialSnapshot>,
  next: Map<string, MaterialSnapshot>,
): EntryChange[] {
  const changes: EntryChange[] = [];

  for (const [id, after] of next) {
    const before = previous.get(id);
    if (!before) {
      changes.push({ type: "created", entry: after });
      continue;
    }
    const fields = diffFields(before, after);
    if (fields.length > 0) {
      changes.push({ type: "updated", before, after, fields });
    }
  }

  for (const [id, before] of previous) {
    if (!next.has(id)) {
      changes.push({ type: "deleted", entry: before });
    }
  }

  return changes;
}

function dayLabel(date: string): string {
  return format(parseISO(`${date}T12:00:00`), "EEEE");
}

function shortDay(date: string): string {
  return format(parseISO(`${date}T12:00:00`), "EEE").toUpperCase();
}

function modeLine(entry: MaterialSnapshot): string {
  if (isOffDayEmployer(entry.employer) || entry.work_mode === "Off") {
    return entry.employer === "Annual Leave" ? "Annual leave" : "Day off";
  }
  if (entry.work_mode === "WFH") return "Working from home";
  if (entry.work_mode === "On site") {
    return entry.location ? `On site — ${entry.location}` : "On site";
  }
  if (entry.work_mode === "Office") {
    return entry.location ? `Office — ${entry.location}` : "Office";
  }
  if (entry.work_mode === "Travelling") {
    return entry.location ? `Travelling — ${entry.location}` : "Travelling";
  }
  return entry.work_mode;
}

function hoursLine(entry: MaterialSnapshot): string | null {
  if (entry.is_all_day) return "All day";
  const start = normTime(entry.start_time);
  const end = normTime(entry.end_time);
  if (start && end) return `${start}–${end}`;
  return null;
}

function freeLine(entry: MaterialSnapshot): string | null {
  const t = normTime(entry.expected_home_time);
  if (!t) return null;
  if (
    entry.work_mode === "WFH" ||
    entry.work_mode === "Off" ||
    isOffDayEmployer(entry.employer)
  ) {
    return `Free ~${t}`;
  }
  return `Home ~${t}`;
}

function entryDetailLines(entry: MaterialSnapshot): string[] {
  const lines = [entry.employer.toUpperCase(), modeLine(entry)];
  const hours = hoursLine(entry);
  if (hours) lines.push(hours);
  const free = freeLine(entry);
  if (free) lines.push(free);
  return lines;
}

function deletedSummary(entry: MaterialSnapshot): string {
  const mode =
    entry.work_mode === "On site"
      ? "onsite work"
      : entry.work_mode === "WFH"
        ? "WFH"
        : entry.work_mode.toLowerCase();
  return `${entry.employer} ${mode}`.trim();
}

function weekRelation(
  date: string,
  today: string,
  thisMonday: string,
  nextMonday: string,
): "today" | "tomorrow" | "this_week" | "next_week" | "other" {
  if (date === today) return "today";
  const tomorrow = format(
    new Date(parseISO(`${today}T12:00:00`).getTime() + 86400000),
    "yyyy-MM-dd",
  );
  if (date === tomorrow) return "tomorrow";
  if (date >= thisMonday && date < nextMonday) return "this_week";
  const weekAfter = format(
    new Date(parseISO(`${nextMonday}T12:00:00`).getTime() + 7 * 86400000),
    "yyyy-MM-dd",
  );
  if (date >= nextMonday && date < weekAfter) return "next_week";
  return "other";
}

/** Build one household-facing notification from a batch of changes. */
export function summariseScheduleChanges(
  changes: EntryChange[],
  opts: { today: string; thisMonday: string; nextMonday: string },
): ScheduleNotification | null {
  if (changes.length === 0) return null;

  if (changes.length === 1) {
    const c = changes[0];
    if (c.type === "created") {
      const rel = weekRelation(
        c.entry.date,
        opts.today,
        opts.thisMonday,
        opts.nextMonday,
      );
      const subtitle =
        rel === "tomorrow"
          ? "Tomorrow"
          : rel === "today"
            ? "Today"
            : dayLabel(c.entry.date);
      return {
        kind: "created",
        title: "Schedule updated",
        subtitle,
        lines: entryDetailLines(c.entry),
      };
    }
    if (c.type === "deleted") {
      return {
        kind: "deleted",
        title: "Schedule changed",
        subtitle: dayLabel(c.entry.date),
        lines: [deletedSummary(c.entry), "CANCELLED"],
      };
    }
    // updated — prefer the most household-relevant field lines
    const interesting = c.fields.filter((f) =>
      [
        "expected_home_time",
        "start_time",
        "end_time",
        "employer",
        "work_mode",
        "location",
        "date",
      ].includes(f.field),
    );
    const show = interesting.length ? interesting : c.fields;
    if (
      show.length === 1 &&
      (show[0].field === "expected_home_time" ||
        show[0].field === "start_time" ||
        show[0].field === "end_time")
    ) {
      const f = show[0];
      return {
        kind: "updated",
        title: "Schedule changed",
        subtitle: dayLabel(c.after.date),
        lines: [`${fieldLabel(f.field)}`, `${f.from} → ${f.to}`],
      };
    }
    return {
      kind: "updated",
      title: "Schedule changed",
      subtitle: dayLabel(c.after.date),
      lines: [
        c.after.employer.toUpperCase(),
        ...show.slice(0, 3).map((f) => `${fieldLabel(f.field)}: ${f.from} → ${f.to}`),
      ],
    };
  }

  // Multiple changes — compress
  const allNextWeek = changes.every((c) => {
    const date =
      c.type === "updated" ? c.after.date : c.entry.date;
    return (
      weekRelation(date, opts.today, opts.thisMonday, opts.nextMonday) ===
      "next_week"
    );
  });

  const byDay = new Map<string, Set<string>>();
  for (const c of changes) {
    const entry = c.type === "updated" ? c.after : c.entry;
    const set = byDay.get(entry.date) ?? new Set<string>();
    set.add(entry.employer);
    byDay.set(entry.date, set);
  }

  const dayLines = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, 5)
    .map(([date, employers]) => {
      return `${shortDay(date)} — ${[...employers].join(" + ")}`;
    });

  return {
    kind: "batch",
    title: allNextWeek ? "Next week updated" : "Schedule updated",
    subtitle: `${changes.length} changes`,
    lines: dayLines,
  };
}
