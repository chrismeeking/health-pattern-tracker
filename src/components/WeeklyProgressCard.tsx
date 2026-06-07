import type { WeeklyProgress } from '@/utils/health';
import { Card } from './Card';

interface WeeklyProgressCardProps {
  progress: WeeklyProgress;
  showSymptoms?: boolean;
  compact?: boolean;
}

export function WeeklyProgressCard({
  progress,
  showSymptoms = true,
  compact,
}: WeeklyProgressCardProps) {
  const items = [
    { label: 'Avg calories/day', value: progress.avgCalories ? `${progress.avgCalories} kcal` : '—' },
    { label: 'Avg protein/day', value: progress.avgProtein ? `${progress.avgProtein}g` : '—' },
    {
      label: 'Water target days',
      value: `${progress.waterTargetDays}/${progress.waterTargetTotal}`,
    },
    {
      label: 'Weight change',
      value:
        progress.weightChange != null
          ? `${progress.weightChange > 0 ? '+' : ''}${progress.weightChange} kg`
          : '—',
    },
  ];

  if (showSymptoms) {
    items.push(
      { label: 'Symptoms this week', value: String(progress.symptomsThisWeek) },
      { label: 'Severe episodes', value: String(progress.severeThisWeek) }
    );
  }

  items.push({
    label: 'Goals completed',
    value: String(progress.goalsCompleted),
  });

  return (
    <Card className="space-y-3">
      {!compact && (
        <h3 className="text-sm font-medium text-slate-600">Weekly progress</h3>
      )}
      <div className={`grid gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-2'}`}>
        {items.map((item) => (
          <div key={item.label} className="bg-slate-50 rounded-xl px-3 py-2">
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">{item.label}</p>
            <p className="text-sm font-semibold text-slate-800">{item.value}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
