import type { FoodItem, TriggerTag } from '@/types';

const OPEN_FOOD_FACTS_PRODUCT_URL = 'https://world.openfoodfacts.org/api/v2/product';
const OPEN_FOOD_FACTS_FIELDS = [
  'product_name',
  'brands',
  'serving_size',
  'quantity',
  'nutriments',
  'ingredients_text',
  'allergens_tags',
  'categories_tags',
].join(',');

type OpenFoodFactsStatus = 0 | 1;

interface OpenFoodFactsProduct {
  product_name?: unknown;
  brands?: unknown;
  serving_size?: unknown;
  quantity?: unknown;
  nutriments?: Record<string, unknown>;
  ingredients_text?: unknown;
  allergens_tags?: unknown;
  categories_tags?: unknown;
}

interface OpenFoodFactsResponse {
  status?: OpenFoodFactsStatus;
  product?: OpenFoodFactsProduct;
}

export interface OpenFoodFactsLookupResult {
  found: boolean;
  item: Omit<FoodItem, 'id' | 'createdAt' | 'updatedAt'> | null;
  message?: string;
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

function numberValue(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function roundMacro(value: number): number {
  return Math.round(value * 10) / 10;
}

function parseServingGrams(servingSize: string): number | null {
  const grams = servingSize.match(/(\d+(?:\.\d+)?)\s*g/i);
  if (grams) return Number(grams[1]);

  const millilitres = servingSize.match(/(\d+(?:\.\d+)?)\s*ml/i);
  if (millilitres) return Number(millilitres[1]);

  return null;
}

function nutrient(
  nutriments: Record<string, unknown>,
  baseName: string,
  servingMultiplier: number | null
): number {
  const serving = numberValue(nutriments[`${baseName}_serving`]);
  if (serving != null) return roundMacro(serving);

  const per100g = numberValue(nutriments[`${baseName}_100g`]);
  if (per100g == null) return 0;

  return roundMacro(per100g * (servingMultiplier ?? 1));
}

function calories(nutriments: Record<string, unknown>, servingMultiplier: number | null): number {
  const kcalServing = numberValue(nutriments['energy-kcal_serving']);
  if (kcalServing != null) return Math.round(kcalServing);

  const kjServing = numberValue(nutriments['energy-kj_serving']);
  if (kjServing != null) return Math.round(kjServing / 4.184);

  const kcal100g = numberValue(nutriments['energy-kcal_100g']);
  if (kcal100g != null) return Math.round(kcal100g * (servingMultiplier ?? 1));

  const kj100g = numberValue(nutriments['energy-kj_100g']);
  if (kj100g != null) return Math.round((kj100g / 4.184) * (servingMultiplier ?? 1));

  return 0;
}

function inferTriggerTags(product: OpenFoodFactsProduct): TriggerTag[] {
  const text = [
    stringValue(product.product_name),
    stringValue(product.ingredients_text),
    ...stringArray(product.allergens_tags),
    ...stringArray(product.categories_tags),
  ]
    .join(' ')
    .toLowerCase();

  const tags = new Set<TriggerTag>();
  if (/milk|dairy|cheese|yogurt|yoghurt|cream|butter|en:milk/.test(text)) tags.add('dairy');
  if (/gluten|wheat|barley|rye|oat|en:gluten/.test(text)) tags.add('gluten');
  if (/coffee|cola|caffeine|energy-drink/.test(text)) tags.add('caffeine');
  if (/carbonated|fizzy|soda|cola/.test(text)) tags.add('carbonatedDrink');
  if (/tomato/.test(text)) tags.add('tomato');
  if (/onion/.test(text)) tags.add('onion');
  if (/garlic/.test(text)) tags.add('garlic');
  if (/chilli|chili|spicy|curry/.test(text)) tags.add('spicy');
  if (/pepperoni|bacon|sausage|ham|processed-meat/.test(text)) tags.add('processedMeat');
  if (/fried|crisps|chips|fatty|high-fat/.test(text)) tags.add('fatty');
  if (/beans|lentil|chickpea|legume/.test(text)) tags.add('beansLegumes');
  if (/beer|wine|alcohol/.test(text)) tags.add('alcohol');
  if (/citrus|lemon|lime|vinegar|acidic/.test(text)) tags.add('acidic');

  return tags.size > 0 ? [...tags] : ['unknown'];
}

export async function fetchOpenFoodFactsBarcode(
  barcode: string,
  signal?: AbortSignal
): Promise<OpenFoodFactsLookupResult> {
  const url = `${OPEN_FOOD_FACTS_PRODUCT_URL}/${encodeURIComponent(
    barcode
  )}.json?fields=${encodeURIComponent(OPEN_FOOD_FACTS_FIELDS)}`;

  const response = await fetch(url, {
    signal,
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Open Food Facts lookup failed (${response.status}).`);
  }

  const payload = (await response.json()) as OpenFoodFactsResponse;
  if (payload.status !== 1 || !payload.product) {
    return {
      found: false,
      item: null,
      message: 'Barcode not found in Open Food Facts.',
    };
  }

  const product = payload.product;
  const name = stringValue(product.product_name);
  if (!name) {
    return {
      found: false,
      item: null,
      message: 'Open Food Facts found this barcode but it has no product name.',
    };
  }

  const servingSize = stringValue(product.serving_size) || stringValue(product.quantity) || '100g';
  const servingGrams = parseServingGrams(servingSize);
  const servingMultiplier = servingGrams != null ? servingGrams / 100 : null;
  const nutriments = product.nutriments ?? {};
  const fat = nutrient(nutriments, 'fat', servingMultiplier);
  let saturatedFat = nutrient(nutriments, 'saturated-fat', servingMultiplier);
  if (!saturatedFat && fat > 0) saturatedFat = roundMacro(fat * 0.4);

  return {
    found: true,
    item: {
      barcode,
      name,
      brand: stringValue(product.brands) || undefined,
      servingSize,
      calories: calories(nutriments, servingMultiplier),
      protein: nutrient(nutriments, 'proteins', servingMultiplier),
      carbs: nutrient(nutriments, 'carbohydrates', servingMultiplier),
      fat,
      saturatedFat,
      fibre: nutrient(nutriments, 'fiber', servingMultiplier),
      sugar: nutrient(nutriments, 'sugars', servingMultiplier),
      salt: nutrient(nutriments, 'salt', servingMultiplier),
      triggerTags: inferTriggerTags(product),
      source: 'openFoodFacts',
    },
    message: 'Found via Open Food Facts.',
  };
}
