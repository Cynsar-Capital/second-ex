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
    ? hostname.split('.').length > 1 && !hostname.startsWith('www')
    : hostname.split('.').length > 2 && !hostname.startsWith('www')

  // For local development, use .localhost for proper subdomain testing
  const rootDomain = isLocalhost ? '.localhost' : '.2nd.exchange'
  
  // For subdomains in local dev, we need to handle both the subdomain cookie and root domain cookie
  const domains = isLocalhost && isSubdomain 
    ? [hostname, rootDomain]  // e.g. ['test.localhost', '.localhost']
    : [rootDomain]            // e.g. ['.2nd.exchange']

  return {
    isLocalhost,
    isSubdomain,
    domains,
    host: hostname
  }
}

/**
 * Helper function to copy cookies from response to rewrite/redirect response
 * Handles domain-specific cookie settings for auth cookies and adds debug logging
 */
function copyCookiesWithDomains(
  fromResponse: NextResponse,
  toResponse: NextResponse,
  domains: string[]
) {
  console.log('Copying cookies with domains:', domains)
  const cookies = fromResponse.cookies.getAll()
  console.log('Cookies to copy:', cookies.map(c => ({ name: c.name, domain: c.domain })))
  
  cookies.forEach(cookie => {
    if (cookie.name.startsWith('sb-')) {
      // For auth cookies, set for all applicable domains
      domains.forEach(domain => {
        toResponse.cookies.set({
          name: cookie.name,
          value: cookie.value,
          domain,
          expires: cookie.expires,
          httpOnly: cookie.httpOnly,
          maxAge: cookie.maxAge,
          path: cookie.path,
          priority: cookie.priority,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        })
      })
    } else {
      // For non-auth cookies, copy as is
      toResponse.cookies.set({
        name: cookie.name,
        value: cookie.value,
        expires: cookie.expires,
        httpOnly: cookie.httpOnly,
        maxAge: cookie.maxAge,
        path: cookie.path,
        priority: cookie.priority,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      })
    }
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
            // Get domain settings once
            const { domains } = getDomainSettings(hostname)
            
            cookies.forEach((cookie) => {
              // For each auth cookie, we need to set it for all applicable domains
              if (cookie.name.startsWith('sb-')) {
                domains.forEach(domain => {
                  const cookieOptions = {
                    name: cookie.name,
                    value: cookie.value,
                    sameSite: 'lax' as const,
                    secure: process.env.NODE_ENV === 'production',
                    path: '/',
                    domain,
                    maxAge: 60 * 60 * 24 * 7 // 7 days for auth cookies
                  }
                  // Only set on response, not request (avoid duplication)
                  response.cookies.set(cookieOptions)
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
    const { data: { user }, error: sessionError } = await supabase.auth.getUser()
    
    if (sessionError) {
      console.error('Error refreshing session in middleware:', sessionError)
      // Continue execution as we can still handle routing without a valid session
    }

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
        
        copyCookiesWithDomains(response, rewriteResponse, domains)
        
        return rewriteResponse
      } else {
        // Username doesn't exist, redirect to 404
        url.pathname = '/404'
        const rewriteResponse = NextResponse.rewrite(url)
        
        copyCookiesWithDomains(response, rewriteResponse, domains)
        
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
        const redirectResponse = NextResponse.redirect(url)
        copyCookiesWithDomains(response, redirectResponse, domains)
        return redirectResponse
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
