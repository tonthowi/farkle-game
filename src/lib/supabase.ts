import { createClient } from '@supabase/supabase-js';
import { log } from './logger';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  log.error(
    'Missing Supabase env vars.\n' +
      'Copy .env.example → .env and fill in your Supabase URL and anon key.'
  );
}

// Only create the real client when credentials are available.
// The fallback string prevents createClient from crashing with undefined.
export const supabase = createClient(
  supabaseUrl ?? 'http://localhost',
  supabaseAnonKey ?? 'placeholder'
);
