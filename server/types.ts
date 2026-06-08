export type ConfidenceLevel = 'low' | 'medium' | 'high';

export type MealAnalysisType = 'text' | 'photo' | 'menu' | 'packaging' | 'name';

export const VALID_TRIGGER_TAGS = [
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
  'largePortion',
  'lateMeal',
  'acidic',
  'gluten',
  'beansLegumes',
  'coconutMilk',
  'takeaway',
  'richFood',
  'unknown',
] as const;

export type TriggerTag = (typeof VALID_TRIGGER_TAGS)[number];

export interface AnalyseMealRequest {
  profileId: string;
  mealText: string;
  imageBase64: string | null;
  analysisType: MealAnalysisType;
}

export interface MealAnalysisConfidence {
  calories: ConfidenceLevel;
  ingredients: ConfidenceLevel;
  triggerTags: ConfidenceLevel;
}

export interface AnalyseMealResponse {
  mealName: string;
  estimatedCalories: number;
  protein: number;
  carbs: number;
  fat: number;
  saturatedFat: number;
  fibre: number;
  sugar: number;
  salt: number;
  likelyIngredients: string[];
  triggerTags: string[];
  confidence: MealAnalysisConfidence;
  notes: string;
  source: 'openai' | 'mock' | 'local-database';
}
