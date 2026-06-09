import { Link } from 'react-router-dom';
import type { WeeklyNutritionSummary } from '@/utils/weeklyNutrition';
import { Card } from './Card';

interface WeeklyNutritionCardProps {
  summary: WeeklyNutritionSummary;
  compact?: boolean;
}

export function WeeklyNutritionCard({ summary, compact }: WeeklyNutritionCardProps) {
  if (summary.daysTracked === 0) {
    return (
      <Card className="text-sm text-slate-500 text-center py-4">
        Log meals this week to see nutrition trends.
      </Card>
    );
  }

  return (
    <Link to="/meals">
      <Card className={compact ? 'space-y-2' : 'space-y-3'}>
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-300">
            This week&apos;s nutrition
          </h3>
          <span className="text-xs text-teal-500">Details</span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-slate-400">Avg calories</p>
            <p className="font-semibold text-slate-800 dark:text-slate-100">
              {summary.avgCalories}
              <span className="text-xs font-normal text-slate-400">
                {' '}
                / {summary.calorieTarget}
              </span>
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Protein hit rate</p>
            <p className="font-semibold text-slate-800 dark:text-slate-100">
              {summary.proteinHitDays}/{summary.proteinTargetDays} days
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Over target</p>
            <p className="font-semibold text-slate-800 dark:text-slate-100">
              {summary.daysOverCalories} day{summary.daysOverCalories !== 1 ? 's' : ''}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Under target</p>
            <p className="font-semibold text-slate-800 dark:text-slate-100">
              {summary.daysUnderCalories} day{summary.daysUnderCalories !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
