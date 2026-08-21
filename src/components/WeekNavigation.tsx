"use client";

import { formatWeekRangeLabel } from "@/lib/date";

type Props = {
  monday: string;
  isCurrentWeek: boolean;
  onPrev: () => void;
  onNext: () => void;
  onThisWeek: () => void;
};

const btn =
  "inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl bg-white/80 px-3 py-2 text-sm font-semibold text-[var(--ink)] shadow-sm ring-1 ring-black/5 active:scale-[0.98] disabled:opacity-40";

export function WeekNavigation({
  monday,
  isCurrentWeek,
  onPrev,
  onNext,
  onThisWeek,
}: Props) {
  const label = formatWeekRangeLabel(monday);

  return (
    <nav
      className="flex min-w-0 flex-1 items-center justify-end gap-1.5 sm:gap-2"
      aria-label="Week navigation"
    >
      <p className="mr-1 hidden truncate text-sm font-medium text-[var(--muted)] md:block">
        {label}
      </p>
      <button type="button" onClick={onPrev} className={btn} aria-label="Previous week">
        Prev
      </button>
      <button
        type="button"
        onClick={onThisWeek}
        disabled={isCurrentWeek}
        className={btn}
        aria-label="This week"
      >
        This week
      </button>
      <button type="button" onClick={onNext} className={btn} aria-label="Next week">
        Next
      </button>
    </nav>
  );
}
