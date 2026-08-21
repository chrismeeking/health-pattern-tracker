"use client";

import { ScheduleBlock } from "@/components/ScheduleBlock";
import { formatDayHeading } from "@/lib/date";
import type { ScheduleEntry } from "@/lib/schedule/schema";

type Props = {
  date: string;
  entries: ScheduleEntry[];
  isToday: boolean;
  /** Fill remaining board height (NCR week columns) */
  fill?: boolean;
};

export function DayCard({ date, entries, isToday, fill = false }: Props) {
  const { weekday, dayMonth } = formatDayHeading(date);
  const shortDay = weekday.slice(0, 3);

  return (
    <section
      className={`flex min-h-0 flex-col overflow-hidden rounded-2xl p-2 ${
        fill ? "h-full" : ""
      } ${
        isToday
          ? "bg-white shadow-[0_4px_18px_rgba(42,122,110,0.16)] ring-2 ring-[var(--accent)]"
          : "bg-white/85 shadow-sm ring-1 ring-black/5"
      }`}
    >
      <header className="mb-1.5 shrink-0 border-b border-black/5 pb-1">
        <div className="flex items-baseline justify-between gap-1">
          <h2
            className={`text-sm font-bold uppercase tracking-wide ${
              isToday ? "text-[var(--accent)]" : "text-[var(--ink)]"
            }`}
          >
            {shortDay}
          </h2>
          <p className="text-xs font-medium text-[var(--muted)]">{dayMonth}</p>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto overscroll-contain">
        {entries.length === 0 ? (
          <p className="py-3 text-center text-xs text-[var(--muted)]">No plans</p>
        ) : (
          entries.map((entry) => (
            <ScheduleBlock key={entry.id} entry={entry} dense />
          ))
        )}
      </div>
    </section>
  );
}
