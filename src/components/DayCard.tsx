"use client";

import { ScheduleBlock } from "@/components/ScheduleBlock";
import { formatDayHeading } from "@/lib/date";
import type { ScheduleEntry } from "@/lib/schedule/schema";

type Props = {
  date: string;
  entries: ScheduleEntry[];
  isToday: boolean;
};

export function DayCard({ date, entries, isToday }: Props) {
  const { weekday, dayMonth } = formatDayHeading(date);

  return (
    <section
      className={`flex min-h-[280px] flex-col rounded-3xl p-4 transition-shadow ${
        isToday
          ? "bg-white shadow-[0_8px_30px_rgba(42,122,110,0.18)] ring-2 ring-[var(--accent)]"
          : "bg-white/80 shadow-sm ring-1 ring-black/5"
      }`}
    >
      <header className="mb-3">
        <p
          className={`text-xs font-semibold uppercase tracking-[0.14em] ${
            isToday ? "text-[var(--accent)]" : "text-[var(--muted)]"
          }`}
        >
          {isToday ? "Today" : weekday}
        </p>
        <h2 className="mt-0.5 text-2xl font-semibold tracking-tight text-[var(--ink)]">
          {isToday ? weekday : dayMonth}
        </h2>
        {isToday && (
          <p className="text-sm text-[var(--muted)]">{dayMonth}</p>
        )}
      </header>

      <div className="flex flex-1 flex-col gap-2.5">
        {entries.length === 0 ? (
          <p className="mt-6 text-center text-base text-[var(--muted)]">
            Nothing scheduled
          </p>
        ) : (
          entries.map((entry) => (
            <ScheduleBlock key={entry.id} entry={entry} />
          ))
        )}
      </div>
    </section>
  );
}
