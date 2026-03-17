import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Essa linha tenta pegar de vários nomes possíveis para não dar erro
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
