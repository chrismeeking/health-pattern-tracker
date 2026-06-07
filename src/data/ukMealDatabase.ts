/**
 * UK meal nutrition database for offline mock lookup and name suggestions.
 *
 * Values are typical single-serving estimates from public sources (not user-specific).
 * Prefer official brand nutrition PDFs / websites where available; otherwise industry averages.
 *
 * Sources used:
 * - McDonald's UK nutrition booklet (Dec 2025)
 * - Greggs.com product pages
 * - Nando's UK menu / allergen PDFs
 * - Nutracheck chip-shop averages
 * - National Federation of Fish Friers (via press coverage)
 * - British Heart Foundation (typical full English ~850 kcal)
 * - NHS Healthier Families / NHS trust meal guides
 * - Tesco / Co-op ready-meal labels (supermarket portions)
 */

export type MealConfidence = 'low' | 'medium' | 'high';

export interface UkMealDatabaseEntry {
  id: string;
  name: string;
  patterns: RegExp[];
  servingDescription: string;
  sourceLabel: string;
  sourceUrl?: string;
  confidence: MealConfidence;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
  sugar: number;
  salt: number;
  ingredients: string[];
  triggerTags: string[];
}

export const UK_MEAL_DATABASE: UkMealDatabaseEntry[] = [
  {
    id: 'full-english',
    name: 'All Day Breakfast',
    patterns: [
      /all\s+day\s+breakfast/i,
      /full\s+english/i,
      /english\s+breakfast/i,
      /fry\s+up/i,
      /full\s+breakfast/i,
    ],
    servingDescription: 'Typical café full English (2 rashers, 2 sausages, egg, beans, toast)',
    sourceLabel: 'British Heart Foundation typical fry-up (~850 kcal)',
    sourceUrl: 'https://www.bhf.org.uk/',
    confidence: 'medium',
    calories: 850,
    protein: 35,
    carbs: 45,
    fat: 52,
    fibre: 6,
    sugar: 8,
    salt: 3.2,
    ingredients: ['bacon', 'sausage', 'egg', 'baked beans', 'toast', 'tomato', 'mushrooms'],
    triggerTags: ['processedMeat', 'fatty', 'tomato', 'dairy'],
  },
  {
    id: 'beans-on-toast',
    name: 'Beans on Toast',
    patterns: [/beans\s+on\s+toast/i, /beans\s+&?\s+toast/i],
    servingDescription: 'Half tin beans + 2 slices wholemeal toast',
    sourceLabel: 'NHS trust meal guide / typical home portion (~320 kcal)',
    sourceUrl: 'https://www.nhs.uk/healthier-families/recipes/healthy-beans-on-toast/',
    confidence: 'high',
    calories: 320,
    protein: 14,
    carbs: 48,
    fat: 6,
    fibre: 12,
    sugar: 10,
    salt: 1.2,
    ingredients: ['baked beans', 'wholemeal bread', 'butter or spread'],
    triggerTags: ['tomato'],
  },
  {
    id: 'jacket-potato-beans',
    name: 'Jacket Potato with Beans',
    patterns: [/jacket\s+potato.*beans/i, /baked\s+potato.*beans/i],
    servingDescription: 'Large jacket potato with half tin beans',
    sourceLabel: 'Typical UK canteen / pub portion (~450 kcal)',
    confidence: 'medium',
    calories: 450,
    protein: 16,
    carbs: 72,
    fat: 8,
    fibre: 14,
    sugar: 9,
    salt: 1.4,
    ingredients: ['baked potato', 'baked beans', 'butter'],
    triggerTags: ['tomato', 'dairy'],
  },
  {
    id: 'pepperoni-pizza',
    name: 'Pepperoni Pizza',
    patterns: [/pepperoni\s+pizza/i, /pizza.*pepperoni/i],
    servingDescription: 'Large takeaway slice or small whole pizza',
    sourceLabel: 'Typical UK takeaway pepperoni pizza',
    confidence: 'medium',
    calories: 850,
    protein: 35,
    carbs: 85,
    fat: 38,
    fibre: 4,
    sugar: 8,
    salt: 2.5,
    ingredients: ['pizza dough', 'tomato sauce', 'mozzarella', 'pepperoni', 'garlic', 'onion'],
    triggerTags: ['tomato', 'dairy', 'processedMeat', 'fatty', 'garlic', 'onion', 'spicy'],
  },
  {
    id: 'margherita-pizza',
    name: 'Margherita Pizza',
    patterns: [/margherita\s+pizza/i, /cheese\s+and\s+tomato\s+pizza/i],
    servingDescription: 'Personal 9" takeaway pizza',
    sourceLabel: 'Typical UK takeaway margherita (~680 kcal)',
    confidence: 'medium',
    calories: 680,
    protein: 28,
    carbs: 78,
    fat: 26,
    fibre: 4,
    sugar: 6,
    salt: 2.0,
    ingredients: ['pizza dough', 'tomato sauce', 'mozzarella', 'basil'],
    triggerTags: ['tomato', 'dairy', 'gluten'],
  },
  {
    id: 'fish-and-chips',
    name: 'Fish and Chips',
    patterns: [/fish\s+and\s+chips/i, /fish\s*&\s*chips/i, /cod\s+and\s+chips/i],
    servingDescription: 'Average chip-shop portion (cod/haddock + chips)',
    sourceLabel: 'Nutracheck chip-shop average portion (838 kcal)',
    sourceUrl: 'https://www.nutracheck.co.uk/calories/calories_in_takeaways/calories_in_fish_and_chips',
    confidence: 'medium',
    calories: 838,
    protein: 35,
    carbs: 80,
    fat: 48,
    fibre: 5,
    sugar: 2,
    salt: 2.4,
    ingredients: ['battered cod', 'chips', 'salt', 'vinegar'],
    triggerTags: ['fried', 'fatty', 'gluten'],
  },
  {
    id: 'chicken-and-chips',
    name: 'Chicken and Chips',
    patterns: [/chicken\s+and\s+chips/i, /fried\s+chicken\s+and\s+chips/i],
    servingDescription: 'Chip-shop fried chicken pieces + chips',
    sourceLabel: 'Nutracheck chip-shop fried chicken average (445 kcal chicken portion)',
    confidence: 'medium',
    calories: 720,
    protein: 38,
    carbs: 65,
    fat: 34,
    fibre: 4,
    sugar: 2,
    salt: 2.1,
    ingredients: ['fried chicken pieces', 'chips'],
    triggerTags: ['fried', 'fatty'],
  },
  {
    id: 'thai-green-curry',
    name: 'Thai Green Curry with Rice',
    patterns: [/thai\s+green\s+curry/i, /green\s+curry.*rice/i],
    servingDescription: 'Restaurant/takeaway portion with jasmine rice',
    sourceLabel: 'Typical UK Thai takeaway portion',
    confidence: 'medium',
    calories: 650,
    protein: 30,
    carbs: 70,
    fat: 28,
    fibre: 5,
    sugar: 6,
    salt: 2.0,
    ingredients: ['chicken or tofu', 'green curry paste', 'coconut milk', 'jasmine rice', 'garlic', 'chilli'],
    triggerTags: ['spicy', 'garlic', 'onion', 'coconutMilk', 'chilli'],
  },
  {
    id: 'chicken-tikka-masala',
    name: 'Chicken Tikka Masala with Rice',
    patterns: [
      /chicken\s+tikka\s+masala/i,
      /tikka\s+masala.*rice/i,
      /tikka\s+masala/i,
    ],
    servingDescription: 'Takeaway/restaurant portion with pilau rice',
    sourceLabel: 'Typical UK Indian takeaway (~750 kcal)',
    confidence: 'medium',
    calories: 750,
    protein: 40,
    carbs: 68,
    fat: 32,
    fibre: 4,
    sugar: 9,
    salt: 2.2,
    ingredients: ['chicken tikka', 'masala sauce', 'pilau rice', 'cream', 'tomato'],
    triggerTags: ['dairy', 'tomato', 'spicy', 'richFood'],
  },
  {
    id: 'tikka-masala-ready-meal',
    name: 'Chicken Tikka Masala (Ready Meal)',
    patterns: [/tikka\s+masala.*ready\s+meal/i, /supermarket\s+tikka\s+masala/i],
    servingDescription: '400g supermarket ready meal',
    sourceLabel: 'Tesco chicken tikka masala with rice label (~530 kcal)',
    sourceUrl: 'https://www.tesco.com/groceries/en-GB/products/310147600',
    confidence: 'high',
    calories: 530,
    protein: 26,
    carbs: 58,
    fat: 21,
    fibre: 3,
    sugar: 11,
    salt: 1.6,
    ingredients: ['chicken breast', 'masala sauce', 'pilau rice'],
    triggerTags: ['dairy', 'tomato', 'spicy'],
  },
  {
    id: 'indian-curry-rice',
    name: 'Indian Curry with Rice',
    patterns: [/indian\s+curry/i, /curry\s+with\s+rice/i, /balti/i, /korma/i, /jalfrezi/i],
    servingDescription: 'Average takeaway curry + rice (no naan)',
    sourceLabel: 'Typical UK takeaway curry portion (~800 kcal)',
    confidence: 'low',
    calories: 800,
    protein: 35,
    carbs: 75,
    fat: 38,
    fibre: 5,
    sugar: 8,
    salt: 2.5,
    ingredients: ['meat or veg curry', 'pilau or boiled rice', 'onion', 'garlic', 'spices'],
    triggerTags: ['spicy', 'onion', 'garlic', 'richFood', 'takeaway'],
  },
  {
    id: 'roast-dinner',
    name: 'Roast Dinner',
    patterns: [/roast\s+dinner/i, /sunday\s+roast/i, /roast\s+(beef|chicken|lamb|pork)/i],
    servingDescription: 'Roast meat, potatoes, vegetables, gravy, yorkshire pudding',
    sourceLabel: 'Typical home/pub Sunday roast portion',
    confidence: 'medium',
    calories: 750,
    protein: 40,
    carbs: 80,
    fat: 25,
    fibre: 8,
    sugar: 5,
    salt: 1.8,
    ingredients: ['roast meat', 'roast potatoes', 'vegetables', 'gravy', 'yorkshire pudding'],
    triggerTags: ['fatty', 'gluten'],
  },
  {
    id: 'shepherds-pie',
    name: "Shepherd's Pie",
    patterns: [/shepherd'?s?\s+pie/i, /cottage\s+pie/i],
    servingDescription: 'Home-cooked adult portion',
    sourceLabel: 'Typical home portion (~480 kcal)',
    confidence: 'medium',
    calories: 480,
    protein: 28,
    carbs: 42,
    fat: 20,
    fibre: 5,
    sugar: 6,
    salt: 1.5,
    ingredients: ['minced lamb or beef', 'mashed potato', 'onion', 'carrot', 'gravy'],
    triggerTags: ['onion', 'fatty'],
  },
  {
    id: 'spaghetti-bolognese',
    name: 'Spaghetti Bolognese',
    patterns: [/spaghetti\s+bolognese/i, /spag\s+bol/i, /bolognese/i],
    servingDescription: 'Home-cooked or pub portion',
    sourceLabel: 'Typical UK portion (~570 kcal)',
    confidence: 'medium',
    calories: 570,
    protein: 32,
    carbs: 62,
    fat: 18,
    fibre: 6,
    sugar: 8,
    salt: 1.6,
    ingredients: ['spaghetti', 'beef mince', 'tomato sauce', 'onion', 'garlic'],
    triggerTags: ['tomato', 'onion', 'garlic', 'gluten'],
  },
  {
    id: 'big-mac',
    name: "McDonald's Big Mac",
    patterns: [/big\s+mac/i],
    servingDescription: '1 Big Mac sandwich',
    sourceLabel: 'McDonald\'s UK nutrition booklet (494 kcal)',
    sourceUrl: 'https://www.mcdonalds.com/gb/en-gb/menu.html',
    confidence: 'high',
    calories: 494,
    protein: 27,
    carbs: 43,
    fat: 25,
    fibre: 4,
    sugar: 9,
    salt: 2.3,
    ingredients: ['beef patties', 'bun', 'cheese', 'lettuce', 'onion', 'pickles', 'Big Mac sauce'],
    triggerTags: ['dairy', 'onion', 'processedMeat', 'takeaway'],
  },
  {
    id: 'mcdonalds-fries-medium',
    name: "McDonald's Medium Fries",
    patterns: [/mcdonald'?s?\s+fries/i, /medium\s+fries/i, /mc\s+fries/i],
    servingDescription: 'Medium portion fries',
    sourceLabel: 'McDonald\'s UK nutrition booklet (337 kcal)',
    confidence: 'high',
    calories: 337,
    protein: 4,
    carbs: 42,
    fat: 17,
    fibre: 4,
    sugar: 0,
    salt: 0.6,
    ingredients: ['potatoes', 'vegetable oil', 'salt'],
    triggerTags: ['fried', 'takeaway'],
  },
  {
    id: 'greggs-sausage-roll',
    name: 'Greggs Sausage Roll',
    patterns: [/greggs\s+sausage\s+roll/i, /sausage\s+roll/i],
    servingDescription: '1 Greggs sausage roll (103g)',
    sourceLabel: 'Greggs.com official product nutrition (348 kcal)',
    sourceUrl: 'https://www.greggs.com/menu/product/sausage-roll-1000446/',
    confidence: 'high',
    calories: 348,
    protein: 9,
    carbs: 24,
    fat: 24,
    fibre: 1,
    sugar: 0,
    salt: 1.5,
    ingredients: ['sausage meat', 'puff pastry'],
    triggerTags: ['processedMeat', 'fatty', 'gluten'],
  },
  {
    id: 'nandos-quarter-chicken',
    name: "Nando's 1/4 Chicken",
    patterns: [/nando'?s?\s*(1\/4|quarter)\s*chicken/i, /quarter\s+chicken/i, /1\/4\s+chicken/i],
    servingDescription: '1/4 chicken, plain-ish spice (no sides)',
    sourceLabel: 'Nando\'s UK menu (289 kcal base)',
    sourceUrl: 'https://www.nandos.co.uk/food/menu/',
    confidence: 'high',
    calories: 289,
    protein: 39,
    carbs: 0,
    fat: 15,
    fibre: 1,
    sugar: 0,
    salt: 0.9,
    ingredients: ['chicken', 'PERi-PERi marinade'],
    triggerTags: ['spicy'],
  },
  {
    id: 'nandos-half-chicken-chips',
    name: "Nando's Half Chicken & Chips",
    patterns: [/nando'?s?\s*half\s+chicken/i, /half\s+chicken\s+and\s+chips/i, /half\s+chicken\s*&\s*chips/i],
    servingDescription: '1/2 chicken plain-ish + regular chips',
    sourceLabel: 'Nando\'s UK allergen menu PDF (840 kcal)',
    confidence: 'high',
    calories: 840,
    protein: 72,
    carbs: 34,
    fat: 47,
    fibre: 4,
    sugar: 1,
    salt: 2.0,
    ingredients: ['half chicken', 'PERi-PERi chips'],
    triggerTags: ['spicy', 'fried', 'takeaway'],
  },
  {
    id: 'chicken-caesar-salad',
    name: 'Chicken Caesar Salad',
    patterns: [/chicken\s+caesar\s+salad/i, /caesar\s+salad/i],
    servingDescription: 'Restaurant/pub Caesar with grilled chicken',
    sourceLabel: 'Typical restaurant Caesar salad (~520 kcal)',
    confidence: 'medium',
    calories: 520,
    protein: 35,
    carbs: 18,
    fat: 34,
    fibre: 3,
    sugar: 3,
    salt: 1.8,
    ingredients: ['romaine lettuce', 'grilled chicken', 'parmesan', 'croutons', 'Caesar dressing'],
    triggerTags: ['dairy', 'gluten', 'fatty'],
  },
  {
    id: 'ham-cheese-sandwich',
    name: 'Ham and Cheese Sandwich',
    patterns: [/ham\s+(and|&)\s+cheese\s+sandwich/i, /meal\s+deal\s+sandwich/i],
    servingDescription: 'Supermarket meal-deal style sandwich',
    sourceLabel: 'Typical UK meal-deal sandwich (~480 kcal)',
    confidence: 'medium',
    calories: 480,
    protein: 22,
    carbs: 48,
    fat: 20,
    fibre: 4,
    sugar: 5,
    salt: 2.0,
    ingredients: ['bread', 'ham', 'cheddar', 'butter', 'lettuce'],
    triggerTags: ['dairy', 'processedMeat', 'gluten'],
  },
  {
    id: 'chicken-wrap',
    name: 'Chicken Wrap',
    patterns: [/chicken\s+wrap/i, /grilled\s+chicken\s+wrap/i],
    servingDescription: 'Takeaway/café chicken wrap',
    sourceLabel: 'Typical UK takeaway wrap (~500 kcal)',
    confidence: 'medium',
    calories: 500,
    protein: 28,
    carbs: 45,
    fat: 22,
    fibre: 3,
    sugar: 4,
    salt: 1.6,
    ingredients: ['tortilla wrap', 'chicken', 'lettuce', 'mayo or sauce'],
    triggerTags: ['fatty', 'takeaway'],
  },
  {
    id: 'burrito',
    name: 'Burrito',
    patterns: [/burrito/i, /mission\s+wrap/i],
    servingDescription: 'Takeaway chicken or beef burrito',
    sourceLabel: 'Typical UK burrito chain portion (~650 kcal)',
    confidence: 'medium',
    calories: 650,
    protein: 32,
    carbs: 72,
    fat: 24,
    fibre: 8,
    sugar: 5,
    salt: 2.2,
    ingredients: ['tortilla', 'rice', 'beans', 'meat', 'cheese', 'salsa'],
    triggerTags: ['dairy', 'spicy', 'beansLegumes', 'takeaway', 'largePortion'],
  },
  {
    id: 'porridge-banana',
    name: 'Porridge with Banana',
    patterns: [/porridge/i, /oatmeal.*banana/i, /oats.*banana/i],
    servingDescription: 'Bowl of porridge with semi-skimmed milk and banana',
    sourceLabel: 'Typical home breakfast portion (~350 kcal)',
    confidence: 'medium',
    calories: 350,
    protein: 14,
    carbs: 55,
    fat: 8,
    fibre: 7,
    sugar: 18,
    salt: 0.3,
    ingredients: ['oats', 'milk', 'banana'],
    triggerTags: ['dairy'],
  },
  {
    id: 'soup-and-roll',
    name: 'Soup and Bread Roll',
    patterns: [/soup\s+and\s+(bread|roll)/i, /cup\s+of\s+soup/i],
    servingDescription: 'Café cup of soup + bread roll',
    sourceLabel: 'Typical café lunch (~400 kcal)',
    confidence: 'low',
    calories: 400,
    protein: 12,
    carbs: 52,
    fat: 14,
    fibre: 4,
    sugar: 4,
    salt: 1.8,
    ingredients: ['vegetable or tomato soup', 'bread roll', 'butter'],
    triggerTags: ['tomato', 'gluten', 'dairy'],
  },
];

const GENERIC_FALLBACK = {
  confidence: 'low' as MealConfidence,
  estimatedCalories: 500,
  protein: 20,
  carbs: 50,
  fat: 18,
  fibre: 4,
  sugar: 8,
  salt: 1.5,
};

function normaliseSearch(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

function scoreUkMealMatch(entry: UkMealDatabaseEntry, normalized: string): number {
  const nameLower = normaliseSearch(entry.name);
  let score = 0;
  if (nameLower === normalized) score += 100;
  if (nameLower.includes(normalized) || normalized.includes(nameLower)) score += 50;
  if (entry.patterns.some((p) => p.test(normalized))) score += 80;
  for (const word of normalized.split(' ')) {
    if (word.length >= 3 && nameLower.includes(word)) score += 10;
  }
  return score;
}

function getRankedUkMealMatches(text: string): { entry: UkMealDatabaseEntry; score: number }[] {
  const normalized = normaliseSearch(text);
  if (normalized.length < 2) return [];

  const scored = UK_MEAL_DATABASE.map((entry) => {
    return { entry, score: scoreUkMealMatch(entry, normalized) };
  })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  return scored;
}

/** Best ranked match for meal name / description text. */
export function matchUkMeal(text: string): UkMealDatabaseEntry | null {
  return getRankedUkMealMatches(text)[0]?.entry ?? null;
}

/** Ranked matches for autocomplete-style search. */
export function searchUkMeals(text: string, limit = 5): UkMealDatabaseEntry[] {
  return getRankedUkMealMatches(text).slice(0, limit).map(({ entry }) => entry);
}

export function getScaledGenericEstimate(text: string) {
  const wordCount = normaliseSearch(text).split(' ').filter(Boolean).length;
  const scale = Math.min(1.4, 0.8 + wordCount * 0.05);
  return {
    estimatedCalories: Math.round(GENERIC_FALLBACK.estimatedCalories * scale),
    protein: Math.round(GENERIC_FALLBACK.protein * scale),
    carbs: Math.round(GENERIC_FALLBACK.carbs * scale),
    fat: Math.round(GENERIC_FALLBACK.fat * scale),
    fibre: GENERIC_FALLBACK.fibre,
    sugar: GENERIC_FALLBACK.sugar,
    salt: GENERIC_FALLBACK.salt,
    confidence: GENERIC_FALLBACK.confidence,
  };
}

export function inferDisplayName(text: string): string {
  const match = matchUkMeal(text);
  if (match) return match.name;
  const trimmed = text.trim();
  if (!trimmed) return 'Unknown meal';
  const firstLine = trimmed.split(/[\n.]/)[0]?.trim() ?? trimmed;
  return firstLine
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
    .slice(0, 60);
}

export function getDatabaseSourceSummary(): string {
  return `${UK_MEAL_DATABASE.length} UK meals (official brand data where available)`;
}
