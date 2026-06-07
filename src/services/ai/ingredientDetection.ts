import type { ConfidenceLevel, TriggerTag } from '@/types';
import { ALL_TRIGGER_TAGS } from '@/types';
import { inferDisplayName, matchUkMeal } from '@/data/ukMealDatabase';

export interface IngredientDetectionResult {
  mealName: string;
  likelyIngredients: string[];
  triggerTags: TriggerTag[];
  confidence: ConfidenceLevel;
}

const KEYWORD_TAGS: { pattern: RegExp; tag: TriggerTag }[] = [
  { pattern: /tomato|marinara|passata/i, tag: 'tomato' },
  { pattern: /cheese|mozzarella|dairy|cream|butter/i, tag: 'dairy' },
  { pattern: /pepperoni|bacon|sausage|processed/i, tag: 'processedMeat' },
  { pattern: /fried|deep.?fried|crispy/i, tag: 'fried' },
  { pattern: /fatty|greasy|rich/i, tag: 'fatty' },
  { pattern: /garlic/i, tag: 'garlic' },
  { pattern: /onion/i, tag: 'onion' },
  { pattern: /spicy|chilli|chili|curry/i, tag: 'spicy' },
  { pattern: /coconut\s*milk/i, tag: 'coconutMilk' },
  { pattern: /takeaway|take.?out|delivery/i, tag: 'takeaway' },
  { pattern: /large\s+portion|extra\s+large|big\s+meal/i, tag: 'largePortion' },
  { pattern: /late\s+meal|late\s+night/i, tag: 'lateMeal' },
  { pattern: /alcohol|beer|wine/i, tag: 'alcohol' },
  { pattern: /coffee|espresso|caffeine/i, tag: 'caffeine' },
];

function detectTagsFromText(text: string): TriggerTag[] {
  const tags = new Set<TriggerTag>();
  for (const { pattern, tag } of KEYWORD_TAGS) {
    if (pattern.test(text)) tags.add(tag);
  }
  return [...tags];
}

function parseIngredientList(text: string): string[] {
  const listMatch = text.match(/ingredients?[:\s]+(.+)/i);
  if (listMatch) {
    return listMatch[1]
      .split(/[,;•·]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 12);
  }
  return [];
}

/**
 * Detect likely ingredients and trigger tags from meal text.
 * Uses the UK meal database first, then keyword heuristics.
 */
export function detectIngredients(text: string): IngredientDetectionResult {
  const normalized = text.trim().toLowerCase();
  if (!normalized) {
    return {
      mealName: 'Unknown meal',
      likelyIngredients: [],
      triggerTags: [],
      confidence: 'low',
    };
  }

  const dbMatch = matchUkMeal(text);
  if (dbMatch) {
    return {
      mealName: dbMatch.name,
      likelyIngredients: dbMatch.ingredients,
      triggerTags: dbMatch.triggerTags as TriggerTag[],
      confidence: dbMatch.confidence,
    };
  }

  const parsedList = parseIngredientList(text);
  const keywordTags = detectTagsFromText(text);
  const genericIngredients =
    parsedList.length > 0
      ? parsedList
      : text
          .split(/[,;+]/)
          .map((s) => s.trim())
          .filter((s) => s.length > 2 && s.length < 40)
          .slice(0, 6);

  return {
    mealName: inferDisplayName(text),
    likelyIngredients:
      genericIngredients.length > 0 ? genericIngredients : ['mixed ingredients (uncertain)'],
    triggerTags: keywordTags,
    confidence: keywordTags.length >= 2 ? 'medium' : 'low',
  };
}

/** Map backend string tags to validated TriggerTag values. */
export function parseTriggerTags(raw: string[]): TriggerTag[] {
  const valid = new Set<TriggerTag>(ALL_TRIGGER_TAGS);
  return raw
    .map((t) => t.trim())
    .filter((t): t is TriggerTag => valid.has(t as TriggerTag));
}
