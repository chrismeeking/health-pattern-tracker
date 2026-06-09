import type { SuggestedMealValues } from '@/services/ai/mealNameSuggestion';

export interface PortionScaleOption {
  id: string;
  label: string;
  factor: number;
}

const MACRO_KEYS = [
  'calories',
  'protein',
  'carbs',
  'fat',
  'saturatedFat',
  'fibre',
  'sugar',
  'salt',
] as const;

/** Parse typical serving text (e.g. "1 glass 200ml", "2 slices") into scale options. */
export function getPortionScaleOptions(servingDescription?: string): PortionScaleOption[] {
  if (!servingDescription?.trim()) {
    return [
      { id: '0.75', label: 'Smaller (75%)', factor: 0.75 },
      { id: '1', label: 'Typical', factor: 1 },
      { id: '1.25', label: 'Larger (125%)', factor: 1.25 },
    ];
  }

  const text = servingDescription.toLowerCase();

  const mlMatch = text.match(/(\d+(?:\.\d+)?)\s*ml/);
  if (mlMatch) {
    const base = Number(mlMatch[1]);
    const steps = [0.75, 1, 1.25].map((m) => Math.round(base * m));
    const unique = [...new Set(steps)];
    return unique.map((ml) => ({
      id: `ml-${ml}`,
      label: `${ml}ml`,
      factor: ml / base,
    }));
  }

  const sliceMatch = text.match(/(\d+)\s*slice/);
  if (sliceMatch) {
    const base = Number(sliceMatch[1]);
    const max = Math.max(base + 2, 3);
    return Array.from({ length: max }, (_, i) => i + 1).map((n) => ({
      id: `slice-${n}`,
      label: n === 1 ? '1 slice' : `${n} slices`,
      factor: n / base,
    }));
  }

  const gramMatch = text.match(/(\d+(?:\.\d+)?)\s*g\b/);
  if (gramMatch) {
    const base = Number(gramMatch[1]);
    const steps = [0.75, 1, 1.5].map((m) => Math.round(base * m));
    const unique = [...new Set(steps)];
    return unique.map((g) => ({
      id: `g-${g}`,
      label: `${g}g`,
      factor: g / base,
    }));
  }

  return [
    { id: '0.75', label: 'Smaller (75%)', factor: 0.75 },
    { id: '1', label: servingDescription, factor: 1 },
    { id: '1.25', label: 'Larger (125%)', factor: 1.25 },
  ];
}

export function scaleSuggestedValues(
  values: SuggestedMealValues,
  factor: number
): SuggestedMealValues {
  if (factor === 1) return { ...values };

  const scaled: SuggestedMealValues = { ...values };
  for (const key of MACRO_KEYS) {
    const raw = values[key];
    if (raw == null || raw === 0) continue;
    if (key === 'salt') {
      scaled[key] = Math.round(raw * factor * 10) / 10;
    } else if (key === 'calories') {
      scaled[key] = Math.round(raw * factor);
    } else {
      scaled[key] = Math.round(raw * factor);
    }
  }
  return scaled;
}

export function formatScaledServing(
  servingDescription: string | undefined,
  factor: number
): string | undefined {
  if (!servingDescription || factor === 1) return servingDescription;
  const mlMatch = servingDescription.match(/(\d+(?:\.\d+)?)\s*ml/i);
  if (mlMatch) {
    const ml = Math.round(Number(mlMatch[1]) * factor);
    return servingDescription.replace(mlMatch[0], `${ml}ml`);
  }
  const sliceMatch = servingDescription.match(/(\d+)\s*slice/i);
  if (sliceMatch) {
    const n = Math.max(1, Math.round(Number(sliceMatch[1]) * factor));
    return n === 1 ? '1 slice' : `${n} slices`;
  }
  return `${servingDescription} (${Math.round(factor * 100)}%)`;
}
