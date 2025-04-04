import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Define which routes to run the middleware on
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}

export async function middleware(request: NextRequest) {
  // Handle subdomain routing for usernames
  const url = request.nextUrl.clone()
  const hostname = request.headers.get('host') || ''
  
  // Create a response object that we'll modify as needed
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })
  
  // Initialize Supabase client for auth
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )
  
  // Refresh session if expired - required for Server Components
  await supabase.auth.getSession()
  
  // Check if we're dealing with a subdomain
  const domainParts = hostname.split('.')
  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1')
  const isSubdomain = domainParts.length > (isLocalhost ? 1 : 2)
  
  if (isSubdomain) {
    // Extract the username from the subdomain
    const username = domainParts[0]
    
    // Skip processing for special subdomains like 'www'
    if (username === 'www') {
      return response
    }
    
    // Check if the username exists in the profiles table
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('username', username)
      .single()
    
    if (profile) {
      // Username exists, rewrite the URL to the user's profile page
      // Add the username as a query parameter to be used by the profile page
      url.pathname = '/profile'
      url.searchParams.set('username', username)
      
      // Use rewrite to keep the original URL in the browser but serve a different path
      const rewriteResponse = NextResponse.rewrite(url)
      
      // Copy cookies from the original response to the rewrite response
      response.cookies.getAll().forEach(cookie => {
        rewriteResponse.cookies.set(cookie)
      })
      
      return rewriteResponse
    } else {
      // Username doesn't exist, redirect to 404
      url.pathname = '/404'
      const rewriteResponse = NextResponse.rewrite(url)
      
      // Copy cookies from the original response to the rewrite response
      response.cookies.getAll().forEach(cookie => {
        rewriteResponse.cookies.set(cookie)
      })
      
      return rewriteResponse
    }
  }
  
  // For non-subdomain requests, just return the response with auth session
  return response
}
