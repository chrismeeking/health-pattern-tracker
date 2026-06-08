import type { WeightEntry } from '@/types';
import { calculateBmi, getBmiCategory } from '@/utils/bmi';
import { Card } from './Card';

interface WeightChartProps {
  entries: WeightEntry[];
  weekChange: number | null;
  monthChange: number | null;
  latestWeight: number | null;
  targetWeight?: number;
  heightCm?: number;
}

export function WeightChart({
  entries,
  weekChange,
  monthChange,
  latestWeight,
  targetWeight,
  heightCm,
}: WeightChartProps) {
  const bmi =
    latestWeight != null && heightCm != null
      ? calculateBmi(latestWeight, heightCm)
      : null;
  const bmiCategory = bmi != null ? getBmiCategory(bmi) : null;

  const sorted = [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const display = sorted.slice(-8);
  const weights = display.map((e) => e.weight);
  const min = weights.length ? Math.min(...weights) : 0;
  const max = weights.length ? Math.max(...weights) : 1;
  const range = max - min || 1;

  return (
    <Card className="space-y-3">
      <div className="flex justify-between items-start gap-2">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wide">Current weight</p>
          <p className="text-3xl font-semibold text-slate-800">
            {latestWeight != null ? `${latestWeight} kg` : '—'}
          </p>
          {targetWeight != null && (
            <p className="text-sm text-slate-500">Target: {targetWeight} kg</p>
          )}
          {bmi != null && bmiCategory && (
            <>
              <p className="text-sm text-slate-500 mt-1">
                BMI {bmi} · {bmiCategory.label}
              </p>
              {bmiCategory.description && (
                <p className="text-xs text-slate-400 mt-0.5">{bmiCategory.description}</p>
              )}
            </>
          )}
        </div>
        <div className="text-right text-xs text-slate-500 space-y-0.5">
          {weekChange != null && (
            <p>
              This week:{' '}
              <span className={weekChange <= 0 ? 'text-teal-600' : 'text-slate-700'}>
                {weekChange > 0 ? '+' : ''}
                {weekChange} kg
              </span>
            </p>
          )}
          {monthChange != null && (
            <p>
              This month:{' '}
              <span className={monthChange <= 0 ? 'text-teal-600' : 'text-slate-700'}>
                {monthChange > 0 ? '+' : ''}
                {monthChange} kg
              </span>
            </p>
          )}
        </div>
      </div>

      {display.length >= 2 ? (
        <div className="flex items-end gap-1.5 h-20 pt-2">
          {display.map((entry) => {
            const height = ((entry.weight - min) / range) * 100;
            return (
              <div key={entry.id} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                <div
                  className="w-full bg-teal-400 rounded-t min-h-[8px] transition-all"
                  style={{ height: `${Math.max(15, height)}%` }}
                />
                <span className="text-[9px] text-slate-400 truncate w-full text-center">
                  {new Date(entry.date).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-slate-400 text-center py-4">
          Log at least two weights to see a trend.
        </p>
      )}
    </Card>
  );
}
