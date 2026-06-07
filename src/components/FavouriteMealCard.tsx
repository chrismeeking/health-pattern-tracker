import type { FavouriteMeal } from '@/types';
import { MEAL_TYPE_LABELS } from '@/types';
import { Card } from './Card';
import { EntityActions } from './EntityActions';

interface FavouriteMealCardProps {
  favourite: FavouriteMeal;
  onUse?: () => void;
  onDelete?: () => void;
  pickMode?: boolean;
}

export function FavouriteMealCard({
  favourite,
  onUse,
  onDelete,
  pickMode,
}: FavouriteMealCardProps) {
  return (
    <Card className="space-y-2">
      <div className="flex justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-medium text-slate-800 truncate">{favourite.name}</h3>
          <p className="text-xs text-slate-400">
            {MEAL_TYPE_LABELS[favourite.mealType]} · {favourite.calories} kcal
          </p>
        </div>
        {pickMode && onUse && (
          <button
            type="button"
            onClick={onUse}
            className="text-sm text-teal-600 shrink-0 min-h-[44px] px-2"
          >
            Add
          </button>
        )}
      </div>
      <p className="text-xs text-slate-500">
        P {favourite.protein}g · C {favourite.carbs}g · F {favourite.fat}g
      </p>
      {!pickMode && (
        <EntityActions
          editTo={`/favourites/${favourite.id}/edit`}
          onDelete={onDelete}
        />
      )}
    </Card>
  );
}
