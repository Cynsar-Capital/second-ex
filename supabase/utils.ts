import { createBrowserClient } from '@supabase/ssr'

// Create a single supabase client for the entire application
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Client-side Supabase client
export const supabase = createBrowserClient(supabaseUrl, supabaseKey)

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
