import type { ConfidenceLevel, TriggerTag } from '@/types';

export type MealAnalysisType = 'text' | 'photo' | 'menu' | 'packaging';

/** Request body for POST /api/analyse-meal */
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

/** Response body from POST /api/analyse-meal */
export interface AnalyseMealResponse {
  mealName: string;
  estimatedCalories: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
  sugar: number;
  salt: number;
  likelyIngredients: string[];
  triggerTags: string[];
  confidence: MealAnalysisConfidence;
  notes: string;
  source?: 'openai' | 'mock';
  error?: string;
}

export type AnalysisProvider = 'openai' | 'server-mock' | 'local-mock';

export interface ParsedMealAnalysis extends Omit<AnalyseMealResponse, 'triggerTags' | 'source' | 'error'> {
  triggerTags: TriggerTag[];
  provider: AnalysisProvider;
}

export interface AnalyseMealOutcome {
  analysis: ParsedMealAnalysis;
  /** True when the client used local mock after backend failure. */
  usedLocalFallback: boolean;
  backendError?: string;
}

export const AI_NUTRITION_DISCLAIMER =
  'AI nutrition and ingredient estimates may be inaccurate.';

export const AI_ESTIMATE_REVIEW_LABEL = 'AI estimate — review before saving.';

/** Max raw image size before upload (bytes). ~4MB */
export const MAX_IMAGE_FILE_BYTES = 4 * 1024 * 1024;
