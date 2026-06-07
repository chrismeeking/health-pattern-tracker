import type { AnalyseMealRequest, MealAnalysisType } from '../types.js';

export const MAX_MEAL_TEXT_LENGTH = 5000;
export const MAX_IMAGE_BASE64_LENGTH = 5_600_000;

const ANALYSIS_TYPES: MealAnalysisType[] = ['text', 'photo', 'menu', 'packaging', 'name'];

export class RequestValidationError extends Error {
  status = 400;
  constructor(message: string) {
    super(message);
    this.name = 'RequestValidationError';
  }
}

export function validateAnalyseMealRequest(body: unknown): AnalyseMealRequest {
  if (!body || typeof body !== 'object') {
    throw new RequestValidationError('Request body must be a JSON object.');
  }

  const record = body as Record<string, unknown>;

  if (typeof record.profileId !== 'string' || !record.profileId.trim()) {
    throw new RequestValidationError('profileId is required.');
  }

  if (typeof record.mealText !== 'string') {
    throw new RequestValidationError('mealText must be a string.');
  }

  if (record.mealText.length > MAX_MEAL_TEXT_LENGTH) {
    throw new RequestValidationError(
      `mealText exceeds maximum length of ${MAX_MEAL_TEXT_LENGTH} characters.`
    );
  }

  if (record.imageBase64 != null && typeof record.imageBase64 !== 'string') {
    throw new RequestValidationError('imageBase64 must be a string or null.');
  }

  if (
    typeof record.imageBase64 === 'string' &&
    record.imageBase64.length > MAX_IMAGE_BASE64_LENGTH
  ) {
    throw new RequestValidationError(
      'Image payload is too large. Please use a smaller photo (max ~4MB).'
    );
  }

  if (
    typeof record.analysisType !== 'string' ||
    !ANALYSIS_TYPES.includes(record.analysisType as MealAnalysisType)
  ) {
    throw new RequestValidationError(
      'analysisType must be one of: text, photo, menu, packaging, name.'
    );
  }

  if (record.analysisType === 'photo' && !record.imageBase64 && !record.mealText.trim()) {
    throw new RequestValidationError('Photo analysis requires an image or meal description.');
  }

  if (record.analysisType !== 'photo' && !record.mealText.trim() && !record.imageBase64) {
    throw new RequestValidationError('mealText is required for this analysis type.');
  }

  return {
    profileId: record.profileId.trim(),
    mealText: record.mealText.trim(),
    imageBase64: record.imageBase64 ?? null,
    analysisType: record.analysisType as MealAnalysisType,
  };
}
