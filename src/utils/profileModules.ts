import type { Profile, ProfileModule } from '@/types';

export const ALL_PROFILE_MODULES: ProfileModule[] = [
  'nutrition',
  'macros',
  'weight',
  'water',
  'healthIssues',
  'digestive',
  'goals',
];

export type ModulePresetId =
  | 'digestiveHealth'
  | 'nutritionFitness'
  | 'simpleCalories'
  | 'everything'
  | 'custom';

export interface ModulePreset {
  id: ModulePresetId;
  label: string;
  description: string;
  modules: ProfileModule[];
}

export const MODULE_PRESETS: ModulePreset[] = [
  {
    id: 'digestiveHealth',
    label: 'Digestive & health patterns',
    description: 'Symptoms, triggers, issues, and meal patterns',
    modules: ['nutrition', 'healthIssues', 'digestive'],
  },
  {
    id: 'nutritionFitness',
    label: 'Nutrition & fitness',
    description: 'Calories, macros, weight, water, and weekly progress',
    modules: ['nutrition', 'macros', 'weight', 'water', 'goals'],
  },
  {
    id: 'simpleCalories',
    label: 'Simple calorie tracking',
    description: 'Meals and daily calories without extra detail',
    modules: ['nutrition'],
  },
  {
    id: 'everything',
    label: 'Track everything',
    description: 'All modules — full dashboard and insights',
    modules: [...ALL_PROFILE_MODULES],
  },
];

export function hasModule(profile: Profile, mod: ProfileModule): boolean {
  return profile.enabledModules.includes(mod);
}

export function hasHealthTracking(profile: Profile): boolean {
  return hasModule(profile, 'healthIssues') || hasModule(profile, 'digestive');
}

export function hasPatternInsights(profile: Profile): boolean {
  return hasHealthTracking(profile);
}

export function hasProgressInsights(profile: Profile): boolean {
  return (
    hasModule(profile, 'nutrition') ||
    hasModule(profile, 'macros') ||
    hasModule(profile, 'weight') ||
    hasModule(profile, 'water') ||
    hasModule(profile, 'goals')
  );
}

export function showInsightsNav(profile: Profile): boolean {
  return hasPatternInsights(profile) || hasProgressInsights(profile);
}

export function normalizeEnabledModules(modules: ProfileModule[]): ProfileModule[] {
  const unique = [...new Set(modules.filter((m) => ALL_PROFILE_MODULES.includes(m)))];
  return unique.length > 0 ? unique : ['nutrition'];
}

export function modulesForPreset(presetId: ModulePresetId): ProfileModule[] {
  if (presetId === 'custom') return ['nutrition'];
  const preset = MODULE_PRESETS.find((p) => p.id === presetId);
  return preset ? [...preset.modules] : ['nutrition'];
}

export function detectPreset(modules: ProfileModule[]): ModulePresetId {
  const normalized = normalizeEnabledModules(modules).sort().join(',');
  for (const preset of MODULE_PRESETS) {
    if (normalizeEnabledModules(preset.modules).sort().join(',') === normalized) {
      return preset.id;
    }
  }
  return 'custom';
}

export function toggleModuleList(
  modules: ProfileModule[],
  mod: ProfileModule
): ProfileModule[] {
  const next = modules.includes(mod)
    ? modules.filter((m) => m !== mod)
    : [...modules, mod];
  return normalizeEnabledModules(next);
}
