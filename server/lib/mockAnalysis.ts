import type {
  AnalyseMealRequest,
  AnalyseMealResponse,
  ConfidenceLevel,
  TriggerTag,
} from '../types.js';
import { VALID_TRIGGER_TAGS } from '../types.js';
import {
  getScaledGenericEstimate,
  inferDisplayName,
  matchUkMeal,
} from '../../src/data/ukMealDatabase.js';

const AI_DISCLAIMER =
  'AI nutrition and ingredient estimates may be inaccurate. Review before saving.';

interface NutritionEstimate {
  estimatedCalories: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
  sugar: number;
  salt: number;
  confidence: ConfidenceLevel;
}

function estimateNutrition(text: string): NutritionEstimate {
  const dbMatch = matchUkMeal(text);
  if (dbMatch) {
    return {
      estimatedCalories: dbMatch.calories,
      protein: dbMatch.protein,
      carbs: dbMatch.carbs,
      fat: dbMatch.fat,
      fibre: dbMatch.fibre,
      sugar: dbMatch.sugar,
      salt: dbMatch.salt,
      confidence: dbMatch.confidence,
    };
  }
  return getScaledGenericEstimate(text);
}

function detectIngredients(text: string): {
  mealName: string;
  likelyIngredients: string[];
  triggerTags: TriggerTag[];
  confidence: ConfidenceLevel;
} {
  const normalized = text.trim().toLowerCase();
  if (!normalized) {
    return { mealName: 'Unknown meal', likelyIngredients: [], triggerTags: [], confidence: 'low' };
  }

  const dbMatch = matchUkMeal(text);
  if (dbMatch) {
    return {
      mealName: dbMatch.name,
      likelyIngredients: dbMatch.ingredients,
      triggerTags: sanitizeTriggerTags(dbMatch.triggerTags) as TriggerTag[],
      confidence: dbMatch.confidence,
    };
  }

  const tags: TriggerTag[] = [];
  const keywordMap: [RegExp, TriggerTag][] = [
    [/tomato|marinara/i, 'tomato'],
    [/cheese|dairy|cream/i, 'dairy'],
    [/pepperoni|processed/i, 'processedMeat'],
    [/fried/i, 'fried'],
    [/fatty|greasy/i, 'fatty'],
    [/garlic/i, 'garlic'],
    [/onion/i, 'onion'],
    [/spicy|chilli|curry/i, 'spicy'],
    [/coconut\s*milk/i, 'coconutMilk'],
    [/takeaway/i, 'takeaway'],
  ];
  for (const [pattern, tag] of keywordMap) {
    if (pattern.test(normalized)) tags.push(tag);
  }

  return {
    mealName: inferDisplayName(text),
    likelyIngredients: ['mixed ingredients (uncertain)'],
    triggerTags: tags,
    confidence: tags.length >= 2 ? 'medium' : 'low',
  };
}

export function mockAnalyseMeal(request: AnalyseMealRequest): AnalyseMealResponse {
  const text = request.mealText.trim();
  const ingredients = detectIngredients(text);
  const nutrition = estimateNutrition(text);
  const dbMatch = matchUkMeal(text);

  const notesParts = [
    request.analysisType === 'photo'
      ? 'Photo estimate (mock — OpenAI key not configured or unavailable).'
      : request.analysisType === 'name'
        ? dbMatch
          ? `Typical portion from local UK meal database (${dbMatch.sourceLabel}).`
          : 'Typical portion estimate from meal name (mock).'
        : request.analysisType === 'menu' || request.analysisType === 'packaging'
          ? `Estimated from ${request.analysisType} text (mock).`
          : 'Mock estimate for local development.',
    ingredients.likelyIngredients.length
      ? `Likely ingredients: ${ingredients.likelyIngredients.join(', ')}.`
      : '',
    nutrition.confidence === 'low'
      ? 'Limited detail — treat as a cautious generic estimate.'
      : '',
    AI_DISCLAIMER,
  ].filter(Boolean);

  return {
    mealName: ingredients.mealName,
    estimatedCalories: nutrition.estimatedCalories,
    protein: nutrition.protein,
    carbs: nutrition.carbs,
    fat: nutrition.fat,
    fibre: nutrition.fibre,
    sugar: nutrition.sugar,
    salt: nutrition.salt,
    likelyIngredients: ingredients.likelyIngredients,
    triggerTags: ingredients.triggerTags,
    confidence: {
      calories: nutrition.confidence,
      ingredients: ingredients.confidence,
      triggerTags:
        ingredients.confidence === 'high'
          ? 'high'
          : ingredients.confidence === 'medium'
            ? 'medium'
            : 'low',
    },
    notes: notesParts.join(' '),
    source: 'mock',
  };
}

export function sanitizeTriggerTags(raw: string[]): string[] {
  const allowed = new Set<string>(VALID_TRIGGER_TAGS);
  return raw.filter((tag) => allowed.has(tag));
}
