import type { AppData, GoalCategory, Profile, WeightEntry } from '@/types';
import { getMealsForDate, sumMealTotals } from './nutrition';

export interface WeeklyProgress {
  avgCalories: number;
  avgProtein: number;
  waterTargetDays: number;
  waterTargetTotal: number;
  weightChange: number | null;
  latestWeight: number | null;
  symptomsThisWeek: number;
  severeThisWeek: number;
  goalsCompleted: number;
  daysWithMeals: number;
}

export interface WeightSummary {
  latest: number | null;
  target: number | null;
  weekChange: number | null;
  monthChange: number | null;
  entries: WeightEntry[];
}

export interface SuggestedGoal {
  title: string;
  description: string;
  category: GoalCategory;
  difficulty: 'easy' | 'medium';
}

export function getWeekStart(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const start = new Date(now);
  start.setDate(now.getDate() - diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function getMonthStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function getWeightChange(entries: WeightEntry[], since: Date): number | null {
  const sorted = [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  if (sorted.length < 2) return null;
  const recent = sorted[sorted.length - 1];
  const baseline =
    sorted.find((e) => new Date(e.date) >= since) ?? sorted[0];
  return Math.round((recent.weight - baseline.weight) * 10) / 10;
}

export function getWeightSummary(
  entries: WeightEntry[],
  profile: Profile
): WeightSummary {
  const sorted = [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const latest = sorted[sorted.length - 1]?.weight ?? profile.currentWeight ?? null;

  return {
    latest: latest ?? null,
    target: profile.targetWeight ?? null,
    weekChange: getWeightChange(entries, getWeekStart()),
    monthChange: getWeightChange(entries, getMonthStart()),
    entries: sorted,
  };
}

export function getWeeklyProgress(data: AppData, profileId: string): WeeklyProgress {
  const weekStart = getWeekStart();
  const profile = data.profiles.find((p) => p.id === profileId);
  const meals = data.meals.filter((m) => m.profileId === profileId);
  const water = data.waterEntries.filter((w) => w.profileId === profileId);
  const episodes = data.symptomEpisodes.filter((s) => s.profileId === profileId);
  const goals = data.goals.filter((g) => g.profileId === profileId);
  const weights = data.weightEntries.filter((w) => w.profileId === profileId);

  const weekMeals = meals.filter(
    (m) => new Date(m.dateTime) >= weekStart
  );

  const daysWithData = new Set(
    weekMeals.map((m) => m.dateTime.split('T')[0])
  );
  const dayTotals = [...daysWithData].map((date) =>
    sumMealTotals(getMealsForDate(weekMeals, date))
  );

  const avgCalories =
    dayTotals.length > 0
      ? Math.round(dayTotals.reduce((s, t) => s + t.calories, 0) / dayTotals.length)
      : 0;
  const avgProtein =
    dayTotals.length > 0
      ? Math.round(dayTotals.reduce((s, t) => s + t.protein, 0) / dayTotals.length)
      : 0;

  const waterTarget = profile?.waterTarget ?? 2000;
  let waterTargetDays = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    if (d > new Date()) break;
    const dateStr = d.toISOString().split('T')[0];
    const dayWater = water
      .filter((e) => e.dateTime.startsWith(dateStr))
      .reduce((s, e) => s + e.amountMl, 0);
    if (dayWater >= waterTarget) waterTargetDays += 1;
  }

  const weekEpisodes = episodes.filter((e) => new Date(e.startDateTime) >= weekStart);
  const severeThisWeek = weekEpisodes.filter((e) => e.severity === 'severe').length;

  const goalsCompleted = goals.filter(
    (g) =>
      g.status === 'completed' &&
      g.completedAt &&
      new Date(g.completedAt) >= weekStart
  ).length;

  const weightSummary = getWeightSummary(weights, profile!);

  return {
    avgCalories,
    avgProtein,
    waterTargetDays,
    waterTargetTotal: 7,
    weightChange: weightSummary.weekChange,
    latestWeight: weightSummary.latest,
    symptomsThisWeek: weekEpisodes.length,
    severeThisWeek,
    goalsCompleted,
    daysWithMeals: daysWithData.size,
  };
}

const DIGESTIVE_GOAL_SUGGESTIONS: SuggestedGoal[] = [
  {
    title: 'Choose one non-tomato evening meal this week',
    description: 'A small experiment to observe how you feel.',
    category: 'digestion',
    difficulty: 'easy',
  },
  {
    title: 'Try one smaller portion',
    description: 'Pick one meal and try a normal portion instead of large.',
    category: 'portion',
    difficulty: 'easy',
  },
  {
    title: 'Avoid pepperoni pizza for one week and observe symptoms',
    description: 'Track how you feel — a pattern experiment, not a rule.',
    category: 'digestion',
    difficulty: 'medium',
  },
  {
    title: 'Try spicy non-tomato food and track symptoms',
    description: 'See if spice alone is tolerated without tomato.',
    category: 'digestion',
    difficulty: 'medium',
  },
  {
    title: 'Eat earlier one night this week',
    description: 'One lighter, earlier evening meal as a small improvement.',
    category: 'digestion',
    difficulty: 'easy',
  },
  {
    title: 'Have one lighter takeaway option',
    description: 'Swap one takeaway side for something simpler.',
    category: 'takeaway',
    difficulty: 'easy',
  },
  {
    title: 'Add a short walk after dinner',
    description: 'A small movement experiment after one evening meal.',
    category: 'movement',
    difficulty: 'easy',
  },
];

const NUTRITION_GOAL_SUGGESTIONS: SuggestedGoal[] = [
  {
    title: 'Increase protein by 10g per day',
    description: 'A small daily improvement toward your protein target.',
    category: 'protein',
    difficulty: 'easy',
  },
  {
    title: 'Hit fibre target 3 days this week',
    description: 'Aim for your fibre goal on three separate days.',
    category: 'fibre',
    difficulty: 'medium',
  },
  {
    title: 'Drink more water today',
    description: 'Try to reach your water target today.',
    category: 'hydration',
    difficulty: 'easy',
  },
  {
    title: 'Track breakfast for 5 days',
    description: 'Build consistency with a simple logging habit.',
    category: 'calories',
    difficulty: 'easy',
  },
  {
    title: 'Replace one takeaway side this week',
    description: 'One small swap — progress, not perfection.',
    category: 'takeaway',
    difficulty: 'easy',
  },
  {
    title: 'Try one smaller portion',
    description: 'Experiment with portion size at one meal.',
    category: 'portion',
    difficulty: 'easy',
  },
];

export function getSuggestedGoals(profile: Profile, existingTitles: string[]): SuggestedGoal[] {
  const isDigestive =
    profile.enabledModules.includes('digestive') ||
    profile.enabledModules.includes('healthIssues');
  const pool = isDigestive ? DIGESTIVE_GOAL_SUGGESTIONS : NUTRITION_GOAL_SUGGESTIONS;

  return pool
    .filter((s) => !existingTitles.some((t) => t.toLowerCase() === s.title.toLowerCase()))
    .slice(0, 4);
}

export function isDigestiveProfile(profile: Profile): boolean {
  return (
    profile.enabledModules.includes('digestive') ||
    profile.enabledModules.includes('healthIssues') ||
    profile.goalType === 'improveDigestion' ||
    profile.goalType === 'fattyLiverSupport'
  );
}

export function isNutritionFocusedProfile(profile: Profile): boolean {
  return (
    profile.enabledModules.includes('macros') ||
    profile.goalType === 'slowWeightLoss' ||
    profile.goalType === 'moderateWeightLoss' ||
    profile.goalType === 'muscleGain'
  );
}
