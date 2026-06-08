export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active';

export type GoalType =
  | 'maintain'
  | 'slowWeightLoss'
  | 'moderateWeightLoss'
  | 'improveDigestion'
  | 'fattyLiverSupport'
  | 'muscleGain'
  | 'generalHealth';

export type ProfileModule =
  | 'nutrition'
  | 'macros'
  | 'weight'
  | 'water'
  | 'exercise'
  | 'healthIssues'
  | 'digestive'
  | 'goals';

export type ExerciseType =
  | 'walking'
  | 'briskWalking'
  | 'running'
  | 'cycling'
  | 'swimming'
  | 'gym'
  | 'yoga'
  | 'pilates'
  | 'reformerPilates'
  | 'housework'
  | 'other';

export interface ExerciseEntry {
  id: string;
  profileId: string;
  dateTime: string;
  activity: ExerciseType;
  durationMinutes: number;
  caloriesBurned: number;
  notes?: string;
}

export interface Profile {
  id: string;
  name: string;
  age?: number;
  sex?: 'male' | 'female' | 'other' | 'preferNotToSay';
  height?: number;
  currentWeight?: number;
  targetWeight?: number;
  activityLevel: ActivityLevel;
  goalType: GoalType;
  enabledModules: ProfileModule[];
  dailyCalorieTarget?: number;
  proteinTarget?: number;
  carbTarget?: number;
  fatTarget?: number;
  fibreTarget?: number;
  waterTarget?: number;
  /** Cloud sync: household this profile belongs to. */
  householdId?: string;
  /** Cloud sync: user who created/owns this profile. */
  ownerUserId?: string;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'drink';
export type MealSource = 'homemade' | 'takeaway' | 'restaurant' | 'packaged' | 'unknown';
export type PortionSize = 'small' | 'normal' | 'large' | 'veryLarge';

export type TriggerTag =
  | 'tomato'
  | 'onion'
  | 'garlic'
  | 'spicy'
  | 'chilli'
  | 'fatty'
  | 'fried'
  | 'dairy'
  | 'processedMeat'
  | 'alcohol'
  | 'caffeine'
  | 'carbonatedDrink'
  | 'largePortion'
  | 'lateMeal'
  | 'acidic'
  | 'gluten'
  | 'beansLegumes'
  | 'coconutMilk'
  | 'takeaway'
  | 'richFood'
  | 'unknown';

export interface Meal {
  id: string;
  profileId: string;
  dateTime: string;
  mealType: MealType;
  mealName: string;
  description?: string;
  source: MealSource;
  photoUrl?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  saturatedFat?: number;
  fibre: number;
  sugar?: number;
  salt?: number;
  waterMl?: number;
  portionSize: PortionSize;
  notes?: string;
  triggerTags: TriggerTag[];
  createdAt: string;
  updatedAt: string;
}

export type IssueCategory = 'digestion' | 'pain' | 'sleep' | 'skin' | 'energy' | 'mood' | 'other';

export interface HealthIssue {
  id: string;
  profileId: string;
  name: string;
  description?: string;
  category: IssueCategory;
  possibleTriggers: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type Severity = 'mild' | 'moderate' | 'severe';

export type PainLocation =
  | 'upper middle'
  | 'upper right'
  | 'upper left'
  | 'lower abdomen'
  | 'chest'
  | 'back'
  | 'right shoulder'
  | 'left shoulder'
  | 'head'
  | 'general abdomen'
  | 'other';

export type PainDescription =
  | 'pressure'
  | 'burning'
  | 'sharp'
  | 'cramping'
  | 'stabbing'
  | 'dull ache'
  | 'wave-like'
  | 'bloated'
  | 'gassy'
  | 'other';

export interface SymptomEpisode {
  id: string;
  profileId: string;
  issueId?: string;
  startDateTime: string;
  endDateTime?: string;
  durationMinutes?: number;
  severity: Severity;
  painScore?: number;
  symptoms: string[];
  bloating?: boolean;
  nausea?: boolean;
  sweating?: boolean;
  vomiting?: boolean;
  fever?: boolean;
  burping?: boolean;
  passingWind?: boolean;
  bowelMovement?: boolean;
  diarrhoea?: boolean;
  constipation?: boolean;
  sleepAffected?: boolean;
  painLocation?: PainLocation;
  painDescription?: PainDescription;
  suspectedTrigger?: string;
  relatedMealIds?: string[];
  notes?: string;
  createdAt: string;
}

export interface DailyCheckIn {
  id: string;
  profileId: string;
  date: string;
  checkInTime: string;
  noSymptomsReported: boolean;
  symptomsSinceLastCheckIn: boolean;
  selectedIssues: string[];
  mildBloatingPressure?: boolean;
  indigestion?: boolean;
  painEpisode?: boolean;
  gas?: boolean;
  nausea?: boolean;
  sweating?: boolean;
  vomiting?: boolean;
  fever?: boolean;
  diarrhoea?: boolean;
  constipation?: boolean;
  headache?: boolean;
  tiredness?: boolean;
  skinIssue?: boolean;
  sleepAffected?: boolean;
  stressLevel?: number;
  energyLevel?: number;
  notes?: string;
  createdAt: string;
}

export interface WeightEntry {
  id: string;
  profileId: string;
  date: string;
  weight: number;
  notes?: string;
}

export interface WaterEntry {
  id: string;
  profileId: string;
  dateTime: string;
  amountMl: number;
}

export type GoalStatus = 'active' | 'completed' | 'skipped';

export type GoalCategory =
  | 'digestion'
  | 'calories'
  | 'hydration'
  | 'takeaway'
  | 'portion'
  | 'movement'
  | 'sleep'
  | 'protein'
  | 'fibre'
  | 'weight';

export type GoalDifficulty = 'easy' | 'medium';

export interface Goal {
  id: string;
  profileId: string;
  title: string;
  description?: string;
  category: GoalCategory;
  status: GoalStatus;
  startDate?: string;
  endDate?: string;
  difficulty: GoalDifficulty;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export type FoodItemSource =
  | 'openFoodFacts'
  | 'manual'
  | 'ai'
  | 'favourite'
  | 'unknown';

export interface FoodItem {
  id: string;
  profileId?: string;
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
  triggerTags: TriggerTag[];
  source: FoodItemSource;
  createdAt: string;
  updatedAt: string;
}

export interface FavouriteMeal {
  id: string;
  profileId: string;
  name: string;
  mealType: MealType;
  source: MealSource;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  saturatedFat: number;
  fibre: number;
  sugar: number;
  salt: number;
  portionSize: PortionSize;
  triggerTags: TriggerTag[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ConfidenceLevel = 'low' | 'medium' | 'high';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface Insight {
  id: string;
  title: string;
  description: string;
  confidence: ConfidenceLevel;
  category: 'trigger' | 'tolerance' | 'progress' | 'pattern' | 'general' | 'early';
  relatedTriggers?: TriggerTag[];
  dataPoints?: number;
}

export interface TriggerReport {
  trigger: TriggerTag;
  timesEaten: number;
  symptomsAfter: number;
  noSymptomsAfter: number;
  symptomRate: number;
  severeSymptomRate: number;
  confidence: ConfidenceLevel;
  explanation: string;
}

export interface SuspectedTrigger {
  trigger: TriggerTag;
  label: string;
  symptomRate: number;
  episodeCount: number;
  severeCount: number;
  confidence: ConfidenceLevel;
  score: number;
}

export interface ToleratedItem {
  name: string;
  type: 'meal' | 'trigger';
  count: number;
  confidence: ConfidenceLevel;
}

export interface SymptomPatternSummary {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  dateTime: string;
}

export interface RiskAssessment {
  level: RiskLevel;
  confidence: ConfidenceLevel;
  contributingFactors: string[];
  explanation: string;
}

export const PATTERN_DISCLAIMER =
  'Pattern estimate only. This is not medical advice.';

export const INSIGHTS_DISCLAIMER =
  'Insights are pattern observations only and are not medical advice.';

export const MEDICAL_DISCLAIMER =
  'This app is for personal tracking only and does not provide medical diagnosis. Seek medical advice for severe, recurring, or concerning symptoms.';

export const AI_STATUS_LABEL =
  'Secure backend when API server is running; mock/local fallback otherwise';

export const FOOD_LOOKUP_STATUS_LABEL =
  'Open Food Facts barcode lookup with saved-food cache; local UK meal database for meal names';

export const APP_VERSION = '0.2.0';

export interface AppData {
  profiles: Profile[];
  meals: Meal[];
  issues: HealthIssue[];
  symptomEpisodes: SymptomEpisode[];
  dailyCheckIns: DailyCheckIn[];
  weightEntries: WeightEntry[];
  waterEntries: WaterEntry[];
  exerciseEntries: ExerciseEntry[];
  goals: Goal[];
  favouriteMeals: FavouriteMeal[];
  savedFoods: FoodItem[];
  activeProfileId: string | null;
  demoLoaded: boolean;
}

export const FOOD_ITEM_SOURCE_LABELS: Record<FoodItemSource, string> = {
  openFoodFacts: 'Open Food Facts',
  manual: 'Manual',
  ai: 'AI',
  favourite: 'Favourite',
  unknown: 'Unknown',
};

export const MODULE_LABELS: Record<ProfileModule, string> = {
  nutrition: 'Nutrition',
  macros: 'Macros',
  weight: 'Weight',
  water: 'Water',
  exercise: 'Exercise',
  healthIssues: 'Health issues',
  digestive: 'Digestive',
  goals: 'Goals',
};

export const GOAL_CATEGORY_LABELS: Record<GoalCategory, string> = {
  digestion: 'Digestion',
  calories: 'Calories',
  hydration: 'Hydration',
  takeaway: 'Takeaway',
  portion: 'Portion',
  movement: 'Movement',
  sleep: 'Sleep',
  protein: 'Protein',
  fibre: 'Fibre',
  weight: 'Weight',
};

export const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  maintain: 'Maintain weight',
  slowWeightLoss: 'Gentle weight loss',
  moderateWeightLoss: 'Weight loss (NHS pace)',
  improveDigestion: 'Improve digestion',
  fattyLiverSupport: 'Fatty liver support',
  muscleGain: 'Muscle gain',
  generalHealth: 'General health',
};

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
  drink: 'Drink',
};

export const PORTION_SIZE_LABELS: Record<PortionSize, string> = {
  small: 'Small',
  normal: 'Normal',
  large: 'Large',
  veryLarge: 'Very large',
};

export const MEAL_SOURCE_LABELS: Record<MealSource, string> = {
  homemade: 'Homemade',
  takeaway: 'Takeaway',
  restaurant: 'Restaurant',
  packaged: 'Packaged',
  unknown: 'Unknown',
};

export const TRIGGER_TAG_LABELS: Record<TriggerTag, string> = {
  tomato: 'Tomato',
  onion: 'Onion',
  garlic: 'Garlic',
  spicy: 'Spicy',
  chilli: 'Chilli',
  fatty: 'Fatty',
  fried: 'Fried',
  dairy: 'Dairy',
  processedMeat: 'Processed meat',
  alcohol: 'Alcohol',
  caffeine: 'Caffeine',
  carbonatedDrink: 'Carbonated drink',
  largePortion: 'Large portion',
  lateMeal: 'Late meal',
  acidic: 'Acidic',
  gluten: 'Gluten',
  beansLegumes: 'Beans / legumes',
  coconutMilk: 'Coconut milk',
  takeaway: 'Takeaway',
  richFood: 'Rich food',
  unknown: 'Unknown',
};

export const ALL_TRIGGER_TAGS: TriggerTag[] = Object.keys(TRIGGER_TAG_LABELS) as TriggerTag[];

export const ISSUE_CATEGORY_LABELS: Record<IssueCategory, string> = {
  digestion: 'Digestion',
  pain: 'Pain',
  sleep: 'Sleep',
  skin: 'Skin',
  energy: 'Energy',
  mood: 'Mood',
  other: 'Other',
};

export const PAIN_LOCATION_LABELS: Record<PainLocation, string> = {
  'upper middle': 'Upper middle',
  'upper right': 'Upper right',
  'upper left': 'Upper left',
  'lower abdomen': 'Lower abdomen',
  chest: 'Chest',
  back: 'Back',
  'right shoulder': 'Right shoulder',
  'left shoulder': 'Left shoulder',
  head: 'Head',
  'general abdomen': 'General abdomen',
  other: 'Other',
};

export const PAIN_DESCRIPTION_LABELS: Record<PainDescription, string> = {
  pressure: 'Pressure',
  burning: 'Burning',
  sharp: 'Sharp',
  cramping: 'Cramping',
  stabbing: 'Stabbing',
  'dull ache': 'Dull ache',
  'wave-like': 'Wave-like',
  bloated: 'Bloated',
  gassy: 'Gassy',
  other: 'Other',
};

export const URGENT_WARNING =
  'Seek urgent medical help for severe chest pain, shortness of breath, fainting, vomiting blood, black stools, severe worsening abdominal pain, fever with severe pain, or yellowing of skin/eyes.';
