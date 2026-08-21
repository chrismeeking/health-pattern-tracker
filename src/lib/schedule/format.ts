import type { ScheduleEntry } from "@/lib/schedule/schema";
import { formatTimeDisplay } from "@/lib/date";
import { isOffDayEmployer } from "@/lib/employers";

function modePhrase(mode: string, location: string | null): string {
  switch (mode) {
    case "WFH":
      return "Working from home";
    case "On site":
      return location ? `On site in ${location}` : "On site";
    case "Office":
      return location ? `In the office — ${location}` : "In the office";
    case "Travelling":
      return location ? `Travelling — ${location}` : "Travelling";
    case "Off":
      return "Off";
    default:
      return mode;
  }
}

function freePhrase(entry: ScheduleEntry): string | null {
  const t = formatTimeDisplay(entry.expected_home_time);
  if (!t) return null;
  if (entry.work_mode === "WFH" || entry.work_mode === "Off") {
    return `Expected free around ${t}`;
  }
  return `Expected home around ${t}`;
}

/** Plain-English lines for the Today panel. */
export function summariseEntry(entry: ScheduleEntry): string[] {
  const lines: string[] = [entry.employer];

  if (isOffDayEmployer(entry.employer) || entry.work_mode === "Off") {
    lines.push(entry.employer === "Annual Leave" ? "Annual leave" : "Day off");
    if (entry.household_note) lines.push(entry.household_note);
    return lines;
  }

  lines.push(modePhrase(entry.work_mode, entry.location));

  if (!entry.is_all_day) {
    const start = formatTimeDisplay(entry.start_time);
    const end = formatTimeDisplay(entry.end_time);
    if (start && end) {
      lines.push(`${start}–${end}`);
    } else if (start) {
      lines.push(`From ${start}`);
    }
  }

  const free = freePhrase(entry);
  if (free) lines.push(free);

  if (entry.household_note) {
    lines.push(entry.household_note);
  }

  return lines;
}

export function sortEntries(entries: ScheduleEntry[]): ScheduleEntry[] {
  return [...entries].sort((a, b) => {
    if (a.priority !== b.priority) return b.priority - a.priority;
    const at = a.start_time ?? (a.is_all_day ? "00:00:00" : "99:99:99");
    const bt = b.start_time ?? (b.is_all_day ? "00:00:00" : "99:99:99");
    if (at !== bt) return at.localeCompare(bt);
    return a.employer.localeCompare(b.employer);
  });
}

export function groupByDate(
  entries: ScheduleEntry[],
): Record<string, ScheduleEntry[]> {
  const groups: Record<string, ScheduleEntry[]> = {};
  for (const entry of sortEntries(entries)) {
    if (!groups[entry.date]) groups[entry.date] = [];
    groups[entry.date].push(entry);
  }
  return groups;
}
