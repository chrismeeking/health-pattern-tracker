import type {
  AppData,
  ConfidenceLevel,
  DailyCheckIn,
  Insight,
  Meal,
  SuspectedTrigger,
  SymptomEpisode,
  SymptomPatternSummary,
  ToleratedItem,
  TriggerReport,
  TriggerTag,
} from '@/types';
import { TRIGGER_TAG_LABELS } from '@/types';

export const SYMPTOM_WINDOW_HOURS = 12;

export function getConfidence(count: number): ConfidenceLevel {
  if (count >= 15) return 'high';
  if (count >= 5) return 'medium';
  return 'low';
}

function mealHadSymptomsAfter(meal: Meal, episodes: SymptomEpisode[]): boolean {
  const mealTime = new Date(meal.dateTime).getTime();
  const windowEnd = mealTime + SYMPTOM_WINDOW_HOURS * 60 * 60 * 1000;
  return episodes.some((ep) => {
    const epTime = new Date(ep.startDateTime).getTime();
    return epTime >= mealTime && epTime <= windowEnd;
  });
}

function mealHadSevereSymptomsAfter(meal: Meal, episodes: SymptomEpisode[]): boolean {
  const mealTime = new Date(meal.dateTime).getTime();
  const windowEnd = mealTime + SYMPTOM_WINDOW_HOURS * 60 * 60 * 1000;
  return episodes.some((ep) => {
    const epTime = new Date(ep.startDateTime).getTime();
    return epTime >= mealTime && epTime <= windowEnd && ep.severity === 'severe';
  });
}

function profileData(data: AppData, profileId: string) {
  return {
    meals: data.meals.filter((m) => m.profileId === profileId),
    episodes: data.symptomEpisodes.filter((s) => s.profileId === profileId),
    checkIns: data.dailyCheckIns.filter((c) => c.profileId === profileId),
  };
}

export function buildTriggerReports(
  meals: Meal[],
  episodes: SymptomEpisode[],
  tags: TriggerTag[]
): TriggerReport[] {
  return tags.map((trigger) => {
    const taggedMeals = meals.filter((m) => m.triggerTags.includes(trigger));
    const timesEaten = taggedMeals.length;
    const symptomsAfter = taggedMeals.filter((m) => mealHadSymptomsAfter(m, episodes)).length;
    const noSymptomsAfter = timesEaten - symptomsAfter;
    const severeAfter = taggedMeals.filter((m) => mealHadSevereSymptomsAfter(m, episodes)).length;
    const symptomRate = timesEaten > 0 ? symptomsAfter / timesEaten : 0;
    const severeSymptomRate = timesEaten > 0 ? severeAfter / timesEaten : 0;
    const confidence = getConfidence(timesEaten);
    const label = TRIGGER_TAG_LABELS[trigger];

    let explanation = '';
    if (timesEaten === 0) {
      explanation = `No ${label.toLowerCase()} meals logged yet. Too early to be certain.`;
    } else if (symptomsAfter === 0) {
      explanation = `${label} appears tolerated so far: ${timesEaten} meal${timesEaten > 1 ? 's' : ''}, 0 symptoms within ${SYMPTOM_WINDOW_HOURS} hours. Confidence: ${confidence}.`;
    } else {
      explanation = `${label} was associated with symptoms after ${symptomsAfter} of ${timesEaten} meals. This may be worth watching. Confidence: ${confidence}.`;
    }

    return {
      trigger,
      timesEaten,
      symptomsAfter,
      noSymptomsAfter,
      symptomRate,
      severeSymptomRate,
      confidence,
      explanation,
    };
  });
}

export function getTriggerReports(data: AppData, profileId: string): TriggerReport[] {
  const { meals, episodes } = profileData(data, profileId);
  const allTags = [...new Set(meals.flatMap((m) => m.triggerTags))];
  return buildTriggerReports(meals, episodes, allTags)
    .filter((r) => r.timesEaten > 0)
    .sort((a, b) => b.symptomRate - a.symptomRate);
}

export function getSuspectedTriggers(data: AppData, profileId: string): SuspectedTrigger[] {
  const reports = getTriggerReports(data, profileId);
  const { episodes } = profileData(data, profileId);

  return reports
    .filter((r) => r.symptomsAfter > 0 && r.timesEaten >= 1)
    .map((r) => {
      const relatedEpisodes = episodes.filter((ep) => {
        if (!ep.relatedMealIds?.length) return false;
        const linkedMeals = data.meals.filter(
          (m) => ep.relatedMealIds!.includes(m.id) && m.triggerTags.includes(r.trigger)
        );
        return linkedMeals.length > 0;
      });
      const severeCount = relatedEpisodes.filter((e) => e.severity === 'severe').length;
      const score =
        r.symptomRate * 40 +
        r.severeSymptomRate * 30 +
        Math.min(r.symptomsAfter, 5) * 6 +
        (r.confidence === 'high' ? 10 : r.confidence === 'medium' ? 5 : 0);

      return {
        trigger: r.trigger,
        label: TRIGGER_TAG_LABELS[r.trigger],
        symptomRate: r.symptomRate,
        episodeCount: r.symptomsAfter,
        severeCount,
        confidence: r.confidence,
        score,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
}

export function getToleratedFoods(data: AppData, profileId: string): ToleratedItem[] {
  const { meals, episodes } = profileData(data, profileId);
  const items: ToleratedItem[] = [];

  const mealGroups = new Map<string, Meal[]>();
  for (const meal of meals) {
    const key = meal.mealName.toLowerCase();
    if (!mealGroups.has(key)) mealGroups.set(key, []);
    mealGroups.get(key)!.push(meal);
  }

  for (const [, group] of mealGroups) {
    if (group.length < 2) continue;
    const withSymptoms = group.filter((m) => mealHadSymptomsAfter(m, episodes)).length;
    if (withSymptoms === 0) {
      items.push({
        name: group[0].mealName,
        type: 'meal',
        count: group.length,
        confidence: getConfidence(group.length),
      });
    }
  }

  const reports = getTriggerReports(data, profileId);
  for (const r of reports) {
    if (r.symptomsAfter === 0 && r.timesEaten >= 2) {
      items.push({
        name: TRIGGER_TAG_LABELS[r.trigger],
        type: 'trigger',
        count: r.timesEaten,
        confidence: r.confidence,
      });
    }
  }

  return items.sort((a, b) => b.count - a.count).slice(0, 8);
}

export function getRecentSymptomPatterns(
  data: AppData,
  profileId: string,
  limit = 5
): SymptomPatternSummary[] {
  return data.symptomEpisodes
    .filter((s) => s.profileId === profileId)
    .sort((a, b) => new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime())
    .slice(0, limit)
    .map((ep) => ({
      id: ep.id,
      title: `${ep.severity} episode · pain ${ep.painScore ?? '—'}/10`,
      description: ep.symptoms.join(', ') || 'Symptoms logged',
      severity: ep.severity,
      dateTime: ep.startDateTime,
    }));
}

function noSymptomCheckInInsight(checkIns: DailyCheckIn[]): Insight | null {
  const count = checkIns.filter((c) => c.noSymptomsReported).length;
  if (count === 0) return null;
  return {
    id: 'no-symptom-checkins',
    title: 'No-symptom days recorded',
    description: `You have logged ${count} no-symptom check-in${count > 1 ? 's' : ''}. This improves confidence when comparing patterns.`,
    confidence: getConfidence(count),
    category: 'progress',
    dataPoints: count,
  };
}

export function generateEarlyObservations(data: AppData, profileId: string): Insight[] {
  const { meals, episodes, checkIns } = profileData(data, profileId);
  const insights: Insight[] = [];

  if (meals.length < 5) {
    insights.push({
      id: 'early-meals',
      title: 'Building your meal picture',
      description: 'Too early to be certain about most patterns. Keep logging meals with trigger tags.',
      confidence: 'low',
      category: 'early',
      dataPoints: meals.length,
    });
  }

  if (episodes.length < 3 && checkIns.length < 3) {
    insights.push({
      id: 'early-symptoms',
      title: 'Limited symptom data',
      description: 'More check-ins and symptom logs will improve accuracy. Include no-symptom days whenever you can.',
      confidence: 'low',
      category: 'early',
      dataPoints: episodes.length + checkIns.length,
    });
  }

  const noSymptomCount = checkIns.filter((c) => c.noSymptomsReported).length;
  if (noSymptomCount < 3 && checkIns.length > 0) {
    insights.push({
      id: 'need-no-symptom-days',
      title: 'More no-symptom check-ins help',
      description: 'More no-symptom check-ins will improve accuracy when comparing good days against symptom days.',
      confidence: 'low',
      category: 'early',
      dataPoints: noSymptomCount,
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: 'enough-data',
      title: 'Patterns emerging',
      description: 'You have a reasonable amount of data. Insights below reflect possible patterns — not diagnoses.',
      confidence: 'medium',
      category: 'early',
    });
  }

  return insights;
}

export function generateInsights(data: AppData, profileId: string): Insight[] {
  const { meals, episodes, checkIns } = profileData(data, profileId);
  const insights: Insight[] = [];

  const allTags = [...new Set(meals.flatMap((m) => m.triggerTags))];
  const reports = buildTriggerReports(meals, episodes, allTags);

  for (const report of reports) {
    if (report.timesEaten === 0) continue;
    const label = TRIGGER_TAG_LABELS[report.trigger];

    if (report.symptomsAfter === 0 && report.timesEaten >= 2) {
      insights.push({
        id: `tolerance-${report.trigger}`,
        title: `${label} appears tolerated`,
        description: `${label} meals appear tolerated so far: ${report.timesEaten} logged, 0 symptoms within ${SYMPTOM_WINDOW_HOURS} hours.`,
        confidence: report.confidence,
        category: 'tolerance',
        relatedTriggers: [report.trigger],
        dataPoints: report.timesEaten,
      });
    } else if (report.symptomsAfter > 0) {
      insights.push({
        id: `trigger-${report.trigger}`,
        title: `${label} may be worth watching`,
        description: `${label} appeared in ${report.symptomsAfter} of ${report.timesEaten} meals followed by symptoms. Too early to be certain — confidence: ${report.confidence}.`,
        confidence: report.confidence,
        category: 'trigger',
        relatedTriggers: [report.trigger],
        dataPoints: report.timesEaten,
      });
    }
  }

  const mealGroups = new Map<string, Meal[]>();
  for (const meal of meals) {
    const key = meal.mealName.toLowerCase();
    if (!mealGroups.has(key)) mealGroups.set(key, []);
    mealGroups.get(key)!.push(meal);
  }

  for (const [, group] of mealGroups) {
    if (group.length < 2) continue;
    const withSymptoms = group.filter((m) => mealHadSymptomsAfter(m, episodes)).length;
    const withoutSymptoms = group.length - withSymptoms;
    const displayName = group[0].mealName;

    if (withSymptoms === group.length) {
      insights.push({
        id: `meal-pattern-${displayName}`,
        title: `${displayName} often followed by symptoms`,
        description: `${displayName} has been logged ${group.length} times and was followed by symptoms each time. This is a possible pattern worth watching.`,
        confidence: getConfidence(group.length),
        category: 'pattern',
        dataPoints: group.length,
      });
    } else if (withoutSymptoms === group.length) {
      insights.push({
        id: `meal-safe-${displayName}`,
        title: `${displayName} appears well tolerated`,
        description: `${displayName} has been logged ${group.length} times with no symptoms within ${SYMPTOM_WINDOW_HOURS} hours.`,
        confidence: getConfidence(group.length),
        category: 'tolerance',
        dataPoints: group.length,
      });
    }
  }

  const spicyMeals = meals.filter((m) => m.triggerTags.includes('spicy'));
  const spicySymptoms = spicyMeals.filter((m) => mealHadSymptomsAfter(m, episodes));
  const tomatoFreeSpicy = spicyMeals.filter(
    (m) => m.triggerTags.includes('spicy') && !m.triggerTags.includes('tomato')
  );
  const tomatoFreeSpicySymptoms = tomatoFreeSpicy.filter((m) =>
    mealHadSymptomsAfter(m, episodes)
  );

  if (spicyMeals.length >= 2 && spicySymptoms.length === 0) {
    insights.push({
      id: 'spicy-tolerated',
      title: 'Spicy meals seem fine so far',
      description: `Small spicy meals appear tolerated so far (${spicyMeals.length} meals, 0 symptoms). Sample size is still small.`,
      confidence: getConfidence(spicyMeals.length),
      category: 'tolerance',
      relatedTriggers: ['spicy'],
      dataPoints: spicyMeals.length,
    });
  }

  if (tomatoFreeSpicy.length >= 2 && tomatoFreeSpicySymptoms.length === 0) {
    insights.push({
      id: 'fatty-no-tomato',
      title: 'Fatty or spicy without tomato',
      description: 'Fatty or spicy meals without tomato have not been followed by symptoms so far. This may be worth watching.',
      confidence: getConfidence(tomatoFreeSpicy.length),
      category: 'tolerance',
      dataPoints: tomatoFreeSpicy.length,
    });
  }

  const checkInInsight = noSymptomCheckInInsight(checkIns);
  if (checkInInsight) insights.push(checkInInsight);

  if (insights.length === 0) {
    insights.push({
      id: 'get-started',
      title: 'Start tracking',
      description: 'Log meals with trigger tags and daily check-ins to begin identifying possible patterns.',
      confidence: 'low',
      category: 'general',
      dataPoints: 0,
    });
  }

  return insights;
}

export function getTopInsight(data: AppData, profileId: string): Insight | null {
  const insights = generateInsights(data, profileId);
  return insights.find((i) => i.category !== 'early') ?? insights[0] ?? null;
}
