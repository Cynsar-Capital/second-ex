import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Create a single supabase client for the entire application
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Server-side Supabase client (for use in Server Components and Route Handlers)
export const createServerSupabaseClient = () => {
  const cookieStore = cookies()
  
  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll().map((cookie) => ({
            name: cookie.name,
            value: cookie.value,
          }))
        },
        setAll(cookies) {
          cookies.forEach((cookie) => {
            cookieStore.set(cookie)
          })
        },
      },
    }
  )
}
