import type { FavouriteMeal, FoodItem, TriggerTag } from '@/types';
import { ALL_TRIGGER_TAGS } from '@/types';
import { searchUkMeals, type UkMealDatabaseEntry } from '@/data/ukMealDatabase';
import { getFavouritesForProfile } from '@/services/food/favouriteMeals';
import { getSavedFoodsForProfile, inferTriggerTags } from '@/services/food/foodLookup';
import { searchOpenFoodFacts, type OpenFoodFactsHit } from '@/services/food/openFoodFactsClient';

export type FoodSearchSource =
  | 'uk-database'
  | 'saved-food'
  | 'favourite'
  | 'packaged-catalog'
  | 'open-food-facts';

export interface FoodSearchHit {
  id: string;
  name: string;
  subtitle?: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  saturatedFat: number;
  fibre: number;
  sugar: number;
  salt: number;
  triggerTags: TriggerTag[];
  source: FoodSearchSource;
  sourceLabel: string;
  barcode?: string;
  confidence?: 'low' | 'medium' | 'high';
}

export interface FoodSearchOutcome {
  local: FoodSearchHit[];
  online: FoodSearchHit[];
  onlineError?: string;
  usedOnline: boolean;
}

export interface FoodSearchFormValues {
  mealName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  saturatedFat: number;
  fibre: number;
  sugar: number;
  salt: number;
  triggerTags: TriggerTag[];
  notes?: string;
  source: 'homemade' | 'packaged' | 'restaurant' | 'takeaway' | 'unknown';
}

function validTags(tags: string[]): TriggerTag[] {
  const allowed = new Set<string>(ALL_TRIGGER_TAGS);
  return tags.filter((t): t is TriggerTag => allowed.has(t));
}

function ukEntryToHit(entry: UkMealDatabaseEntry): FoodSearchHit {
  return {
    id: `uk-${entry.id}`,
    name: entry.name,
    subtitle: entry.servingDescription,
    servingSize: entry.servingDescription,
    calories: entry.calories,
    protein: entry.protein,
    carbs: entry.carbs,
    fat: entry.fat,
    saturatedFat: entry.saturatedFat,
    fibre: entry.fibre,
    sugar: entry.sugar,
    salt: entry.salt,
    triggerTags: validTags(entry.triggerTags),
    source: 'uk-database',
    sourceLabel: entry.sourceLabel,
    confidence: entry.confidence,
  };
}

function foodItemToHit(item: FoodItem, source: 'saved-food' | 'packaged-catalog'): FoodSearchHit {
  return {
    id: `${source}-${item.id}`,
    name: item.brand ? `${item.brand} ${item.name}` : item.name,
    subtitle: item.servingSize,
    servingSize: item.servingSize,
    calories: item.calories,
    protein: item.protein,
    carbs: item.carbs,
    fat: item.fat,
    saturatedFat: item.saturatedFat,
    fibre: item.fibre,
    sugar: item.sugar,
    salt: item.salt,
    triggerTags: item.triggerTags,
    source,
    sourceLabel: source === 'saved-food' ? 'Your saved food' : 'Packaged food catalog',
    barcode: item.barcode,
    confidence: 'high',
  };
}

function favouriteToHit(fav: FavouriteMeal): FoodSearchHit {
  return {
    id: `fav-${fav.id}`,
    name: fav.name,
    subtitle: 'Favourite meal',
    servingSize: fav.portionSize,
    calories: fav.calories,
    protein: fav.protein,
    carbs: fav.carbs,
    fat: fav.fat,
    saturatedFat: fav.saturatedFat,
    fibre: fav.fibre,
    sugar: fav.sugar,
    salt: fav.salt,
    triggerTags: fav.triggerTags,
    source: 'favourite',
    sourceLabel: 'Your favourite',
    confidence: 'high',
  };
}

function offHitToSearchHit(hit: OpenFoodFactsHit): FoodSearchHit {
  return {
    id: `off-${hit.barcode ?? hit.name}`,
    name: hit.brand ? `${hit.brand} ${hit.name}` : hit.name,
    subtitle: hit.servingSize,
    servingSize: hit.servingSize,
    calories: hit.calories,
    protein: hit.protein,
    carbs: hit.carbs,
    fat: hit.fat,
    saturatedFat: hit.saturatedFat,
    fibre: hit.fibre,
    sugar: hit.sugar,
    salt: hit.salt,
    triggerTags: validTags(hit.triggerTags),
    source: 'open-food-facts',
    sourceLabel: 'Open Food Facts',
    barcode: hit.barcode,
    confidence: hit.confidence,
  };
}

function scoreHit(query: string, name: string, source: FoodSearchSource): number {
  const q = query.trim().toLowerCase();
  const n = name.toLowerCase();
  let score = 0;
  if (n === q) score += 100;
  if (n.startsWith(q)) score += 60;
  if (n.includes(q)) score += 40;
  for (const word of q.split(/\s+/)) {
    if (word.length >= 2 && n.includes(word)) score += 8;
  }
  if (source === 'favourite' || source === 'saved-food') score += 15;
  if (source === 'uk-database') score += 10;
  return score;
}

/** Instant offline search across UK database, saved foods, favourites, and packaged catalog. */
export function searchFoodsLocal(
  query: string,
  options: {
    profileId: string;
    savedFoods: FoodItem[];
    favouriteMeals: FavouriteMeal[];
    packagedCatalog?: FoodItem[];
    limit?: number;
  }
): FoodSearchHit[] {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const limit = options.limit ?? 12;
  const hits: FoodSearchHit[] = [];

  for (const entry of searchUkMeals(trimmed, 8)) {
    hits.push(ukEntryToHit(entry));
  }

  for (const fav of getFavouritesForProfile(
    { favouriteMeals: options.favouriteMeals } as import('@/types').AppData,
    options.profileId
  )) {
    if (fav.name.toLowerCase().includes(trimmed.toLowerCase())) {
      hits.push(favouriteToHit(fav));
    }
  }

  for (const food of getSavedFoodsForProfile(options.savedFoods, options.profileId)) {
    const label = `${food.brand ?? ''} ${food.name}`.toLowerCase();
    if (label.includes(trimmed.toLowerCase()) || food.barcode?.includes(trimmed)) {
      hits.push(foodItemToHit(food, 'saved-food'));
    }
  }

  for (const item of options.packagedCatalog ?? []) {
    const label = `${item.brand ?? ''} ${item.name}`.toLowerCase();
    if (label.includes(trimmed.toLowerCase()) || item.barcode?.includes(trimmed)) {
      hits.push(foodItemToHit(item, 'packaged-catalog'));
    }
  }

  const seen = new Set<string>();
  return hits
    .map((hit) => ({ hit, score: scoreHit(trimmed, hit.name, hit.source) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .filter(({ hit }) => {
      if (seen.has(hit.id)) return false;
      seen.add(hit.id);
      return true;
    })
    .slice(0, limit)
    .map(({ hit }) => hit);
}

/** Local search first, then optional Open Food Facts via backend. */
export async function searchFoods(
  query: string,
  options: {
    profileId: string;
    savedFoods: FoodItem[];
    favouriteMeals: FavouriteMeal[];
    packagedCatalog?: FoodItem[];
    includeOnline?: boolean;
    localLimit?: number;
    onlineLimit?: number;
  }
): Promise<FoodSearchOutcome> {
  const local = searchFoodsLocal(query, {
    profileId: options.profileId,
    savedFoods: options.savedFoods,
    favouriteMeals: options.favouriteMeals,
    packagedCatalog: options.packagedCatalog,
    limit: options.localLimit,
  });

  if (!options.includeOnline || query.trim().length < 3) {
    return { local, online: [], usedOnline: false };
  }

  const onlineResult = await searchOpenFoodFacts(query, options.onlineLimit ?? 8);
  return {
    local,
    online: onlineResult.hits.map(offHitToSearchHit),
    onlineError: onlineResult.error,
    usedOnline: true,
  };
}

export function foodSearchHitToFormValues(hit: FoodSearchHit): FoodSearchFormValues {
  const mealSource =
    hit.source === 'open-food-facts' || hit.source === 'packaged-catalog' || hit.source === 'saved-food'
      ? 'packaged'
      : hit.source === 'uk-database'
        ? 'restaurant'
        : 'homemade';

  return {
    mealName: hit.name,
    calories: hit.calories,
    protein: hit.protein,
    carbs: hit.carbs,
    fat: hit.fat,
    saturatedFat: hit.saturatedFat,
    fibre: hit.fibre,
    sugar: hit.sugar,
    salt: hit.salt,
    triggerTags: hit.triggerTags.length ? hit.triggerTags : inferTriggerTags(hit.name),
    notes: `${hit.sourceLabel}${hit.barcode ? ` · Barcode ${hit.barcode}` : ''} · ${hit.servingSize}`,
    source: mealSource,
  };
}

export function ukDatabaseToMealSuggestion(entry: UkMealDatabaseEntry) {
  const hit = ukEntryToHit(entry);
  return {
    mealName: hit.name,
    source: 'uk-database' as const,
    label: 'UK meal database',
    values: foodSearchHitToFormValues(hit),
    ingredients: entry.ingredients,
  };
}
