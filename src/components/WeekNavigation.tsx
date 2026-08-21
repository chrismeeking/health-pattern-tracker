"use client";

import Link from "next/link";
import { formatWeekRangeLabel } from "@/lib/date";

type Props = {
  monday: string;
  isCurrentWeek: boolean;
  onPrev: () => void;
  onNext: () => void;
  onThisWeek: () => void;
};

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
      className="flex flex-wrap items-center justify-between gap-3"
      aria-label="Week navigation"
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          className="touch-target rounded-2xl bg-white/70 px-5 py-3 text-base font-medium text-[var(--ink)] shadow-sm ring-1 ring-black/5 active:scale-[0.98]"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={onThisWeek}
          disabled={isCurrentWeek}
          className="touch-target rounded-2xl bg-white/70 px-5 py-3 text-base font-medium text-[var(--ink)] shadow-sm ring-1 ring-black/5 enabled:active:scale-[0.98] disabled:opacity-40"
        >
          This week
        </button>
        <button
          type="button"
          onClick={onNext}
          className="touch-target rounded-2xl bg-white/70 px-5 py-3 text-base font-medium text-[var(--ink)] shadow-sm ring-1 ring-black/5 active:scale-[0.98]"
        >
          Next
        </button>
      </div>

      <p className="text-lg font-medium text-[var(--ink)]">{label}</p>

      <Link
        href="/admin"
        className="touch-target rounded-2xl px-4 py-3 text-sm font-medium text-[var(--muted)] underline-offset-4 hover:underline"
      >
        Admin
      </Link>
    </nav>
  );
}
