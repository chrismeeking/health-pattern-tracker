import type { MeasurementSystem, Profile } from '@/types';

const KG_PER_LB = 0.45359237;
const CM_PER_IN = 2.54;

export function getProfileMeasurementSystem(profile: Profile): MeasurementSystem {
  return profile.measurementSystem ?? 'metric';
}

export function kgToLb(kg: number): number {
  return kg / KG_PER_LB;
}

export function lbToKg(lb: number): number {
  return lb * KG_PER_LB;
}

export function kgToStonePounds(kg: number): { stone: number; pounds: number } {
  const totalLb = kgToLb(kg);
  const stone = Math.floor(totalLb / 14);
  const pounds = Math.round((totalLb - stone * 14) * 10) / 10;
  return { stone, pounds };
}

export function stonePoundsToKg(stone: number, pounds: number): number {
  if (!Number.isFinite(stone) && !Number.isFinite(pounds)) return NaN;
  const totalLb = (stone || 0) * 14 + (pounds || 0);
  if (totalLb <= 0) return NaN;
  return lbToKg(totalLb);
}

export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalIn = cm / CM_PER_IN;
  const feet = Math.floor(totalIn / 12);
  const inches = Math.round((totalIn - feet * 12) * 10) / 10;
  return { feet, inches };
}

export function feetInchesToCm(feet: number, inches: number): number {
  const totalIn = (feet || 0) * 12 + (inches || 0);
  if (totalIn <= 0) return NaN;
  return totalIn * CM_PER_IN;
}

export function formatWeight(
  kg: number | null | undefined,
  system: MeasurementSystem
): string {
  if (kg == null || !Number.isFinite(kg)) return '—';
  if (system === 'metric') {
    return `${Math.round(kg * 10) / 10} kg`;
  }
  const { stone, pounds } = kgToStonePounds(kg);
  if (stone > 0) {
    return `${stone} st ${pounds} lb`;
  }
  return `${Math.round(kgToLb(kg) * 10) / 10} lb`;
}

export function formatWeightChange(
  kgDelta: number,
  system: MeasurementSystem
): string {
  const sign = kgDelta > 0 ? '+' : '';
  if (system === 'metric') {
    return `${sign}${Math.round(kgDelta * 10) / 10} kg`;
  }
  const lbDelta = kgToLb(kgDelta);
  return `${sign}${Math.round(lbDelta * 10) / 10} lb`;
}

export function formatHeight(
  cm: number | null | undefined,
  system: MeasurementSystem
): string {
  if (cm == null || !Number.isFinite(cm)) return '—';
  if (system === 'metric') {
    return `${Math.round(cm)} cm`;
  }
  const { feet, inches } = cmToFeetInches(cm);
  return `${feet} ft ${inches} in`;
}

export const MEASUREMENT_SYSTEM_LABELS: Record<MeasurementSystem, string> = {
  metric: 'Metric (kg, cm)',
  imperial: 'Imperial (st/lb, ft/in)',
};
