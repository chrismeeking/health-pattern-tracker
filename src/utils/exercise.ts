import type { ExerciseEntry, ExerciseType, Profile } from '@/types';
import { todayISO } from './helpers';

/**
 * MET values (Metabolic Equivalent of Task) — standard compendium estimates.
 * Calories burned ≈ MET × weight(kg) × hours.
 * NHS apps and clinical tools use the same MET-based approach for activity estimates.
 */
export const EXERCISE_MET: Record<ExerciseType, number> = {
  walking: 3.5,
  briskWalking: 4.3,
  running: 8.0,
  cycling: 6.0,
  swimming: 6.0,
  gym: 5.0,
  yoga: 2.5,
  pilates: 3.0,
  reformerPilates: 4.0,
  housework: 3.0,
  other: 4.0,
};

export const EXERCISE_LABELS: Record<ExerciseType, string> = {
  walking: 'Walking',
  briskWalking: 'Brisk walking',
  running: 'Running / jogging',
  cycling: 'Cycling',
  swimming: 'Swimming',
  gym: 'Gym / weights',
  yoga: 'Yoga',
  pilates: 'Mat pilates',
  reformerPilates: 'Reformer pilates',
  housework: 'Housework / gardening',
  other: 'Other activity',
};

export function estimateCaloriesBurned(
  activity: ExerciseType,
  durationMinutes: number,
  weightKg: number
): number {
  if (durationMinutes <= 0 || weightKg <= 0) return 0;
  const met = EXERCISE_MET[activity];
  const hours = durationMinutes / 60;
  return Math.round(met * weightKg * hours);
}

export function getExerciseEntriesForDate(
  entries: ExerciseEntry[],
  date: string
): ExerciseEntry[] {
  return entries.filter((e) => e.dateTime.startsWith(date));
}

export function getTodayExerciseBurn(entries: ExerciseEntry[]): number {
  return getExerciseEntriesForDate(entries, todayISO()).reduce(
    (sum, e) => sum + e.caloriesBurned,
    0
  );
}

export function resolveExerciseCalories(
  activity: ExerciseType,
  durationMinutes: number,
  profile: Profile,
  manualCalories?: number
): number {
  if (manualCalories != null && manualCalories > 0) {
    return Math.round(manualCalories);
  }
  const weight = profile.currentWeight ?? 70;
  return estimateCaloriesBurned(activity, durationMinutes, weight);
}
