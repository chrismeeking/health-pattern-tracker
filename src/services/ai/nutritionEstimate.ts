import type { ConfidenceLevel } from '@/types';

export interface NutritionEstimate {
  estimatedCalories: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
  sugar: number;
  salt: number;
  confidence: ConfidenceLevel;
}

interface NutritionPreset {
  match: (text: string) => boolean;
  estimate: NutritionEstimate;
}

const PRESETS: NutritionPreset[] = [
  {
    match: (t) => /pepperoni\s+pizza|pizza.*pepperoni/i.test(t),
    estimate: {
      estimatedCalories: 850,
      protein: 35,
      carbs: 85,
      fat: 38,
      fibre: 4,
      sugar: 8,
      salt: 2.5,
      confidence: 'medium',
    },
  },
  {
    match: (t) => /thai\s+green\s+curry|green\s+curry.*rice/i.test(t),
    estimate: {
      estimatedCalories: 650,
      protein: 30,
      carbs: 70,
      fat: 28,
      fibre: 5,
      sugar: 6,
      salt: 2,
      confidence: 'medium',
    },
  },
  {
    match: (t) => /roast\s+dinner|sunday\s+roast/i.test(t),
    estimate: {
      estimatedCalories: 750,
      protein: 40,
      carbs: 80,
      fat: 25,
      fibre: 8,
      sugar: 5,
      salt: 1.8,
      confidence: 'medium',
    },
  },
];

const GENERIC_ESTIMATE: NutritionEstimate = {
  estimatedCalories: 500,
  protein: 20,
  carbs: 50,
  fat: 18,
  fibre: 4,
  sugar: 8,
  salt: 1.5,
  confidence: 'low',
};

/**
 * Estimate nutrition from meal description text.
 * Returns cautious generic values for unknown meals.
 */
export function estimateNutrition(text: string, mealName?: string): NutritionEstimate {
  const combined = `${text} ${mealName ?? ''}`.trim().toLowerCase();
  if (!combined) return { ...GENERIC_ESTIMATE };

  for (const preset of PRESETS) {
    if (preset.match(combined)) {
      return { ...preset.estimate };
    }
  }

  const wordCount = combined.split(/\s+/).length;
  const scale = Math.min(1.4, 0.8 + wordCount * 0.05);

  return {
    estimatedCalories: Math.round(GENERIC_ESTIMATE.estimatedCalories * scale),
    protein: Math.round(GENERIC_ESTIMATE.protein * scale),
    carbs: Math.round(GENERIC_ESTIMATE.carbs * scale),
    fat: Math.round(GENERIC_ESTIMATE.fat * scale),
    fibre: GENERIC_ESTIMATE.fibre,
    sugar: GENERIC_ESTIMATE.sugar,
    salt: GENERIC_ESTIMATE.salt,
    confidence: 'low',
  };
}
