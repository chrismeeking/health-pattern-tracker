import type { AppData, Insight, Profile } from '@/types';
import { getWeeklyProgress, getWeekStart } from '@/utils/health';
import { getMealsForDate, sumMealTotals } from '@/utils/nutrition';
import { hasModule, hasProgressInsights } from '@/utils/profileModules';

function weekMealAverages(data: AppData, profileId: string) {
  const weekStart = getWeekStart();
  const meals = data.meals.filter(
    (m) => m.profileId === profileId && new Date(m.dateTime) >= weekStart
  );
  const days = [...new Set(meals.map((m) => m.dateTime.split('T')[0]))];
  if (days.length === 0) {
    return { days: 0, avgCalories: 0, avgProtein: 0, avgFibre: 0, avgCarbs: 0, avgFat: 0 };
  }
  const totals = days.map((date) => sumMealTotals(getMealsForDate(meals, date)));
  const count = totals.length;
  return {
    days: count,
    avgCalories: Math.round(totals.reduce((s, t) => s + t.calories, 0) / count),
    avgProtein: Math.round(totals.reduce((s, t) => s + t.protein, 0) / count),
    avgFibre: Math.round(totals.reduce((s, t) => s + t.fibre, 0) / count),
    avgCarbs: Math.round(totals.reduce((s, t) => s + t.carbs, 0) / count),
    avgFat: Math.round(totals.reduce((s, t) => s + t.fat, 0) / count),
  };
}

export function generateProgressInsights(data: AppData, profile: Profile): Insight[] {
  if (!hasProgressInsights(profile)) return [];

  const progress = getWeeklyProgress(data, profile.id);
  const averages = weekMealAverages(data, profile.id);
  const insights: Insight[] = [];

  if (averages.days < 2) {
    insights.push({
      id: 'progress-early',
      title: 'Building your weekly picture',
      description: 'Log meals on a few more days this week to unlock calorie and macro progress insights.',
      confidence: 'low',
      category: 'early',
      dataPoints: averages.days,
    });
    return insights;
  }

  if (hasModule(profile, 'macros') && profile.proteinTarget) {
    const target = profile.proteinTarget;
    const avg = progress.avgProtein || averages.avgProtein;
    if (avg < target * 0.85) {
      insights.push({
        id: 'protein-low-week',
        title: 'Protein below target this week',
        description: `Averaging ${avg}g protein per day vs your ${target}g target. Small swaps (yogurt, eggs, lean meat) can help.`,
        confidence: averages.days >= 5 ? 'medium' : 'low',
        category: 'progress',
        dataPoints: averages.days,
      });
    } else if (avg >= target) {
      insights.push({
        id: 'protein-on-track',
        title: 'Protein on track this week',
        description: `Averaging ${avg}g protein per day — at or above your ${target}g target.`,
        confidence: averages.days >= 5 ? 'medium' : 'low',
        category: 'progress',
        dataPoints: averages.days,
      });
    }
  }

  if (hasModule(profile, 'nutrition') && profile.dailyCalorieTarget) {
    const target = profile.dailyCalorieTarget;
    const avg = progress.avgCalories || averages.avgCalories;
    const diff = avg - target;
    if (Math.abs(diff) > target * 0.12) {
      insights.push({
        id: diff > 0 ? 'calories-over-week' : 'calories-under-week',
        title: diff > 0 ? 'Calories above target this week' : 'Calories below target this week',
        description: `Daily average ${avg} kcal vs ${target} kcal target (${diff > 0 ? '+' : ''}${diff} kcal).`,
        confidence: averages.days >= 5 ? 'medium' : 'low',
        category: 'progress',
        dataPoints: averages.days,
      });
    } else {
      insights.push({
        id: 'calories-on-track',
        title: 'Calories near target this week',
        description: `Daily average ${avg} kcal — close to your ${target} kcal target.`,
        confidence: averages.days >= 5 ? 'medium' : 'low',
        category: 'progress',
        dataPoints: averages.days,
      });
    }
  }

  if (hasModule(profile, 'macros') && profile.fibreTarget && averages.avgFibre > 0) {
    const target = profile.fibreTarget;
    if (averages.avgFibre < target * 0.8) {
      insights.push({
        id: 'fibre-low-week',
        title: 'Fibre below target this week',
        description: `Averaging ${averages.avgFibre}g fibre vs ${target}g target. Veg, beans, and whole grains can help.`,
        confidence: 'low',
        category: 'progress',
        dataPoints: averages.days,
      });
    }
  }

  if (hasModule(profile, 'weight') && progress.weightChange != null) {
    const change = progress.weightChange;
    insights.push({
      id: 'weight-week-change',
      title: change === 0 ? 'Weight stable this week' : change > 0 ? 'Weight up this week' : 'Weight down this week',
      description:
        change === 0
          ? `Holding steady at ${progress.latestWeight ?? '—'} kg.`
          : `${change > 0 ? '+' : ''}${change} kg since the start of the week${progress.latestWeight != null ? ` (now ${progress.latestWeight} kg)` : ''}.`,
      confidence: 'medium',
      category: 'progress',
      dataPoints: 1,
    });
  }

  if (hasModule(profile, 'water') && profile.waterTarget) {
    if (progress.waterTargetDays >= 4) {
      insights.push({
        id: 'water-good-week',
        title: 'Hydration going well',
        description: `Hit your water target ${progress.waterTargetDays} of ${progress.waterTargetTotal} days this week.`,
        confidence: 'medium',
        category: 'progress',
        dataPoints: progress.waterTargetDays,
      });
    } else if (progress.waterTargetDays <= 1 && progress.daysWithMeals >= 2) {
      insights.push({
        id: 'water-low-week',
        title: 'Water target missed most days',
        description: `Only ${progress.waterTargetDays} day${progress.waterTargetDays === 1 ? '' : 's'} at your ${profile.waterTarget} ml target so far this week.`,
        confidence: 'low',
        category: 'progress',
        dataPoints: progress.waterTargetDays,
      });
    }
  }

  if (hasModule(profile, 'goals') && progress.goalsCompleted > 0) {
    insights.push({
      id: 'goals-completed-week',
      title: 'Goals completed this week',
      description: `You completed ${progress.goalsCompleted} goal${progress.goalsCompleted > 1 ? 's' : ''} — nice progress.`,
      confidence: 'medium',
      category: 'progress',
      dataPoints: progress.goalsCompleted,
    });
  }

  if (insights.filter((i) => i.category === 'progress').length === 0 && insights.length === 0) {
    insights.push({
      id: 'progress-keep-going',
      title: 'Keep logging this week',
      description: 'More meal and weight logs will sharpen your weekly progress insights.',
      confidence: 'low',
      category: 'progress',
      dataPoints: averages.days,
    });
  }

  return insights;
}

export function getTopProgressInsight(data: AppData, profile: Profile): Insight | null {
  const insights = generateProgressInsights(data, profile).filter((i) => i.category === 'progress');
  return insights[0] ?? null;
}
