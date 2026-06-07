import type { AnalyseMealRequest, AnalyseMealResponse } from '../types.js';
import { analyseMealWithOpenAiOrMock } from './openaiAnalysis.js';
import { mockAnalyseMeal } from './mockAnalysis.js';
import { RequestValidationError, validateAnalyseMealRequest } from './validateRequest.js';

export { RequestValidationError };

export async function handleAnalyseMealRequest(
  body: unknown
): Promise<AnalyseMealResponse> {
  const request: AnalyseMealRequest = validateAnalyseMealRequest(body);
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  try {
    return await analyseMealWithOpenAiOrMock(request, apiKey);
  } catch {
    return mockAnalyseMeal(request);
  }
}
