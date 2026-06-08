export interface OpenFoodFactsHit {
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

export interface OpenFoodFactsSearchResult {
  hits: OpenFoodFactsHit[];
  error?: string;
  available: boolean;
}

export interface OpenFoodFactsProductResult {
  hit: OpenFoodFactsHit | null;
  error?: string;
  available: boolean;
}

const SEARCH_ENDPOINT = '/api/food/search';
const BARCODE_ENDPOINT = '/api/food/barcode';

export async function searchOpenFoodFacts(
  query: string,
  limit = 8
): Promise<OpenFoodFactsSearchResult> {
  const q = query.trim();
  if (q.length < 2) return { hits: [], available: false };

  try {
    const params = new URLSearchParams({ q, limit: String(limit) });
    const response = await fetch(`${SEARCH_ENDPOINT}?${params}`);
    const payload = (await response.json().catch(() => null)) as
      | { hits?: OpenFoodFactsHit[]; error?: string; available?: boolean }
      | null;

    if (!response.ok) {
      return {
        hits: [],
        available: payload?.available ?? false,
        error: payload?.error ?? `Search failed (${response.status})`,
      };
    }

    return {
      hits: payload?.hits ?? [],
      available: payload?.available ?? true,
      error: payload?.error,
    };
  } catch {
    return {
      hits: [],
      available: false,
      error: 'Could not reach food search API. Using local database only.',
    };
  }
}

export async function lookupOpenFoodFactsBarcode(
  barcode: string
): Promise<OpenFoodFactsProductResult> {
  const code = barcode.trim().replace(/\s/g, '');
  if (!code) return { hit: null, available: false, error: 'Enter a barcode.' };

  try {
    const response = await fetch(`${BARCODE_ENDPOINT}/${encodeURIComponent(code)}`);
    const payload = (await response.json().catch(() => null)) as
      | { hit?: OpenFoodFactsHit | null; error?: string; available?: boolean }
      | null;

    if (!response.ok) {
      return {
        hit: null,
        available: payload?.available ?? false,
        error: payload?.error ?? `Lookup failed (${response.status})`,
      };
    }

    return {
      hit: payload?.hit ?? null,
      available: payload?.available ?? true,
      error: payload?.error,
    };
  } catch {
    return {
      hit: null,
      available: false,
      error: 'Could not reach food search API.',
    };
  }
}
