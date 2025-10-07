/**
 * Backend Entry
 * Centralized exports for backend clients and utilities.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase, getSupabaseAdmin } from '@/backend/supabase/clients';

export const backend: { supabase: SupabaseClient; admin: SupabaseClient } = {
  supabase,
  get admin() {
    return getSupabaseAdmin();
  },
} as const;

export { getGameinfoClient } from '@/backend/api/gameinfo';
export * from '@/backend/realtime';