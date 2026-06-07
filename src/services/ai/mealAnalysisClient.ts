import type { ConfidenceLevel } from '@/types';
import { detectIngredients, parseTriggerTags } from './ingredientDetection';
import { estimateNutrition } from './nutritionEstimate';
import type {
  AnalyseMealRequest,
  AnalyseMealResponse,
  AnalyseMealOutcome,
  MealAnalysisType,
  ParsedMealAnalysis,
} from './types';
import { AI_NUTRITION_DISCLAIMER } from './types';

export const ANALYSE_MEAL_ENDPOINT = '/api/analyse-meal';

export type {
  AnalyseMealRequest,
  AnalyseMealResponse,
  AnalyseMealOutcome,
  MealAnalysisType,
  ParsedMealAnalysis,
};

const LOCAL_DISCLAIMER_SUFFIX = AI_NUTRITION_DISCLAIMER;

function buildAnalysisNotes(
  likelyIngredients: string[],
  analysisType: MealAnalysisType,
  extra?: string
): string {
  const parts: string[] = [];
  if (analysisType === 'photo') {
    parts.push('Photo-based local estimate.');
  } else if (analysisType === 'name') {
    parts.push('Typical portion estimate from meal name (local).');
  } else if (analysisType === 'menu' || analysisType === 'packaging') {
    parts.push(`Estimated from ${analysisType} text (local).`);
  }
  if (likelyIngredients.length > 0) {
    parts.push(`Likely ingredients: ${likelyIngredients.join(', ')}.`);
  }
  if (extra) parts.push(extra);
  parts.push(LOCAL_DISCLAIMER_SUFFIX);
  return parts.join(' ');
}

function mergeConfidence(
  nutritionConf: ConfidenceLevel,
  ingredientConf: ConfidenceLevel
): ParsedMealAnalysis['confidence'] {
  const tagConf: ConfidenceLevel =
    ingredientConf === 'high' ? 'high' : ingredientConf === 'medium' ? 'medium' : 'low';

  return {
    calories: nutritionConf,
    ingredients: ingredientConf,
    triggerTags: tagConf,
  };
}

/** Local mock AI — used when the backend is unavailable. */
export function mockAnalyseMeal(request: AnalyseMealRequest): ParsedMealAnalysis {
  const text = request.mealText.trim();
  const ingredientResult = detectIngredients(text);
  const nutrition = estimateNutrition(text, ingredientResult.mealName);

  const notes = buildAnalysisNotes(
    ingredientResult.likelyIngredients,
    request.analysisType,
    nutrition.confidence === 'low'
      ? 'Limited detail provided — treat as a cautious generic estimate.'
      : undefined
  );

  return {
    mealName: ingredientResult.mealName,
    estimatedCalories: nutrition.estimatedCalories,
    protein: nutrition.protein,
    carbs: nutrition.carbs,
    fat: nutrition.fat,
    fibre: nutrition.fibre,
    sugar: nutrition.sugar,
    salt: nutrition.salt,
    likelyIngredients: ingredientResult.likelyIngredients,
    triggerTags: ingredientResult.triggerTags,
    confidence: mergeConfidence(nutrition.confidence, ingredientResult.confidence),
    notes,
    provider: 'local-mock',
  };
}

interface BackendFetchResult {
  ok: true;
  data: AnalyseMealResponse;
}

interface BackendFetchError {
  ok: false;
  status: number;
  message: string;
  retryable: boolean;
}

async function fetchBackendAnalysis(
  request: AnalyseMealRequest
): Promise<BackendFetchResult | BackendFetchError> {
  try {
    const response = await fetch(ANALYSE_MEAL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    const payload = (await response.json().catch(() => null)) as
      | AnalyseMealResponse
      | { error?: string }
      | null;

    if (!response.ok) {
      const message =
        payload && typeof payload === 'object' && 'error' in payload && payload.error
          ? String(payload.error)
          : `Server error (${response.status})`;
      return {
        ok: false,
        status: response.status,
        message,
        retryable: response.status >= 500 || response.status === 429,
      };
    }

    if (!payload || typeof payload !== 'object' || !('mealName' in payload)) {
      return {
        ok: false,
        status: response.status,
        message: 'Invalid response from analysis server.',
        retryable: true,
      };
    }

    return { ok: true, data: payload as AnalyseMealResponse };
  } catch {
    return {
      ok: false,
      status: 0,
      message: 'Could not reach the analysis server. Is the API running?',
      retryable: true,
    };
  }
}

function parseBackendResponse(raw: AnalyseMealResponse): ParsedMealAnalysis {
  const tags = parseTriggerTags(raw.triggerTags);
  const ingredientFallback = detectIngredients(raw.mealName);
  const provider: ParsedMealAnalysis['provider'] =
    raw.source === 'openai'
      ? 'openai'
      : raw.source === 'local-database'
        ? 'local-database'
        : 'server-mock';

  return {
    mealName: raw.mealName,
    estimatedCalories: raw.estimatedCalories,
    protein: raw.protein,
    carbs: raw.carbs,
    fat: raw.fat,
    fibre: raw.fibre,
    sugar: raw.sugar,
    salt: raw.salt,
    likelyIngredients:
      raw.likelyIngredients.length > 0
        ? raw.likelyIngredients
        : ingredientFallback.likelyIngredients,
    triggerTags: tags.length > 0 ? tags : ingredientFallback.triggerTags,
    confidence: raw.confidence,
    notes: raw.notes || AI_NUTRITION_DISCLAIMER,
    provider,
  };
}

/**
 * Analyse a meal via the secure backend when available,
 * with local mock as fallback for network/server errors.
 * Validation errors from the backend are thrown (no silent fallback).
 */
export async function analyseMeal(request: AnalyseMealRequest): Promise<AnalyseMealOutcome> {
  const backend = await fetchBackendAnalysis(request);

  if (backend.ok) {
    return {
      analysis: parseBackendResponse(backend.data),
      usedLocalFallback: false,
    };
  }

  if (!backend.retryable) {
    throw new Error(backend.message);
  }

  return {
    analysis: mockAnalyseMeal(request),
    usedLocalFallback: true,
    backendError: backend.message,
  };
}
