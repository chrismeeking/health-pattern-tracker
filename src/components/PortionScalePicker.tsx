import { useMemo, useState } from 'react';
import type { SuggestedMealValues } from '@/services/ai/mealNameSuggestion';
import {
  formatScaledServing,
  getPortionScaleOptions,
  scaleSuggestedValues,
  type PortionScaleOption,
} from '@/utils/portionScaling';
import { Button } from './Button';

interface PortionScalePickerProps {
  servingDescription?: string;
  baseValues: SuggestedMealValues;
  onApply: (values: SuggestedMealValues, scaledServing?: string) => void;
  compact?: boolean;
}

export function PortionScalePicker({
  servingDescription,
  baseValues,
  onApply,
  compact = false,
}: PortionScalePickerProps) {
  const options = useMemo(
    () => getPortionScaleOptions(servingDescription),
    [servingDescription]
  );
  const defaultId = options.find((o) => o.factor === 1)?.id ?? options[0]?.id ?? '1';
  const [selectedId, setSelectedId] = useState(defaultId);

  const selected = options.find((o) => o.id === selectedId) ?? options[0];
  const preview = selected
    ? scaleSuggestedValues(baseValues, selected.factor)
    : baseValues;
  const scaledServing = formatScaledServing(servingDescription, selected?.factor ?? 1);

  const apply = () => {
    if (!selected) {
      onApply(baseValues, servingDescription);
      return;
    }
    onApply(scaleSuggestedValues(baseValues, selected.factor), scaledServing);
  };

  if (options.length <= 1 && !servingDescription) {
    return (
      <Button type="button" size="sm" variant="secondary" onClick={() => onApply(baseValues)}>
        Apply suggestion
      </Button>
    );
  }

  return (
    <div className={compact ? 'space-y-2' : 'space-y-2.5'}>
      <p className="text-[11px] text-slate-500 dark:text-slate-400">Choose portion</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt: PortionScaleOption) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setSelectedId(opt.id)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium min-h-[36px] ${
              selectedId === opt.id
                ? 'bg-teal-500 text-white'
                : 'bg-white border border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-700'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-600 dark:text-slate-300">
        <span className="font-semibold">{preview.calories ?? 0} kcal</span>
        {scaledServing && (
          <span className="text-slate-500 font-normal"> · {scaledServing}</span>
        )}
      </p>
      <Button type="button" size="sm" variant="secondary" onClick={apply}>
        Apply {scaledServing ? scaledServing : 'suggestion'}
      </Button>
    </div>
  );
}
