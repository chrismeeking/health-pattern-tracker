import type { Profile } from '@/types';
import type { NutritionTotals } from '@/utils/nutrition';
import { getCaloriesRemaining } from '@/utils/nutrition';
import { Card } from './Card';
import { ProgressBar } from './ProgressBar';

interface DailyNutritionSummaryProps {
  totals: NutritionTotals;
  profile: Profile;
}

export function DailyNutritionSummary({ totals, profile }: DailyNutritionSummaryProps) {
  const calorieTarget = profile.dailyCalorieTarget ?? 2000;
  const remaining = getCaloriesRemaining(totals.calories, calorieTarget);

  return (
    <Card className="space-y-4 border-teal-100 dark:border-teal-500/20">
      <div className="flex justify-between items-end">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wide dark:text-slate-500">Today</p>
          <p className="text-3xl font-semibold text-slate-800 dark:text-slate-100">{Math.round(totals.calories)}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {totals.calories > 0 ? 'calories consumed' : 'No meals logged yet'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold text-teal-600 dark:text-teal-300">{remaining}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">remaining</p>
        </div>
      </div>

      <ProgressBar
        value={totals.calories}
        max={calorieTarget}
        label="Calorie target"
        showValues
        unit=" kcal"
      />

      <div className="grid grid-cols-4 gap-2 text-center text-sm pt-1">
        <div>
          <p className="text-slate-400 text-xs dark:text-slate-500">Protein</p>
          <p className="font-semibold text-slate-800 dark:text-slate-100">{Math.round(totals.protein)}g</p>
        </div>
        <div>
          <p className="text-slate-400 text-xs dark:text-slate-500">Carbs</p>
          <p className="font-semibold text-slate-800 dark:text-slate-100">{Math.round(totals.carbs)}g</p>
        </div>
        <div>
          <p className="text-slate-400 text-xs dark:text-slate-500">Fat</p>
          <p className="font-semibold text-slate-800 dark:text-slate-100">{Math.round(totals.fat)}g</p>
        </div>
        <div>
          <p className="text-slate-400 text-xs dark:text-slate-500">Fibre</p>
          <p className="font-semibold text-slate-800 dark:text-slate-100">{Math.round(totals.fibre)}g</p>
        </div>
      </div>
    </Card>
  );
}
