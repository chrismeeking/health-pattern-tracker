import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.trim() ?? '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? '';

let client: SupabaseClient | null = null;

/** True when both Supabase env vars are set — cloud sync can be enabled. */
export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/** Lazy singleton Supabase client. Returns null when not configured. */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return client;
}

export function getSupabaseConfigLabel(): string {
  if (!isSupabaseConfigured()) {
    return 'Not configured — local storage only';
  }
  try {
    const host = new URL(SUPABASE_URL).hostname;
    return host;
  } catch {
    return 'Configured';
  }
}

/** Reset client (e.g. after sign-out in tests). */
export function resetSupabaseClient(): void {
  client = null;
}

export type { SupabaseClient };
