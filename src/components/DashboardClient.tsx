"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { TodaySummary } from "@/components/TodaySummary";
import { WeekView } from "@/components/WeekView";
import { WeekNavigation } from "@/components/WeekNavigation";
import { InactivityReset } from "@/components/InactivityReset";
import {
  formatDayHeading,
  shiftWeek,
  todayDateString,
  weekStartMonday,
} from "@/lib/date";
import { groupByDate, sortEntries } from "@/lib/schedule/format";
import type { ScheduleEntry } from "@/lib/schedule/schema";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

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

  // Keep "today" accurate across midnight on a always-on kiosk
  useEffect(() => {
    const tick = () => {
      const t = todayDateString();
      setToday((prev) => (prev === t ? prev : t));
    };
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  // Poll lightly; also used when Supabase realtime is unavailable
  useEffect(() => {
    const id = setInterval(() => {
      void refresh(monday);
    }, 30_000);
    return () => clearInterval(id);
  }, [monday, refresh]);

  // Supabase realtime when configured (and not demo)
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

  const todayHeading = formatDayHeading(today);

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
    <div className="mx-auto flex min-h-full w-full max-w-[1800px] flex-col gap-6 px-5 py-5 sm:px-8 sm:py-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            Household board
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-5xl font-semibold tracking-tight text-[var(--ink)] sm:text-6xl">
            Homeboard
          </h1>
        </div>
        {demoMode && (
          <span className="rounded-xl bg-white/70 px-3 py-2 text-sm text-[var(--muted)] ring-1 ring-black/5">
            Demo data
          </span>
        )}
      </header>

      <TodaySummary
        entries={todayEntries}
        todayLabel={`${todayHeading.weekday} · ${todayHeading.dayMonth}`}
      />

      <WeekNavigation
        monday={monday}
        isCurrentWeek={isCurrentWeek}
        onPrev={goPrev}
        onNext={goNext}
        onThisWeek={goThisWeek}
      />

      {error && (
        <p className="rounded-2xl bg-[#fde8e8] px-4 py-3 text-base text-[#7a1224]">
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
