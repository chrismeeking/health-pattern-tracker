import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '@/hooks/useAppData';
import { findById, generateId, removeById, updateById } from '@/services/storage';
import { nowISO } from '@/utils/helpers';
import {
  EXERCISE_LABELS,
  estimateCaloriesBurned,
  resolveExerciseCalories,
} from '@/utils/exercise';
import type { ExerciseType } from '@/types';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ConfirmDialog } from '@/components/ConfirmDialog';

const EXERCISE_TYPES = Object.keys(EXERCISE_LABELS) as ExerciseType[];

export function AddExercisePage() {
  const { data, activeProfile, update } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const existing = useMemo(
    () => (editId ? findById(data.exerciseEntries, editId) : undefined),
    [data.exerciseEntries, editId]
  );

  const [activity, setActivity] = useState<ExerciseType>(existing?.activity ?? 'briskWalking');
  const [durationMinutes, setDurationMinutes] = useState(
    existing?.durationMinutes?.toString() ?? '30'
  );
  const [useManualCalories, setUseManualCalories] = useState(false);
  const [manualCalories, setManualCalories] = useState(
    existing?.caloriesBurned?.toString() ?? ''
  );
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [showDelete, setShowDelete] = useState(false);

  if (!activeProfile) return null;

  const inputClass =
    'w-full px-3 py-3 rounded-xl border border-slate-200 text-base focus:outline-none focus:ring-2 focus:ring-teal-500/30 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100';

  const parsedDuration = parseInt(durationMinutes, 10);
  const estimated =
    Number.isFinite(parsedDuration) && parsedDuration > 0
      ? estimateCaloriesBurned(
          activity,
          parsedDuration,
          activeProfile.currentWeight ?? 70
        )
      : 0;

  const save = () => {
    const duration = parseInt(durationMinutes, 10);
    if (!Number.isFinite(duration) || duration <= 0) return;

    const caloriesBurned = resolveExerciseCalories(
      activity,
      duration,
      activeProfile,
      useManualCalories ? parseInt(manualCalories, 10) : undefined
    );
    if (caloriesBurned <= 0) return;

    const entry = {
      activity,
      dateTime: existing?.dateTime ?? nowISO(),
      durationMinutes: duration,
      caloriesBurned,
      notes: notes.trim() || undefined,
    };

    if (existing) {
      update((d) => ({
        ...d,
        exerciseEntries: updateById(d.exerciseEntries, existing.id, entry),
      }));
    } else {
      update((d) => ({
        ...d,
        exerciseEntries: [
          ...d.exerciseEntries,
          {
            id: generateId(),
            profileId: activeProfile.id,
            ...entry,
          },
        ],
      }));
    }
    navigate('/meals');
  };

  const remove = () => {
    if (!existing) return;
    update((d) => ({
      ...d,
      exerciseEntries: removeById(d.exerciseEntries, existing.id),
    }));
    navigate('/meals');
  };

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
        {existing ? 'Edit exercise' : 'Log exercise'}
      </h1>

      <Card className="space-y-4">
        <div>
          <label className="block text-sm text-slate-600 mb-1 dark:text-slate-400">Activity</label>
          <select
            value={activity}
            onChange={(e) => setActivity(e.target.value as ExerciseType)}
            className={inputClass}
          >
            {EXERCISE_TYPES.map((type) => (
              <option key={type} value={type}>
                {EXERCISE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-slate-600 mb-1 dark:text-slate-400">
            Duration (minutes)
          </label>
          <input
            type="number"
            min="1"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            className={inputClass}
            placeholder="e.g. 30"
          />
        </div>

        {!useManualCalories && estimated > 0 && (
          <p className="text-sm text-teal-700 bg-teal-50 rounded-xl px-3 py-2 dark:bg-teal-500/10 dark:text-teal-200">
            Estimated burn: <strong>{estimated} kcal</strong> (MET-based estimate using your
            weight — same method used by NHS activity tools)
          </p>
        )}

        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <input
            type="checkbox"
            checked={useManualCalories}
            onChange={(e) => setUseManualCalories(e.target.checked)}
            className="rounded border-slate-300"
          />
          Enter calories manually (e.g. from a watch)
        </label>

        {useManualCalories && (
          <div>
            <label className="block text-sm text-slate-600 mb-1 dark:text-slate-400">
              Calories burned
            </label>
            <input
              type="number"
              min="1"
              value={manualCalories}
              onChange={(e) => setManualCalories(e.target.value)}
              className={inputClass}
              placeholder="e.g. 250"
            />
          </div>
        )}

        <div>
          <label className="block text-sm text-slate-600 mb-1 dark:text-slate-400">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={`${inputClass} min-h-[72px]`}
            placeholder="Morning run, gym session, etc."
          />
        </div>
      </Card>

      <p className="text-xs text-slate-400 dark:text-slate-500">
        Logged exercise adds calories back to your daily budget (food target + exercise − meals
        eaten).
      </p>

      <Button fullWidth onClick={save}>
        Save
      </Button>

      {existing && (
        <Button variant="danger" fullWidth onClick={() => setShowDelete(true)}>
          Delete entry
        </Button>
      )}

      <ConfirmDialog
        open={showDelete}
        title="Delete exercise entry?"
        message="This cannot be undone."
        confirmLabel="Delete"
        onConfirm={remove}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
}
