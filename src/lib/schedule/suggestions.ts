import { addDays, format, getISODay, parseISO } from "date-fns";
import { formatTimeDisplay, shiftWeek, weekDatesFromMonday } from "@/lib/date";
import { isOffDayEmployer } from "@/lib/employers";
import { sortEntries } from "@/lib/schedule/format";
import type { ScheduleEntry } from "@/lib/schedule/schema";

const LOOKBACK_WEEKS = 6;
/** Minimum matching weeks before we surface an auto suggestion. */
const MIN_MATCHES = 2;

export type SuggestedEntry = {
  date: string;
  employer: string;
  work_mode: string;
  location: string | null;
  start_time: string | null;
  end_time: string | null;
  expected_home_time: string | null;
  household_note: string | null;
  is_all_day: boolean;
};

export type Confidence = "weak" | "useful" | "strong";

export type DaySuggestion = {
  date: string;
  weekday: string;
  entries: SuggestedEntry[];
  patternKey: string;
  matchCount: number;
  confidence: Confidence;
  reason: string;
};

export type WeekSuggestion = {
  entries: SuggestedEntry[];
  dayLines: { weekday: string; text: string; date: string }[];
  matchWeeks: number;
  confidence: Confidence;
  reason: string;
  title: string;
};

function normTime(t: string | null | undefined): string {
  return formatTimeDisplay(t) ?? "";
}

/** Leave / off / personal — never auto-suggested as recurring work. */
export function isNonWorkSuggestionEntry(entry: {
  employer: string;
  work_mode: string;
}): boolean {
  if (isOffDayEmployer(entry.employer)) return true;
  if (entry.employer === "Personal / Family") return true;
  if (entry.work_mode === "Off") return true;
  return false;
}

function entryFingerprint(entry: {
  employer: string;
  work_mode: string;
  location: string | null;
  start_time: string | null;
  end_time: string | null;
  expected_home_time: string | null;
  is_all_day: boolean;
}): string {
  return [
    entry.employer,
    entry.work_mode,
    entry.is_all_day ? "allday" : `${normTime(entry.start_time)}-${normTime(entry.end_time)}`,
    (entry.location ?? "").trim().toLowerCase(),
    normTime(entry.expected_home_time),
  ].join("|");
}

function dayFingerprint(entries: ScheduleEntry[]): string {
  const work = sortEntries(entries.filter((e) => !isNonWorkSuggestionEntry(e)));
  if (work.length === 0) return "";
  return work.map(entryFingerprint).join(";;");
}

function confidenceFromCount(count: number): Confidence {
  if (count >= 4) return "strong";
  if (count >= 2) return "useful";
  return "weak";
}

function reasonForWeekday(weekday: string, count: number): string {
  if (count >= 4) {
    return `You've worked this pattern for the last ${count} ${weekday}s.`;
  }
  if (count >= 2) {
    return `Based on your recent ${weekday}s (${count} similar weeks).`;
  }
  return `Based on a recent ${weekday}.`;
}

function toSuggested(
  entry: ScheduleEntry,
  targetDate: string,
): SuggestedEntry {
  return {
    date: targetDate,
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

function templatesFromFingerprint(
  fingerprint: string,
  sample: ScheduleEntry[],
  targetDate: string,
): SuggestedEntry[] {
  const work = sortEntries(sample.filter((e) => !isNonWorkSuggestionEntry(e)));
  if (dayFingerprint(work) !== fingerprint) {
    // Fallback: rebuild from fingerprint parts is hard — use sample filtered
  }
  return work.map((e) => toSuggested(e, targetDate));
}

function summariseDayEntries(entries: SuggestedEntry[]): string {
  return entries
    .map((e) => {
      const hours = e.is_all_day
        ? "all day"
        : [normTime(e.start_time), normTime(e.end_time)].filter(Boolean).join("–");
      return hours ? `${e.employer} ${hours}` : e.employer;
    })
    .join(" + ");
}

export function historyRangeForWeek(targetMonday: string): {
  from: string;
  to: string;
} {
  const from = shiftWeek(targetMonday, -LOOKBACK_WEEKS);
  const to = format(addDays(parseISO(`${targetMonday}T12:00:00`), -1), "yyyy-MM-dd");
  return { from, to };
}

export function previousWeekMonday(targetMonday: string): string {
  return shiftWeek(targetMonday, -1);
}

/** Whether two entries look like the same plan on a day (duplicate guard). */
export function isDuplicateSuggestion(
  existing: ScheduleEntry[],
  proposed: SuggestedEntry,
): boolean {
  return existing.some(
    (e) =>
      e.date === proposed.date &&
      e.employer === proposed.employer &&
      e.work_mode === proposed.work_mode &&
      normTime(e.start_time) === normTime(proposed.start_time) &&
      normTime(e.end_time) === normTime(proposed.end_time) &&
      Boolean(e.is_all_day) === Boolean(proposed.is_all_day),
  );
}

export function filterNewSuggestions(
  existing: ScheduleEntry[],
  proposed: SuggestedEntry[],
): SuggestedEntry[] {
  return proposed.filter((p) => !isDuplicateSuggestion(existing, p));
}

/**
 * Build per-day suggestions for a target week from lookback history.
 * Only returns days with reasonable repetition (2+ matching weeks).
 */
export function buildDaySuggestions(
  targetMonday: string,
  targetEntries: ScheduleEntry[],
  history: ScheduleEntry[],
  opts?: { includeWeak?: boolean },
): DaySuggestion[] {
  const dates = weekDatesFromMonday(targetMonday);
  const byDate = new Map<string, ScheduleEntry[]>();
  for (const e of history) {
    const list = byDate.get(e.date) ?? [];
    list.push(e);
    byDate.set(e.date, list);
  }

  const suggestions: DaySuggestion[] = [];

  for (const date of dates) {
    const existing = targetEntries.filter((e) => e.date === date);
    const existingWork = existing.filter((e) => !isNonWorkSuggestionEntry(e));
    // Only suggest for empty / no work days
    if (existingWork.length > 0) continue;

    const weekdayNum = getISODay(parseISO(`${date}T12:00:00`)); // 1=Mon … 7=Sun
    const weekday = format(parseISO(`${date}T12:00:00`), "EEEE");

    const counts = new Map<
      string,
      { count: number; sample: ScheduleEntry[] }
    >();

    for (let w = 1; w <= LOOKBACK_WEEKS; w++) {
      const histMonday = shiftWeek(targetMonday, -w);
      const histDates = weekDatesFromMonday(histMonday);
      const histDate = histDates[weekdayNum - 1];
      if (!histDate) continue;
      const dayEntries = sortEntries(byDate.get(histDate) ?? []);
      const fp = dayFingerprint(dayEntries);
      if (!fp) continue;
      const prev = counts.get(fp);
      if (prev) {
        prev.count += 1;
      } else {
        counts.set(fp, {
          count: 1,
          sample: dayEntries.filter((e) => !isNonWorkSuggestionEntry(e)),
        });
      }
    }

    let best: { fp: string; count: number; sample: ScheduleEntry[] } | null =
      null;
    for (const [fp, val] of counts) {
      if (!best || val.count > best.count) {
        best = { fp, count: val.count, sample: val.sample };
      }
    }

    if (!best) continue;
    if (best.count < MIN_MATCHES && !opts?.includeWeak) continue;

    const entries = templatesFromFingerprint(best.fp, best.sample, date);
    if (entries.length === 0) continue;

    suggestions.push({
      date,
      weekday,
      entries,
      patternKey: best.fp,
      matchCount: best.count,
      confidence: confidenceFromCount(best.count),
      reason: reasonForWeekday(weekday, best.count),
    });
  }

  return suggestions;
}

function weekWorkDayCount(entries: ScheduleEntry[], monday: string): number {
  const dates = new Set(weekDatesFromMonday(monday));
  const days = new Set<string>();
  for (const e of entries) {
    if (!dates.has(e.date)) continue;
    if (isNonWorkSuggestionEntry(e)) continue;
    days.add(e.date);
  }
  return days.size;
}

/**
 * Week-level suggestion when the target week is empty or thin and patterns exist.
 */
export function buildWeekSuggestion(
  targetMonday: string,
  targetEntries: ScheduleEntry[],
  history: ScheduleEntry[],
  todayMonday: string,
): WeekSuggestion | null {
  const daySuggestions = buildDaySuggestions(
    targetMonday,
    targetEntries,
    history,
  );
  if (daySuggestions.length < 3) return null;

  const workDays = weekWorkDayCount(targetEntries, targetMonday);
  // Empty or substantially incomplete (fewer than 3 work days filled)
  if (workDays >= 3) return null;

  const entries = daySuggestions.flatMap((d) => d.entries);
  const fresh = filterNewSuggestions(targetEntries, entries);
  if (fresh.length === 0) return null;

  const matchWeeks = Math.min(
    ...daySuggestions.map((d) => d.matchCount),
  );
  const confidence = confidenceFromCount(
    Math.round(
      daySuggestions.reduce((s, d) => s + d.matchCount, 0) /
        daySuggestions.length,
    ),
  );

  const isNext = targetMonday === shiftWeek(todayMonday, 1);
  const title = isNext
    ? "Next week looks empty"
    : workDays === 0
      ? "This week looks empty"
      : "This week looks incomplete";

  const reason =
    matchWeeks >= 4
      ? `You've worked this pattern for the last ${matchWeeks} weeks.`
      : matchWeeks >= 2
        ? `Based on your recent weeks (${matchWeeks}+ similar).`
        : "Based on your recent schedule.";

  return {
    entries: fresh,
    dayLines: daySuggestions.map((d) => ({
      date: d.date,
      weekday: format(parseISO(`${d.date}T12:00:00`), "EEE").toUpperCase(),
      text: summariseDayEntries(d.entries),
    })),
    matchWeeks,
    confidence,
    reason,
    title,
  };
}

/** Exact +7 day copy of previous week's entries (includes leave/off). */
export function buildCopyPreviousWeek(
  targetMonday: string,
  previousWeekEntries: ScheduleEntry[],
  targetEntries: ScheduleEntry[],
): SuggestedEntry[] {
  const prevMonday = previousWeekMonday(targetMonday);
  const proposed: SuggestedEntry[] = [];
  for (const e of sortEntries(previousWeekEntries)) {
    const prevDates = weekDatesFromMonday(prevMonday);
    const idx = prevDates.indexOf(e.date);
    if (idx < 0) continue;
    const targetDates = weekDatesFromMonday(targetMonday);
    const targetDate = targetDates[idx];
    if (!targetDate) continue;
    proposed.push(toSuggested(e, targetDate));
  }
  return filterNewSuggestions(targetEntries, proposed);
}

export function suggestedToPayload(entry: SuggestedEntry) {
  return {
    date: entry.date,
    employer: entry.employer,
    work_mode: entry.work_mode,
    location: entry.location,
    start_time: entry.start_time,
    end_time: entry.end_time,
    expected_home_time: entry.expected_home_time,
    household_note: entry.household_note,
    source: "manual" as const,
    source_reference: null,
    is_all_day: entry.is_all_day,
    manual_override: true,
    priority: 0,
  };
}

export function formatSuggestionLines(entries: SuggestedEntry[]): string[] {
  if (entries.length === 0) return [];
  const first = entries[0];
  const lines = [first.employer.toUpperCase(), first.work_mode];
  if (first.is_all_day) {
    lines.push("All day");
  } else {
    const start = normTime(first.start_time);
    const end = normTime(first.end_time);
    if (start && end) lines.push(`${start}–${end}`);
    else if (start) lines.push(`From ${start}`);
  }
  if (first.location) lines.push(first.location);
  if (entries.length > 1) {
    lines.push(
      entries.length === 2
        ? "+1 more that day"
        : `+${entries.length - 1} more that day`,
    );
  }
  return lines;
}
