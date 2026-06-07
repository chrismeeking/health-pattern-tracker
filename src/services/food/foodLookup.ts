import type { FoodItem, FoodItemSource, TriggerTag } from '@/types';
import { ALL_TRIGGER_TAGS } from '@/types';
import { getDatabaseSourceSummary, matchUkMeal, searchUkMeals, type UkMealDatabaseEntry } from '@/data/ukMealDatabase';
import { generateId } from '@/services/storage';
import { nowISO } from '@/utils/helpers';

export type LookupStatus = 'mock-local' | 'offline';

export interface FoodLookupResult {
  found: boolean;
  item: FoodItem | null;
  status: LookupStatus;
  message?: string;
}

export interface ScaledNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
  sugar: number;
  salt: number;
}

export type ServingMode = 'default' | 'portions' | 'grams' | 'custom';

const MOCK_CATALOG: Omit<FoodItem, 'id' | 'createdAt' | 'updatedAt' | 'profileId'>[] = [
  {
    barcode: '5000159484695',
    name: 'Dairy Milk Chocolate Bar',
    brand: 'Cadbury',
    servingSize: '45g bar',
    calories: 240,
    protein: 4,
    carbs: 26,
    fat: 13,
    fibre: 1,
    sugar: 25,
    salt: 0.3,
    triggerTags: ['dairy', 'fatty'],
    source: 'openFoodFacts',
  },
  {
    barcode: '5053990107920',
    name: 'Baked Beans',
    brand: 'Heinz',
    servingSize: '200g half can',
    calories: 164,
    protein: 9,
    carbs: 28,
    fat: 1,
    fibre: 8,
    sugar: 10,
    salt: 1.2,
    triggerTags: ['tomato', 'onion'],
    source: 'openFoodFacts',
  },
  {
    barcode: '8710400000000',
    name: 'Greek Style Yogurt',
    brand: 'Generic',
    servingSize: '150g pot',
    calories: 130,
    protein: 12,
    carbs: 8,
    fat: 6,
    fibre: 0,
    sugar: 6,
    salt: 0.1,
    triggerTags: ['dairy'],
    source: 'manual',
  },
  {
    barcode: '5449000000996',
    name: 'Cola',
    brand: 'Generic',
    servingSize: '330ml can',
    calories: 139,
    protein: 0,
    carbs: 35,
    fat: 0,
    fibre: 0,
    sugar: 35,
    salt: 0,
    triggerTags: ['caffeine', 'carbonatedDrink'],
    source: 'manual',
  },
];

const KEYWORD_TRIGGERS: { pattern: RegExp; tag: TriggerTag }[] = [
  { pattern: /milk|cheese|yogurt|yoghurt|cream|dairy|butter/i, tag: 'dairy' },
  { pattern: /gluten|wheat|bread|pasta|flour/i, tag: 'gluten' },
  { pattern: /coffee|espresso|cola|caffeine|energy drink/i, tag: 'caffeine' },
  { pattern: /cola|fizzy|sparkling|carbonated|soda/i, tag: 'carbonatedDrink' },
  { pattern: /pepperoni|bacon|sausage|ham|processed/i, tag: 'processedMeat' },
  { pattern: /fried|crisps|chips|fatty|greasy/i, tag: 'fatty' },
  { pattern: /spicy|chilli|chili|curry/i, tag: 'spicy' },
  { pattern: /tomato|passata|ketchup|beans/i, tag: 'tomato' },
  { pattern: /onion/i, tag: 'onion' },
  { pattern: /garlic/i, tag: 'garlic' },
];

export function inferTriggerTags(text: string): TriggerTag[] {
  const tags = new Set<TriggerTag>();
  for (const { pattern, tag } of KEYWORD_TRIGGERS) {
    if (pattern.test(text)) tags.add(tag);
  }
  if (tags.size === 0) tags.add('unknown');
  return [...tags];
}

export function getLookupStatusLabel(): string {
  return getDatabaseSourceSummary();
}

export function lookupMealByName(name: string): FoodLookupResult {
  const match = matchUkMeal(name);
  if (!match) {
    return {
      found: false,
      item: null,
      status: 'mock-local',
      message: 'Meal not in local database — try AI lookup or enter manually.',
    };
  }

  return {
    found: true,
    item: toFoodItem({
      name: match.name,
      servingSize: match.servingDescription,
      calories: match.calories,
      protein: match.protein,
      carbs: match.carbs,
      fat: match.fat,
      fibre: match.fibre,
      sugar: match.sugar,
      salt: match.salt,
      triggerTags: match.triggerTags.filter((t): t is TriggerTag =>
        (ALL_TRIGGER_TAGS as readonly string[]).includes(t)
      ),
      source: 'manual',
    }),
    status: 'mock-local',
    message: match.sourceLabel,
  };
}

export function searchMealNames(query: string, limit = 5): UkMealDatabaseEntry[] {
  return searchUkMeals(query, limit);
}

export function getLookupStatus(): LookupStatus {
  return 'mock-local';
}

function toFoodItem(
  partial: Omit<FoodItem, 'id' | 'createdAt' | 'updatedAt'> & { profileId?: string }
): FoodItem {
  const now = nowISO();
  return {
    id: generateId(),
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

export function lookupBarcode(
  barcode: string,
  savedFoods: FoodItem[]
): FoodLookupResult {
  const normalized = barcode.trim().replace(/\s/g, '');
  if (!normalized) {
    return { found: false, item: null, status: 'mock-local', message: 'Enter a barcode.' };
  }

  const saved = savedFoods.find((f) => f.barcode === normalized);
  if (saved) {
    return { found: true, item: saved, status: 'mock-local' };
  }

  const mock = MOCK_CATALOG.find((f) => f.barcode === normalized);
  if (mock) {
    return {
      found: true,
      item: toFoodItem({ ...mock, barcode: normalized }),
      status: 'mock-local',
    };
  }

  return {
    found: false,
    item: null,
    status: 'mock-local',
    message: 'Barcode not found — enter details manually or save as custom food.',
  };
}

export function foodItemToMealFormValues(item: FoodItem, scaled?: ScaledNutrition) {
  const n = scaled ?? item;
  return {
    mealName: item.brand ? `${item.brand} ${item.name}` : item.name,
    mealType: 'snack' as const,
    source: 'packaged' as const,
    calories: n.calories,
    protein: n.protein,
    carbs: n.carbs,
    fat: n.fat,
    fibre: n.fibre,
    sugar: n.sugar,
    salt: n.salt,
    portionSize: 'normal' as const,
    triggerTags: item.triggerTags,
    notes: `Barcode: ${item.barcode ?? 'n/a'} · Serving: ${item.servingSize}`,
  };
}

export function scaleFoodNutrition(
  item: FoodItem,
  mode: ServingMode,
  amount: number
): ScaledNutrition {
  if (mode === 'custom') {
    return {
      calories: amount,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      fibre: item.fibre,
      sugar: item.sugar,
      salt: item.salt,
    };
  }

  let multiplier = 1;
  if (mode === 'portions') multiplier = Math.max(0.25, amount);
  if (mode === 'grams') {
    const match = item.servingSize.match(/(\d+)\s*g/i);
    const baseGrams = match ? Number(match[1]) : 100;
    multiplier = Math.max(0.1, amount / baseGrams);
  }

  const round = (n: number) => Math.round(n * multiplier * 10) / 10;
  return {
    calories: Math.round(item.calories * multiplier),
    protein: round(item.protein),
    carbs: round(item.carbs),
    fat: round(item.fat),
    fibre: round(item.fibre),
    sugar: round(item.sugar),
    salt: round(item.salt),
  };
}

export function createCustomFood(input: {
  profileId: string;
  barcode?: string;
  name: string;
  brand?: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
  sugar: number;
  salt: number;
  triggerTags?: TriggerTag[];
}): FoodItem {
  const tags =
    input.triggerTags && input.triggerTags.length > 0
      ? input.triggerTags
      : inferTriggerTags(`${input.name} ${input.brand ?? ''}`);

  const validTags = tags.filter((t) => ALL_TRIGGER_TAGS.includes(t));

  return toFoodItem({
    profileId: input.profileId,
    barcode: input.barcode?.trim() || undefined,
    name: input.name.trim(),
    brand: input.brand?.trim() || undefined,
    servingSize: input.servingSize.trim() || '1 serving',
    calories: input.calories,
    protein: input.protein,
    carbs: input.carbs,
    fat: input.fat,
    fibre: input.fibre,
    sugar: input.sugar,
    salt: input.salt,
    triggerTags: validTags.length ? validTags : ['unknown'],
    source: 'manual' as FoodItemSource,
  });
}

export function getSavedFoodsForProfile(
  savedFoods: FoodItem[],
  profileId: string
): FoodItem[] {
  return savedFoods
    .filter((f) => !f.profileId || f.profileId === profileId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
