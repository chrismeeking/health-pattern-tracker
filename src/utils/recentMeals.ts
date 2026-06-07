import type { Meal, MealType } from '@/types';
import type { MealFormValues } from '@/components/MealForm';
import { mealToFormValues } from '@/components/MealForm';
import { todayISO } from './helpers';

export function getRecentMeals(meals: Meal[], limit = 8): Meal[] {
  return [...meals]
    .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
    .slice(0, limit);
}

export function getYesterdayDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

export function getYesterdayMealByType(meals: Meal[], mealType: MealType): Meal | null {
  const yesterday = getYesterdayDate();
  const matches = meals
    .filter((m) => m.mealType === mealType && m.dateTime.startsWith(yesterday))
    .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
  return matches[0] ?? null;
}

export function repeatMealFormValues(meal: Meal): MealFormValues {
  const base = mealToFormValues(meal);
  return {
    ...base,
    notes: base.notes ? `${base.notes} (repeat)` : 'Repeat meal',
  };
}

export function getUniqueRecentByName(meals: Meal[], limit = 5): Meal[] {
  const seen = new Set<string>();
  const result: Meal[] = [];
  for (const meal of getRecentMeals(meals, 30)) {
    const key = meal.mealName.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(meal);
    if (result.length >= limit) break;
  }
  return result;
}

export function suggestMealTypeForNow(): MealType {
  const hour = new Date().getHours();
  if (hour < 11) return 'breakfast';
  if (hour < 15) return 'lunch';
  if (hour < 21) return 'dinner';
  return 'snack';
}

export function isMealLoggedToday(meals: Meal[], mealType: MealType): boolean {
  const today = todayISO();
  return meals.some((m) => m.mealType === mealType && m.dateTime.startsWith(today));
}
