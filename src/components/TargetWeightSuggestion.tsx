import type { GoalType, MeasurementSystem } from '@/types';
import { formatWeight } from '@/utils/measurements';
import {
  getSuggestedTargetWeight,
  type TargetWeightOption,
} from '@/utils/targetWeight';
import { Button } from './Button';

interface TargetWeightSuggestionProps {
  heightCm?: number;
  currentWeightKg?: number;
  targetWeightKg?: number;
  goalType: GoalType;
  system: MeasurementSystem;
  onApply: (kg: number) => void;
}

function OptionChip({
  option,
  system,
  selected,
  onSelect,
}: {
  option: TargetWeightOption;
  system: MeasurementSystem;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-xl border px-3 py-2 text-left text-xs transition-colors ${
        selected
          ? 'border-teal-400 bg-teal-50 dark:border-teal-600 dark:bg-teal-950/50'
          : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900'
      }`}
    >
      <span className="block font-medium text-slate-800 dark:text-slate-100">
        {formatWeight(option.kg, system)} · {option.label}
      </span>
      <span className="block text-[10px] text-slate-500 mt-0.5 dark:text-slate-400">
        BMI {option.bmi} — {option.detail}
      </span>
    </button>
  );
}

export function TargetWeightSuggestion({
  heightCm,
  currentWeightKg,
  targetWeightKg,
  goalType,
  system,
  onApply,
}: TargetWeightSuggestionProps) {
  if (heightCm == null || currentWeightKg == null) {
    return (
      <p className="text-[11px] text-slate-500 dark:text-slate-400">
        Enter height and current weight to see a suggested target.
      </p>
    );
  }

  const suggestion = getSuggestedTargetWeight(heightCm, currentWeightKg, goalType);
  if (!suggestion) return null;

  const { primary, alternatives, disclaimer } = suggestion;
  const selectedKg = targetWeightKg ?? primary.kg;
  const matchesPrimary = targetWeightKg != null && Math.abs(targetWeightKg - primary.kg) < 0.05;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 space-y-2 dark:border-slate-700 dark:bg-slate-900/60">
      <p className="text-xs font-medium text-slate-700 dark:text-slate-200">Suggested target</p>
      <OptionChip
        option={primary}
        system={system}
        selected={matchesPrimary || targetWeightKg == null}
        onSelect={() => onApply(primary.kg)}
      />
      {alternatives.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] text-slate-500 uppercase tracking-wide dark:text-slate-400">
            Other options
          </p>
          {alternatives.map((alt) => (
            <OptionChip
              key={alt.label}
              option={alt}
              system={system}
              selected={targetWeightKg != null && Math.abs(targetWeightKg - alt.kg) < 0.05}
              onSelect={() => onApply(alt.kg)}
            />
          ))}
        </div>
      )}
      {!matchesPrimary && targetWeightKg == null && (
        <Button type="button" size="sm" fullWidth onClick={() => onApply(primary.kg)}>
          Use {formatWeight(primary.kg, system)} suggested target
        </Button>
      )}
      {targetWeightKg != null && !matchesPrimary && (
        <p className="text-[10px] text-slate-500 dark:text-slate-400">
          Manual target: {formatWeight(selectedKg, system)} — tap a suggestion to replace.
        </p>
      )}
      <p className="text-[10px] text-slate-400 leading-snug dark:text-slate-500">{disclaimer}</p>
    </div>
  );
}
