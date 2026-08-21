import { EmployerBadge } from "@/components/EmployerBadge";
import { formatTimeDisplay } from "@/lib/date";
import { getEmployerTheme, isOffDayEmployer } from "@/lib/employers";
import type { ScheduleEntry } from "@/lib/schedule/schema";

type Props = {
  entry: ScheduleEntry;
  compact?: boolean;
};

export function ScheduleBlock({ entry, compact = false }: Props) {
  const theme = getEmployerTheme(entry.employer);
  const start = formatTimeDisplay(entry.start_time);
  const end = formatTimeDisplay(entry.end_time);
  const home = formatTimeDisplay(entry.expected_home_time);
  const off = isOffDayEmployer(entry.employer) || entry.work_mode === "Off";

  return (
    <article
      className={`rounded-2xl border border-black/5 p-3.5 shadow-sm ${compact ? "p-3" : "p-4"}`}
      style={{
        backgroundColor: theme.bg,
        borderLeftWidth: 4,
        borderLeftColor: theme.accent,
      }}
    >
      <div className="mb-2">
        <EmployerBadge employer={entry.employer} />
      </div>

      {!off && (
        <p
          className={`font-medium ${compact ? "text-base" : "text-lg"}`}
          style={{ color: theme.text }}
        >
          {entry.work_mode === "WFH" && "WFH"}
          {entry.work_mode === "On site" &&
            (entry.location ? `On site — ${entry.location}` : "On site")}
          {entry.work_mode === "Office" &&
            (entry.location ? `Office — ${entry.location}` : "Office")}
          {entry.work_mode === "Travelling" &&
            (entry.location ? `Travelling — ${entry.location}` : "Travelling")}
        </p>
      )}

      {off && entry.employer === "Annual Leave" && (
        <p className="text-lg font-medium" style={{ color: theme.text }}>
          Annual leave
        </p>
      )}

      {!entry.is_all_day && start && end && (
        <p
          className={`mt-1 font-semibold tracking-tight ${compact ? "text-lg" : "text-xl"}`}
          style={{ color: theme.text }}
        >
          {start}–{end}
        </p>
      )}

      {home && (
        <p className={`mt-1 opacity-90 ${compact ? "text-sm" : "text-base"}`} style={{ color: theme.text }}>
          {entry.work_mode === "WFH" || off
            ? `Free around ${home}`
            : `Home around ${home}`}
        </p>
      )}

      {entry.household_note && (
        <p
          className={`mt-2 opacity-80 ${compact ? "text-sm" : "text-base"}`}
          style={{ color: theme.text }}
        >
          {entry.household_note}
        </p>
      )}
    </article>
  );
}
