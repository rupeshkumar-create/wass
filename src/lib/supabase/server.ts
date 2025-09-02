import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

/**
 * Server-only Supabase client with Service Role key
 * NEVER expose this to the browser - server-side only
 */
function createServerClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  // Support multiple environment variable names for compatibility
  const supabaseServiceRoleKey = 
    process.env.SUPABASE_SERVICE_ROLE_KEY || 
    process.env.SUPABASE_KEY || 
    process.env.supabaseKey;

  if (!supabaseUrl) {
    throw new Error(
      'Missing Supabase URL. Please set SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL in your environment variables.'
    );
  }

  if (!supabaseServiceRoleKey) {
    throw new Error(
      'Missing Supabase Service Role Key. Please set SUPABASE_SERVICE_ROLE_KEY, SUPABASE_KEY, or supabaseKey in your environment variables.'
    );
  }

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export const supabase = createServerClient();