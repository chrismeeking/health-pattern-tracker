import { cn } from '@/utils/helpers';

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  color?: 'teal' | 'sage' | 'amber';
  showValues?: boolean;
  unit?: string;
}

const colors = {
  teal: 'bg-teal-500',
  sage: 'bg-sage-500',
  amber: 'bg-amber-500',
};

export function ProgressBar({
  value,
  max,
  label,
  color = 'teal',
  showValues,
  unit = '',
}: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;

  return (
    <div className="space-y-1">
      {(label || showValues) && (
        <div className="flex justify-between text-sm">
          {label && <span className="text-slate-600">{label}</span>}
          {showValues && (
            <span className="text-slate-400">
              {Math.round(value)}
              {unit} / {max}
              {unit}
            </span>
          )}
        </div>
      )}
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', colors[color])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
