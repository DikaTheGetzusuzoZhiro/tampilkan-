import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(supabaseUrl || 'https://invalid.supabase.co', supabaseAnonKey || 'invalid-key');
export const ADMIN_EMAIL = 'fyesty8@gmail.com';
export const STORAGE_BUCKET = 'products';
