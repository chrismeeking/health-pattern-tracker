"use client";

import { EmployerBadge } from "@/components/EmployerBadge";
import { formatTimeDisplay } from "@/lib/date";
import { getEmployerTheme, isOffDayEmployer } from "@/lib/employers";
import type { ScheduleEntry } from "@/lib/schedule/schema";

type Props = {
  entries: ScheduleEntry[];
  /** e.g. FRI 21 AUG */
  todayShortLabel: string;
};

function modeLabel(entry: ScheduleEntry): string {
  if (isOffDayEmployer(entry.employer) || entry.work_mode === "Off") {
    return entry.employer === "Annual Leave" ? "Leave" : "Off";
  }
  if (entry.work_mode === "On site" && entry.location) {
    return `On site — ${entry.location}`;
  }
  if (entry.work_mode === "Office" && entry.location) {
    return `Office — ${entry.location}`;
  }
  if (entry.work_mode === "Travelling" && entry.location) {
    return `Travelling — ${entry.location}`;
  }
  return entry.work_mode;
}

function hoursLabel(entry: ScheduleEntry): string | null {
  if (entry.is_all_day) return "All day";
  const start = formatTimeDisplay(entry.start_time);
  const end = formatTimeDisplay(entry.end_time);
  if (start && end) return `${start}–${end}`;
  if (start) return `From ${start}`;
  return null;
}

function freeLabel(entry: ScheduleEntry): string | null {
  const t = formatTimeDisplay(entry.expected_home_time);
  if (!t) return null;
  if (entry.work_mode === "WFH" || entry.work_mode === "Off" || isOffDayEmployer(entry.employer)) {
    return `FREE ~${t}`;
  }
  return `HOME ~${t}`;
}

function EntryLine({ entry }: { entry: ScheduleEntry }) {
  const theme = getEmployerTheme(entry.employer);
  const parts = [
    modeLabel(entry),
    hoursLabel(entry),
    freeLabel(entry),
  ].filter(Boolean);

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
      <EmployerBadge employer={entry.employer} size="md" />
      <p
        className="min-w-0 text-base font-semibold tracking-tight sm:text-lg"
        style={{ color: theme.text }}
      >
        {parts.join("  ·  ")}
      </p>
      {entry.household_note ? (
        <span className="text-sm text-[var(--muted)]">{entry.household_note}</span>
      ) : null}
    </div>
  );
}

export function TodaySummary({ entries, todayShortLabel }: Props) {
  return (
    <section className="today-strip shrink-0 overflow-hidden rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent)]">
          Today
        </p>
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--ink)]">
          {todayShortLabel}
        </p>
      </div>

      {entries.length === 0 ? (
        <p className="mt-1.5 text-lg font-semibold text-[var(--ink)]">
          Nothing scheduled
        </p>
      ) : (
        <div className="mt-1.5 flex flex-col gap-1.5">
          {entries.map((entry) => (
            <EntryLine key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </section>
  );
}
