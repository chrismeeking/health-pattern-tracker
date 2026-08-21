import { formatInTimeZone } from "date-fns-tz";
import { addDays, format, parseISO } from "date-fns";
import { formatTimeDisplay, LONDON_TZ, todayDateString } from "@/lib/date";
import { isOffDayEmployer } from "@/lib/employers";
import { sortEntries } from "@/lib/schedule/format";
import type { ScheduleEntry } from "@/lib/schedule/schema";

export type NowStatusLine = {
  label?: string;
  text: string;
  emphasis?: "hero" | "strong" | "muted";
};

export type NowStatus = {
  phase:
    | "empty"
    | "off"
    | "before"
    | "working"
    | "travelling_home"
    | "between"
    | "finished";
  eyebrow: string;
  primaryEmployer?: string;
  lines: NowStatusLine[];
  next?: NowStatusLine[];
};

function toMinutes(time: string | null | undefined): number | null {
  if (!time) return null;
  const m = /^(\d{2}):(\d{2})/.exec(time);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

function londonNowMinutes(reference: Date): number {
  const hm = formatInTimeZone(reference, LONDON_TZ, "HH:mm");
  return toMinutes(hm) ?? 0;
}

function modeLong(entry: ScheduleEntry): string {
  if (isOffDayEmployer(entry.employer) || entry.work_mode === "Off") {
    return entry.employer === "Annual Leave" ? "Annual leave" : "Day off";
  }
  switch (entry.work_mode) {
    case "WFH":
      return "Working from home";
    case "On site":
      return entry.location
        ? `On site — ${entry.location}`
        : "On site";
    case "Office":
      return entry.location ? `Office — ${entry.location}` : "In the office";
    case "Travelling":
      return entry.location ? `Travelling — ${entry.location}` : "Travelling";
    default:
      return entry.work_mode;
  }
}

function modeShort(entry: ScheduleEntry): string {
  if (isOffDayEmployer(entry.employer) || entry.work_mode === "Off") {
    return entry.employer === "Annual Leave" ? "Leave" : "Off";
  }
  if (entry.work_mode === "WFH") return "WFH";
  if (entry.work_mode === "On site") {
    return entry.location ? `On site — ${entry.location}` : "On site";
  }
  return entry.work_mode;
}

function isAwayWork(entry: ScheduleEntry): boolean {
  return (
    entry.work_mode === "On site" ||
    entry.work_mode === "Office" ||
    entry.work_mode === "Travelling"
  );
}

function freeOrHome(entry: ScheduleEntry): { label: string; time: string } | null {
  const t = formatTimeDisplay(entry.expected_home_time);
  if (!t) return null;
  if (
    entry.work_mode === "WFH" ||
    entry.work_mode === "Off" ||
    isOffDayEmployer(entry.employer)
  ) {
    return { label: "Free around", time: t };
  }
  return { label: "Expected home", time: t };
}

function entryBounds(entry: ScheduleEntry): { start: number; end: number } {
  if (entry.is_all_day) return { start: 0, end: 24 * 60 - 1 };
  const start = toMinutes(entry.start_time) ?? 0;
  const end = toMinutes(entry.end_time) ?? start;
  return { start, end };
}

function tomorrowDateString(today: string): string {
  return format(addDays(parseISO(`${today}T12:00:00`), 1), "yyyy-MM-dd");
}

function tomorrowPlanLines(tomorrowEntries: ScheduleEntry[]): NowStatusLine[] {
  const next = sortEntries(tomorrowEntries);
  if (next.length === 0) {
    return [
      { label: "Tomorrow", text: "Nothing scheduled", emphasis: "muted" },
    ];
  }

  const first = next[0];
  const start = formatTimeDisplay(first.start_time);
  const lines: NowStatusLine[] = [
    { label: "Tomorrow", text: first.employer.toUpperCase(), emphasis: "strong" },
    { text: modeShort(first), emphasis: "strong" },
  ];
  if (start) {
    lines.push({ text: `Starts ${start}`, emphasis: "muted" });
  } else if (first.is_all_day) {
    lines.push({ text: "All day", emphasis: "muted" });
  }
  if (next.length > 1) {
    const extra = next.length - 1;
    lines.push({
      text: extra === 1 ? "+1 more tomorrow" : `+${extra} more tomorrow`,
      emphasis: "muted",
    });
  }
  return lines;
}

/** Evening / overnight NOW state — useful for planning tomorrow. */
function finishedWithTomorrow(tomorrowEntries: ScheduleEntry[]): NowStatus {
  return {
    phase: "finished",
    eyebrow: "Evening",
    lines: [{ text: "Done for today", emphasis: "hero" }],
    next: tomorrowPlanLines(tomorrowEntries),
  };
}

/**
 * True while today's working day is still active (before first job, in progress,
 * between jobs, or in the travel/free window before expected_home_time).
 * False once the final work entry has ended and expected_home_time (if any) has passed.
 */
export function isWorkingDayActive(
  todayEntries: ScheduleEntry[],
  reference: Date = new Date(),
): boolean {
  const today = todayDateString(reference);
  const now = londonNowMinutes(reference);
  const work = sortEntries(
    todayEntries.filter(
      (e) =>
        e.date === today &&
        !(isOffDayEmployer(e.employer) || e.work_mode === "Off"),
    ),
  );
  if (work.length === 0) return false;

  const last = work[work.length - 1];
  const { end: lastEnd } = entryBounds(last);
  const lastHome = toMinutes(last.expected_home_time);
  const dayEnd = lastHome != null && lastHome > lastEnd ? lastHome : lastEnd;
  return now < dayEnd;
}

/**
 * Derive household-friendly NOW / TODAY status from today's entries
 * and the current Europe/London clock.
 */
export function deriveNowStatus(
  todayEntries: ScheduleEntry[],
  tomorrowEntries: ScheduleEntry[] = [],
  reference: Date = new Date(),
): NowStatus {
  const today = todayDateString(reference);
  const now = londonNowMinutes(reference);
  const entries = sortEntries(
    todayEntries.filter((e) => e.date === today),
  );

  if (entries.length === 0) {
    return {
      phase: "empty",
      eyebrow: "Today",
      lines: [{ text: "Nothing scheduled", emphasis: "hero" }],
      next: finishedWithTomorrow(tomorrowEntries).next,
    };
  }

  const onlyOff = entries.every(
    (e) => isOffDayEmployer(e.employer) || e.work_mode === "Off",
  );
  if (onlyOff) {
    const primary = entries[0];
    return {
      phase: "off",
      eyebrow: "Today",
      primaryEmployer: primary.employer,
      lines: [
        { text: primary.employer.toUpperCase(), emphasis: "hero" },
        { text: modeLong(primary), emphasis: "strong" },
      ],
    };
  }

  // Active timed work blocks (ignore pure off markers mixed in)
  const work = entries.filter(
    (e) => !(isOffDayEmployer(e.employer) || e.work_mode === "Off"),
  );
  if (work.length === 0) {
    return finishedWithTomorrow(tomorrowEntries);
  }

  const current = work.find((e) => {
    const { start, end } = entryBounds(e);
    return now >= start && now < end;
  });

  if (current) {
    const end = formatTimeDisplay(current.end_time);
    const idx = work.indexOf(current);
    const following = work[idx + 1];
    const lines: NowStatusLine[] = [
      { text: current.employer.toUpperCase(), emphasis: "hero" },
      { text: modeLong(current).toUpperCase(), emphasis: "strong" },
    ];
    if (end) {
      lines.push({ text: `Until ${end}`, emphasis: "muted" });
    }

    const next: NowStatusLine[] = [];
    if (following) {
      const start = formatTimeDisplay(following.start_time);
      next.push({ label: "Next", text: following.employer.toUpperCase(), emphasis: "strong" });
      if (start) next.push({ text: start, emphasis: "muted" });
    } else {
      const free = freeOrHome(current);
      if (free) {
        next.push({
          label: "Next",
          text: `${free.label} ${free.time}`,
          emphasis: "muted",
        });
      }
    }

    return {
      phase: "working",
      eyebrow: "Now",
      primaryEmployer: current.employer,
      lines,
      next: next.length ? next : undefined,
    };
  }

  // Travelling home window after away work
  const justFinished = [...work].reverse().find((e) => {
    const { end } = entryBounds(e);
    const home = toMinutes(e.expected_home_time);
    if (!isAwayWork(e) || home == null) return false;
    if (home <= end) return false;
    return now >= end && now < home;
  });

  if (justFinished) {
    const idx = work.indexOf(justFinished);
    const following = work[idx + 1];
    const followingStart = following ? entryBounds(following).start : null;
    // Conflicting subsequent work during travel window?
    if (followingStart != null && now >= followingStart) {
      // fall through — subsequent work should have matched as current
    } else if (
      !following ||
      followingStart == null ||
      followingStart >= (toMinutes(justFinished.expected_home_time) ?? 0)
    ) {
      const home = formatTimeDisplay(justFinished.expected_home_time);
      const from = justFinished.location
        ? `From ${justFinished.location}`
        : "On the way back";
      return {
        phase: "travelling_home",
        eyebrow: "Now",
        primaryEmployer: justFinished.employer,
        lines: [
          { text: "Travelling home", emphasis: "hero" },
          { text: from, emphasis: "strong" },
        ],
        next: home
          ? [{ label: "Expected home", text: home, emphasis: "strong" }]
          : undefined,
      };
    }
  }

  const first = work[0];
  const firstStart = entryBounds(first).start;
  if (now < firstStart) {
    const start = formatTimeDisplay(first.start_time);
    return {
      phase: "before",
      eyebrow: "Today",
      primaryEmployer: first.employer,
      lines: [
        { text: first.employer.toUpperCase(), emphasis: "hero" },
        { text: modeLong(first), emphasis: "strong" },
        ...(start
          ? [{ text: `Starts ${start}`, emphasis: "muted" as const }]
          : []),
      ],
    };
  }

  // Between jobs
  const nextJob = work.find((e) => entryBounds(e).start > now);
  if (nextJob) {
    const start = formatTimeDisplay(nextJob.start_time);
    return {
      phase: "between",
      eyebrow: "Now",
      primaryEmployer: nextJob.employer,
      lines: [{ text: "Between jobs", emphasis: "hero" }],
      next: [
        { label: "Next", text: nextJob.employer.toUpperCase(), emphasis: "strong" },
        {
          text: [modeShort(nextJob), start].filter(Boolean).join(" — "),
          emphasis: "muted",
        },
      ],
    };
  }

  // Past the last work block, but expected home / free time not yet reached
  // (covers WFH and any case where travelling_home did not apply).
  const last = work[work.length - 1];
  const { end: lastEnd } = entryBounds(last);
  const lastHome = toMinutes(last.expected_home_time);
  if (
    now >= lastEnd &&
    lastHome != null &&
    lastHome > lastEnd &&
    now < lastHome
  ) {
    const free = freeOrHome(last);
    return {
      phase: "travelling_home",
      eyebrow: "Now",
      primaryEmployer: last.employer,
      lines: [
        {
          text: isAwayWork(last) ? "Travelling home" : "Winding down",
          emphasis: "hero",
        },
        {
          text: isAwayWork(last)
            ? last.location
              ? `From ${last.location}`
              : "On the way back"
            : modeLong(last),
          emphasis: "strong",
        },
      ],
      next: free
        ? [{ label: free.label, text: free.time, emphasis: "strong" }]
        : undefined,
    };
  }

  return finishedWithTomorrow(tomorrowEntries);
}

export function tomorrowIsoDate(reference: Date = new Date()): string {
  return tomorrowDateString(todayDateString(reference));
}
