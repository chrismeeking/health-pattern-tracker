import type { GoalType, Profile } from '@/types';

type TargetFields = Pick<
  Profile,
  | 'dailyCalorieTarget'
  | 'proteinTarget'
  | 'carbTarget'
  | 'fatTarget'
  | 'fibreTarget'
  | 'waterTarget'
>;

export interface SuggestedNutritionTargets extends Required<TargetFields> {
  calorieBasis: string;
  macroBasis: string;
}

const ACTIVITY_FACTORS: Record<Profile['activityLevel'], number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
};

const FALLBACK_CALORIES: Record<NonNullable<Profile['sex']>, number> = {
  male: 2200,
  female: 1800,
  other: 2000,
  preferNotToSay: 2000,
};

const GOAL_CALORIE_MULTIPLIER: Record<GoalType, number> = {
  maintain: 1,
  slowWeightLoss: 0.85,
  improveDigestion: 1,
  fattyLiverSupport: 0.9,
  muscleGain: 1.1,
  generalHealth: 1,
};

const GOAL_PROTEIN_PER_KG: Record<GoalType, number> = {
  maintain: 1.4,
  slowWeightLoss: 1.6,
  improveDigestion: 1.4,
  fattyLiverSupport: 1.6,
  muscleGain: 1.8,
  generalHealth: 1.3,
};

const GOAL_FAT_PERCENT: Record<GoalType, number> = {
  maintain: 0.3,
  slowWeightLoss: 0.3,
  improveDigestion: 0.28,
  fattyLiverSupport: 0.25,
  muscleGain: 0.28,
  generalHealth: 0.3,
};

const GOAL_FIBRE_TARGET: Record<GoalType, number> = {
  maintain: 30,
  slowWeightLoss: 32,
  improveDigestion: 35,
  fattyLiverSupport: 35,
  muscleGain: 30,
  generalHealth: 30,
};

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function estimateMaintenanceCalories(profile: Profile): { calories: number; basis: string } {
  const { currentWeight, height, age, sex } = profile;
  const factor = ACTIVITY_FACTORS[profile.activityLevel];

  if (currentWeight && height && age && (sex === 'male' || sex === 'female')) {
    const sexAdjustment = sex === 'male' ? 5 : -161;
    const bmr = 10 * currentWeight + 6.25 * height - 5 * age + sexAdjustment;
    return {
      calories: bmr * factor,
      basis: 'Estimated from weight, height, age, sex, and activity.',
    };
  }

  const fallback = FALLBACK_CALORIES[sex ?? 'preferNotToSay'];
  const weightAdjustment = currentWeight ? clamp((currentWeight - 75) * 8, -250, 350) : 0;
  return {
    calories: (fallback + weightAdjustment) * (factor / ACTIVITY_FACTORS.moderate),
    basis: 'Estimated from goal and activity; add age, height, sex, and weight for a better target.',
  };
}

export function getSuggestedNutritionTargets(profile: Profile): SuggestedNutritionTargets {
  const maintenance = estimateMaintenanceCalories(profile);
  const calorieMultiplier = GOAL_CALORIE_MULTIPLIER[profile.goalType];
  const dailyCalorieTarget = clamp(roundTo(maintenance.calories * calorieMultiplier, 50), 1200, 3800);

  const referenceWeight =
    profile.currentWeight && profile.targetWeight
      ? Math.min(profile.currentWeight, Math.max(profile.targetWeight, profile.currentWeight * 0.85))
      : profile.currentWeight ?? profile.targetWeight ?? 75;

  const proteinTarget = roundTo(referenceWeight * GOAL_PROTEIN_PER_KG[profile.goalType], 5);
  const fatTarget = roundTo((dailyCalorieTarget * GOAL_FAT_PERCENT[profile.goalType]) / 9, 5);
  const carbCalories = Math.max(0, dailyCalorieTarget - proteinTarget * 4 - fatTarget * 9);
  const carbTarget = roundTo(carbCalories / 4, 5);
  const fibreTarget = GOAL_FIBRE_TARGET[profile.goalType];
  const waterTarget = clamp(roundTo((profile.currentWeight ?? 70) * 32, 100), 1800, 3500);

  return {
    dailyCalorieTarget,
    proteinTarget,
    carbTarget,
    fatTarget,
    fibreTarget,
    waterTarget,
    calorieBasis: maintenance.basis,
    macroBasis: 'Macros are adjusted from the selected goal type and body weight where available.',
  };
}

export function suggestedTargetsToProfileFields(
  targets: SuggestedNutritionTargets
): Required<TargetFields> {
  return {
    dailyCalorieTarget: targets.dailyCalorieTarget,
    proteinTarget: targets.proteinTarget,
    carbTarget: targets.carbTarget,
    fatTarget: targets.fatTarget,
    fibreTarget: targets.fibreTarget,
    waterTarget: targets.waterTarget,
  };
}
