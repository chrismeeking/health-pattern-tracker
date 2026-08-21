"use client";

import { DayCard } from "@/components/DayCard";
import { weekDatesFromMonday } from "@/lib/date";
import { groupByDate } from "@/lib/schedule/format";
import type { ScheduleEntry } from "@/lib/schedule/schema";

type Props = {
  monday: string;
  today: string;
  entries: ScheduleEntry[];
};

export function WeekView({ monday, today, entries }: Props) {
  const dates = weekDatesFromMonday(monday);
  const byDate = groupByDate(entries);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      {dates.map((date) => (
        <DayCard
          key={date}
          date={date}
          entries={byDate[date] ?? []}
          isToday={date === today}
        />
      ))}
    </div>
  );
}
