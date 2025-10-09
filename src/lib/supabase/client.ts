/**
 * Singleton Supabase Client
 * Single instance shared across entire application
 * Supports both development (localhost) and production (Kubernetes)
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { getDatabaseUrl, isProduction } from '@/lib/config/production';

// Get Supabase URL based on environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? getDatabaseUrl();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️  Missing Supabase environment variables, using defaults');
}

// Singleton client instance with production optimizations
export const supabase = createClient(
  supabaseUrl || 'http://localhost:54321',
  supabaseAnonKey ?? 'placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    realtime: {
      params: {
        eventsPerSecond: isProduction ? 10 : 5,
      },
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-application-name': 'albion-dashboard',
      },
    },
  }
);

/**
 * Get admin client (server-side only)
 * Use for operations requiring elevated permissions
 */
export function getSupabaseAdmin(): SupabaseClient {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase admin credentials');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
