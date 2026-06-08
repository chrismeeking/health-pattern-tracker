import type { Meal, Profile, ProfileModule, WaterEntry } from '@/types';
import { todayISO } from './helpers';

export interface NutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  saturatedFat: number;
  fibre: number;
  sugar: number;
  salt: number;
}

/** Estimate saturated fat (g) from total fat when not explicitly known. */
export function deriveSaturatedFat(totalFat: number, known?: number): number {
  if (known != null && known > 0) return known;
  return Math.round(totalFat * 0.4);
}

export function getMealsForDate(meals: Meal[], date: string): Meal[] {
  return meals.filter((m) => m.dateTime.startsWith(date));
}

export function sumMealTotals(meals: Meal[]): NutritionTotals {
  return meals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat,
      saturatedFat: acc.saturatedFat + (m.saturatedFat ?? 0),
      fibre: acc.fibre + m.fibre,
      sugar: acc.sugar + (m.sugar ?? 0),
      salt: acc.salt + (m.salt ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, saturatedFat: 0, fibre: 0, sugar: 0, salt: 0 }
  );
}

export function getTodayNutrition(meals: Meal[]): NutritionTotals {
  return sumMealTotals(getMealsForDate(meals, todayISO()));
}

export function getCaloriesRemaining(consumed: number, target?: number): number {
  if (!target) return 0;
  return Math.max(0, target - consumed);
}

export function sumWaterForDate(entries: WaterEntry[], date: string): number {
  return entries.filter((e) => e.dateTime.startsWith(date)).reduce((s, e) => s + e.amountMl, 0);
}

export function getTodayWater(entries: WaterEntry[]): number {
  return sumWaterForDate(entries, todayISO());
}

export function hasModule(modules: ProfileModule[], mod: ProfileModule): boolean {
  return modules.includes(mod);
}

export function isDigestiveProfile(profile: Profile): boolean {
  return (
    profile.enabledModules.includes('digestive') ||
    profile.enabledModules.includes('healthIssues')
  );
}

export function isMacroFocusedProfile(profile: Profile): boolean {
  return (
    profile.enabledModules.includes('macros') &&
    !!(profile.carbTarget || profile.fatTarget || profile.fibreTarget)
  );
}
