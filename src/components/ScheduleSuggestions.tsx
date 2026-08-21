"use client";

import { format, parseISO } from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  formatTimeDisplay,
  todayDateString,
  weekStartMonday,
} from "@/lib/date";
import {
  dismissSuggestion,
  daySuggestionKey,
  isSuggestionDismissed,
  weekSuggestionKey,
} from "@/lib/schedule/suggestion-dismiss";
import {
  buildCopyPreviousWeek,
  buildDaySuggestions,
  buildWeekSuggestion,
  formatSuggestionLines,
  historyRangeForWeek,
  previousWeekMonday,
  suggestedToPayload,
  type DaySuggestion,
  type SuggestedEntry,
  type WeekSuggestion,
} from "@/lib/schedule/suggestions";
import type { ScheduleEntry } from "@/lib/schedule/schema";

type Props = {
  monday: string;
  targetEntries: ScheduleEntry[];
  onSaved: (message: string) => void;
  onEditDraft: (draft: SuggestedEntry) => void;
};

type PreviewState =
  | { kind: "week"; title: string; entries: SuggestedEntry[] }
  | { kind: "copy"; title: string; entries: SuggestedEntry[] }
  | { kind: "day"; title: string; entries: SuggestedEntry[] }
  | null;

async function postEntries(entries: SuggestedEntry[]): Promise<number> {
  if (entries.length === 0) return 0;
  const payload = entries.map(suggestedToPayload);
  const res = await fetch("/api/schedule", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(payload.length === 1 ? payload[0] : payload),
  });
  if (!res.ok) throw new Error("save failed");
  const data = (await res.json()) as {
    results?: { status: string }[];
  };
  const created =
    data.results?.filter((r) => r.status === "created" || r.status === "updated")
      .length ?? entries.length;
  return created;
}

function EntryPreviewList({ entries }: { entries: SuggestedEntry[] }) {
  return (
    <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto text-sm sm:text-base">
      {entries.map((e, i) => {
        const day = format(parseISO(`${e.date}T12:00:00`), "EEE d MMM");
        const hours = e.is_all_day
          ? "All day"
          : [formatTimeDisplay(e.start_time), formatTimeDisplay(e.end_time)]
              .filter(Boolean)
              .join("–");
        return (
          <li
            key={`${e.date}-${e.employer}-${e.start_time}-${i}`}
            className="rounded-xl bg-white/80 px-3 py-2 ring-1 ring-black/5"
          >
            <span className="font-semibold text-[var(--ink)]">{day}</span>
            {" · "}
            <span className="font-medium">{e.employer}</span>
            {" · "}
            <span className="text-[var(--muted)]">
              {e.work_mode}
              {hours ? ` ${hours}` : ""}
              {e.location ? ` — ${e.location}` : ""}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function ScheduleSuggestions({
  monday,
  targetEntries,
  onSaved,
  onEditDraft,
}: Props) {
  const [history, setHistory] = useState<ScheduleEntry[]>([]);
  const [prevWeek, setPrevWeek] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissTick, setDismissTick] = useState(0);
  const [preview, setPreview] = useState<PreviewState>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const todayMonday = weekStartMonday(todayDateString());
  const isCurrentOrFuture = monday >= todayMonday;

  const loadHistory = useCallback(async () => {
    setError(null);
    try {
      const { from, to } = historyRangeForWeek(monday);
      const prevMon = previousWeekMonday(monday);
      const [histRes, prevRes] = await Promise.all([
        fetch(`/api/schedule?from=${from}&to=${to}`, { cache: "no-store" }),
        fetch(`/api/schedule?week=${prevMon}`, { cache: "no-store" }),
      ]);
      if (histRes.ok) {
        const data = (await histRes.json()) as { entries: ScheduleEntry[] };
        setHistory(data.entries);
      } else {
        setHistory([]);
      }
      if (prevRes.ok) {
        const data = (await prevRes.json()) as { entries: ScheduleEntry[] };
        setPrevWeek(data.entries);
      } else {
        setPrevWeek([]);
      }
    } catch {
      setHistory([]);
      setPrevWeek([]);
    } finally {
      setLoading(false);
    }
  }, [monday]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await loadHistory();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [loadHistory]);

  const daySuggestions = useMemo(() => {
    if (!isCurrentOrFuture) return [] as DaySuggestion[];
    void dismissTick;
    return buildDaySuggestions(monday, targetEntries, history).filter(
      (d) =>
        !isSuggestionDismissed(
          monday,
          daySuggestionKey(d.date, d.patternKey),
        ),
    );
  }, [monday, targetEntries, history, isCurrentOrFuture, dismissTick]);

  const weekSuggestion = useMemo(() => {
    if (!isCurrentOrFuture) return null as WeekSuggestion | null;
    void dismissTick;
    if (isSuggestionDismissed(monday, weekSuggestionKey())) return null;
    return buildWeekSuggestion(monday, targetEntries, history, todayMonday);
  }, [
    monday,
    targetEntries,
    history,
    todayMonday,
    isCurrentOrFuture,
    dismissTick,
  ]);

  const copyCandidates = useMemo(
    () => buildCopyPreviousWeek(monday, prevWeek, targetEntries),
    [monday, prevWeek, targetEntries],
  );

  function bumpDismiss() {
    setDismissTick((n) => n + 1);
  }

  async function commitPreview() {
    if (!preview || preview.entries.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const n = await postEntries(preview.entries);
      setPreview(null);
      onSaved(`Added ${n} suggested entr${n === 1 ? "y" : "ies"}`);
    } catch {
      setError("Could not save suggestions. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function addDay(suggestion: DaySuggestion) {
    setPreview({
      kind: "day",
      title: `Add suggested ${suggestion.weekday}`,
      entries: suggestion.entries,
    });
  }

  if (!isCurrentOrFuture && copyCandidates.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4 rounded-3xl bg-[var(--panel)] p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            Suggestions
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--ink)]">
            From your recent weeks
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Nothing is saved until you confirm. Leave and personal days are not
            auto-suggested.
          </p>
        </div>
        <button
          type="button"
          className="touch-target rounded-2xl bg-white px-4 py-3 text-sm font-semibold ring-1 ring-black/10"
          disabled={copyCandidates.length === 0}
          onClick={() =>
            setPreview({
              kind: "copy",
              title: "Copy previous week",
              entries: copyCandidates,
            })
          }
        >
          Copy previous week
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--muted)]">Looking at recent weeks…</p>
      ) : null}

      {error ? (
        <p className="rounded-2xl bg-[#fde8e8] px-4 py-3 text-sm text-[#7a1224]">
          {error}
        </p>
      ) : null}

      {preview ? (
        <div className="rounded-2xl bg-white p-4 ring-1 ring-black/10">
          <h3 className="text-lg font-semibold text-[var(--ink)]">
            {preview.title}
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Review these {preview.entries.length} entr
            {preview.entries.length === 1 ? "y" : "ies"} before saving. Existing
            matching plans are skipped.
          </p>
          <EntryPreviewList entries={preview.entries} />
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={saving || preview.entries.length === 0}
              className="touch-target rounded-2xl bg-[var(--accent)] px-5 py-3 text-base font-semibold text-white disabled:opacity-50"
              onClick={() => void commitPreview()}
            >
              {saving ? "Saving…" : "Confirm & save"}
            </button>
            {preview.kind === "week" || preview.kind === "copy" ? (
              <button
                type="button"
                className="touch-target rounded-2xl bg-white px-5 py-3 text-base font-semibold ring-1 ring-black/10"
                onClick={() => {
                  if (preview.entries[0]) onEditDraft(preview.entries[0]);
                }}
              >
                Edit first
              </button>
            ) : null}
            <button
              type="button"
              className="touch-target rounded-2xl bg-white px-5 py-3 text-base font-semibold ring-1 ring-black/10"
              onClick={() => setPreview(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {!preview && weekSuggestion ? (
        <div className="rounded-2xl bg-white p-4 ring-1 ring-black/10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
            {weekSuggestion.title}
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {weekSuggestion.reason}
          </p>
          <p className="mt-3 text-sm font-semibold text-[var(--ink)]">
            Your recent schedule suggests:
          </p>
          <ul className="mt-2 space-y-1">
            {weekSuggestion.dayLines.map((line) => (
              <li key={line.date} className="text-base text-[var(--ink)]">
                <span className="font-bold">{line.weekday}</span>
                {" — "}
                {line.text}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="touch-target rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white"
              onClick={() =>
                setPreview({
                  kind: "week",
                  title: "Add suggested week",
                  entries: weekSuggestion.entries,
                })
              }
            >
              Add all
            </button>
            <button
              type="button"
              className="touch-target rounded-2xl bg-white px-4 py-3 text-sm font-semibold ring-1 ring-black/10"
              onClick={() =>
                setPreview({
                  kind: "week",
                  title: "Review & edit suggested week",
                  entries: weekSuggestion.entries,
                })
              }
            >
              Review & edit
            </button>
            <button
              type="button"
              className="touch-target rounded-2xl bg-white px-4 py-3 text-sm font-semibold ring-1 ring-black/10"
              onClick={() => {
                dismissSuggestion(monday, weekSuggestionKey());
                bumpDismiss();
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      {!preview &&
        !weekSuggestion &&
        daySuggestions.map((suggestion) => {
          const lines = formatSuggestionLines(suggestion.entries);
          return (
            <div
              key={`${suggestion.date}-${suggestion.patternKey}`}
              className="rounded-2xl bg-white p-4 ring-1 ring-black/10"
            >
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
                Suggested for {suggestion.weekday}
              </p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {suggestion.reason}
              </p>
              <p className="mt-3 text-sm font-semibold text-[var(--muted)]">
                You usually work:
              </p>
              <div className="mt-1 space-y-0.5">
                {lines.map((line, i) => (
                  <p
                    key={`${line}-${i}`}
                    className={
                      i === 0
                        ? "text-xl font-bold uppercase tracking-tight text-[var(--ink)]"
                        : "text-base font-medium text-[var(--ink)]"
                    }
                  >
                    {line}
                  </p>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="touch-target rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white"
                  onClick={() => void addDay(suggestion)}
                >
                  Add
                </button>
                <button
                  type="button"
                  className="touch-target rounded-2xl bg-white px-4 py-3 text-sm font-semibold ring-1 ring-black/10"
                  onClick={() => onEditDraft(suggestion.entries[0])}
                >
                  Edit first
                </button>
                <button
                  type="button"
                  className="touch-target rounded-2xl bg-white px-4 py-3 text-sm font-semibold ring-1 ring-black/10"
                  onClick={() => {
                    dismissSuggestion(
                      monday,
                      daySuggestionKey(
                        suggestion.date,
                        suggestion.patternKey,
                      ),
                    );
                    bumpDismiss();
                  }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          );
        })}

      {!loading &&
      !preview &&
      !weekSuggestion &&
      daySuggestions.length === 0 &&
      copyCandidates.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">
          No repeating patterns spotted for this week yet. Use Copy previous
          week once you have a week to clone.
        </p>
      ) : null}

      {!loading &&
      !preview &&
      !weekSuggestion &&
      daySuggestions.length === 0 &&
      copyCandidates.length > 0 &&
      isCurrentOrFuture ? (
        <p className="text-sm text-[var(--muted)]">
          No strong repeating patterns for empty days — you can still copy last
          week.
        </p>
      ) : null}
    </section>
  );
}
