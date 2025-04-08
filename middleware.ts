import { NextResponse, type NextRequest } from 'next/server'
import { supabase, updateSession } from './supabase/utils'

function copyCookiesWithDomains(
  fromRequest: NextRequest,  // Changed from NextResponse to NextRequest
  toResponse: NextResponse,
  domains: string[]
) {
  console.log('Copying cookies with domains:', domains);
  
  // Get cookies from the request (not response)
  const cookies = fromRequest.cookies.getAll();
  console.log('Cookies to copy:', cookies.map(c => ({ name: c.name })));

  cookies.forEach(cookie => {
    if (cookie.name.startsWith('sb-')) {
      // For auth cookies, set for all applicable domains
      domains.forEach(domain => {
        toResponse.cookies.set({
          name: cookie.name,
          value: cookie.value,
          domain,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          path: '/',
          maxAge: 60 * 60 * 24 * 7, // 7 days for auth cookies
          httpOnly: true,
        });
      });
    } else {
      // For non-auth cookies, copy as is
      toResponse.cookies.set({
        name: cookie.name,
        value: cookie.value,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      });
    }
  });
}

function getDomainSettings(hostname: string) {
  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1')
  const isSubdomain = isLocalhost 
    ? hostname.split('.').length > 1 && !hostname.startsWith('www')
    : hostname.split('.').length > 2 && !hostname.startsWith('www')

  // For local development, use .localhost for proper subdomain testing
  const rootDomain = isLocalhost ? 'localhost' : '.2nd.exchange'
  
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


export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })
  const url = request.nextUrl.clone()
  const hostname = request.headers.get('host') || ''
  const { domains, isLocalhost, isSubdomain } = getDomainSettings(hostname)
  if (isSubdomain){
    const username = hostname.split('.')[0]
    if (username === 'www') {
      return response
    }
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('username', username)
        .single()
      
    if (profileError || !profile) {
      url.pathname = '/404'
      const rewriteResponse = NextResponse.rewrite(url)
      return rewriteResponse
    } else {
      url.pathname = '/profile'
      url.searchParams.set('username', username)
      copyCookiesWithDomains(request, response, domains)
      const rewriteResponse = NextResponse.rewrite(url)
      return rewriteResponse
    }
  }
  //response.cookies.set('name', 'value')
  //copyCookiesWithDomains(request, response, domains)
  return await updateSession(request)
  
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}