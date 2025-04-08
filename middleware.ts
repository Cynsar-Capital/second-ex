import { NextResponse, type NextRequest } from 'next/server'
import { supabase, updateSession } from './supabase/utils'

function copyCookiesWithDomains(
  fromRequest: NextRequest,
  toResponse: NextResponse,
  domains: string[]
) {
  console.log('Copying cookies with domains:', domains);
  
  // Get cookies from the request (not response)
  const cookies = fromRequest.cookies.getAll();
  console.log('Cookies to copy:', cookies.map(c => ({ name: c.name, value: c.value.substring(0, 10) + '...' })));

  // Check if this is a sign-out request (auth cookie exists but is being deleted)
  const authCookie = cookies.find(c => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'));
  if (authCookie && authCookie.value === '') {
    console.log('Sign-out detected, skipping cookie copy');
    return;
  }

  cookies.forEach(cookie => {
    if (cookie.name.startsWith('sb-')) {
      // Only copy auth cookies if they have a value
      if (cookie.value) {
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
      }
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

  // For local development, we don't use a domain prefix for cookies
  // For production, we use .2nd.exchange to share cookies across subdomains
  const domains = isLocalhost ? [''] : ['.2nd.exchange']
  
  // Get the base host for the current environment
  const baseHost = isLocalhost ? 'localhost' : '2nd.exchange'
  
  // If it's a subdomain, get the username part
  const username = isSubdomain ? hostname.split('.')[0] : ''
  
  // Construct the full hostname in username.host format
  const formattedHostname = isSubdomain ? `${username}.${baseHost}` : baseHost
  
  console.log('Domain settings:', {
    isLocalhost,
    isSubdomain,
    hostname: formattedHostname,
    domains,
    username
  })

  return {
    domains,
    isLocalhost,
    isSubdomain,
    host: formattedHostname
  }
}


export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const hostname = request.headers.get('host') || ''
  const { domains, isLocalhost, isSubdomain } = getDomainSettings(hostname)

  if (isSubdomain) {
    const username = hostname.split('.')[0]
    console.log('Processing subdomain request:', { username, hostname })

    if (username === 'www') {
      return NextResponse.next()
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('username', username)
      .single()
    
    if (profileError || !profile) {
      console.log('Profile not found:', { username, error: profileError })
      url.pathname = '/404'
      return NextResponse.rewrite(url)
    }

    console.log('Profile found:', { username, profileId: profile.id })
    url.pathname = '/profile'
    url.searchParams.set('username', username)
    
    const rewriteResponse = NextResponse.rewrite(url)
    copyCookiesWithDomains(request, rewriteResponse, domains)
    
    console.log('Rewriting to profile with cookies:', { 
      pathname: url.pathname, 
      cookies: rewriteResponse.cookies.getAll().map(c => ({ 
        name: c.name, 
        domain: c.domain 
      }))
    })
    
    return rewriteResponse
  }

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