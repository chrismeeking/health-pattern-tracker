"use client";

import { useMemo, useState } from "react";
import { EMPLOYERS, WORK_MODES, SOURCES, type Employer, type WorkMode, type Source } from "@/lib/employers";
import type { ScheduleEntry } from "@/lib/schedule/schema";
import type { SuggestedEntry } from "@/lib/schedule/suggestions";
import { formatTimeDisplay } from "@/lib/date";

type Props = {
  initial?: ScheduleEntry | null;
  /** Prefill a new entry (e.g. from a suggestion) without an existing id. */
  draft?: SuggestedEntry | null;
  defaultDate: string;
  onSaved: () => void;
  onCancel: () => void;
};

type FormState = {
  id?: string;
  date: string;
  employer: string;
  work_mode: WorkMode;
  location: string;
  start_time: string;
  end_time: string;
  expected_home_time: string;
  household_note: string;
  source: Source;
  source_reference: string;
  is_all_day: boolean;
  manual_override: boolean;
};

function toForm(
  entry: ScheduleEntry | null | undefined,
  draft: SuggestedEntry | null | undefined,
  defaultDate: string,
): FormState {
  if (entry) {
    return {
      id: entry.id,
      date: entry.date,
      employer: entry.employer,
      work_mode: entry.work_mode as WorkMode,
      location: entry.location ?? "",
      start_time: formatTimeDisplay(entry.start_time) ?? "",
      end_time: formatTimeDisplay(entry.end_time) ?? "",
      expected_home_time: formatTimeDisplay(entry.expected_home_time) ?? "",
      household_note: entry.household_note ?? "",
      source: (entry.source as Source) || "manual",
      source_reference: entry.source_reference ?? "",
      is_all_day: entry.is_all_day,
      manual_override: entry.manual_override,
    };
  }
  if (draft) {
    return {
      date: draft.date || defaultDate,
      employer: draft.employer,
      work_mode: draft.work_mode as WorkMode,
      location: draft.location ?? "",
      start_time: formatTimeDisplay(draft.start_time) ?? "",
      end_time: formatTimeDisplay(draft.end_time) ?? "",
      expected_home_time: formatTimeDisplay(draft.expected_home_time) ?? "",
      household_note: draft.household_note ?? "",
      source: "manual",
      source_reference: "",
      is_all_day: draft.is_all_day,
      manual_override: true,
    };
  }
  return {
    date: defaultDate,
    employer: "Post Office",
    work_mode: "WFH",
    location: "",
    start_time: "09:00",
    end_time: "17:00",
    expected_home_time: "17:30",
    household_note: "",
    source: "manual",
    source_reference: "",
    is_all_day: false,
    manual_override: true,
  };
}

const fieldClass =
  "w-full rounded-2xl border-0 bg-white px-4 py-3.5 text-lg text-[var(--ink)] shadow-sm ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-[var(--accent)]";

const labelClass = "mb-1.5 block text-sm font-semibold text-[var(--muted)]";

export function ScheduleForm({
  initial,
  draft = null,
  defaultDate,
  onSaved,
  onCancel,
}: Props) {
  const [form, setForm] = useState<FormState>(() =>
    toForm(initial, draft, defaultDate),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const employerOptions = useMemo(() => {
    const list = [...EMPLOYERS] as string[];
    if (form.employer && !list.includes(form.employer)) {
      list.push(form.employer);
    }
    return list;
  }, [form.employer]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      id: form.id,
      date: form.date,
      employer: form.employer,
      work_mode: form.work_mode,
      location: form.location || null,
      start_time: form.is_all_day ? null : form.start_time || null,
      end_time: form.is_all_day ? null : form.end_time || null,
      expected_home_time: form.is_all_day ? null : form.expected_home_time || null,
      household_note: form.household_note || null,
      source: form.source,
      source_reference: form.source_reference || null,
      is_all_day: form.is_all_day,
      manual_override: form.manual_override,
      priority: 0,
    };

    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save");
        return;
      }
      const result = Array.isArray(data.results) ? data.results[0] : null;
      if (result?.status === "error") {
        setError(result.message ?? "Could not save");
        return;
      }
      onSaved();
    } catch {
      setError("Network error — try again");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelClass} htmlFor="date">
          Date
        </label>
        <input
          id="date"
          type="date"
          required
          className={fieldClass}
          value={form.date}
          onChange={(e) => update("date", e.target.value)}
        />
      </div>

      <div>
        <p className={labelClass}>Employer</p>
        <div className="chip-grid" role="group" aria-label="Employer">
          {employerOptions.map((e) => (
            <button
              key={e}
              type="button"
              className="chip-option"
              data-active={form.employer === e ? "true" : "false"}
              onClick={() => update("employer", e as Employer)}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className={labelClass}>Work mode</p>
        <div className="chip-grid" role="group" aria-label="Work mode">
          {WORK_MODES.map((m) => (
            <button
              key={m}
              type="button"
              className="chip-option"
              data-active={form.work_mode === m ? "true" : "false"}
              onClick={() => update("work_mode", m)}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="location">
          Location
        </label>
        <input
          id="location"
          className={fieldClass}
          placeholder="e.g. Birmingham"
          value={form.location}
          onChange={(e) => update("location", e.target.value)}
          autoComplete="off"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <label className="flex min-h-12 flex-1 items-center gap-3 rounded-2xl bg-white px-4 py-3 text-base ring-1 ring-black/10 sm:flex-none">
          <input
            type="checkbox"
            className="size-5 accent-[var(--accent)]"
            checked={form.is_all_day}
            onChange={(e) => update("is_all_day", e.target.checked)}
          />
          All day
        </label>
        <label className="flex min-h-12 flex-1 items-center gap-3 rounded-2xl bg-white px-4 py-3 text-base ring-1 ring-black/10 sm:flex-none">
          <input
            type="checkbox"
            className="size-5 accent-[var(--accent)]"
            checked={form.manual_override}
            onChange={(e) => update("manual_override", e.target.checked)}
          />
          Manual override
        </label>
      </div>

      {!form.is_all_day && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass} htmlFor="start_time">
              Start
            </label>
            <input
              id="start_time"
              type="time"
              className={fieldClass}
              value={form.start_time}
              onChange={(e) => update("start_time", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="end_time">
              Finish
            </label>
            <input
              id="end_time"
              type="time"
              className={fieldClass}
              value={form.end_time}
              onChange={(e) => update("end_time", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="expected_home_time">
              Expected home / free
            </label>
            <input
              id="expected_home_time"
              type="time"
              className={fieldClass}
              value={form.expected_home_time}
              onChange={(e) => update("expected_home_time", e.target.value)}
            />
          </div>
        </div>
      )}

      <div>
        <label className={labelClass} htmlFor="household_note">
          Household note
        </label>
        <input
          id="household_note"
          className={fieldClass}
          placeholder="Short note for Jenny — no confidential detail"
          value={form.household_note}
          onChange={(e) => update("household_note", e.target.value)}
        />
      </div>

      <details className="rounded-2xl bg-white/70 p-3 ring-1 ring-black/5 open:pb-4">
        <summary className="cursor-pointer text-sm font-semibold text-[var(--muted)]">
          Advanced (source)
        </summary>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="source">
              Source
            </label>
            <select
              id="source"
              className={fieldClass}
              value={form.source}
              onChange={(e) => update("source", e.target.value as Source)}
            >
              {SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="source_reference">
              Source reference
            </label>
            <input
              id="source_reference"
              className={fieldClass}
              placeholder="Stable id for upserts"
              value={form.source_reference}
              onChange={(e) => update("source_reference", e.target.value)}
            />
          </div>
        </div>
      </details>

      {error && (
        <p className="rounded-2xl bg-[#fde8e8] px-4 py-3 text-[#7a1224]">{error}</p>
      )}

      <div className="admin-sticky-actions flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="submit"
          disabled={saving}
          className="touch-target w-full rounded-2xl bg-[var(--accent)] px-6 py-3.5 text-lg font-semibold text-white shadow-sm active:scale-[0.98] disabled:opacity-60 sm:w-auto"
        >
          {saving ? "Saving…" : form.id ? "Update entry" : "Create entry"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="touch-target w-full rounded-2xl bg-white px-6 py-3.5 text-lg font-medium text-[var(--ink)] ring-1 ring-black/10 active:scale-[0.98] sm:w-auto"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
