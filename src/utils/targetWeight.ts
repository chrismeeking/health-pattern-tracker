import type { GoalType } from '@/types';
import { calculateBmi, weightKgFromBmi } from './bmi';

/** NHS healthy range — reference only; suggestions use a higher floor. */
export const NHS_BMI_HEALTHY = { min: 18.5, max: 24.9 } as const;

/** Prudent minimum — avoids pushing toward the bottom of the NHS range. */
export const SUGGESTED_BMI_FLOOR = 20;

/** Comfortable mid-range target when a longer-term goal is shown. */
export const SUGGESTED_BMI_MID = 22.5;

export interface TargetWeightOption {
  kg: number;
  label: string;
  detail: string;
  bmi: number;
}

export interface TargetWeightSuggestion {
  primary: TargetWeightOption;
  alternatives: TargetWeightOption[];
  disclaimer: string;
}

function roundKg(kg: number): number {
  return Math.round(kg * 10) / 10;
}

function option(kg: number, label: string, detail: string, heightCm: number): TargetWeightOption {
  const bmi = calculateBmi(kg, heightCm) ?? 0;
  return { kg: roundKg(kg), label, detail, bmi };
}

function withFloor(kg: number, heightCm: number, currentKg: number, maxLossFraction: number): number {
  const floorKg = weightKgFromBmi(SUGGESTED_BMI_FLOOR, heightCm) ?? currentKg;
  const minFromLossCap = currentKg * (1 - maxLossFraction);
  return roundKg(Math.max(floorKg, minFromLossCap, kg));
}

function isLossGoal(goalType: GoalType): boolean {
  return (
    goalType === 'slowWeightLoss' ||
    goalType === 'moderateWeightLoss' ||
    goalType === 'fattyLiverSupport'
  );
}

const DISCLAIMER =
  'Based on NHS healthy weight guidance (BMI 18.5–24.9). BMI is a rough guide — muscle, age, and fitness matter too, so we suggest conservative targets (BMI 20+) rather than the lowest “healthy” weight.';

/**
 * Suggest a target weight from height, current weight, and goal.
 * Caps single-step loss at 5% (gentle) or 10% (NHS-cited first goal) and never below BMI 20.
 */
export function getSuggestedTargetWeight(
  heightCm: number,
  currentWeightKg: number,
  goalType: GoalType
): TargetWeightSuggestion | null {
  if (!Number.isFinite(heightCm) || !Number.isFinite(currentWeightKg) || heightCm <= 0 || currentWeightKg <= 0) {
    return null;
  }

  const currentBmi = calculateBmi(currentWeightKg, heightCm);
  if (currentBmi == null) return null;

  const healthyUpperKg = weightKgFromBmi(NHS_BMI_HEALTHY.max, heightCm);
  const healthyMidKg = weightKgFromBmi(SUGGESTED_BMI_MID, heightCm);
  const floorKg = weightKgFromBmi(SUGGESTED_BMI_FLOOR, heightCm);

  if (floorKg == null || healthyUpperKg == null || healthyMidKg == null) return null;

  const alternatives: TargetWeightOption[] = [];

  // Under the prudent floor — suggest gain, not loss.
  if (currentBmi < SUGGESTED_BMI_FLOOR) {
    const primary = option(
      floorKg,
      'Toward BMI 20',
      'Below a healthy range — NHS guidance is to gain gradually, not lose more.',
      heightCm
    );
    return { primary, alternatives: [], disclaimer: DISCLAIMER };
  }

  // Already in healthy range.
  if (currentBmi < NHS_BMI_HEALTHY.max) {
    if (goalType === 'muscleGain') {
      const gainKg = roundKg(Math.min(currentWeightKg + 2, healthyUpperKg));
      const primary = option(
        gainKg,
        'Modest gain',
        'Small increase while staying in the healthy range.',
        heightCm
      );
      return { primary, alternatives: [], disclaimer: DISCLAIMER };
    }

    if (isLossGoal(goalType)) {
      const gentleKg = roundKg(Math.max(floorKg, currentWeightKg - 2));
      const primary = option(
        gentleKg,
        'Small step',
        'You are already in a healthy range — a 1–2 kg shift at most.',
        heightCm
      );
      return { primary, alternatives: [], disclaimer: DISCLAIMER };
    }

    const primary = option(
      currentWeightKg,
      'Maintain current',
      'Your weight is already in the NHS healthy range.',
      heightCm
    );
    return { primary, alternatives: [], disclaimer: DISCLAIMER };
  }

  // Above healthy range — loss goals get capped, conservative targets.
  const gentleKg = withFloor(currentWeightKg * 0.95, heightCm, currentWeightKg, 0.05);
  const nhsFirstGoalKg = withFloor(currentWeightKg * 0.9, heightCm, currentWeightKg, 0.1);
  const longTermUpperKg = roundKg(Math.max(floorKg, healthyUpperKg));

  if (goalType === 'slowWeightLoss' || goalType === 'generalHealth' || goalType === 'maintain') {
    const primary = option(
      gentleKg,
      'Gentle first step (~5%)',
      'NHS-style small loss — often easier to sustain than a big jump.',
      heightCm
    );
    alternatives.push(
      option(
        nhsFirstGoalKg,
        'NHS first goal (~10%)',
        'Many NHS plans cite 5–10% as an initial target.',
        heightCm
      )
    );
    if (longTermUpperKg < gentleKg - 1) {
      alternatives.push(
        option(
          longTermUpperKg,
          'Upper healthy range (BMI 24.9)',
          'Longer-term aim — beyond a typical first milestone.',
          heightCm
        )
      );
    }
    return { primary, alternatives, disclaimer: DISCLAIMER };
  }

  if (goalType === 'moderateWeightLoss' || goalType === 'fattyLiverSupport') {
    const primary = option(
      nhsFirstGoalKg,
      'NHS first goal (~10%)',
      goalType === 'fattyLiverSupport'
        ? 'NICE often recommends 5–10% loss for fatty liver — we cap at 10%.'
        : 'Matches NHS 12-week pace as a first milestone, not the lowest possible weight.',
      heightCm
    );
    alternatives.push(
      option(
        gentleKg,
        'Gentler (~5%)',
        'Smaller first step if 10% feels too much.',
        heightCm
      )
    );
    if (longTermUpperKg < nhsFirstGoalKg - 1) {
      alternatives.push(
        option(
          longTermUpperKg,
          'Upper healthy range (BMI 24.9)',
          'Longer-term — only when you are ready.',
          heightCm
        )
      );
    }
    return { primary, alternatives, disclaimer: DISCLAIMER };
  }

  if (goalType === 'muscleGain') {
    const primary = option(
      currentWeightKg,
      'Maintain while building',
      'Focus on strength first; weight may rise as muscle increases.',
      heightCm
    );
    return { primary, alternatives: [], disclaimer: DISCLAIMER };
  }

  // improveDigestion — no strong weight target; gentle if overweight.
  const primary = option(
    gentleKg,
    'Gentle step (~5%)',
    'Optional — digestion goals do not require weight loss, but a small shift can help some people.',
    heightCm
  );
  return { primary, alternatives: [], disclaimer: DISCLAIMER };
}
