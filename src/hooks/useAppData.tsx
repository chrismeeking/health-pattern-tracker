import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { AppData, Profile } from '@/types';
import { loadData, saveData, updateData, resetToEmpty } from '@/services/storage';
import { createDemoData } from '@/data/seedData';
import type { SyncMeta } from '@/services/sync/types';
import {
  isCloudSyncAvailable,
  loadSyncMeta,
  pullFromCloud,
  pushToCloud,
  restoreSessionFromSupabase,
  saveSyncMeta,
  scheduleCloudPush,
  signInWithEmail,
  signOut,
  signUpWithEmail,
} from '@/services/sync/syncService';

interface AppContextValue {
  data: AppData;
  activeProfile: Profile | null;
  syncMeta: SyncMeta;
  isCloudAvailable: boolean;
  isSignedIn: boolean;
  refresh: () => void;
  setActiveProfile: (id: string) => void;
  update: (updater: (d: AppData) => AppData) => void;
  loadDemo: () => void;
  clearDemoData: () => void;
  resetApp: () => void;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signOutUser: () => Promise<void>;
  syncNow: () => Promise<string | null>;
  pullFromCloudAndReplace: () => Promise<string | null>;
  checkCloudHasData: () => Promise<boolean>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadData());
  const [syncMeta, setSyncMeta] = useState<SyncMeta>(() => loadSyncMeta());
  const syncMetaRef = useRef(syncMeta);
  syncMetaRef.current = syncMeta;

  const refresh = useCallback(() => {
    setData(loadData());
    setSyncMeta(loadSyncMeta());
  }, []);

  useEffect(() => {
    if (!isCloudSyncAvailable()) return;

    void (async () => {
      const meta = await restoreSessionFromSupabase();
      setSyncMeta(meta);
      saveSyncMeta(meta);

      if (!meta.session.userId) return;

      const result = await pullFromCloud(meta);
      if (result.ok && result.data) {
        const local = loadData();
        const merged = {
          ...result.data,
          activeProfileId: local.activeProfileId ?? result.data.activeProfileId,
        };
        saveData(merged);
        setData(merged);
        setSyncMeta(loadSyncMeta());
      }
    })();
  }, []);

  const setActiveProfile = useCallback((id: string) => {
    const updated = updateData((d) => ({ ...d, activeProfileId: id }));
    setData(updated);
  }, []);

  const update = useCallback((updater: (d: AppData) => AppData) => {
    const updated = updateData(updater);
    setData(updated);
    scheduleCloudPush(updated, syncMetaRef.current, setSyncMeta);
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

  const signIn = useCallback(async (email: string, password: string) => {
    const { meta, result } = await signInWithEmail(email, password);
    setSyncMeta(meta);
    if (!result.ok) return result.error ?? 'Sign in failed.';
    return null;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { meta, result } = await signUpWithEmail(email, password);
    setSyncMeta(meta);
    if (!result.ok) return result.error ?? 'Sign up failed.';
    return null;
  }, []);

  const signOutUser = useCallback(async () => {
    const meta = await signOut();
    setSyncMeta(meta);
  }, []);

  const syncNow = useCallback(async () => {
    const currentData = loadData();
    const meta = loadSyncMeta();
    const result = await pushToCloud(currentData, meta);
    setSyncMeta(loadSyncMeta());
    if (!result.ok) return result.error ?? 'Sync failed.';
    return null;
  }, []);

  const checkCloudHasData = useCallback(async () => {
    const meta = loadSyncMeta();
    if (!meta.session.userId || !meta.household.id) return false;
    const result = await pullFromCloud(meta);
    if (!result.ok || !result.data) return false;
    return (
      result.data.profiles.length > 0 ||
      result.data.meals.length > 0 ||
      result.data.symptomEpisodes.length > 0
    );
  }, []);

  const pullFromCloudAndReplace = useCallback(async () => {
    const meta = loadSyncMeta();
    const result = await pullFromCloud(meta);
    if (!result.ok || !result.data) {
      return result.error ?? 'Could not pull from cloud.';
    }
    const merged = {
      ...result.data,
      activeProfileId: result.data.activeProfileId ?? loadData().activeProfileId,
    };
    saveData(merged);
    setData(merged);
    setSyncMeta(loadSyncMeta());
    return null;
  }, []);

  const activeProfile =
    data.profiles.find((p) => p.id === data.activeProfileId) ?? data.profiles[0] ?? null;

  return (
    <AppContext.Provider
      value={{
        data,
        activeProfile,
        syncMeta,
        isCloudAvailable: isCloudSyncAvailable(),
        isSignedIn: Boolean(syncMeta.session.userId),
        refresh,
        setActiveProfile,
        update,
        loadDemo,
        clearDemoData,
        resetApp,
        signIn,
        signUp,
        signOutUser,
        syncNow,
        pullFromCloudAndReplace,
        checkCloudHasData,
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
