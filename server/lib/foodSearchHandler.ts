import {
  isOpenFoodFactsEnabled,
  lookupOpenFoodFactsBarcode,
  searchOpenFoodFacts,
} from './openFoodFacts.js';

export class FoodSearchValidationError extends Error {
  status = 400;
  constructor(message: string) {
    super(message);
    this.name = 'FoodSearchValidationError';
  }
}

export async function handleFoodSearchRequest(query: {
  q?: string;
  limit?: string;
}) {
  const q = String(query.q ?? '').trim();
  const limit = Math.min(20, Math.max(1, Number(query.limit) || 8));

  if (q.length < 2) {
    throw new FoodSearchValidationError('Query must be at least 2 characters.');
  }

  const result = await searchOpenFoodFacts(q, limit);
  return {
    hits: result.hits,
    available: isOpenFoodFactsEnabled(),
    error: result.error,
  };
}

export async function handleFoodBarcodeRequest(barcode: string) {
  const code = barcode.trim().replace(/\s/g, '');
  if (!code) {
    throw new FoodSearchValidationError('Barcode required.');
  }

  const result = await lookupOpenFoodFactsBarcode(code);
  return {
    hit: result.hit,
    available: isOpenFoodFactsEnabled(),
    error: result.error,
  };
}
