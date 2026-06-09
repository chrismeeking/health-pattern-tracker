import { useEffect, useRef, useState } from 'react';
import { useApp } from '@/hooks/useAppData';
import {
  foodSearchHitToFormValues,
  searchFoods,
  type FoodSearchHit,
} from '@/services/food/foodSearch';
import type { MealFormValues } from './MealForm';
import { Card } from './Card';

interface FoodSearchPanelProps {
  query: string;
  profileId: string;
  onApply: (values: Partial<MealFormValues>) => void;
}

export function FoodSearchPanel({ query, profileId, onApply }: FoodSearchPanelProps) {
  const { data } = useApp();
  const [localHits, setLocalHits] = useState<FoodSearchHit[]>([]);
  const [onlineHits, setOnlineHits] = useState<FoodSearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [onlineError, setOnlineError] = useState<string | null>(null);
  const requestId = useRef(0);

  const trimmed = query.trim();

  useEffect(() => {
    if (trimmed.length < 2) {
      setLocalHits([]);
      setOnlineHits([]);
      setOnlineError(null);
      return;
    }

    const id = ++requestId.current;
    setLoading(true);

    void searchFoods(trimmed, {
      profileId,
      savedFoods: data.savedFoods,
      favouriteMeals: data.favouriteMeals,
      includeOnline: trimmed.length >= 3,
      localLimit: 6,
      onlineLimit: 6,
    })
      .then((outcome) => {
        if (id !== requestId.current) return;
        setLocalHits(outcome.local);
        setOnlineHits(outcome.online);
        setOnlineError(outcome.onlineError ?? null);
      })
      .finally(() => {
        if (id === requestId.current) setLoading(false);
      });
  }, [trimmed, profileId, data.savedFoods, data.favouriteMeals]);

  if (trimmed.length < 2) return null;

  const hits = [...localHits, ...onlineHits].slice(0, 8);
  if (!loading && hits.length === 0) return null;

  const applyHit = (hit: FoodSearchHit) => {
    const form = foodSearchHitToFormValues(hit);
    onApply({
      mealName: form.mealName,
      calories: form.calories,
      protein: form.protein,
      carbs: form.carbs,
      fat: form.fat,
      saturatedFat: form.saturatedFat,
      fibre: form.fibre,
      sugar: form.sugar,
      salt: form.salt,
      triggerTags: form.triggerTags,
      source: form.source,
      notes: form.notes,
    });
  };

  return (
    <div className="mt-2 space-y-2">
      {loading && (
        <p className="text-xs text-slate-400 animate-pulse">Searching foods…</p>
      )}
      {hits.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {hits.map((hit) => (
            <button
              key={hit.id}
              type="button"
              className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left shadow-sm min-w-[160px] max-w-[200px] dark:bg-slate-900 dark:border-slate-700"
              onClick={() => applyHit(hit)}
            >
              <span className="block text-xs font-medium text-slate-700 dark:text-slate-200 leading-snug line-clamp-2">
                {hit.name}
              </span>
              <span className="block text-[10px] text-slate-500 mt-0.5">{hit.sourceLabel}</span>
              <span className="block text-[10px] text-slate-400 mt-0.5">
                {hit.calories} kcal · {hit.servingSize}
              </span>
            </button>
          ))}
        </div>
      )}
      {onlineError && hits.length === 0 && (
        <Card className="text-xs text-slate-500 py-2 px-3">{onlineError}</Card>
      )}
    </div>
  );
}
