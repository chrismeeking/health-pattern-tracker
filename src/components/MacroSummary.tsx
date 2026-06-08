import type { Profile } from '@/types';
import type { NutritionTotals } from '@/utils/nutrition';
import { Card } from './Card';
import { ProgressBar } from './ProgressBar';

interface MacroSummaryProps {
  totals: NutritionTotals;
  profile: Profile;
  compact?: boolean;
}

export function MacroSummary({ totals, profile, compact }: MacroSummaryProps) {
  const rows = [
    { label: 'Protein', value: totals.protein, target: profile.proteinTarget, color: 'teal' as const },
    { label: 'Carbs', value: totals.carbs, target: profile.carbTarget, color: 'sage' as const },
    { label: 'Fat', value: totals.fat, target: profile.fatTarget, color: 'amber' as const },
    { label: 'Fibre', value: totals.fibre, target: profile.fibreTarget, color: 'sage' as const },
  ].filter((r) => r.target || !compact);

  if (rows.length === 0) {
    return (
      <Card className="space-y-2">
        <h3 className="text-sm font-medium text-slate-600">Macros today</h3>
        <div className="grid grid-cols-5 gap-2 text-center text-sm">
          <div><span className="text-slate-400 block text-xs">Protein</span>{Math.round(totals.protein)}g</div>
          <div><span className="text-slate-400 block text-xs">Carbs</span>{Math.round(totals.carbs)}g</div>
          <div><span className="text-slate-400 block text-xs">Fat</span>{Math.round(totals.fat)}g</div>
          <div><span className="text-slate-400 block text-xs">Sat. fat</span>{Math.round(totals.saturatedFat)}g</div>
          <div><span className="text-slate-400 block text-xs">Fibre</span>{Math.round(totals.fibre)}g</div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="space-y-3">
      <h3 className="text-sm font-medium text-slate-600">Macro progress</h3>
      {rows.map((row) => (
        <ProgressBar
          key={row.label}
          value={row.value}
          max={row.target ?? 100}
          label={row.label}
          showValues={!!row.target}
          unit="g"
          color={row.color}
        />
      ))}
    </Card>
  );
}
