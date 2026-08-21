"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ScheduleForm } from "@/components/ScheduleForm";
import { ScheduleBlock } from "@/components/ScheduleBlock";
import { WeekBulkUpload } from "@/components/WeekBulkUpload";
import { ScheduleSuggestions } from "@/components/ScheduleSuggestions";
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
import type { SuggestedEntry } from "@/lib/schedule/suggestions";
import { getBankHolidayNote } from "@/lib/bank-holidays";

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
  const [draft, setDraft] = useState<SuggestedEntry | null>(null);
  const [bulkWeek, setBulkWeek] = useState(false);
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
      credentials: "same-origin",
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
      credentials: "same-origin",
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

  const showForm = creating || editing || !!draft;

  return (
    <div className="mx-auto flex min-h-full w-full max-w-[1400px] flex-col gap-4 px-4 py-4 sm:gap-6 sm:px-8 sm:py-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            Homeboard Admin
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--ink)] sm:text-5xl">
            Schedule
          </h1>
          {demoMode && (
            <p className="mt-1 text-sm text-[var(--muted)]">
              Running in demo mode (no Supabase credentials).
            </p>
          )}
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <Link
            href="/"
            className="touch-target flex-1 rounded-2xl bg-white px-4 py-3 text-center text-base font-medium ring-1 ring-black/10 sm:flex-none sm:px-5"
          >
            Board
          </Link>
          <button
            type="button"
            onClick={logout}
            className="touch-target flex-1 rounded-2xl bg-white px-4 py-3 text-base font-medium ring-1 ring-black/10 sm:flex-none sm:px-5"
          >
            Log out
          </button>
        </div>
      </header>

      <div className="admin-week-nav -mx-4 space-y-3 px-4 pb-3 sm:mx-0 sm:px-0">
        <p className="text-center text-base font-semibold text-[var(--ink)] sm:text-left sm:text-lg">
          {formatWeekRangeLabel(monday)}
        </p>
        <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <button
            type="button"
            className="touch-target rounded-2xl bg-white px-3 py-3 text-sm font-semibold ring-1 ring-black/10 sm:px-4 sm:text-base"
            onClick={() => setMonday(shiftWeek(monday, -1))}
          >
            Prev
          </button>
          <button
            type="button"
            className="touch-target rounded-2xl bg-white px-3 py-3 text-sm font-semibold ring-1 ring-black/10 sm:px-4 sm:text-base"
            onClick={() => setMonday(weekStartMonday(todayDateString()))}
          >
            Today
          </button>
          <button
            type="button"
            className="touch-target rounded-2xl bg-white px-3 py-3 text-sm font-semibold ring-1 ring-black/10 sm:px-4 sm:text-base"
            onClick={() => setMonday(shiftWeek(monday, 1))}
          >
            Next
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <button
            type="button"
            className="touch-target rounded-2xl bg-white px-4 py-3 text-base font-semibold ring-1 ring-black/10"
            onClick={() => {
              setEditing(null);
              setDraft(null);
              setCreating(false);
              setBulkWeek(true);
            }}
          >
            Upload week
          </button>
          <button
            type="button"
            className="touch-target rounded-2xl bg-[var(--accent)] px-4 py-3 text-base font-semibold text-white"
            onClick={() => {
              setEditing(null);
              setDraft(null);
              setBulkWeek(false);
              setCreating(true);
              setSelectedDate(today);
            }}
          >
            New entry
          </button>
        </div>
      </div>

      {message && (
        <p className="rounded-2xl bg-white px-4 py-3 text-[var(--ink)] ring-1 ring-black/5">
          {message}
        </p>
      )}

      <ScheduleSuggestions
        key={monday}
        monday={monday}
        targetEntries={entries}
        onSaved={async (msg) => {
          setMessage(msg);
          await refresh(monday);
        }}
        onEditDraft={(suggested) => {
          setBulkWeek(false);
          setEditing(null);
          setCreating(false);
          setSelectedDate(suggested.date);
          setDraft(suggested);
        }}
      />

      {bulkWeek && (
        <section className="rounded-3xl bg-[var(--panel)] p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
          <h2 className="mb-4 text-2xl font-semibold text-[var(--ink)]">
            Upload week
          </h2>
          <WeekBulkUpload
            key={monday}
            monday={monday}
            onCancel={() => setBulkWeek(false)}
            onSaved={async (count) => {
              setBulkWeek(false);
              setMessage(`Uploaded ${count} entr${count === 1 ? "y" : "ies"}`);
              await refresh(monday);
            }}
          />
        </section>
      )}

      {showForm && (
        <section className="rounded-3xl bg-[var(--panel)] p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
          <h2 className="mb-4 text-2xl font-semibold text-[var(--ink)]">
            {editing ? "Edit entry" : draft ? "Edit suggestion" : "Create entry"}
          </h2>
          <ScheduleForm
            key={
              editing?.id ??
              (draft
                ? `draft-${draft.date}-${draft.employer}-${draft.start_time}`
                : `new-${selectedDate}`)
            }
            initial={editing}
            draft={editing ? null : draft}
            defaultDate={selectedDate}
            onCancel={() => {
              setCreating(false);
              setEditing(null);
              setDraft(null);
            }}
            onSaved={async () => {
              setCreating(false);
              setEditing(null);
              setDraft(null);
              setMessage("Saved");
              await refresh(monday);
            }}
          />
        </section>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {dates.map((date) => {
          const heading = formatDayHeading(date);
          const dayEntries = byDate[date] ?? [];
          const isToday = date === today;
          const bankHoliday = getBankHolidayNote(date);
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
                  {bankHoliday ? (
                    <p className="mt-0.5 text-xs font-medium text-[var(--muted)]">
                      {bankHoliday}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="touch-target rounded-xl bg-[var(--panel)] px-3 py-2 text-sm font-medium"
                  onClick={() => {
                    setSelectedDate(date);
                    setEditing(null);
                    setDraft(null);
                    setBulkWeek(false);
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
                            setDraft(null);
                            setBulkWeek(false);
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
