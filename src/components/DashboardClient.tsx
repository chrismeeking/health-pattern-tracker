"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { TodaySummary } from "@/components/TodaySummary";
import { WeekView } from "@/components/WeekView";
import { WeekNavigation } from "@/components/WeekNavigation";
import { NowStatusView } from "@/components/NowStatusView";
import { InactivityReset } from "@/components/InactivityReset";
import {
  shiftWeek,
  todayDateString,
  weekStartMonday,
} from "@/lib/date";
import { groupByDate, sortEntries } from "@/lib/schedule/format";
import {
  deriveNowStatus,
  tomorrowIsoDate,
} from "@/lib/schedule/now-status";
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

type BoardView = "week" | "now";

const WEEK_MS = 15_000;
const NOW_MS = 10_000;
const PAUSE_MS = 60_000;

async function fetchWeek(monday: string): Promise<ScheduleEntry[]> {
  const res = await fetch(`/api/schedule?week=${monday}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to refresh schedule");
  const data = (await res.json()) as { entries: ScheduleEntry[] };
  return data.entries;
}

async function fetchDay(date: string): Promise<ScheduleEntry[]> {
  const res = await fetch(`/api/schedule?from=${date}&to=${date}`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
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
  const [tomorrowEntries, setTomorrowEntries] = useState<ScheduleEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [boardView, setBoardView] = useState<BoardView>("week");
  const [rotationPaused, setRotationPaused] = useState(false);
  const [nowTick, setNowTick] = useState(0);
  const [, startTransition] = useTransition();
  const pauseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const refreshTomorrow = useCallback(async () => {
    const date = tomorrowIsoDate();
    try {
      const next = await fetchDay(date);
      startTransition(() => setTomorrowEntries(next));
    } catch {
      // Non-fatal for NOW view
    }
  }, []);

  useEffect(() => {
    const tick = () => {
      const t = todayDateString();
      setToday((prev) => (prev === t ? prev : t));
      setNowTick((n) => n + 1);
    };
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      void refresh(monday);
      if (weekStartMonday(todayDateString()) === monday) {
        void refreshTomorrow();
      }
    }, 30_000);
    return () => clearInterval(id);
  }, [monday, refresh, refreshTomorrow]);

  useEffect(() => {
    void refreshTomorrow();
  }, [today, refreshTomorrow]);

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
            void refreshTomorrow();
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
  }, [demoMode, monday, refresh, refreshTomorrow]);

  const pauseRotation = useCallback(() => {
    setRotationPaused(true);
    if (pauseTimer.current) clearTimeout(pauseTimer.current);
    pauseTimer.current = setTimeout(() => {
      setRotationPaused(false);
    }, PAUSE_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (pauseTimer.current) clearTimeout(pauseTimer.current);
    };
  }, []);

  // Auto-rotate only on the current week, when not paused
  useEffect(() => {
    if (!isCurrentWeek || rotationPaused) return;

    const delay = boardView === "week" ? WEEK_MS : NOW_MS;
    const id = setTimeout(() => {
      setBoardView((v) => (v === "week" ? "now" : "week"));
    }, delay);
    return () => clearTimeout(id);
  }, [boardView, isCurrentWeek, rotationPaused, nowTick]);

  const todayEntries = useMemo(() => {
    const byDate = groupByDate(entries);
    return sortEntries(byDate[today] ?? []);
  }, [entries, today]);

  const nowStatus = useMemo(
    () => deriveNowStatus(todayEntries, tomorrowEntries),
    // nowTick forces recompute as London time advances
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [todayEntries, tomorrowEntries, nowTick],
  );

  const goPrev = () => {
    pauseRotation();
    setBoardView("week");
    const next = shiftWeek(monday, -1);
    setMonday(next);
    void refresh(next);
  };
  const goNext = () => {
    pauseRotation();
    setBoardView("week");
    const next = shiftWeek(monday, 1);
    setMonday(next);
    void refresh(next);
  };
  const goThisWeek = () => {
    pauseRotation();
    const next = weekStartMonday(todayDateString());
    setMonday(next);
    void refresh(next);
  };

  const showNow = isCurrentWeek && boardView === "now";

  return (
    <div
      className="board-shell mx-auto flex h-dvh max-h-dvh w-full max-w-[1400px] flex-col gap-2 overflow-hidden px-2.5 py-2 sm:px-3 sm:py-2.5"
      onPointerDown={pauseRotation}
    >
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

      {error && (
        <p className="shrink-0 rounded-xl bg-[#fde8e8] px-3 py-1.5 text-sm text-[#7a1224]">
          {error}
        </p>
      )}

      <div className="relative min-h-0 flex-1">
        <div
          className={`absolute inset-0 flex flex-col gap-2 transition-opacity duration-500 ease-out ${
            showNow ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
          aria-hidden={showNow}
        >
          <TodaySummary
            entries={todayEntries}
            todayShortLabel={todayStripLabel(today)}
          />
          <WeekView monday={monday} today={today} entries={entries} />
        </div>

        <div
          className={`absolute inset-0 transition-opacity duration-500 ease-out ${
            showNow ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          aria-hidden={!showNow}
        >
          <NowStatusView status={nowStatus} />
        </div>
      </div>

      <InactivityReset
        timeoutMs={inactivityMs}
        enabled={!isCurrentWeek}
        onReset={goThisWeek}
      />
    </div>
  );
}
