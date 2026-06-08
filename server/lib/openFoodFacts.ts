const OFF_SEARCH_URL = 'https://world.openfoodfacts.org/cgi/search.pl';
const OFF_PRODUCT_URL = 'https://world.openfoodfacts.org/api/v2/product';

export interface OffNutritionHit {
  barcode?: string;
  name: string;
  brand?: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  saturatedFat: number;
  fibre: number;
  sugar: number;
  salt: number;
  triggerTags: string[];
  confidence: 'low' | 'medium' | 'high';
}

const VALID_TAGS = new Set([
  'tomato',
  'onion',
  'garlic',
  'spicy',
  'chilli',
  'fatty',
  'fried',
  'dairy',
  'processedMeat',
  'alcohol',
  'caffeine',
  'carbonatedDrink',
  'gluten',
  'unknown',
]);

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

function pickNutrient(
  nutriments: Record<string, unknown>,
  servingKey: string,
  per100Key: string,
  servingGrams: number
): number {
  if (nutriments[servingKey] != null) return num(nutriments[servingKey]);
  if (nutriments[per100Key] != null) {
    return Math.round((num(nutriments[per100Key]) * servingGrams) / 100);
  }
  return 0;
}

function parseServingGrams(servingSize?: string, quantity?: string): number {
  const text = `${servingSize ?? ''} ${quantity ?? ''}`;
  const match = text.match(/(\d+(?:\.\d+)?)\s*g/i);
  if (match) return Number(match[1]);
  return 100;
}

function inferTags(name: string, ingredients?: string, categories?: string): string[] {
  const text = `${name} ${ingredients ?? ''} ${categories ?? ''}`.toLowerCase();
  const tags = new Set<string>();
  const rules: [RegExp, string][] = [
    [/milk|cheese|yogurt|yoghurt|cream|butter|dairy/i, 'dairy'],
    [/wheat|gluten|bread|pasta/i, 'gluten'],
    [/coffee|cola|caffeine|energy/i, 'caffeine'],
    [/cola|fizzy|sparkling|soda/i, 'carbonatedDrink'],
    [/pepperoni|bacon|sausage|ham|processed/i, 'processedMeat'],
    [/fried|crisp|chip/i, 'fatty'],
    [/spicy|chilli|curry/i, 'spicy'],
    [/tomato|passata|ketchup/i, 'tomato'],
    [/onion/i, 'onion'],
    [/garlic/i, 'garlic'],
  ];
  for (const [pattern, tag] of rules) {
    if (pattern.test(text)) tags.add(tag);
  }
  if (tags.size === 0) tags.add('unknown');
  return [...tags].filter((t) => VALID_TAGS.has(t));
}

function mapProduct(product: Record<string, unknown>): OffNutritionHit | null {
  const name = String(product.product_name ?? product.product_name_en ?? '').trim();
  if (!name) return null;

  const brand = String(product.brands ?? '').trim() || undefined;
  const barcode = product.code ? String(product.code) : undefined;
  const servingSize =
    String(product.serving_size ?? product.quantity ?? '').trim() || 'Per 100g';
  const servingGrams = parseServingGrams(servingSize, String(product.quantity ?? ''));
  const nutriments = (product.nutriments ?? {}) as Record<string, unknown>;

  let calories = pickNutrient(
    nutriments,
    'energy-kcal_serving',
    'energy-kcal_100g',
    servingGrams
  );
  if (!calories && nutriments['energy-kj_100g']) {
    calories = Math.round((num(nutriments['energy-kj_100g']) * servingGrams) / 4184);
  }

  const protein = pickNutrient(nutriments, 'proteins_serving', 'proteins_100g', servingGrams);
  const carbs = pickNutrient(
    nutriments,
    'carbohydrates_serving',
    'carbohydrates_100g',
    servingGrams
  );
  const fat = pickNutrient(nutriments, 'fat_serving', 'fat_100g', servingGrams);
  let saturatedFat = pickNutrient(
    nutriments,
    'saturated-fat_serving',
    'saturated-fat_100g',
    servingGrams
  );
  if (!saturatedFat && fat > 0) saturatedFat = Math.round(fat * 0.4 * 10) / 10;
  const fibre = pickNutrient(nutriments, 'fiber_serving', 'fiber_100g', servingGrams);
  const sugar = pickNutrient(nutriments, 'sugars_serving', 'sugars_100g', servingGrams);
  const salt = pickNutrient(nutriments, 'salt_serving', 'salt_100g', servingGrams);

  const hasData = calories > 0 || protein > 0 || carbs > 0 || fat > 0;
  if (!hasData) return null;

  return {
    barcode,
    name,
    brand,
    servingSize,
    calories: Math.round(calories),
    protein: Math.round(protein * 10) / 10,
    carbs: Math.round(carbs * 10) / 10,
    fat: Math.round(fat * 10) / 10,
    saturatedFat: Math.round(saturatedFat * 10) / 10,
    fibre: Math.round(fibre * 10) / 10,
    sugar: Math.round(sugar * 10) / 10,
    salt: Math.round(salt * 100) / 100,
    triggerTags: inferTags(
      name,
      String(product.ingredients_text ?? ''),
      String(product.categories ?? '')
    ),
    confidence: nutriments['energy-kcal_serving'] ? 'high' : 'medium',
  };
}

export function isOpenFoodFactsEnabled(): boolean {
  const flag = process.env.ENABLE_OPEN_FOOD_FACTS?.trim().toLowerCase();
  if (flag === 'false' || flag === '0') return false;
  return true;
}

export async function searchOpenFoodFacts(
  query: string,
  limit = 8
): Promise<{ hits: OffNutritionHit[]; error?: string }> {
  if (!isOpenFoodFactsEnabled()) {
    return { hits: [], error: 'Open Food Facts disabled on server.' };
  }

  const q = query.trim();
  if (q.length < 2) return { hits: [] };

  const params = new URLSearchParams({
    search_terms: q,
    search_simple: '1',
    action: 'process',
    json: '1',
    page_size: String(Math.min(limit, 20)),
    countries_tags_en: 'United Kingdom',
    fields:
      'code,product_name,product_name_en,brands,serving_size,quantity,nutriments,ingredients_text,categories',
  });

  try {
    const response = await fetch(`${OFF_SEARCH_URL}?${params}`, {
      headers: { 'User-Agent': 'HealthPatternTracker/1.0 (contact: local-dev)' },
    });
    if (!response.ok) {
      return { hits: [], error: `Open Food Facts error (${response.status})` };
    }

    const data = (await response.json()) as { products?: Record<string, unknown>[] };
    const hits = (data.products ?? [])
      .map((p) => mapProduct(p))
      .filter((h): h is OffNutritionHit => h != null)
      .slice(0, limit);

    return { hits };
  } catch {
    return { hits: [], error: 'Open Food Facts unreachable.' };
  }
}

export async function lookupOpenFoodFactsBarcode(
  barcode: string
): Promise<{ hit: OffNutritionHit | null; error?: string }> {
  if (!isOpenFoodFactsEnabled()) {
    return { hit: null, error: 'Open Food Facts disabled on server.' };
  }

  const code = barcode.trim().replace(/\s/g, '');
  if (!code) return { hit: null, error: 'Barcode required.' };

  try {
    const response = await fetch(`${OFF_PRODUCT_URL}/${code}.json`, {
      headers: { 'User-Agent': 'HealthPatternTracker/1.0 (contact: local-dev)' },
    });
    if (!response.ok) {
      return { hit: null, error: `Open Food Facts error (${response.status})` };
    }

    const data = (await response.json()) as {
      status?: number;
      product?: Record<string, unknown>;
    };

    if (data.status !== 1 || !data.product) {
      return { hit: null };
    }

    return { hit: mapProduct(data.product) };
  } catch {
    return { hit: null, error: 'Open Food Facts unreachable.' };
  }
}
