import type {
  AnalyseMealRequest,
  AnalyseMealResponse,
  ConfidenceLevel,
  TriggerTag,
} from '../types.js';
import { VALID_TRIGGER_TAGS } from '../types.js';

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

const PRESETS: { match: (t: string) => boolean; estimate: NutritionEstimate }[] = [
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

const GENERIC: NutritionEstimate = {
  estimatedCalories: 500,
  protein: 20,
  carbs: 50,
  fat: 18,
  fibre: 4,
  sugar: 8,
  salt: 1.5,
  confidence: 'low',
};

function estimateNutrition(text: string, mealName?: string): NutritionEstimate {
  const combined = `${text} ${mealName ?? ''}`.trim().toLowerCase();
  if (!combined) return { ...GENERIC };

  for (const preset of PRESETS) {
    if (preset.match(combined)) return { ...preset.estimate };
  }

  const wordCount = combined.split(/\s+/).length;
  const scale = Math.min(1.4, 0.8 + wordCount * 0.05);
  return {
    estimatedCalories: Math.round(GENERIC.estimatedCalories * scale),
    protein: Math.round(GENERIC.protein * scale),
    carbs: Math.round(GENERIC.carbs * scale),
    fat: Math.round(GENERIC.fat * scale),
    fibre: GENERIC.fibre,
    sugar: GENERIC.sugar,
    salt: GENERIC.salt,
    confidence: 'low',
  };
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

  const patterns: {
    match: RegExp;
    mealName: string;
    ingredients: string[];
    tags: TriggerTag[];
    confidence: ConfidenceLevel;
  }[] = [
    {
      match: /pepperoni\s+pizza|pizza.*pepperoni/i,
      mealName: 'Pepperoni Pizza',
      ingredients: ['pizza dough', 'tomato sauce', 'mozzarella', 'pepperoni', 'garlic', 'onion'],
      tags: ['tomato', 'dairy', 'processedMeat', 'fatty', 'garlic', 'onion', 'spicy'],
      confidence: 'high',
    },
    {
      match: /thai\s+green\s+curry|green\s+curry.*rice/i,
      mealName: 'Thai Green Curry with Rice',
      ingredients: ['curry paste', 'coconut milk', 'rice', 'garlic', 'onion', 'chilli'],
      tags: ['spicy', 'garlic', 'onion', 'coconutMilk', 'chilli'],
      confidence: 'medium',
    },
    {
      match: /roast\s+dinner|sunday\s+roast/i,
      mealName: 'Roast Dinner',
      ingredients: ['roast meat', 'potatoes', 'vegetables', 'gravy'],
      tags: ['fatty'],
      confidence: 'medium',
    },
  ];

  for (const p of patterns) {
    if (p.match.test(normalized)) {
      return {
        mealName: p.mealName,
        likelyIngredients: p.ingredients,
        triggerTags: p.tags,
        confidence: p.confidence,
      };
    }
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

  const name =
    text.trim().split(/[\n.]/)[0]?.trim().slice(0, 60) || 'Unknown meal';

  return {
    mealName: name
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' '),
    likelyIngredients: tags.length ? ['mixed ingredients (uncertain)'] : ['mixed ingredients (uncertain)'],
    triggerTags: tags,
    confidence: tags.length >= 2 ? 'medium' : 'low',
  };
}

export function mockAnalyseMeal(request: AnalyseMealRequest): AnalyseMealResponse {
  const text = request.mealText.trim();
  const ingredients = detectIngredients(text);
  const nutrition = estimateNutrition(text, ingredients.mealName);

  const notesParts = [
    request.analysisType === 'photo'
      ? 'Photo estimate (mock — OpenAI key not configured or unavailable).'
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
