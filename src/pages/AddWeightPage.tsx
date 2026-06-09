import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '@/hooks/useAppData';
import { findById, generateId, removeById, updateById } from '@/services/storage';
import { todayISO } from '@/utils/helpers';
import { WeightInputField } from '@/components/BodyMetricsFields';
import { getProfileMeasurementSystem } from '@/utils/measurements';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ConfirmDialog } from '@/components/ConfirmDialog';

export function AddWeightPage() {
  const { data, activeProfile, update } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const existing = useMemo(
    () => (editId ? findById(data.weightEntries, editId) : undefined),
    [data.weightEntries, editId]
  );

  const [date, setDate] = useState(existing?.date ?? todayISO());
  const [weightKg, setWeightKg] = useState<number | undefined>(existing?.weight);
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [showDelete, setShowDelete] = useState(false);

  if (!activeProfile) return null;

  const units = getProfileMeasurementSystem(activeProfile);
  const inputClass =
    'w-full px-3 py-3 rounded-xl border border-slate-200 text-base focus:outline-none focus:ring-2 focus:ring-teal-500/30';

  const save = () => {
    if (weightKg == null || weightKg <= 0) return;

    if (existing) {
      update((d) => ({
        ...d,
        weightEntries: updateById(d.weightEntries, existing.id, {
          date,
          weight: weightKg,
          notes: notes.trim() || undefined,
        }),
        profiles: d.profiles.map((p) =>
          p.id === activeProfile.id && date === todayISO()
            ? { ...p, currentWeight: weightKg }
            : p
        ),
      }));
    } else {
      update((d) => ({
        ...d,
        weightEntries: [
          ...d.weightEntries,
          {
            id: generateId(),
            profileId: activeProfile.id,
            date,
            weight: weightKg,
            notes: notes.trim() || undefined,
          },
        ],
        profiles: d.profiles.map((p) =>
          p.id === activeProfile.id && date === todayISO()
            ? { ...p, currentWeight: weightKg }
            : p
        ),
      }));
    }
    navigate('/health');
  };

  const remove = () => {
    if (!existing) return;
    update((d) => ({
      ...d,
      weightEntries: removeById(d.weightEntries, existing.id),
    }));
    navigate('/health');
  };

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-slate-800">
        {existing ? 'Edit weight' : 'Log weight'}
      </h1>

      <Card className="space-y-4">
        <div>
          <label className="block text-sm text-slate-600 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </div>

        <WeightInputField
          system={units}
          kgValue={weightKg}
          onKgChange={setWeightKg}
          inputClass={inputClass}
        />

        <div>
          <label className="block text-sm text-slate-600 mb-1">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={`${inputClass} min-h-[72px]`}
            placeholder="Morning weigh-in, after walk, etc."
          />
        </div>
      </Card>

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
        title="Delete weight entry?"
        message="This cannot be undone."
        confirmLabel="Delete"
        onConfirm={remove}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
}
