import { createBrowserClient } from '@supabase/ssr'

// Create a single supabase client for the entire application
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Determine the root domain for cookie setting
const COOKIE_DOMAIN = typeof window !== 'undefined' 
  ? (window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1')
    // For localhost, we need to use .localhost to share cookies across subdomains
    ? '' 
    : '.2nd.exchange') // Note the leading dot for subdomain sharing
  : '.2nd.exchange';

// Client-side Supabase client with consistent storage configuration
// Using localStorage to avoid cookie parsing issues
export const supabase = createBrowserClient(supabaseUrl, supabaseKey, {
  // Persist sessions using localStorage instead of cookies
  // This avoids issues with cookie parsing and session management
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // Use localStorage for client-side authentication instead of cookies
    storageKey: 'supabase.auth.token',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined
  },
  // Keep these cookie options for non-auth related features
  cookieOptions: {
    domain: COOKIE_DOMAIN,
    maxAge: 3600 * 24 * 7, // 7 days
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  }
})

// Auth helper functions
export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  
  return { data, error }
}

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const resetPassword = async (email: string) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  
  return { data, error }
}

export const updatePassword = async (newPassword: string) => {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  })
  
  return { data, error }
}

// OAuth sign in
export const signInWithProvider = async (provider: 'google' | 'github' | 'facebook') => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  
  return { data, error }
}

// Get current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

// Get session
export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  return { session, error }
}

// Listen to auth changes
export const onAuthStateChange = (callback: (event: any, session: any) => void) => {
  return supabase.auth.onAuthStateChange(callback)
}

// Function to set cookies across domains (main domain and subdomains)
export async function setCrossDomainCookies(session: any) {
  if (!session) {
    console.error('No session provided to setCrossDomainCookies');
    return { success: false, error: 'No session provided' };
  }
  
  try {
    console.log('Setting cross-domain cookies');
    
    // Set the session in Supabase
    // This will automatically set cookies with the proper domain
    // thanks to our cookieOptions configuration
    const { error } = await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });
    
    if (error) {
      console.error('Error setting session:', error);
      return { success: false, error: error.message };
    }
    
    // Verify the user is properly authenticated using getUser (more secure)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error verifying user authentication:', userError);
      return { success: false, error: userError.message };
    }
    
    if (!user) {
      console.error('No authenticated user found after setting session');
      return { success: false, error: 'Authentication failed: No user found' };
    }
    
    console.log('User authenticated successfully:', user.id);
    
    // Store in localStorage as a backup
    localStorage.setItem('supabase.auth.token', JSON.stringify({
      currentSession: session,
      expiresAt: Math.floor(Date.now() / 1000) + (session.expires_in || 3600)
    }));
    
    // Log success message
    console.log('Session set successfully with domain:', COOKIE_DOMAIN);
    
    return { success: true, user };
  } catch (error) {
    console.error('Error in setCrossDomainCookies:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
