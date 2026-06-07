import { useState } from 'react';
import type { Meal, PainDescription, PainLocation, Severity } from '@/types';
import {
  MEAL_TYPE_LABELS,
  PAIN_DESCRIPTION_LABELS,
  PAIN_LOCATION_LABELS,
  URGENT_WARNING,
} from '@/types';
import { formatTime } from '@/utils/helpers';
import { PainSlider } from './PainSlider';
import { Button } from './Button';
import { Card } from './Card';

export type SymptomFormValues = {
  issueId?: string;
  severity: Severity;
  painScore: number;
  symptoms: string[];
  bloating: boolean;
  nausea: boolean;
  sweating: boolean;
  vomiting: boolean;
  fever: boolean;
  burping: boolean;
  passingWind: boolean;
  bowelMovement: boolean;
  diarrhoea: boolean;
  constipation: boolean;
  sleepAffected: boolean;
  painLocation: PainLocation;
  painDescription: PainDescription;
  suspectedTrigger: string;
  relatedMealIds: string[];
  notes: string;
};

interface SymptomFormProps {
  issueOptions: { id: string; name: string }[];
  recentMeals: Meal[];
  onSubmit: (values: SymptomFormValues) => void;
  onCancel?: () => void;
}

const symptomChips = [
  'indigestion',
  'bloating',
  'gas',
  'upper abdominal pain',
  'headache',
  'tiredness',
  'nausea',
];

const boolFields: { key: keyof SymptomFormValues; label: string }[] = [
  { key: 'bloating', label: 'Bloating' },
  { key: 'nausea', label: 'Nausea' },
  { key: 'sweating', label: 'Sweating' },
  { key: 'vomiting', label: 'Vomiting' },
  { key: 'fever', label: 'Fever' },
  { key: 'burping', label: 'Burping' },
  { key: 'passingWind', label: 'Passing wind' },
  { key: 'bowelMovement', label: 'Bowel movement' },
  { key: 'diarrhoea', label: 'Diarrhoea' },
  { key: 'constipation', label: 'Constipation' },
  { key: 'sleepAffected', label: 'Sleep affected' },
];

const inputClass =
  'w-full px-3 py-3 rounded-xl border border-slate-200 text-base focus:outline-none focus:ring-2 focus:ring-teal-500/30';

export function SymptomForm({ issueOptions, recentMeals, onSubmit, onCancel }: SymptomFormProps) {
  const [form, setForm] = useState<SymptomFormValues>({
    severity: 'mild',
    painScore: 3,
    symptoms: [],
    bloating: false,
    nausea: false,
    sweating: false,
    vomiting: false,
    fever: false,
    burping: false,
    passingWind: false,
    bowelMovement: false,
    diarrhoea: false,
    constipation: false,
    sleepAffected: false,
    painLocation: 'upper middle',
    painDescription: 'pressure',
    suspectedTrigger: '',
    relatedMealIds: [],
    notes: '',
  });

  const toggleSymptom = (s: string) => {
    setForm((f) => ({
      ...f,
      symptoms: f.symptoms.includes(s)
        ? f.symptoms.filter((x) => x !== s)
        : [...f.symptoms, s],
    }));
  };

  const toggleMeal = (mealId: string) => {
    setForm((f) => ({
      ...f,
      relatedMealIds: f.relatedMealIds.includes(mealId)
        ? f.relatedMealIds.filter((id) => id !== mealId)
        : [...f.relatedMealIds, mealId],
    }));
  };

  const chipClass = (selected: boolean) =>
    `px-3 py-2.5 rounded-xl text-sm font-medium min-h-[44px] ${
      selected ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-600'
    }`;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
      className="space-y-5"
    >
      <Card className="bg-coral-50 border-coral-100">
        <p className="text-xs text-coral-700 leading-relaxed">{URGENT_WARNING}</p>
      </Card>

      {issueOptions.length > 0 && (
        <div>
          <label className="text-xs font-medium text-slate-500 block mb-1.5">Related issue</label>
          <select
            value={form.issueId ?? ''}
            onChange={(e) =>
              setForm((f) => ({ ...f, issueId: e.target.value || undefined }))
            }
            className={inputClass}
          >
            <option value="">None selected</option>
            {issueOptions.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="text-xs font-medium text-slate-500 block mb-2">Severity</label>
        <div className="grid grid-cols-3 gap-2">
          {(['mild', 'moderate', 'severe'] as Severity[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setForm((f) => ({ ...f, severity: s }))}
              className={chipClass(form.severity === s)}
            >
              <span className="capitalize">{s}</span>
            </button>
          ))}
        </div>
      </div>

      <PainSlider
        value={form.painScore}
        onChange={(v) => setForm((f) => ({ ...f, painScore: v }))}
      />

      <div>
        <label className="text-xs font-medium text-slate-500 block mb-2">Symptoms</label>
        <div className="flex flex-wrap gap-2">
          {symptomChips.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggleSymptom(s)}
              className={`px-3 py-2 rounded-full text-sm capitalize min-h-[40px] ${
                form.symptoms.includes(s) ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {boolFields.map(({ key, label }) => (
          <label key={key} className="flex items-center gap-2 text-sm min-h-[44px]">
            <input
              type="checkbox"
              checked={form[key] as boolean}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
              className="w-5 h-5 accent-teal-500"
            />
            {label}
          </label>
        ))}
      </div>

      <div>
        <label className="text-xs font-medium text-slate-500 block mb-2">Pain location</label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PAIN_LOCATION_LABELS) as PainLocation[]).map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => setForm((f) => ({ ...f, painLocation: loc }))}
              className={`px-3 py-2 rounded-xl text-xs min-h-[40px] ${
                form.painLocation === loc ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {PAIN_LOCATION_LABELS[loc]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-slate-500 block mb-2">Pain description</label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PAIN_DESCRIPTION_LABELS) as PainDescription[]).map((desc) => (
            <button
              key={desc}
              type="button"
              onClick={() => setForm((f) => ({ ...f, painDescription: desc }))}
              className={`px-3 py-2 rounded-xl text-xs min-h-[40px] ${
                form.painDescription === desc ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {PAIN_DESCRIPTION_LABELS[desc]}
            </button>
          ))}
        </div>
      </div>

      {recentMeals.length > 0 && (
        <div>
          <label className="text-xs font-medium text-slate-500 block mb-2">
            Meals in the last 12 hours
          </label>
          <div className="space-y-2">
            {recentMeals.map((meal) => (
              <button
                key={meal.id}
                type="button"
                onClick={() => toggleMeal(meal.id)}
                className={`w-full text-left px-3 py-3 rounded-xl border min-h-[48px] ${
                  form.relatedMealIds.includes(meal.id)
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <span className="font-medium text-sm text-slate-800">{meal.mealName}</span>
                <span className="text-xs text-slate-400 block">
                  {MEAL_TYPE_LABELS[meal.mealType]} · {formatTime(meal.dateTime)} · {meal.calories} kcal
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="text-xs font-medium text-slate-500 block mb-1.5">Suspected trigger</label>
        <input
          type="text"
          value={form.suspectedTrigger}
          onChange={(e) => setForm((f) => ({ ...f, suspectedTrigger: e.target.value }))}
          placeholder="What might have caused this?"
          className={inputClass}
        />
      </div>

      <div>
        <label className="text-xs font-medium text-slate-500 block mb-1.5">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          rows={2}
          className={inputClass}
        />
      </div>

      <div className="flex gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" fullWidth onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" fullWidth size="lg">
          Save symptom
        </Button>
      </div>
    </form>
  );
}
