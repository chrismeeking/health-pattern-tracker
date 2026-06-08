import type { AppData, Profile, ProfileModule } from '@/types';

export const ALL_PROFILE_MODULES: ProfileModule[] = [
  'nutrition',
  'macros',
  'weight',
  'water',
  'healthIssues',
  'digestive',
  'goals',
];

/** Default for new profiles and legacy repairs when modules were never saved. */
export const DEFAULT_PROFILE_MODULES: ProfileModule[] = [
  'nutrition',
  'macros',
  'weight',
  'water',
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

export function getEnabledModules(profile: Profile): ProfileModule[] {
  return normalizeEnabledModules(profile.enabledModules ?? []);
}

export function hasModule(profile: Profile, mod: ProfileModule): boolean {
  return getEnabledModules(profile).includes(mod);
}

/** Repair profiles created before modules existed or synced with empty enabled_modules. */
export function migrateProfileModules(profile: Profile, data?: AppData): Profile {
  const stored = profile.enabledModules;

  if (stored && stored.length > 0) {
    const normalized = normalizeEnabledModules(stored);
    const unchanged =
      normalized.length === stored.length && normalized.every((mod) => stored.includes(mod));
    return unchanged ? profile : { ...profile, enabledModules: normalized };
  }

  const inferred = new Set<ProfileModule>(['nutrition']);

  if (profile.currentWeight != null || profile.targetWeight != null || profile.height != null) {
    inferred.add('weight');
  }
  if (profile.proteinTarget != null || profile.carbTarget != null || profile.fatTarget != null) {
    inferred.add('macros');
  }
  if (profile.waterTarget != null) {
    inferred.add('water');
  }

  if (data) {
    const profileId = profile.id;
    if (data.weightEntries.some((w) => w.profileId === profileId)) inferred.add('weight');
    if (data.waterEntries.some((w) => w.profileId === profileId)) inferred.add('water');
    if (data.goals.some((g) => g.profileId === profileId)) inferred.add('goals');
    if (data.issues.some((i) => i.profileId === profileId)) inferred.add('healthIssues');
    if (data.symptomEpisodes.some((s) => s.profileId === profileId)) inferred.add('digestive');
    if (data.dailyCheckIns.some((c) => c.profileId === profileId)) inferred.add('digestive');
  }

  const modules =
    inferred.size === 1
      ? [...DEFAULT_PROFILE_MODULES]
      : normalizeEnabledModules([...inferred]);

  return { ...profile, enabledModules: modules };
}

export function migrateAppData(data: AppData): AppData {
  const profiles = data.profiles.map((profile) => migrateProfileModules(profile, data));
  const changed = profiles.some(
    (profile, index) =>
      JSON.stringify(profile.enabledModules) !== JSON.stringify(data.profiles[index]?.enabledModules ?? [])
  );
  return changed ? { ...data, profiles } : data;
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
