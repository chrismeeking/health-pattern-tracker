"use client";

import { EmployerBadge } from "@/components/EmployerBadge";
import { summariseEntry } from "@/lib/schedule/format";
import type { ScheduleEntry } from "@/lib/schedule/schema";
import { getEmployerTheme } from "@/lib/employers";

type Props = {
  entries: ScheduleEntry[];
  todayLabel: string;
};

export function TodaySummary({ entries, todayLabel }: Props) {
  if (entries.length === 0) {
    return (
      <section className="today-panel rounded-[2rem] px-8 py-8 sm:px-10 sm:py-10">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
          Today
        </p>
        <p className="mt-1 text-base text-[var(--muted)]">{todayLabel}</p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-[var(--ink)] sm:text-5xl">
          Nothing scheduled
        </h1>
        <p className="mt-3 max-w-xl text-xl text-[var(--muted)]">
          A quiet day — no work blocks on the board.
        </p>
      </section>
    );
  }

  const primary = entries[0];
  const theme = getEmployerTheme(primary.employer);
  const lines = summariseEntry(primary);
  const extra = entries.slice(1);

  return (
    <section
      className="today-panel rounded-[2rem] px-8 py-8 sm:px-10 sm:py-10"
      style={{
        borderColor: `${theme.accent}33`,
      }}
    >
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
        Today
      </p>
      <p className="mt-1 text-base text-[var(--muted)]">{todayLabel}</p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <EmployerBadge employer={primary.employer} size="lg" />
      </div>

      <div className="mt-4 space-y-1">
        {lines.slice(1).map((line, i) => (
          <p
            key={`${line}-${i}`}
            className={
              i === 0
                ? "font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-[var(--ink)] sm:text-5xl"
                : i === 1
                  ? "text-2xl font-medium text-[var(--ink)] sm:text-3xl"
                  : "text-xl text-[var(--muted)] sm:text-2xl"
            }
          >
            {line}
          </p>
        ))}
      </div>

      {extra.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2 border-t border-black/5 pt-5">
          {extra.map((entry) => {
            const extraLines = summariseEntry(entry);
            return (
              <div
                key={entry.id}
                className="rounded-2xl bg-white/70 px-4 py-3 ring-1 ring-black/5"
              >
                <EmployerBadge employer={entry.employer} size="sm" />
                <p className="mt-1.5 text-base font-medium text-[var(--ink)]">
                  {extraLines.slice(1).join(" · ")}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
