import type { FavouriteMeal, Meal } from '@/types';
import { analyseMeal } from './mealAnalysisClient';
import type { ParsedMealAnalysis } from './types';
import { favouriteToFormValues } from '@/services/food/favouriteMeals';
import type { TriggerTag } from '@/types';

export interface SuggestedMealValues {
  mealName?: string;
  mealType?: Meal['mealType'];
  source?: Meal['source'];
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fibre?: number;
  sugar?: number;
  salt?: number;
  portionSize?: Meal['portionSize'];
  triggerTags?: TriggerTag[];
  notes?: string;
}

export type MealNameSuggestionSource =
  | 'local-favourite'
  | 'local-recent'
  | 'ai-estimate'
  | 'offline-estimate';

export interface MealNameSuggestion {
  mealName: string;
  source: MealNameSuggestionSource;
  label: string;
  values: SuggestedMealValues;
  ingredients?: string[];
  confidence?: ParsedMealAnalysis['confidence'];
  notes?: string;
}

function normaliseName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

function namesMatch(a: string, b: string): boolean {
  const left = normaliseName(a);
  const right = normaliseName(b);
  return left === right || left.includes(right) || right.includes(left);
}

function mealToSuggestedValues(meal: Meal): SuggestedMealValues {
  return {
    mealName: meal.mealName,
    mealType: meal.mealType,
    source: meal.source,
    calories: meal.calories,
    protein: meal.protein,
    carbs: meal.carbs,
    fat: meal.fat,
    fibre: meal.fibre,
    sugar: meal.sugar ?? 0,
    salt: meal.salt ?? 0,
    portionSize: meal.portionSize,
    triggerTags: meal.triggerTags,
    notes: meal.notes ?? '',
  };
}

function averageMeals(meals: Meal[]): SuggestedMealValues {
  const count = meals.length;
  const sum = meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.protein,
      carbs: acc.carbs + meal.carbs,
      fat: acc.fat + meal.fat,
      fibre: acc.fibre + meal.fibre,
      sugar: acc.sugar + (meal.sugar ?? 0),
      salt: acc.salt + (meal.salt ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0, sugar: 0, salt: 0 }
  );

  return {
    calories: Math.round(sum.calories / count),
    protein: Math.round(sum.protein / count),
    carbs: Math.round(sum.carbs / count),
    fat: Math.round(sum.fat / count),
    fibre: Math.round(sum.fibre / count),
    sugar: Math.round(sum.sugar / count),
    salt: Math.round((sum.salt / count) * 10) / 10,
    portionSize: meals[0]?.portionSize ?? 'normal',
    triggerTags: meals[0]?.triggerTags ?? [],
    source: meals[0]?.source ?? 'unknown',
  };
}

/** Check favourites and past logs before calling AI. */
export function findLocalMealNameSuggestion(
  mealName: string,
  favourites: FavouriteMeal[],
  recentMeals: Meal[]
): MealNameSuggestion | null {
  const trimmed = mealName.trim();
  if (trimmed.length < 3) return null;

  const favourite = favourites.find((f) => namesMatch(f.name, trimmed));
  if (favourite) {
    return {
      mealName: favourite.name,
      source: 'local-favourite',
      label: 'From your favourites',
      values: favouriteToFormValues(favourite),
    };
  }

  const matchingMeals = recentMeals.filter((m) => namesMatch(m.mealName, trimmed));
  if (matchingMeals.length > 0) {
    const latest = matchingMeals[0];
    const averaged =
      matchingMeals.length >= 2
        ? averageMeals(matchingMeals.slice(0, 5))
        : mealToSuggestedValues(latest);

    return {
      mealName: latest.mealName,
      source: 'local-recent',
      label:
        matchingMeals.length >= 2
          ? `From your logs (avg of ${Math.min(matchingMeals.length, 5)} entries)`
          : 'From your recent meals',
      values: {
        ...averaged,
        mealName: latest.mealName,
        mealType: latest.mealType,
      },
    };
  }

  return null;
}

function analysisToSuggestion(
  analysis: ParsedMealAnalysis,
  usedLocalFallback: boolean
): MealNameSuggestion {
  return {
    mealName: analysis.mealName,
    source: usedLocalFallback ? 'offline-estimate' : 'ai-estimate',
    label: usedLocalFallback
      ? 'Typical estimate (offline)'
      : 'Typical nutrition estimate',
    values: {
      mealName: analysis.mealName,
      calories: analysis.estimatedCalories,
      protein: analysis.protein,
      carbs: analysis.carbs,
      fat: analysis.fat,
      fibre: analysis.fibre,
      sugar: analysis.sugar,
      salt: analysis.salt,
      triggerTags: analysis.triggerTags,
      notes: analysis.notes,
    },
    ingredients: analysis.likelyIngredients,
    confidence: analysis.confidence,
    notes: analysis.notes,
  };
}

/** Look up typical nutrition for a dish name via the secure backend (or local mock). */
export async function suggestMealFromName(
  profileId: string,
  mealName: string
): Promise<MealNameSuggestion> {
  const outcome = await analyseMeal({
    profileId,
    mealText: mealName.trim(),
    imageBase64: null,
    analysisType: 'name',
  });

  return analysisToSuggestion(outcome.analysis, outcome.usedLocalFallback);
}

export async function resolveMealNameSuggestion(
  profileId: string,
  mealName: string,
  favourites: FavouriteMeal[],
  recentMeals: Meal[]
): Promise<MealNameSuggestion | null> {
  const trimmed = mealName.trim();
  if (trimmed.length < 3) return null;

  const local = findLocalMealNameSuggestion(trimmed, favourites, recentMeals);
  if (local) return local;

  return suggestMealFromName(profileId, trimmed);
}
