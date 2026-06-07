import { useState } from 'react';
import type { Goal, GoalCategory, GoalDifficulty } from '@/types';
import { GOAL_CATEGORY_LABELS } from '@/types';
import { Button } from './Button';

export type GoalFormValues = {
  title: string;
  description: string;
  category: GoalCategory;
  difficulty: GoalDifficulty;
  startDate: string;
  endDate: string;
};

interface GoalFormProps {
  initial?: Partial<GoalFormValues>;
  submitLabel?: string;
  onSubmit: (values: GoalFormValues) => void;
  onCancel?: () => void;
}

const categories = Object.keys(GOAL_CATEGORY_LABELS) as GoalCategory[];

const defaults: GoalFormValues = {
  title: '',
  description: '',
  category: 'digestion',
  difficulty: 'easy',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
};

export function goalToFormValues(goal: Goal): GoalFormValues {
  return {
    title: goal.title,
    description: goal.description ?? '',
    category: goal.category,
    difficulty: goal.difficulty,
    startDate: goal.startDate ?? new Date().toISOString().split('T')[0],
    endDate: goal.endDate ?? '',
  };
}

export function GoalForm({
  initial,
  submitLabel = 'Save goal',
  onSubmit,
  onCancel,
}: GoalFormProps) {
  const [form, setForm] = useState<GoalFormValues>({ ...defaults, ...initial });

  const inputClass =
    'w-full px-3 py-3 rounded-xl border border-slate-200 text-base focus:outline-none focus:ring-2 focus:ring-teal-500/30';

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!form.title.trim()) return;
        onSubmit(form);
      }}
    >
      <div>
        <label className="block text-sm text-slate-600 mb-1">Title</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          className={inputClass}
          placeholder="A small improvement to try"
          required
        />
      </div>

      <div>
        <label className="block text-sm text-slate-600 mb-1">Description (optional)</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          className={`${inputClass} min-h-[80px]`}
          placeholder="What are you experimenting with?"
        />
      </div>

      <div>
        <label className="block text-sm text-slate-600 mb-2">Category</label>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setForm((f) => ({ ...f, category: cat }))}
              className={`text-xs px-3 py-1.5 rounded-full ${
                form.category === cat
                  ? 'bg-teal-100 text-teal-700'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {GOAL_CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm text-slate-600 mb-2">Difficulty</label>
        <div className="flex gap-2">
          {(['easy', 'medium'] as GoalDifficulty[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setForm((f) => ({ ...f, difficulty: d }))}
              className={`flex-1 py-2 rounded-xl text-sm capitalize ${
                form.difficulty === d
                  ? 'bg-teal-500 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-slate-600 mb-1">Start date</label>
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">End date (optional)</label>
          <input
            type="date"
            value={form.endDate}
            onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" fullWidth>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
