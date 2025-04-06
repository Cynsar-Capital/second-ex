import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Configure Supabase to store session in localStorage for client-side
// This avoids the cookie parsing issues when mixing localStorage and cookie storage
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: 'supabase.auth.token',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Use localStorage storage by default for client-side
    storage: typeof window !== 'undefined' ? window.localStorage : undefined
  }
});

// Helper functions for authentication
export const getSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    return { session: data.session, error };
  } catch (err) {
    console.error('Error getting session:', err);
    return { session: null, error: err };
  }
};

export const getCurrentUser = async () => {
  try {
    const { data, error } = await supabase.auth.getUser();
    return { user: data.user, error };
  } catch (err) {
    console.error('Error getting current user:', err);
    return { user: null, error: err };
  }
};

export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  return supabase.auth.onAuthStateChange(callback);
};
