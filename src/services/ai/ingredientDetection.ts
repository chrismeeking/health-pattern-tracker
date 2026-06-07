import type { ConfidenceLevel, TriggerTag } from '@/types';
import { ALL_TRIGGER_TAGS } from '@/types';

export interface IngredientDetectionResult {
  mealName: string;
  likelyIngredients: string[];
  triggerTags: TriggerTag[];
  confidence: ConfidenceLevel;
}

interface KnownMealPattern {
  match: (text: string) => boolean;
  mealName: string;
  ingredients: string[];
  tags: TriggerTag[];
  confidence: ConfidenceLevel;
}

const KNOWN_PATTERNS: KnownMealPattern[] = [
  {
    match: (t) => /pepperoni\s+pizza|pizza.*pepperoni/i.test(t),
    mealName: 'Pepperoni Pizza',
    ingredients: [
      'pizza dough',
      'tomato sauce',
      'mozzarella',
      'pepperoni',
      'garlic',
      'onion',
    ],
    tags: ['tomato', 'dairy', 'processedMeat', 'fatty', 'garlic', 'onion', 'spicy'],
    confidence: 'high',
  },
  {
    match: (t) => /thai\s+green\s+curry|green\s+curry.*rice/i.test(t),
    mealName: 'Thai Green Curry with Rice',
    ingredients: [
      'chicken or tofu',
      'green curry paste',
      'coconut milk',
      'jasmine rice',
      'garlic',
      'onion',
      'chilli',
    ],
    tags: ['spicy', 'garlic', 'onion', 'coconutMilk', 'chilli'],
    confidence: 'medium',
  },
  {
    match: (t) => /roast\s+dinner|sunday\s+roast/i.test(t),
    mealName: 'Roast Dinner',
    ingredients: [
      'roast meat',
      'potatoes',
      'vegetables',
      'gravy',
      'yorkshire pudding',
    ],
    tags: ['fatty'],
    confidence: 'medium',
  },
];

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

function titleCase(text: string): string {
  return text
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function inferMealName(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return 'Unknown meal';
  const firstLine = trimmed.split(/[\n.]/)[0]?.trim() ?? trimmed;
  return titleCase(firstLine.slice(0, 60));
}

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
 * Used by mock AI and as a fallback layer for backend responses.
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

  for (const pattern of KNOWN_PATTERNS) {
    if (pattern.match(normalized)) {
      return {
        mealName: pattern.mealName,
        likelyIngredients: pattern.ingredients,
        triggerTags: pattern.tags,
        confidence: pattern.confidence,
      };
    }
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
    mealName: inferMealName(text),
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
