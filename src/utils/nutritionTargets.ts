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
  guidanceNotes: string[];
}

/** UK reference values used in target calculations (see guidanceNotes for sources). */
export const NHS_REFERENCE = {
  /** NHS 12-week weight loss plan — typical daily cap for women */
  minCaloriesFemale: 1400,
  /** NHS 12-week weight loss plan — typical daily cap for men */
  minCaloriesMale: 1900,
  /** SACN / NHS — adults should aim for at least 30 g fibre/day */
  fibreGrams: 30,
  /** UK RNI — 0.75 g protein per kg body weight */
  proteinRniPerKg: 0.75,
  /** Higher protein in a calorie deficit to preserve muscle (BNF / NHS weight-loss guidance) */
  proteinWeightLossPerKg: 1.2,
  /** BHF reference intake — saturated fat (women, ~2000 kcal reference diet) */
  saturatedFatFemale: 20,
  /** BHF reference intake — saturated fat (men) */
  saturatedFatMale: 30,
  /** NHS — drink 6–8 glasses (~1.2 L) fluids daily as a minimum */
  waterMinMl: 1200,
  /** NICE CG189 / NHS — ~600 kcal/day deficit for ~0.5–1 kg/week loss */
  standardDeficitKcal: 600,
  /** Gentler deficit — roughly half the NHS pace */
  gentleDeficitKcal: 300,
} as const;

const ACTIVITY_FACTORS: Record<Profile['activityLevel'], number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
};

const FALLBACK_CALORIES: Record<NonNullable<Profile['sex']>, number> = {
  male: 2500,
  female: 2000,
  other: 2200,
  preferNotToSay: 2200,
};

/** Daily calorie adjustment from estimated maintenance (kcal). Negative = surplus. */
const GOAL_CALORIE_ADJUSTMENT: Record<GoalType, number> = {
  maintain: 0,
  slowWeightLoss: NHS_REFERENCE.gentleDeficitKcal,
  moderateWeightLoss: NHS_REFERENCE.standardDeficitKcal,
  improveDigestion: 0,
  fattyLiverSupport: 400,
  muscleGain: -250,
  generalHealth: 0,
};

const GOAL_PROTEIN_PER_KG: Record<GoalType, number> = {
  maintain: 0.75,
  slowWeightLoss: NHS_REFERENCE.proteinWeightLossPerKg,
  moderateWeightLoss: NHS_REFERENCE.proteinWeightLossPerKg,
  improveDigestion: 0.75,
  fattyLiverSupport: 1.2,
  muscleGain: 1.6,
  generalHealth: 0.75,
};

/** Total fat as share of calories — aligned with NHS/BHF balanced diet (~70 g fat on 2000 kcal). */
const GOAL_FAT_PERCENT: Record<GoalType, number> = {
  maintain: 0.35,
  slowWeightLoss: 0.3,
  moderateWeightLoss: 0.3,
  improveDigestion: 0.28,
  fattyLiverSupport: 0.25,
  muscleGain: 0.28,
  generalHealth: 0.35,
};

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isWeightLossGoal(goalType: GoalType): boolean {
  return (
    goalType === 'slowWeightLoss' ||
    goalType === 'moderateWeightLoss' ||
    goalType === 'fattyLiverSupport'
  );
}

function estimateMaintenanceCalories(profile: Profile): { calories: number; basis: string } {
  const { currentWeight, height, age, sex } = profile;
  const factor = ACTIVITY_FACTORS[profile.activityLevel];

  if (currentWeight && height && age && (sex === 'male' || sex === 'female')) {
    const sexAdjustment = sex === 'male' ? 5 : -161;
    const bmr = 10 * currentWeight + 6.25 * height - 5 * age + sexAdjustment;
    return {
      calories: bmr * factor,
      basis:
        'Maintenance estimated with Mifflin–St Jeor BMR × activity factor (same approach as NHS BMI tools).',
    };
  }

  const fallback = FALLBACK_CALORIES[sex ?? 'preferNotToSay'];
  const weightAdjustment = currentWeight ? clamp((currentWeight - 75) * 8, -250, 350) : 0;
  return {
    calories: (fallback + weightAdjustment) * (factor / ACTIVITY_FACTORS.moderate),
    basis:
      'Add age, height, sex, and weight for an NHS-style personalised estimate; using average UK intake until then.',
  };
}

function applyNhsCalorieFloors(
  target: number,
  profile: Profile,
  goalType: GoalType
): { calories: number; note?: string } {
  if (!isWeightLossGoal(goalType) && goalType !== 'fattyLiverSupport') {
    return { calories: target };
  }

  let floored = target;
  let note: string | undefined;

  if (profile.sex === 'female') {
    floored = Math.max(floored, NHS_REFERENCE.minCaloriesFemale);
    note = `Floored at NHS 12-week plan minimum (${NHS_REFERENCE.minCaloriesFemale} kcal/day for women).`;
  } else if (profile.sex === 'male') {
    floored = Math.max(floored, NHS_REFERENCE.minCaloriesMale);
    note = `Floored at NHS 12-week plan minimum (${NHS_REFERENCE.minCaloriesMale} kcal/day for men).`;
  } else if (isWeightLossGoal(goalType)) {
    floored = Math.max(floored, 1500);
    note = 'Floored at 1500 kcal/day safety minimum for weight loss.';
  }

  return { calories: floored, note };
}

function buildGuidanceNotes(profile: Profile, goalType: GoalType, floorNote?: string): string[] {
  const notes = [
    'Calories: NICE CG189 / NHS weight-loss guidance supports ~600 kcal/day deficit for ~0.5–1 kg/week (moderate goal).',
    `Fibre: ${NHS_REFERENCE.fibreGrams} g/day — SACN / NHS recommendation.`,
    `Protein: UK RNI is ${NHS_REFERENCE.proteinRniPerKg} g/kg; higher in a deficit (${NHS_REFERENCE.proteinWeightLossPerKg} g/kg) per NHS/BNF weight-loss guidance.`,
    `Fluids: at least ${NHS_REFERENCE.waterMinMl} ml/day — NHS minimum; target scales with body weight.`,
  ];

  if (goalType === 'slowWeightLoss') {
    notes.unshift(
      `Gentle weight loss uses a ~${NHS_REFERENCE.gentleDeficitKcal} kcal/day deficit — slower than the NHS standard pace.`
    );
  }
  if (goalType === 'moderateWeightLoss') {
    notes.unshift(
      `Weight loss (NHS pace) uses a ~${NHS_REFERENCE.standardDeficitKcal} kcal/day deficit — NHS 12-week plan / NICE CG189.`
    );
  }
  if (floorNote) notes.push(floorNote);

  if (profile.sex === 'female' || profile.sex === 'male') {
    const satCap =
      profile.sex === 'female'
        ? NHS_REFERENCE.saturatedFatFemale
        : NHS_REFERENCE.saturatedFatMale;
    notes.push(`Saturated fat: aim below ${satCap} g/day — BHF / NHS reference intake.`);
  }

  return notes;
}

export function getSuggestedNutritionTargets(profile: Profile): SuggestedNutritionTargets {
  const maintenance = estimateMaintenanceCalories(profile);
  const adjustment = GOAL_CALORIE_ADJUSTMENT[profile.goalType];
  const rawTarget = maintenance.calories - adjustment;
  const { calories: flooredTarget, note: floorNote } = applyNhsCalorieFloors(
    rawTarget,
    profile,
    profile.goalType
  );
  const dailyCalorieTarget = clamp(roundTo(flooredTarget, 50), 1200, 3800);

  const referenceWeight =
    profile.currentWeight && profile.targetWeight
      ? Math.min(profile.currentWeight, Math.max(profile.targetWeight, profile.currentWeight * 0.85))
      : profile.currentWeight ?? profile.targetWeight ?? 75;

  const proteinTarget = roundTo(referenceWeight * GOAL_PROTEIN_PER_KG[profile.goalType], 5);
  const fatTarget = roundTo((dailyCalorieTarget * GOAL_FAT_PERCENT[profile.goalType]) / 9, 5);
  const carbCalories = Math.max(0, dailyCalorieTarget - proteinTarget * 4 - fatTarget * 9);
  const carbTarget = roundTo(carbCalories / 4, 5);
  const fibreTarget = NHS_REFERENCE.fibreGrams;
  const waterTarget = clamp(
    roundTo(Math.max(NHS_REFERENCE.waterMinMl, (profile.currentWeight ?? 70) * 35), 100),
    NHS_REFERENCE.waterMinMl,
    3500
  );

  const deficitLabel =
    profile.goalType === 'moderateWeightLoss'
      ? `~${NHS_REFERENCE.standardDeficitKcal} kcal/day below maintenance (NHS / NICE pace).`
      : profile.goalType === 'slowWeightLoss'
        ? `~${NHS_REFERENCE.gentleDeficitKcal} kcal/day below maintenance (gentler than NHS standard).`
        : adjustment > 0
          ? `~${adjustment} kcal/day below maintenance.`
          : adjustment < 0
            ? `~${Math.abs(adjustment)} kcal/day above maintenance.`
            : 'Matches estimated maintenance.';

  return {
    dailyCalorieTarget,
    proteinTarget,
    carbTarget,
    fatTarget,
    fibreTarget,
    waterTarget,
    calorieBasis: `${maintenance.basis} ${deficitLabel}`,
    macroBasis:
      'Protein, fat, carbs, and fibre follow UK RNI / SACN / NHS weight-loss guidance — not arbitrary guesses.',
    guidanceNotes: buildGuidanceNotes(profile, profile.goalType, floorNote),
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
