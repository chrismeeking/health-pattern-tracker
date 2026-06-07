import { useEffect, useRef, useState } from 'react';
import type { FavouriteMeal, Meal } from '@/types';
import {
  findLocalMealNameSuggestion,
  resolveMealNameSuggestion,
  type MealNameSuggestion,
  type SuggestedMealValues,
} from '@/services/ai/mealNameSuggestion';
import { Button } from './Button';

interface MealNameSuggestionPanelProps {
  profileId: string;
  mealName: string;
  calories: number;
  favourites: FavouriteMeal[];
  recentMeals: Meal[];
  onApply: (values: SuggestedMealValues) => void;
}

const DEBOUNCE_MS = 900;
const MIN_NAME_LENGTH = 3;

export function MealNameSuggestionPanel({
  profileId,
  mealName,
  calories,
  favourites,
  recentMeals,
  onApply,
}: MealNameSuggestionPanelProps) {
  const [suggestion, setSuggestion] = useState<MealNameSuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);
  const requestId = useRef(0);

  const trimmed = mealName.trim();
  const canLookup = trimmed.length >= MIN_NAME_LENGTH;
  const hasManualNutrition = calories > 0;
  const isDismissed = dismissedFor === normalise(trimmed);

  useEffect(() => {
    if (!canLookup || isDismissed) {
      setSuggestion(null);
      setError(null);
      setLoading(false);
      return;
    }

    const local = findLocalMealNameSuggestion(trimmed, favourites, recentMeals);
    if (local) {
      setSuggestion(local);
      setError(null);
      setLoading(false);
      return;
    }

    if (hasManualNutrition) {
      setSuggestion(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const timer = setTimeout(() => {
      const id = ++requestId.current;
      void resolveMealNameSuggestion(profileId, trimmed, favourites, recentMeals)
        .then((result) => {
          if (id !== requestId.current) return;
          setSuggestion(result);
        })
        .catch((err) => {
          if (id !== requestId.current) return;
          setSuggestion(null);
          setError(
            err instanceof Error ? err.message : 'Could not look up typical nutrition.'
          );
        })
        .finally(() => {
          if (id === requestId.current) setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [
    trimmed,
    canLookup,
    isDismissed,
    hasManualNutrition,
    profileId,
    favourites,
    recentMeals,
  ]);

  const runManualLookup = () => {
    if (!canLookup) return;
    setDismissedFor(null);
    setLoading(true);
    setError(null);
    const id = ++requestId.current;
    void resolveMealNameSuggestion(profileId, trimmed, favourites, recentMeals)
      .then((result) => {
        if (id !== requestId.current) return;
        setSuggestion(result);
      })
      .catch((err) => {
        if (id !== requestId.current) return;
        setError(err instanceof Error ? err.message : 'Lookup failed.');
      })
      .finally(() => {
        if (id === requestId.current) setLoading(false);
      });
  };

  if (!canLookup) return null;

  if (loading && !suggestion) {
    return (
      <p className="text-xs text-slate-400 mt-1.5 animate-pulse">
        Looking up typical nutrition for “{trimmed}”…
      </p>
    );
  }

  if (error) {
    return (
      <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
        {error}
        <button
          type="button"
          className="ml-2 text-teal-600 font-medium"
          onClick={runManualLookup}
        >
          Retry
        </button>
      </div>
    );
  }

  if (isDismissed || !suggestion) {
    if (hasManualNutrition) {
      return (
        <button
          type="button"
          className="text-xs text-teal-600 font-medium mt-1.5"
          onClick={runManualLookup}
        >
          Look up typical nutrition for “{trimmed}”
        </button>
      );
    }
    return null;
  }

  const { values } = suggestion;

  return (
    <div className="mt-2 rounded-xl border border-teal-100 bg-teal-50/80 px-3 py-2.5 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-teal-800">{suggestion.label}</p>
          <p className="text-[11px] text-teal-700/80 mt-0.5">
            Typical portion for “{suggestion.mealName}” — review before applying.
          </p>
        </div>
        <button
          type="button"
          className="text-[10px] text-slate-400 shrink-0"
          onClick={() => setDismissedFor(normalise(trimmed))}
        >
          Dismiss
        </button>
      </div>

      <p className="text-sm text-slate-700">
        <span className="font-semibold">{values.calories ?? 0} kcal</span>
        {' · '}
        P {values.protein ?? 0}g · C {values.carbs ?? 0}g · F {values.fat ?? 0}g
      </p>

      {suggestion.ingredients && suggestion.ingredients.length > 0 && (
        <p className="text-[11px] text-slate-500">
          Likely: {suggestion.ingredients.slice(0, 5).join(', ')}
        </p>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => onApply(suggestion.values)}
        >
          Apply suggestion
        </Button>
        {hasManualNutrition && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setDismissedFor(normalise(trimmed))}
          >
            Keep mine
          </Button>
        )}
      </div>
    </div>
  );
}

function normalise(name: string): string {
  return name.trim().toLowerCase();
}
