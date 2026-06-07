import type { AnalyseMealRequest, AnalyseMealResponse, ConfidenceLevel } from '../types.js';
import { VALID_TRIGGER_TAGS } from '../types.js';
import { mockAnalyseMeal, sanitizeTriggerTags } from './mockAnalysis.js';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o-mini';

const NAME_LOOKUP_PROMPT = `You estimate typical nutrition for a named dish or meal.
The user typed only a meal name (e.g. "All Day Breakfast", "Chicken Tikka Masala").
Use your knowledge of common UK/US café, pub, restaurant, and home-cooked portions.
Base estimates on publicly known average nutrition data — not the user's personal history.
Rules:
- Provide cautious estimates with confidence levels (low, medium, high).
- Do NOT diagnose medical conditions or claim ingredients cause symptoms.
- triggerTags must ONLY use values from this allowed list: ${VALID_TRIGGER_TAGS.join(', ')}.
- Return JSON only with this exact shape:
{
  "mealName": string,
  "estimatedCalories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "fibre": number,
  "sugar": number,
  "salt": number,
  "likelyIngredients": string[],
  "triggerTags": string[],
  "confidence": { "calories": "low"|"medium"|"high", "ingredients": "low"|"medium"|"high", "triggerTags": "low"|"medium"|"high" },
  "notes": string
}
Notes should say this is a typical average portion estimate, may vary by venue, and is not medical advice.`;

const SYSTEM_PROMPT = `You estimate meal nutrition for a personal food diary app.
Rules:
- Provide cautious estimates with confidence levels (low, medium, high).
- Do NOT diagnose medical conditions or claim ingredients cause symptoms.
- triggerTags must ONLY use values from this allowed list: ${VALID_TRIGGER_TAGS.join(', ')}.
- Return JSON only with this exact shape:
{
  "mealName": string,
  "estimatedCalories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "fibre": number,
  "sugar": number,
  "salt": number,
  "likelyIngredients": string[],
  "triggerTags": string[],
  "confidence": { "calories": "low"|"medium"|"high", "ingredients": "low"|"medium"|"high", "triggerTags": "low"|"medium"|"high" },
  "notes": string
}
Notes should remind the user estimates may be inaccurate and are not medical advice.`;

function parseConfidence(value: unknown): ConfidenceLevel {
  if (value === 'high' || value === 'medium' || value === 'low') return value;
  return 'low';
}

function parseOpenAiJson(content: string): Omit<AnalyseMealResponse, 'source'> {
  const parsed = JSON.parse(content) as Record<string, unknown>;

  const confidenceRaw = (parsed.confidence ?? {}) as Record<string, unknown>;

  return {
    mealName: String(parsed.mealName ?? 'Unknown meal').slice(0, 120),
    estimatedCalories: Math.max(0, Number(parsed.estimatedCalories) || 0),
    protein: Math.max(0, Number(parsed.protein) || 0),
    carbs: Math.max(0, Number(parsed.carbs) || 0),
    fat: Math.max(0, Number(parsed.fat) || 0),
    fibre: Math.max(0, Number(parsed.fibre) || 0),
    sugar: Math.max(0, Number(parsed.sugar) || 0),
    salt: Math.max(0, Number(parsed.salt) || 0),
    likelyIngredients: Array.isArray(parsed.likelyIngredients)
      ? parsed.likelyIngredients.map(String).slice(0, 20)
      : [],
    triggerTags: sanitizeTriggerTags(
      Array.isArray(parsed.triggerTags) ? parsed.triggerTags.map(String) : []
    ),
    confidence: {
      calories: parseConfidence(confidenceRaw.calories),
      ingredients: parseConfidence(confidenceRaw.ingredients),
      triggerTags: parseConfidence(confidenceRaw.triggerTags),
    },
    notes: String(
      parsed.notes ??
        'AI nutrition and ingredient estimates may be inaccurate. Review before saving.'
    ).slice(0, 1000),
  };
}

function buildUserText(request: AnalyseMealRequest): string {
  if (request.analysisType === 'name') {
    return [
      'Look up typical average nutrition for this meal name:',
      `"${request.mealText}"`,
      'Assume a standard single serving at a typical UK café or restaurant unless the name implies otherwise.',
    ].join('\n');
  }

  return [
    `Analysis type: ${request.analysisType}`,
    `Profile ID: ${request.profileId}`,
    `Meal description: ${request.mealText || '(none — infer from image if provided)'}`,
    request.analysisType === 'menu' || request.analysisType === 'packaging'
      ? 'This text may be from a menu or packaging label.'
      : '',
  ]
    .filter(Boolean)
    .join('\n');
}

export async function openaiAnalyseMeal(
  request: AnalyseMealRequest,
  apiKey: string
): Promise<AnalyseMealResponse> {
  const userText = buildUserText(request);

  type ContentPart =
    | { type: 'text'; text: string }
    | { type: 'image_url'; image_url: { url: string; detail: 'low' } };

  const userContent: ContentPart[] = [{ type: 'text', text: userText }];

  if (request.imageBase64 && request.analysisType === 'photo') {
    const mime = request.imageBase64.startsWith('/9j/')
      ? 'image/jpeg'
      : request.imageBase64.startsWith('iVBOR')
        ? 'image/png'
        : 'image/jpeg';
    userContent.push({
      type: 'image_url',
      image_url: {
        url: `data:${mime};base64,${request.imageBase64}`,
        detail: 'low',
      },
    });
  }

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      response_format: { type: 'json_object' },
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content: request.analysisType === 'name' ? NAME_LOOKUP_PROMPT : SYSTEM_PROMPT,
        },
        { role: 'user', content: userContent },
      ],
    }),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => 'Unknown error');
    throw new Error(`OpenAI request failed (${response.status}): ${errBody.slice(0, 200)}`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI returned an empty response.');
  }

  const parsed = parseOpenAiJson(content);
  return { ...parsed, source: 'openai' };
}

export function analyseMealWithOpenAiOrMock(
  request: AnalyseMealRequest,
  apiKey: string | undefined
): Promise<AnalyseMealResponse> {
  if (!apiKey) {
    return Promise.resolve(mockAnalyseMeal(request));
  }

  return openaiAnalyseMeal(request, apiKey).catch(() => mockAnalyseMeal(request));
}
