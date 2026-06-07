import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import type { AppData, Profile } from '@/types';
import { loadData, saveData, updateData, resetToEmpty } from '@/services/storage';
import { createDemoData } from '@/data/seedData';

interface AppContextValue {
  data: AppData;
  activeProfile: Profile | null;
  refresh: () => void;
  setActiveProfile: (id: string) => void;
  update: (updater: (d: AppData) => AppData) => void;
  loadDemo: () => void;
  clearDemoData: () => void;
  resetApp: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadData());

  const refresh = useCallback(() => {
    setData(loadData());
  }, []);

  useEffect(() => {
    const stored = loadData();
    if (stored.profiles.length === 0 && !stored.demoLoaded) {
      const demo = createDemoData();
      saveData(demo);
      setData(demo);
    }
  }, []);

  const setActiveProfile = useCallback((id: string) => {
    const updated = updateData((d) => ({ ...d, activeProfileId: id }));
    setData(updated);
  }, []);

  const update = useCallback((updater: (d: AppData) => AppData) => {
    const updated = updateData(updater);
    setData(updated);
  }, []);

  const loadDemo = useCallback(() => {
    const demo = createDemoData();
    saveData(demo);
    setData(demo);
  }, []);

  const clearDemoData = useCallback(() => {
    const empty = resetToEmpty();
    setData(empty);
  }, []);

  const resetApp = useCallback(() => {
    resetToEmpty();
    window.location.reload();
  }, []);

  const activeProfile =
    data.profiles.find((p) => p.id === data.activeProfileId) ?? data.profiles[0] ?? null;

  return (
    <AppContext.Provider
      value={{
        data,
        activeProfile,
        refresh,
        setActiveProfile,
        update,
        loadDemo,
        clearDemoData,
        resetApp,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function useProfileData<T>(
  selector: (data: AppData, profileId: string) => T
): T | null {
  const { data, activeProfile } = useApp();
  if (!activeProfile) return null;
  return selector(data, activeProfile.id);
}
