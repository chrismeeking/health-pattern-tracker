import { useEffect, useState } from 'react';
import type { Meal, MealSource, MealType, PortionSize, TriggerTag } from '@/types';
import { MEAL_SOURCE_LABELS, MEAL_TYPE_LABELS, PORTION_SIZE_LABELS } from '@/types';
import { TriggerTagSelector } from './TriggerTagSelector';
import { Button } from './Button';
import { RiskCard } from './RiskCard';

export type MealFormValues = {
  mealName: string;
  mealType: MealType;
  source: MealSource;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
  sugar: number;
  salt: number;
  portionSize: PortionSize;
  triggerTags: TriggerTag[];
  notes: string;
};

interface MealFormProps {
  initial?: Partial<MealFormValues>;
  submitLabel?: string;
  onSubmit: (values: MealFormValues) => void;
  onCancel?: () => void;
  onValuesChange?: (values: MealFormValues) => void;
  riskAssessment?: import('@/types').RiskAssessment | null;
  /** When set, merges into the form (e.g. after AI apply). */
  appliedValues?: Partial<MealFormValues> | null;
  showAiEstimateBanner?: boolean;
}

const defaults: MealFormValues = {
  mealName: '',
  mealType: 'lunch',
  source: 'unknown',
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  fibre: 0,
  sugar: 0,
  salt: 0,
  portionSize: 'normal',
  triggerTags: [],
  notes: '',
};

export function mealToFormValues(meal: Meal): MealFormValues {
  return {
    mealName: meal.mealName,
    mealType: meal.mealType,
    source: meal.source,
    calories: meal.calories,
    protein: meal.protein,
    carbs: meal.carbs,
    fat: meal.fat,
    fibre: meal.fibre,
    sugar: meal.sugar ?? 0,
    salt: meal.salt ?? 0,
    portionSize: meal.portionSize,
    triggerTags: meal.triggerTags,
    notes: meal.notes ?? '',
  };
}

const inputClass =
  'w-full px-3 py-3 rounded-xl border border-slate-200 bg-white text-base focus:outline-none focus:ring-2 focus:ring-teal-500/30';

export function MealForm({
  initial,
  submitLabel = 'Save meal',
  onSubmit,
  onCancel,
  onValuesChange,
  riskAssessment,
  appliedValues,
  showAiEstimateBanner,
}: MealFormProps) {
  const [form, setForm] = useState<MealFormValues>({ ...defaults, ...initial });

  useEffect(() => {
    if (!appliedValues) return;
    setForm((prev) => {
      const next = { ...prev, ...appliedValues };
      onValuesChange?.(next);
      return next;
    });
  }, [appliedValues]);

  const update = <K extends keyof MealFormValues>(key: K, value: MealFormValues[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      onValuesChange?.(next);
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.mealName.trim()) return;
    onSubmit(form);
  };

  const chipClass = (selected: boolean) =>
    `px-3 py-2.5 rounded-xl text-sm font-medium min-h-[44px] ${
      selected ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-600'
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {showAiEstimateBanner && (
        <div className="rounded-xl bg-teal-50 border border-teal-100 px-3 py-2 text-sm text-teal-800">
          AI estimate — review before saving.
        </div>
      )}

      <div>
        <label className="text-xs font-medium text-slate-500 block mb-1.5">Meal name *</label>
        <input
          type="text"
          required
          autoFocus
          value={form.mealName}
          onChange={(e) => update('mealName', e.target.value)}
          placeholder="What did you eat?"
          className={inputClass}
        />
      </div>

      <div>
        <label className="text-xs font-medium text-slate-500 block mb-1.5">Meal type</label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(MEAL_TYPE_LABELS) as MealType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => update('mealType', type)}
              className={chipClass(form.mealType === type)}
            >
              {MEAL_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-slate-500 block mb-1.5">Source</label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(MEAL_SOURCE_LABELS) as MealSource[]).map((source) => (
            <button
              key={source}
              type="button"
              onClick={() => update('source', source)}
              className={chipClass(form.source === source)}
            >
              {MEAL_SOURCE_LABELS[source]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-slate-500 block mb-1.5">Calories</label>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={form.calories || ''}
          onChange={(e) => update('calories', Number(e.target.value) || 0)}
          className={`${inputClass} text-2xl font-semibold text-center`}
          placeholder="0"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {(
          [
            ['protein', 'Protein (g)'],
            ['carbs', 'Carbs (g)'],
            ['fat', 'Fat (g)'],
            ['fibre', 'Fibre (g)'],
            ['sugar', 'Sugar (g)'],
            ['salt', 'Salt (g)'],
          ] as const
        ).map(([key, label]) => (
          <div key={key}>
            <label className="text-xs font-medium text-slate-500 block mb-1.5">{label}</label>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              value={form[key] || ''}
              onChange={(e) => update(key, Number(e.target.value) || 0)}
              className={inputClass}
            />
          </div>
        ))}
      </div>

      <div>
        <label className="text-xs font-medium text-slate-500 block mb-1.5">Portion size</label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PORTION_SIZE_LABELS) as PortionSize[]).map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => update('portionSize', size)}
              className={chipClass(form.portionSize === size)}
            >
              {PORTION_SIZE_LABELS[size]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-slate-500 block mb-2">Trigger tags</label>
        <TriggerTagSelector
          selected={form.triggerTags}
          onChange={(tags) => update('triggerTags', tags)}
        />
      </div>

      <div>
        <label className="text-xs font-medium text-slate-500 block mb-1.5">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => update('notes', e.target.value)}
          rows={2}
          className={inputClass}
          placeholder="Optional"
        />
      </div>

      {riskAssessment && <RiskCard assessment={riskAssessment} />}

      <div className="flex gap-3 sticky-form-actions">
        {onCancel && (
          <Button type="button" variant="outline" fullWidth onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" fullWidth size="lg">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
