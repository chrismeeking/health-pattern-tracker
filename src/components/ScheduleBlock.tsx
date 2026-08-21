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
        className="min-w-0 flex-1 rounded-xl px-2.5 py-2.5"
        style={{
          backgroundColor: theme.bg,
          borderLeft: `4px solid ${theme.accent}`,
        }}
      >
        <p
          className="truncate text-[15px] font-bold uppercase leading-tight tracking-wide"
          style={{ color: theme.accent }}
        >
          {entry.employer}
        </p>
        {mode && (
          <p
            className="mt-0.5 truncate text-[13px] font-semibold leading-snug"
            style={{ color: theme.text }}
          >
            {mode}
          </p>
        )}
        {!entry.is_all_day && start && end && (
          <p
            className="mt-1 text-[17px] font-bold leading-snug tracking-tight"
            style={{ color: theme.text }}
          >
            {start}–{end}
          </p>
        )}
        {entry.is_all_day && (
          <p className="mt-1 text-sm font-semibold" style={{ color: theme.text }}>
            All day
          </p>
        )}
        {free && (
          <p
            className="mt-0.5 truncate text-[13px] font-medium leading-snug opacity-90"
            style={{ color: theme.text }}
          >
            {free}
          </p>
        )}
        {entry.household_note && (
          <p
            className="mt-0.5 truncate text-[12px] opacity-80"
            style={{ color: theme.text }}
          >
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
