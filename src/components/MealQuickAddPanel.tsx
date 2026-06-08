import { Link } from 'react-router-dom';
import type { Meal } from '@/types';
import { MEAL_TYPE_LABELS } from '@/types';
import { Card } from './Card';
import { Button } from './Button';

interface MealQuickAddPanelProps {
  recentMeals: Meal[];
  onCopyMeal: (mealId: string) => void;
  onQuickSaveMeal: (mealId: string) => void;
  onRepeatYesterday: (mealType: Meal['mealType']) => void;
  yesterdayOptions: { type: Meal['mealType']; meal: Meal | null }[];
}

export function MealQuickAddPanel({
  recentMeals,
  onCopyMeal,
  onQuickSaveMeal,
  onRepeatYesterday,
  yesterdayOptions,
}: MealQuickAddPanelProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-slate-600 dark:text-slate-400">Shortcuts</h2>

      <Link to="/favourites?pick=1">
        <Card className="p-3 flex items-center gap-3 active:scale-[0.99] transition-transform">
          <span className="text-lg">⭐</span>
          <div>
            <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Add from favourites
            </span>
            <p className="text-xs text-slate-400">Meals you save for one-tap logging</p>
          </div>
        </Card>
      </Link>

      {yesterdayOptions.some((o) => o.meal) && (
        <Card className="space-y-2">
          <p className="text-xs text-slate-500">Repeat yesterday</p>
          <div className="flex flex-wrap gap-2">
            {yesterdayOptions.map(({ type, meal }) =>
              meal ? (
                <Button
                  key={type}
                  variant="outline"
                  size="sm"
                  onClick={() => onRepeatYesterday(type)}
                >
                  {MEAL_TYPE_LABELS[type]}
                </Button>
              ) : null
            )}
          </div>
        </Card>
      )}

      {recentMeals.length > 0 && (
        <Card className="space-y-2">
          <p className="text-xs text-slate-500">Recent meals</p>
          <div className="space-y-2">
            {recentMeals.slice(0, 4).map((meal) => (
              <div
                key={meal.id}
                className="rounded-xl bg-slate-50 dark:bg-slate-900/50 px-3 py-2.5 space-y-2"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                    {meal.mealName}
                  </p>
                  <p className="text-xs text-slate-400">
                    {MEAL_TYPE_LABELS[meal.mealType]} · {meal.calories} kcal
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => onQuickSaveMeal(meal.id)}>
                    Add now
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onCopyMeal(meal.id)}>
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
