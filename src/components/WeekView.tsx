"use client";

import { DayCard } from "@/components/DayCard";
import { ScheduleBlock } from "@/components/ScheduleBlock";
import { formatDayHeading, weekDatesFromMonday } from "@/lib/date";
import { groupByDate } from "@/lib/schedule/format";
import type { ScheduleEntry } from "@/lib/schedule/schema";

type Props = {
  monday: string;
  today: string;
  entries: ScheduleEntry[];
};

export function WeekView({ monday, today, entries }: Props) {
  const dates = weekDatesFromMonday(monday);
  const weekdays = dates.slice(0, 5);
  const weekend = dates.slice(5);
  const byDate = groupByDate(entries);

  const weekendEntries = weekend.flatMap((date) =>
    (byDate[date] ?? []).map((entry) => ({ date, entry })),
  );
  const showWeekend = weekendEntries.length > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-5">
        {weekdays.map((date) => (
          <DayCard
            key={date}
            date={date}
            entries={byDate[date] ?? []}
            isToday={date === today}
            fill
          />
        ))}
      </div>

      {showWeekend && (
        <section className="shrink-0 overflow-hidden rounded-2xl bg-white/80 px-2.5 py-2 ring-1 ring-black/5">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
            Weekend
          </p>
          <div className="flex flex-wrap gap-2">
            {weekend.map((date) => {
              const dayEntries = byDate[date] ?? [];
              if (dayEntries.length === 0) return null;
              const { weekday, dayMonth } = formatDayHeading(date);
              return (
                <div
                  key={date}
                  className={`min-w-[10rem] flex-1 rounded-xl p-2 ${
                    date === today
                      ? "bg-white ring-2 ring-[var(--accent)]"
                      : "bg-[var(--panel)]"
                  }`}
                >
                  <p className="mb-1 text-xs font-bold uppercase text-[var(--ink)]">
                    {weekday.slice(0, 3)}{" "}
                    <span className="font-medium text-[var(--muted)]">{dayMonth}</span>
                  </p>
                  <div className="flex flex-col gap-1">
                    {dayEntries.map((entry) => (
                      <ScheduleBlock key={entry.id} entry={entry} dense />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
