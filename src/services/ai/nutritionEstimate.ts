import type { ConfidenceLevel } from '@/types';
import { getScaledGenericEstimate, matchUkMeal } from '@/data/ukMealDatabase';

export interface NutritionEstimate {
  estimatedCalories: number;
  protein: number;
  carbs: number;
  fat: number;
  saturatedFat: number;
  fibre: number;
  sugar: number;
  salt: number;
  confidence: ConfidenceLevel;
  sourceLabel?: string;
}

/**
 * Estimate nutrition from meal description text.
 * Uses the UK meal database first, then a cautious generic fallback.
 */
export function estimateNutrition(text: string, mealName?: string): NutritionEstimate {
  const combined = `${text} ${mealName ?? ''}`.trim();
  if (!combined) {
    const generic = getScaledGenericEstimate('');
    return { ...generic };
  }

  const dbMatch = matchUkMeal(combined);
  if (dbMatch) {
    return {
      estimatedCalories: dbMatch.calories,
      protein: dbMatch.protein,
      carbs: dbMatch.carbs,
      fat: dbMatch.fat,
      saturatedFat: dbMatch.saturatedFat,
      fibre: dbMatch.fibre,
      sugar: dbMatch.sugar,
      salt: dbMatch.salt,
      confidence: dbMatch.confidence,
      sourceLabel: dbMatch.sourceLabel,
    };
  }

  return getScaledGenericEstimate(combined);
}
