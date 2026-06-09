export interface BmiCategory {
  label: string;
  description?: string;
}

export function calculateBmi(weightKg: number, heightCm: number): number | null {
  if (!Number.isFinite(weightKg) || !Number.isFinite(heightCm)) return null;
  if (weightKg <= 0 || heightCm <= 0) return null;

  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  if (!Number.isFinite(bmi)) return null;

  return Math.round(bmi * 10) / 10;
}

/** Weight (kg) for a given BMI at height (cm). */
export function weightKgFromBmi(bmi: number, heightCm: number): number | null {
  if (!Number.isFinite(bmi) || !Number.isFinite(heightCm) || heightCm <= 0) return null;
  const heightM = heightCm / 100;
  const kg = bmi * heightM * heightM;
  if (!Number.isFinite(kg) || kg <= 0) return null;
  return Math.round(kg * 10) / 10;
}

export function getBmiCategory(bmi: number): BmiCategory {
  if (bmi < 18.5) {
    return {
      label: 'Underweight',
      description: 'Below the healthy weight range for your height.',
    };
  }
  if (bmi < 25) {
    return {
      label: 'Healthy weight',
      description: 'Within the healthy weight range for your height.',
    };
  }
  if (bmi < 30) {
    return {
      label: 'Overweight',
      description: 'Above the healthy weight range for your height.',
    };
  }
  return {
    label: 'Obese',
    description: 'Well above the healthy weight range for your height.',
  };
}
