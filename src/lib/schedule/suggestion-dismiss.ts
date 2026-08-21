const STORAGE_KEY = "homeboard-suggestion-dismissals";

type DismissalStore = {
  /** Target week Monday → dismissed keys */
  weeks: Record<string, string[]>;
};

function readStore(): DismissalStore {
  if (typeof window === "undefined") return { weeks: {} };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { weeks: {} };
    const parsed = JSON.parse(raw) as DismissalStore;
    return { weeks: parsed.weeks ?? {} };
  } catch {
    return { weeks: {} };
  }
}

function writeStore(store: DismissalStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore quota / private mode
  }
}

export function weekSuggestionKey(): string {
  return "week";
}

export function daySuggestionKey(date: string, patternKey: string): string {
  return `day:${date}:${patternKey}`;
}

export function copyWeekKey(): string {
  return "copy-week";
}

export function isSuggestionDismissed(
  targetMonday: string,
  key: string,
): boolean {
  const store = readStore();
  return (store.weeks[targetMonday] ?? []).includes(key);
}

export function dismissSuggestion(targetMonday: string, key: string): void {
  const store = readStore();
  const list = new Set(store.weeks[targetMonday] ?? []);
  list.add(key);
  store.weeks[targetMonday] = [...list];
  writeStore(store);
}
