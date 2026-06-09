import type { AppData, Profile } from '@/types';
import { getMealsForDate, sumMealTotals } from './nutrition';
import { getWeekStart } from './health';

export interface WeeklyNutritionSummary {
  avgCalories: number;
  calorieTarget: number;
  proteinHitDays: number;
  proteinTargetDays: number;
  daysOverCalories: number;
  daysUnderCalories: number;
  daysTracked: number;
}

export function getWeeklyNutritionSummary(
  data: AppData,
  profile: Profile
): WeeklyNutritionSummary {
  const weekStart = getWeekStart();
  const meals = data.meals.filter((m) => m.profileId === profile.id);
  const calorieTarget = profile.dailyCalorieTarget ?? 2000;
  const proteinTarget = profile.proteinTarget ?? 50;

  let daysTracked = 0;
  let totalCalories = 0;
  let proteinHitDays = 0;
  let daysOverCalories = 0;
  let daysUnderCalories = 0;
  let proteinTargetDays = 0;

  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    if (d > new Date()) break;

    const dateStr = d.toISOString().split('T')[0];
    const dayMeals = getMealsForDate(meals, dateStr);
    if (dayMeals.length === 0) continue;

    daysTracked += 1;
    const totals = sumMealTotals(dayMeals);
    totalCalories += totals.calories;

    if (totals.protein >= proteinTarget) proteinHitDays += 1;
    proteinTargetDays += 1;

    if (totals.calories > calorieTarget * 1.05) daysOverCalories += 1;
    if (totals.calories < calorieTarget * 0.85) daysUnderCalories += 1;
  }

  return {
    avgCalories: daysTracked > 0 ? Math.round(totalCalories / daysTracked) : 0,
    calorieTarget,
    proteinHitDays,
    proteinTargetDays: proteinTargetDays || daysTracked,
    daysOverCalories,
    daysUnderCalories,
    daysTracked,
  };
}
