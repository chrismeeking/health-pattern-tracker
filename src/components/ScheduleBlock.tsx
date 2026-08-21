import { formatTimeDisplay } from "@/lib/date";
import { getEmployerTheme, isOffDayEmployer } from "@/lib/employers";
import type { ScheduleEntry } from "@/lib/schedule/schema";

type Props = {
  entry: ScheduleEntry;
  /** Dense board layout for NCR / week columns */
  dense?: boolean;
  /** Slightly roomier compact used by admin */
  compact?: boolean;
};

function modeText(entry: ScheduleEntry): string | null {
  const off = isOffDayEmployer(entry.employer) || entry.work_mode === "Off";
  if (off) {
    return entry.employer === "Annual Leave" ? "Annual leave" : null;
  }
  if (entry.work_mode === "WFH") return "WFH";
  if (entry.work_mode === "On site") {
    return entry.location ? `On site — ${entry.location}` : "On site";
  }
  if (entry.work_mode === "Office") {
    return entry.location ? `Office — ${entry.location}` : "Office";
  }
  if (entry.work_mode === "Travelling") {
    return entry.location ? `Travelling — ${entry.location}` : "Travelling";
  }
  return entry.work_mode;
}

export function ScheduleBlock({ entry, dense = false, compact = false }: Props) {
  const theme = getEmployerTheme(entry.employer);
  const start = formatTimeDisplay(entry.start_time);
  const end = formatTimeDisplay(entry.end_time);
  const home = formatTimeDisplay(entry.expected_home_time);
  const mode = modeText(entry);
  const free =
    home == null
      ? null
      : entry.work_mode === "WFH" ||
          entry.work_mode === "Off" ||
          isOffDayEmployer(entry.employer)
        ? `Free ~${home}`
        : `Home ~${home}`;

  if (dense) {
    return (
      <article
        className="min-w-0 rounded-lg px-2 py-1.5"
        style={{
          backgroundColor: theme.bg,
          borderLeft: `3px solid ${theme.accent}`,
        }}
      >
        <p
          className="truncate text-[11px] font-bold uppercase tracking-wide"
          style={{ color: theme.accent }}
        >
          {entry.employer}
        </p>
        {mode && (
          <p className="truncate text-xs font-medium leading-snug" style={{ color: theme.text }}>
            {mode}
          </p>
        )}
        {!entry.is_all_day && start && end && (
          <p className="text-sm font-semibold leading-snug" style={{ color: theme.text }}>
            {start}–{end}
          </p>
        )}
        {entry.is_all_day && (
          <p className="text-xs font-medium" style={{ color: theme.text }}>
            All day
          </p>
        )}
        {free && (
          <p className="truncate text-[11px] leading-snug opacity-90" style={{ color: theme.text }}>
            {free}
          </p>
        )}
        {entry.household_note && (
          <p className="truncate text-[11px] opacity-80" style={{ color: theme.text }}>
            {entry.household_note}
          </p>
        )}
      </article>
    );
  }

  return (
    <article
      className={`rounded-2xl border border-black/5 shadow-sm ${compact ? "p-3" : "p-4"}`}
      style={{
        backgroundColor: theme.bg,
        borderLeftWidth: 4,
        borderLeftColor: theme.accent,
      }}
    >
      <span
        className="inline-flex items-center rounded-lg px-2.5 py-1 text-sm font-semibold tracking-wide uppercase"
        style={{ backgroundColor: theme.accent, color: theme.onAccent }}
      >
        {entry.employer}
      </span>

      {mode && (
        <p
          className={`mt-2 font-medium ${compact ? "text-base" : "text-lg"}`}
          style={{ color: theme.text }}
        >
          {mode}
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

      {free && (
        <p
          className={`mt-1 opacity-90 ${compact ? "text-sm" : "text-base"}`}
          style={{ color: theme.text }}
        >
          {free}
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
