"use client";

import { useMemo, useState } from "react";
import {
  EMPLOYERS,
  WORK_MODES,
  type WorkMode,
} from "@/lib/employers";
import { formatDayHeading, weekDatesFromMonday } from "@/lib/date";

type Row = {
  key: string;
  date: string;
  include: boolean;
  employer: string;
  work_mode: WorkMode;
  location: string;
  start_time: string;
  end_time: string;
  expected_home_time: string;
  household_note: string;
  is_all_day: boolean;
};

type Props = {
  monday: string;
  onSaved: (count: number) => void;
  onCancel: () => void;
};

const field =
  "w-full rounded-xl border-0 bg-white px-3 py-2.5 text-base text-[var(--ink)] ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-[var(--accent)]";

function defaultRow(date: string, weekdayIndex: number): Row {
  const isWeekend = weekdayIndex >= 5;
  return {
    key: `${date}-0`,
    date,
    include: !isWeekend,
    employer: isWeekend ? "Alpha" : "Post Office",
    work_mode: isWeekend ? "On site" : "WFH",
    location: "",
    start_time: isWeekend ? "08:00" : "08:30",
    end_time: isWeekend ? "16:00" : "17:00",
    expected_home_time: isWeekend ? "17:00" : "17:30",
    household_note: "",
    is_all_day: false,
  };
}

function buildInitialRows(monday: string): Row[] {
  return weekDatesFromMonday(monday).map((date, i) => defaultRow(date, i));
}

export function WeekBulkUpload({ monday, onSaved, onCancel }: Props) {
  const dates = useMemo(() => weekDatesFromMonday(monday), [monday]);
  const [rows, setRows] = useState<Row[]>(() => buildInitialRows(monday));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateRow(key: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function addExtraRow(date: string) {
    const count = rows.filter((r) => r.date === date).length;
    const weekdayIndex = dates.indexOf(date);
    const base = defaultRow(date, weekdayIndex >= 0 ? weekdayIndex : 0);
    setRows((prev) => [
      ...prev,
      {
        ...base,
        key: `${date}-${count}-${Date.now()}`,
        include: true,
        employer: "Wagamama",
        work_mode: "WFH",
        start_time: "05:00",
        end_time: "08:00",
        expected_home_time: "08:15",
        household_note: "",
      },
    ]);
  }

  function fillWeekdaysOffice() {
    setRows((prev) =>
      prev.map((r) => {
        const idx = dates.indexOf(r.date);
        if (idx < 0 || idx >= 5) return r;
        if (!r.key.endsWith("-0") && r.key.split("-").length > 2) return r;
        // only primary weekday rows
        if (!r.key.endsWith("-0")) return r;
        return {
          ...r,
          include: true,
          employer: "Post Office",
          work_mode: "WFH",
          location: "",
          start_time: "08:30",
          end_time: "17:00",
          expected_home_time: "17:30",
          is_all_day: false,
        };
      }),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = rows
      .filter((r) => r.include)
      .map((r) => ({
        date: r.date,
        employer: r.employer,
        work_mode: r.work_mode,
        location: r.location.trim() || null,
        start_time: r.is_all_day ? null : r.start_time || null,
        end_time: r.is_all_day ? null : r.end_time || null,
        expected_home_time: r.is_all_day ? null : r.expected_home_time || null,
        household_note: r.household_note.trim() || null,
        source: "manual" as const,
        source_reference: null,
        is_all_day: r.is_all_day,
        manual_override: true,
        priority: 0,
      }));

    if (payload.length === 0) {
      setError("Tick at least one day to upload.");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed");
        return;
      }
      const results = Array.isArray(data.results) ? data.results : [];
      const failed = results.filter(
        (r: { status: string }) => r.status === "error",
      );
      if (failed.length) {
        setError(`Saved with ${failed.length} error(s). Check and retry.`);
        onSaved(results.length - failed.length);
        return;
      }
      onSaved(results.length);
    } catch {
      setError("Network error — try again");
    } finally {
      setSaving(false);
    }
  }

  // Group display order by date
  const byDate = dates.map((date) => ({
    date,
    heading: formatDayHeading(date),
    rows: rows.filter((r) => r.date === date),
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[var(--muted)]">
          Fill the week below, untick days you want to skip, then upload all at once.
        </p>
        <button
          type="button"
          className="rounded-xl bg-white px-3 py-2 text-sm font-medium ring-1 ring-black/10"
          onClick={fillWeekdaysOffice}
        >
          Fill Mon–Fri Post Office WFH
        </button>
      </div>

      <div className="space-y-3">
        {byDate.map(({ date, heading, rows: dayRows }) => (
          <div
            key={date}
            className="rounded-2xl bg-white p-3 ring-1 ring-black/5 sm:p-4"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-[var(--ink)]">
                {heading.weekday}{" "}
                <span className="font-medium text-[var(--muted)]">
                  {heading.dayMonth}
                </span>
              </h3>
              <button
                type="button"
                className="rounded-xl bg-[var(--panel)] px-3 py-2 text-sm font-medium"
                onClick={() => addExtraRow(date)}
              >
                + Extra block
              </button>
            </div>

            <div className="space-y-3">
              {dayRows.map((row) => (
                <div
                  key={row.key}
                  className="grid gap-2 rounded-xl bg-[var(--panel)] p-3 sm:grid-cols-2 lg:grid-cols-6"
                >
                  <label className="flex items-center gap-2 text-sm font-semibold lg:col-span-6">
                    <input
                      type="checkbox"
                      className="size-5 accent-[var(--accent)]"
                      checked={row.include}
                      onChange={(e) =>
                        updateRow(row.key, { include: e.target.checked })
                      }
                    />
                    Include this block
                  </label>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">
                      Employer
                    </label>
                    <select
                      className={field}
                      value={row.employer}
                      disabled={!row.include}
                      onChange={(e) =>
                        updateRow(row.key, { employer: e.target.value })
                      }
                    >
                      {EMPLOYERS.map((emp) => (
                        <option key={emp} value={emp}>
                          {emp}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">
                      Mode
                    </label>
                    <select
                      className={field}
                      value={row.work_mode}
                      disabled={!row.include}
                      onChange={(e) =>
                        updateRow(row.key, {
                          work_mode: e.target.value as WorkMode,
                        })
                      }
                    >
                      {WORK_MODES.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">
                      Location
                    </label>
                    <input
                      className={field}
                      placeholder="Optional"
                      value={row.location}
                      disabled={!row.include}
                      onChange={(e) =>
                        updateRow(row.key, { location: e.target.value })
                      }
                    />
                  </div>

                  <div className="flex items-end gap-2 lg:col-span-3">
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                      <input
                        type="checkbox"
                        className="size-4 accent-[var(--accent)]"
                        checked={row.is_all_day}
                        disabled={!row.include}
                        onChange={(e) =>
                          updateRow(row.key, { is_all_day: e.target.checked })
                        }
                      />
                      All day
                    </label>
                  </div>

                  {!row.is_all_day && (
                    <>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">
                          Start
                        </label>
                        <input
                          type="time"
                          className={field}
                          value={row.start_time}
                          disabled={!row.include}
                          onChange={(e) =>
                            updateRow(row.key, { start_time: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">
                          Finish
                        </label>
                        <input
                          type="time"
                          className={field}
                          value={row.end_time}
                          disabled={!row.include}
                          onChange={(e) =>
                            updateRow(row.key, { end_time: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">
                          Home / free
                        </label>
                        <input
                          type="time"
                          className={field}
                          value={row.expected_home_time}
                          disabled={!row.include}
                          onChange={(e) =>
                            updateRow(row.key, {
                              expected_home_time: e.target.value,
                            })
                          }
                        />
                      </div>
                    </>
                  )}

                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">
                      Household note
                    </label>
                    <input
                      className={field}
                      value={row.household_note}
                      disabled={!row.include}
                      onChange={(e) =>
                        updateRow(row.key, { household_note: e.target.value })
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <p className="rounded-2xl bg-[#fde8e8] px-4 py-3 text-[#7a1224]">{error}</p>
      )}

      <div className="admin-sticky-actions flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="submit"
          disabled={saving}
          className="touch-target w-full rounded-2xl bg-[var(--accent)] px-6 py-3.5 text-lg font-semibold text-white disabled:opacity-60 sm:w-auto"
        >
          {saving ? "Uploading…" : "Upload week"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="touch-target w-full rounded-2xl bg-white px-6 py-3.5 text-lg font-medium ring-1 ring-black/10 sm:w-auto"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
