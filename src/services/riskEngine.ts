import type { AppData, Meal, RiskAssessment, RiskLevel, TriggerTag } from '@/types';
import { TRIGGER_TAG_LABELS } from '@/types';
import { SYMPTOM_WINDOW_HOURS, buildTriggerReports, getConfidence } from './insightEngine';

function mealHadSymptomsAfter(
  meal: Meal,
  episodes: AppData['symptomEpisodes']
): boolean {
  const mealTime = new Date(meal.dateTime).getTime();
  const windowEnd = mealTime + SYMPTOM_WINDOW_HOURS * 60 * 60 * 1000;
  return episodes.some((ep) => {
    const epTime = new Date(ep.startDateTime).getTime();
    return epTime >= mealTime && epTime <= windowEnd;
  });
}

export function assessMealRisk(
  meal: Pick<Meal, 'triggerTags' | 'mealName' | 'portionSize'>,
  data: AppData,
  profileId: string
): RiskAssessment {
  const meals = data.meals.filter((m) => m.profileId === profileId);
  const episodes = data.symptomEpisodes.filter((s) => s.profileId === profileId);

  if (meals.length < 2) {
    return {
      level: 'low',
      confidence: 'low',
      contributingFactors: meal.triggerTags.map((t) => TRIGGER_TAG_LABELS[t]),
      explanation:
        'Not enough history yet for a reliable pattern estimate. Keep logging meals and symptoms.',
    };
  }

  const contributingFactors: string[] = [];
  let riskScore = 0;
  let dataPoints = 0;

  const allTags = [...new Set(meals.flatMap((m) => m.triggerTags))];
  const reports = buildTriggerReports(meals, episodes, allTags);

  for (const tag of meal.triggerTags) {
    const report = reports.find((r) => r.trigger === tag);
    if (!report || report.timesEaten === 0) continue;

    dataPoints += report.timesEaten;
    if (report.symptomRate >= 0.5) {
      riskScore += 2;
      contributingFactors.push(TRIGGER_TAG_LABELS[tag]);
    } else if (report.symptomRate >= 0.25) {
      riskScore += 1;
      contributingFactors.push(`${TRIGGER_TAG_LABELS[tag]} (mixed history)`);
    }
    if (report.severeSymptomRate >= 0.3) {
      riskScore += 1;
    }
  }

  if (meal.portionSize === 'large' || meal.portionSize === 'veryLarge') {
    const largeMeals = meals.filter(
      (m) => m.portionSize === 'large' || m.portionSize === 'veryLarge'
    );
    if (largeMeals.length >= 2) {
      const largeWithSymptoms = largeMeals.filter((m) => mealHadSymptomsAfter(m, episodes)).length;
      if (largeWithSymptoms / largeMeals.length >= 0.4) {
        riskScore += 1;
        contributingFactors.push('Large portion');
      }
    }
  }

  const sameNameMeals = meals.filter(
    (m) => m.mealName.toLowerCase() === meal.mealName.toLowerCase()
  );
  if (sameNameMeals.length >= 2) {
    const nameWithSymptoms = sameNameMeals.filter((m) => mealHadSymptomsAfter(m, episodes)).length;
    if (nameWithSymptoms === sameNameMeals.length) {
      riskScore += 2;
      contributingFactors.push(`Previous ${meal.mealName} episodes`);
    } else if (nameWithSymptoms > 0) {
      riskScore += 1;
    }
  }

  const confidence = getConfidence(dataPoints);
  let level: RiskLevel = 'low';
  if (riskScore >= 4) level = 'high';
  else if (riskScore >= 2) level = 'medium';

  const uniqueFactors = [...new Set(contributingFactors)];

  let explanation: string;
  if (uniqueFactors.length === 0) {
    explanation = `Based on your history, this meal has a ${level} symptom-risk pattern. No strong associations found yet.`;
  } else {
    explanation = `Based on your history, this meal has a ${level} possible pattern. Factors associated with symptoms before: ${uniqueFactors.join(', ')}.`;
  }

  return {
    level,
    confidence,
    contributingFactors: uniqueFactors,
    explanation,
  };
}

export function getHighRiskTags(data: AppData, profileId: string): TriggerTag[] {
  const meals = data.meals.filter((m) => m.profileId === profileId);
  const episodes = data.symptomEpisodes.filter((s) => s.profileId === profileId);
  const tags = [...new Set(meals.flatMap((m) => m.triggerTags))];

  return tags.filter((tag) => {
    const taggedMeals = meals.filter((m) => m.triggerTags.includes(tag));
    if (taggedMeals.length < 2) return false;
    const withSymptoms = taggedMeals.filter((m) => mealHadSymptomsAfter(m, episodes)).length;
    return withSymptoms / taggedMeals.length >= 0.5;
  });
}
