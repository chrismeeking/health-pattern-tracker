import type { Meal } from '@/types';
import { MEAL_TYPE_LABELS, TRIGGER_TAG_LABELS } from '@/types';
import { formatDate, formatTime, isToday } from '@/utils/helpers';
import { Card } from './Card';
import { EntityActions } from './EntityActions';

interface MealCardProps {
  meal: Meal;
  onDelete?: () => void;
  showDate?: boolean;
}

export function MealCard({ meal, onDelete, showDate }: MealCardProps) {
  const timeLabel = isToday(meal.dateTime)
    ? formatTime(meal.dateTime)
    : `${formatDate(meal.dateTime)} · ${formatTime(meal.dateTime)}`;

  return (
    <Card className="space-y-2">
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0">
          <h3 className="font-medium text-slate-800 truncate">{meal.mealName}</h3>
          <p className="text-xs text-slate-400">
            {MEAL_TYPE_LABELS[meal.mealType]}
            {showDate || !isToday(meal.dateTime) ? ` · ${timeLabel}` : ` · ${formatTime(meal.dateTime)}`}
          </p>
        </div>
        <span className="text-sm font-semibold text-teal-600 shrink-0">{meal.calories} kcal</span>
      </div>
      <p className="text-xs text-slate-500">
        P {meal.protein}g · C {meal.carbs}g · F {meal.fat}g · Fibre {meal.fibre}g
      </p>
      {meal.triggerTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {meal.triggerTags.slice(0, 5).map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700"
            >
              {TRIGGER_TAG_LABELS[tag]}
            </span>
          ))}
          {meal.triggerTags.length > 5 && (
            <span className="text-[10px] text-slate-400">+{meal.triggerTags.length - 5}</span>
          )}
        </div>
      )}
      {meal.notes && <p className="text-xs text-slate-400 italic">{meal.notes}</p>}
      <EntityActions editTo={`/meals/${meal.id}/edit`} onDelete={onDelete} />
    </Card>
  );
}
