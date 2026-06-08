import type { AppData } from '@/types';
import { migrateAppData } from '@/utils/profileModules';

const STORAGE_KEY = 'health-pattern-tracker-data';

const defaultData: AppData = {
  profiles: [],
  meals: [],
  issues: [],
  symptomEpisodes: [],
  dailyCheckIns: [],
  weightEntries: [],
  waterEntries: [],
  exerciseEntries: [],
  goals: [],
  favouriteMeals: [],
  savedFoods: [],
  activeProfileId: null,
  demoLoaded: false,
};

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultData };
    const parsed = JSON.parse(raw) as AppData;
    const loaded: AppData = {
      ...defaultData,
      ...parsed,
      favouriteMeals: parsed.favouriteMeals ?? [],
      savedFoods: parsed.savedFoods ?? [],
      exerciseEntries: parsed.exerciseEntries ?? [],
    };
    const migrated = migrateAppData(loaded);
    if (migrated !== loaded) {
      saveData(migrated);
    }
    return migrated;
  } catch {
    return { ...defaultData };
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/** Reset to empty app state without auto-loading demo on next visit. */
export function resetToEmpty(): AppData {
  const empty: AppData = { ...defaultData, demoLoaded: true, activeProfileId: null };
  saveData(empty);
  return empty;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function updateData(updater: (data: AppData) => AppData): AppData {
  const current = loadData();
  const updated = updater(current);
  saveData(updated);
  return updated;
}

export function getProfileData(data: AppData, profileId: string) {
  return {
    meals: data.meals.filter((m) => m.profileId === profileId),
    issues: data.issues.filter((i) => i.profileId === profileId),
    symptomEpisodes: data.symptomEpisodes.filter((s) => s.profileId === profileId),
    dailyCheckIns: data.dailyCheckIns.filter((c) => c.profileId === profileId),
    weightEntries: data.weightEntries.filter((w) => w.profileId === profileId),
    waterEntries: data.waterEntries.filter((w) => w.profileId === profileId),
    exerciseEntries: data.exerciseEntries.filter((e) => e.profileId === profileId),
    goals: data.goals.filter((g) => g.profileId === profileId),
    favouriteMeals: data.favouriteMeals.filter((f) => f.profileId === profileId),
    savedFoods: data.savedFoods.filter(
      (f) => !f.profileId || f.profileId === profileId
    ),
  };
}

/** Remove an item from a list by id. Reuse for any entity collection. */
export function removeById<T extends { id: string }>(items: T[], id: string): T[] {
  return items.filter((item) => item.id !== id);
}

/** Update an item in a list by id. Reuse for any entity collection. */
export function updateById<T extends { id: string }>(
  items: T[],
  id: string,
  patch: Partial<T>
): T[] {
  return items.map((item) => (item.id === id ? { ...item, ...patch } : item));
}

/** Find an item by id. */
export function findById<T extends { id: string }>(
  items: T[],
  id: string
): T | undefined {
  return items.find((item) => item.id === id);
}
