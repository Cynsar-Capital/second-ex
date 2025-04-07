import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { updateSession } from './supabase/utils'

// Define which routes to run the middleware on
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}

// Helper function to determine domain settings
function getDomainSettings(hostname: string) {
  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1')
  const isSubdomain = isLocalhost 
    ? hostname.split('.').length > 1 && !hostname.startsWith('www')
    : hostname.split('.').length > 2 && !hostname.startsWith('www')

  return {
    isLocalhost,
    isSubdomain,
    // For localhost, don't set domain to allow cookies to work on both main and subdomains
    // For production, use .2nd.exchange to work across all subdomains
    domain: isLocalhost ? undefined : '.2nd.exchange',
    host: hostname
  }
}

export async function middleware(request: NextRequest) {
  // Handle subdomain routing for usernames
  const url = request.nextUrl.clone()
  const hostname = request.headers.get('host') || ''
  const { domain, isLocalhost, isSubdomain } = getDomainSettings(hostname)
  
  
  // Create a response object that we'll modify as needed
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  //await updateSession(request)

  try {
    // Initialize Supabase client with proper cookie handling
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll().map((cookie) => ({
              name: cookie.name,
              value: cookie.value,
            }))
          },
          setAll(cookies) {
            cookies.forEach((cookie) => {
              // Set cookie on both request and response
              const cookieOptions = {
                name: cookie.name,
                value: cookie.value,
                sameSite: 'lax' as const,
                secure: process.env.NODE_ENV === 'production',
                path: '/',
                domain,
                // Set longer expiry for auth cookies
                maxAge: cookie.name.startsWith('sb-') 
                  ? 60 * 60 * 24 * 7 // 7 days for auth cookies
                  : undefined
              }
              request.cookies.set(cookieOptions)
              response = NextResponse.next({
                request: {
                  headers: request.headers,
                },
              })
              response.cookies.set(cookieOptions)
              
            })
          },
        },
        // auth: {
        //   autoRefreshToken: true,
        //   persistSession: true,
        //   detectSessionInUrl: true,
        //   flowType: 'pkce',
        // },
        // cookieOptions: {
        //   secure: process.env.NODE_ENV === 'production',
        //   sameSite: 'lax',
        //   path: '/',
        //   domain,
        // },
      }
    )

    // Refresh session if available
    const { data: { user }, error: sessionError } = await supabase.auth.getUser()
    
    // if (sessionError) {
    //   console.log('Error refreshing session in middleware:', sessionError)
    // } else {
    //   console.log('Middleware session state:', user ? 'Authenticated' : 'Not authenticated')
    //   if (user) {
    //     console.log('Session user ID:', user.id)
    //   }
    // }

    // Handle subdomain routing
    if (isSubdomain) {
      // Extract the username from the subdomain
      const username = hostname.split('.')[0]
      
      // Skip processing for special subdomains like 'www'
      if (username === 'www') {
        return response
      }
      
      // Check if the username exists in the profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('username', username)
        .single()
      
      if (profileError) {
        console.error('Error fetching profile in middleware:', profileError)
      }
      
      if (profile) {
        // Username exists, rewrite the URL to the user's profile page
        url.pathname = '/profile'
        url.searchParams.set('username', username)
        
        const rewriteResponse = NextResponse.rewrite(url)
        
        // Copy all cookies from the original response
        response.cookies.getAll().forEach(cookie => {
          rewriteResponse.cookies.set({
            name: cookie.name,
            value: cookie.value,
            domain: cookie.domain,
            expires: cookie.expires,
            httpOnly: cookie.httpOnly,
            maxAge: cookie.maxAge,
            path: cookie.path,
            priority: cookie.priority,
            sameSite: cookie.sameSite as 'lax' | 'strict' | 'none' | undefined,
            secure: cookie.secure,
          })
        })
        
        return rewriteResponse
      } else {
        // Username doesn't exist, redirect to 404
        url.pathname = '/404'
        const rewriteResponse = NextResponse.rewrite(url)
        
        // Copy all cookies from the original response
        response.cookies.getAll().forEach(cookie => {
          rewriteResponse.cookies.set({
            name: cookie.name,
            value: cookie.value,
            domain: cookie.domain,
            expires: cookie.expires,
            httpOnly: cookie.httpOnly,
            maxAge: cookie.maxAge,
            path: cookie.path,
            priority: cookie.priority,
            sameSite: cookie.sameSite as 'lax' | 'strict' | 'none' | undefined,
            secure: cookie.secure,
          })
        })
        
        return rewriteResponse
      }
    }
    
    // For non-subdomain requests, check if user is authenticated and has no profile
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      // If authenticated but no profile exists, redirect to profile creation
      if (!profile) {
        url.pathname = '/profile/create'
        return NextResponse.redirect(url)
      }
    }
    
    // Return the response with auth session
    return response
  } catch (error) {
    console.error('Middleware error:', error)
    // Return the original response if there's an error
    return response
  }
}
