"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { TodaySummary } from "@/components/TodaySummary";
import { WeekView } from "@/components/WeekView";
import { WeekNavigation } from "@/components/WeekNavigation";
import { InactivityReset } from "@/components/InactivityReset";
import {
  shiftWeek,
  todayDateString,
  weekStartMonday,
} from "@/lib/date";
import { groupByDate, sortEntries } from "@/lib/schedule/format";
import type { ScheduleEntry } from "@/lib/schedule/schema";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { format, parseISO } from "date-fns";

type Props = {
  initialMonday: string;
  initialToday: string;
  initialEntries: ScheduleEntry[];
  demoMode: boolean;
  inactivityMs: number;
};

async function fetchWeek(monday: string): Promise<ScheduleEntry[]> {
  const res = await fetch(`/api/schedule?week=${monday}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to refresh schedule");
  const data = (await res.json()) as { entries: ScheduleEntry[] };
  return data.entries;
}

function todayStripLabel(dateStr: string): string {
  const d = parseISO(`${dateStr}T12:00:00`);
  return format(d, "EEE d MMM").toUpperCase();
}

export function DashboardClient({
  initialMonday,
  initialToday,
  initialEntries,
  demoMode,
  inactivityMs,
}: Props) {
  const [monday, setMonday] = useState(initialMonday);
  const [today, setToday] = useState(initialToday);
  const [entries, setEntries] = useState(initialEntries);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const currentMonday = weekStartMonday(today);
  const isCurrentWeek = monday === currentMonday;

  const refresh = useCallback(async (weekMonday: string) => {
    try {
      const next = await fetchWeek(weekMonday);
      startTransition(() => {
        setEntries(next);
        setError(null);
      });
    } catch {
      setError("Couldn’t refresh the board. Showing the last known schedule.");
    }
  }, []);

  useEffect(() => {
    const tick = () => {
      const t = todayDateString();
      setToday((prev) => (prev === t ? prev : t));
    };
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      void refresh(monday);
    }, 30_000);
    return () => clearInterval(id);
  }, [monday, refresh]);

  useEffect(() => {
    if (demoMode || !isSupabaseConfigured()) return;

    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null =
      null;
    try {
      const supabase = createClient();
      channel = supabase
        .channel("schedule-changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "schedule_entries" },
          () => {
            void refresh(monday);
          },
        )
        .subscribe();
    } catch (err) {
      console.error("[realtime]", err);
    }

    return () => {
      if (channel) {
        void createClient().removeChannel(channel);
      }
    };
  }, [demoMode, monday, refresh]);

  const todayEntries = useMemo(() => {
    const byDate = groupByDate(entries);
    return sortEntries(byDate[today] ?? []);
  }, [entries, today]);

  const goPrev = () => {
    const next = shiftWeek(monday, -1);
    setMonday(next);
    void refresh(next);
  };
  const goNext = () => {
    const next = shiftWeek(monday, 1);
    setMonday(next);
    void refresh(next);
  };
  const goThisWeek = () => {
    const next = weekStartMonday(todayDateString());
    setMonday(next);
    void refresh(next);
  };

  return (
    <div className="board-shell mx-auto flex h-dvh max-h-dvh w-full max-w-[1400px] flex-col gap-2 overflow-hidden px-2.5 py-2 sm:px-3 sm:py-2.5">
      <header className="flex shrink-0 items-center gap-2">
        <div className="flex min-w-0 items-baseline gap-2">
          <h1 className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-[var(--ink)] sm:text-2xl">
            Homeboard
          </h1>
          {demoMode && (
            <span className="rounded-md bg-white/70 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--muted)] ring-1 ring-black/5">
              Demo
            </span>
          )}
        </div>
        <WeekNavigation
          monday={monday}
          isCurrentWeek={isCurrentWeek}
          onPrev={goPrev}
          onNext={goNext}
          onThisWeek={goThisWeek}
        />
      </header>

      <TodaySummary
        entries={todayEntries}
        todayShortLabel={todayStripLabel(today)}
      />

      {error && (
        <p className="shrink-0 rounded-xl bg-[#fde8e8] px-3 py-1.5 text-sm text-[#7a1224]">
          {error}
        </p>
      )}

      <WeekView monday={monday} today={today} entries={entries} />

      <InactivityReset
        timeoutMs={inactivityMs}
        enabled={!isCurrentWeek}
        onReset={goThisWeek}
      />
    </div>
  );
}
