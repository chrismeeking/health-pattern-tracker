"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ScheduleForm } from "@/components/ScheduleForm";
import { ScheduleBlock } from "@/components/ScheduleBlock";
import {
  formatDayHeading,
  formatWeekRangeLabel,
  shiftWeek,
  todayDateString,
  weekDatesFromMonday,
  weekStartMonday,
} from "@/lib/date";
import { groupByDate } from "@/lib/schedule/format";
import type { ScheduleEntry } from "@/lib/schedule/schema";

type Props = {
  initialMonday: string;
  initialToday: string;
  initialEntries: ScheduleEntry[];
  demoMode: boolean;
};

export function AdminClient({
  initialMonday,
  initialToday,
  initialEntries,
  demoMode,
}: Props) {
  const router = useRouter();
  const [monday, setMonday] = useState(initialMonday);
  const [today] = useState(initialToday);
  const [entries, setEntries] = useState(initialEntries);
  const [editing, setEditing] = useState<ScheduleEntry | null>(null);
  const [creating, setCreating] = useState(false);
  const [selectedDate, setSelectedDate] = useState(initialToday);
  const [message, setMessage] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const refresh = useCallback(async (weekMonday: string) => {
    const res = await fetch(`/api/schedule?week=${weekMonday}`, { cache: "no-store" });
    if (!res.ok) throw new Error("refresh failed");
    const data = (await res.json()) as { entries: ScheduleEntry[] };
    startTransition(() => setEntries(data.entries));
  }, []);

  useEffect(() => {
    void refresh(monday);
  }, [monday, refresh]);

  const byDate = useMemo(() => groupByDate(entries), [entries]);
  const dates = weekDatesFromMonday(monday);

  async function handleDelete(id: string) {
    if (!confirm("Delete this entry?")) return;
    const res = await fetch("/api/schedule", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      setMessage("Could not delete entry");
      return;
    }
    setMessage("Deleted");
    setEditing(null);
    await refresh(monday);
  }

  async function handleDuplicate(entry: ScheduleEntry) {
    const res = await fetch("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: entry.date,
        employer: entry.employer,
        work_mode: entry.work_mode,
        location: entry.location,
        start_time: entry.start_time,
        end_time: entry.end_time,
        expected_home_time: entry.expected_home_time,
        household_note: entry.household_note,
        source: "manual",
        source_reference: null,
        is_all_day: entry.is_all_day,
        manual_override: true,
        priority: entry.priority,
      }),
    });
    if (!res.ok) {
      setMessage("Could not duplicate");
      return;
    }
    setMessage("Duplicated");
    await refresh(monday);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  const showForm = creating || editing;

  return (
    <div className="mx-auto flex min-h-full w-full max-w-[1400px] flex-col gap-6 px-5 py-5 sm:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            Manage
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold text-[var(--ink)] sm:text-5xl">
            Schedule
          </h1>
          {demoMode && (
            <p className="mt-1 text-sm text-[var(--muted)]">
              Running in demo mode (no Supabase credentials).
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/"
            className="touch-target rounded-2xl bg-white px-5 py-3 text-base font-medium ring-1 ring-black/10"
          >
            Board
          </Link>
          <button
            type="button"
            onClick={logout}
            className="touch-target rounded-2xl bg-white px-5 py-3 text-base font-medium ring-1 ring-black/10"
          >
            Log out
          </button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="touch-target rounded-2xl bg-white px-4 py-3 ring-1 ring-black/10"
          onClick={() => setMonday(shiftWeek(monday, -1))}
        >
          Previous
        </button>
        <button
          type="button"
          className="touch-target rounded-2xl bg-white px-4 py-3 ring-1 ring-black/10"
          onClick={() => setMonday(weekStartMonday(todayDateString()))}
        >
          This week
        </button>
        <button
          type="button"
          className="touch-target rounded-2xl bg-white px-4 py-3 ring-1 ring-black/10"
          onClick={() => setMonday(shiftWeek(monday, 1))}
        >
          Next
        </button>
        <p className="ml-2 text-lg font-medium text-[var(--ink)]">
          {formatWeekRangeLabel(monday)}
        </p>
        <button
          type="button"
          className="touch-target ml-auto rounded-2xl bg-[var(--accent)] px-5 py-3 text-base font-semibold text-white"
          onClick={() => {
            setEditing(null);
            setCreating(true);
            setSelectedDate(today);
          }}
        >
          New entry
        </button>
      </div>

      {message && (
        <p className="rounded-2xl bg-white px-4 py-3 text-[var(--ink)] ring-1 ring-black/5">
          {message}
        </p>
      )}

      {showForm && (
        <section className="rounded-3xl bg-[var(--panel)] p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
          <h2 className="mb-4 text-2xl font-semibold text-[var(--ink)]">
            {editing ? "Edit entry" : "Create entry"}
          </h2>
          <ScheduleForm
            key={editing?.id ?? `new-${selectedDate}`}
            initial={editing}
            defaultDate={selectedDate}
            onCancel={() => {
              setCreating(false);
              setEditing(null);
            }}
            onSaved={async () => {
              setCreating(false);
              setEditing(null);
              setMessage("Saved");
              await refresh(monday);
            }}
          />
        </section>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {dates.map((date) => {
          const heading = formatDayHeading(date);
          const dayEntries = byDate[date] ?? [];
          const isToday = date === today;
          return (
            <section
              key={date}
              className={`rounded-3xl bg-white p-4 shadow-sm ring-1 ${
                isToday ? "ring-[var(--accent)]" : "ring-black/5"
              }`}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                    {heading.weekday}
                  </p>
                  <h3 className="text-xl font-semibold text-[var(--ink)]">
                    {heading.dayMonth}
                  </h3>
                </div>
                <button
                  type="button"
                  className="touch-target rounded-xl bg-[var(--panel)] px-3 py-2 text-sm font-medium"
                  onClick={() => {
                    setSelectedDate(date);
                    setEditing(null);
                    setCreating(true);
                  }}
                >
                  Add
                </button>
              </div>

              <div className="space-y-2">
                {dayEntries.length === 0 ? (
                  <p className="py-6 text-center text-[var(--muted)]">No plans</p>
                ) : (
                  dayEntries.map((entry) => (
                    <div key={entry.id} className="space-y-2">
                      <ScheduleBlock entry={entry} compact />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="rounded-xl bg-[var(--panel)] px-3 py-2 text-sm font-medium"
                          onClick={() => {
                            setCreating(false);
                            setEditing(entry);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="rounded-xl bg-[var(--panel)] px-3 py-2 text-sm font-medium"
                          onClick={() => void handleDuplicate(entry)}
                        >
                          Duplicate
                        </button>
                        <button
                          type="button"
                          className="rounded-xl bg-[#fde8e8] px-3 py-2 text-sm font-medium text-[#7a1224]"
                          onClick={() => void handleDelete(entry.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
