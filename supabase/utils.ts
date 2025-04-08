
import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server';

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
export const supabase =  createBrowserClient(supabaseUrl, supabaseKey, {
  // Persist sessions using localStorage instead of cookies
  // This avoids issues with cookie parsing and session management
  // auth: {
  //   persistSession: true,
  //   autoRefreshToken: true,
  //   // Use localStorage for client-side authentication instead of cookies
  //   storageKey: 'supabase.auth.token',
  //   storage: typeof window !== 'undefined' ? window.localStorage : undefined
  // },
  // // Keep these cookie options for non-auth related features
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

export async function updateSession(request: NextRequest) {
  // Create initial response
  let response = NextResponse.next({
    request,
  })

  // Create Supabase client with cookie management
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          // Set cookie on the response, not the request
          response.cookies.set({
            name,
            value,
            ...options,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
          })
        },
        remove(name: string, options: any) {
          // Remove cookie from the response
          response.cookies.set({
            name,
            value: '',
            ...options,
            maxAge: 0,
          })
        },
      },
    }
  )

  // Get user without setting any cookies
  const { data: { user } } = await supabase.auth.getUser()

  // Handle auth redirects
  if (!user && 
      !request.nextUrl.pathname.startsWith('/') && 
      !request.nextUrl.pathname.startsWith('/auth')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    response = NextResponse.redirect(url)
  }

  return response
}