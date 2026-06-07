import type { AppData } from '@/types';

export type SyncDisplayStatus = 'local-only' | 'synced' | 'sync-error' | 'syncing';

export interface AuthSession {
  userId: string | null;
  email: string | null;
}

export interface HouseholdInfo {
  id: string | null;
  name: string | null;
}

export interface SyncMeta {
  displayStatus: SyncDisplayStatus;
  lastSyncedAt: string | null;
  lastError: string | null;
  session: AuthSession;
  household: HouseholdInfo;
}

export const DEFAULT_SYNC_META: SyncMeta = {
  displayStatus: 'local-only',
  lastSyncedAt: null,
  lastError: null,
  session: { userId: null, email: null },
  household: { id: null, name: null },
};

export interface SyncResult {
  ok: boolean;
  error?: string;
  syncedAt?: string;
}

export interface PullResult {
  ok: boolean;
  data?: AppData;
  error?: string;
}

export interface SignInResult {
  ok: boolean;
  error?: string;
  session?: AuthSession;
}
