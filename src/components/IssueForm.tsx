import { useState } from 'react';
import type { HealthIssue, IssueCategory } from '@/types';
import { ISSUE_CATEGORY_LABELS } from '@/types';
import { ISSUE_EXAMPLES, ISSUE_SUGGESTED_TRIGGERS } from '@/utils/symptoms';
import { Button } from './Button';

export type IssueFormValues = {
  name: string;
  description: string;
  category: IssueCategory;
  possibleTriggers: string[];
  active: boolean;
};

interface IssueFormProps {
  initial?: Partial<IssueFormValues>;
  submitLabel?: string;
  onSubmit: (values: IssueFormValues) => void;
  onCancel?: () => void;
}

const defaults: IssueFormValues = {
  name: '',
  description: '',
  category: 'digestion',
  possibleTriggers: ISSUE_SUGGESTED_TRIGGERS.digestion,
  active: true,
};

const categories = Object.keys(ISSUE_CATEGORY_LABELS) as IssueCategory[];

export function issueToFormValues(issue: HealthIssue): IssueFormValues {
  return {
    name: issue.name,
    description: issue.description ?? '',
    category: issue.category,
    possibleTriggers: issue.possibleTriggers,
    active: issue.active,
  };
}

export function IssueForm({
  initial,
  submitLabel = 'Create issue',
  onSubmit,
  onCancel,
}: IssueFormProps) {
  const [form, setForm] = useState<IssueFormValues>({ ...defaults, ...initial });

  const setCategory = (category: IssueCategory) => {
    setForm((f) => ({
      ...f,
      category,
      possibleTriggers: ISSUE_SUGGESTED_TRIGGERS[category] ?? [],
    }));
  };

  const applyExample = (ex: (typeof ISSUE_EXAMPLES)[0]) => {
    setForm((f) => ({
      ...f,
      name: ex.name,
      description: ex.question,
      category: ex.category,
      possibleTriggers: ISSUE_SUGGESTED_TRIGGERS[ex.category] ?? [],
    }));
  };

  const toggleTrigger = (trigger: string) => {
    setForm((f) => ({
      ...f,
      possibleTriggers: f.possibleTriggers.includes(trigger)
        ? f.possibleTriggers.filter((t) => t !== trigger)
        : [...f.possibleTriggers, trigger],
    }));
  };

  const inputClass =
    'w-full px-3 py-3 rounded-xl border border-slate-200 text-base focus:outline-none focus:ring-2 focus:ring-teal-500/30';

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!form.name.trim()) return;
        onSubmit(form);
      }}
      className="space-y-5"
    >
      <div>
        <label className="text-xs font-medium text-slate-500 block mb-1.5">
          What are you trying to understand?
        </label>
        <div className="flex flex-wrap gap-2 mb-3">
          {ISSUE_EXAMPLES.map((ex) => (
            <button
              key={ex.name}
              type="button"
              onClick={() => applyExample(ex)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 active:bg-slate-200"
            >
              {ex.question}
            </button>
          ))}
        </div>
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Describe what you want to investigate..."
          rows={2}
          className={`${inputClass} mb-2`}
        />
        <input
          type="text"
          required
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Issue name (e.g. Indigestion)"
          className={inputClass}
        />
      </div>

      <div>
        <label className="text-xs font-medium text-slate-500 block mb-2">Category</label>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3 py-2.5 rounded-xl text-sm min-h-[44px] ${
                form.category === cat
                  ? 'bg-teal-500 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {ISSUE_CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {form.possibleTriggers.length > 0 && (
        <div>
          <label className="text-xs font-medium text-slate-500 block mb-2">
            Suggested things to track
          </label>
          <div className="flex flex-wrap gap-2">
            {form.possibleTriggers.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => toggleTrigger(t)}
                className="px-3 py-2 rounded-full text-sm min-h-[40px] bg-teal-100 text-teal-700"
              >
                {t}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Tap to toggle. These guide meal tagging and future pattern reports.
          </p>
        </div>
      )}

      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={form.active}
          onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
          className="w-5 h-5 accent-teal-500"
        />
        Keep this issue active
      </label>

      <div className="flex gap-3 pt-2">
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
