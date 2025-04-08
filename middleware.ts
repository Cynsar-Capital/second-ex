import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { updateSession } from './supabase/utils'

// Define which routes to run the middleware on
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}

/**
 * Helper function to determine domain settings and cookie configuration
 * Handles both production and local development environments
 */
function getDomainSettings(hostname: string) {
  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1')
  const isSubdomain = isLocalhost 
    ? hostname.split('.').length > 1
    : hostname.split('.').length > 2

  // For local development, use .localhost for proper subdomain testing
  const rootDomain = isLocalhost ? '.localhost' : '.2nd.exchange'
  
  // Handle cookie domains based on hostname
  let domains: string[]
  if (hostname.startsWith('www.')) {
    // Special case for www - set cookies for both www and root domain
    domains = [hostname, rootDomain]
  } else if (isSubdomain) {
    // For other subdomains, set cookies for both subdomain and root domain
    domains = [hostname, rootDomain]
  } else {
    // For root domain, just set the root domain cookie
    domains = [rootDomain]
  }

  return {
    isLocalhost,
    isSubdomain,
    domains,
    host: hostname
  }
}

/**
 * Helper function to copy cookies between responses
 * Simply copies all cookies as they are already set with correct domains
 */
function copyCookies(fromResponse: NextResponse, toResponse: NextResponse) {
  const cookies = fromResponse.cookies.getAll()
  console.log("Copying cookies from the ",cookies)
  console.log('Copying cookies:', cookies.map(c => ({ 
    name: c.name, 
    domain: c.domain,
    value: c.value ? 'exists' : 'empty'
  })))
  
  cookies.forEach(cookie => {
    toResponse.cookies.set(cookie)
  })
}

export async function middleware(request: NextRequest) {
  // Handle subdomain routing for usernames
  const url = request.nextUrl.clone()
  const hostname = request.headers.get('host') || ''
  const { domains, isLocalhost, isSubdomain } = getDomainSettings(hostname)
  
  
  // Create a single response object that we'll reuse throughout the middleware
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

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
            console.log('Supabase setting cookies:', cookies.map(c => c.name))
            
            cookies.forEach((cookie) => {
              if (cookie.name.startsWith('sb-')) {
                // For auth cookies, create two versions
                const cookieOptions = {
                  name: cookie.name,
                  value: cookie.value,
                  sameSite: 'lax' as const,
                  secure: process.env.NODE_ENV === 'production',
                  path: '/',
                  maxAge: 60 * 60 * 24 * 7 // 7 days for auth cookies
                }
                
                // Set cookie for specific domain if www
                if (hostname.startsWith('www.')) {
                  response.cookies.set({
                    ...cookieOptions,
                    domain: hostname
                  })
                }

                console.log('Setting response cookies', response.cookies)
                
                // Always set cookie for root domain
                response.cookies.set({
                  ...cookieOptions,
                  domain: hostname.includes('localhost') ? '.localhost' : '.2nd.exchange'
                })
              } else {
                // For non-auth cookies, just set them normally
                response.cookies.set({
                  name: cookie.name,
                  value: cookie.value,
                  sameSite: 'lax' as const,
                  secure: process.env.NODE_ENV === 'production',
                  path: '/',
                })
              }
            })
          },
        },
      }
    )

    // Refresh session if available
    const sessionUpdate  = await updateSession(request)
    
    if (!sessionUpdate) {
      console.error('Error refreshing session in middleware:', sessionUpdate)
      // Continue execution as we can still handle routing without a valid session
    }

    // Handle subdomain routing
    if (isSubdomain) {
      // Extract the username from the subdomain
      const username = hostname.split('.')[0]
      
      // For www subdomain, return the main response
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
        
        copyCookies(response, rewriteResponse)
        
        return rewriteResponse
      } else {
        // Username doesn't exist, redirect to 404
        url.pathname = '/404'
        const rewriteResponse = NextResponse.rewrite(url)
        
        copyCookies(response, rewriteResponse)
        
        return rewriteResponse
      }
    }
    
    // For non-subdomain requests, check if user is authenticated and has no profile
    // if (user) {
    //   const { data: profile } = await supabase
    //     .from('profiles')
    //     .select('id')
    //     .eq('id', user.id)
    //     .single()

    //   // If authenticated but no profile exists, redirect to profile creation
    //   if (!profile) {
    //     url.pathname = '/profile/create'
    //     const redirectResponse = NextResponse.redirect(url)
    //     copyCookies(response, redirectResponse)
    //     return redirectResponse
    //   }
    // }
    
    // Return the response with auth session
    return response
  } catch (error) {
    console.error('Middleware error:', error)
    // Return the original response
    return response
  }
}
