import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // ── 1. Security headers ──────────────────────────────
  supabaseResponse.headers.set('X-Frame-Options', 'DENY')
  supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff')
  supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  supabaseResponse.headers.set('X-XSS-Protection', '1; mode=block')
  supabaseResponse.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  )
  if (process.env.NODE_ENV === 'production') {
    supabaseResponse.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    )
  }

  // ── 2. Supabase session refresh ──────────────────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          // Re-appliquer les headers de sécurité après re-création de la réponse
          supabaseResponse.headers.set('X-Frame-Options', 'DENY')
          supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff')
          supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, {
              ...options,
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
            })
          })
        },
      },
    }
  )

  // IMPORTANT: ne pas écrire de code entre createServerClient et getUser
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ── 3. Auth guards ───────────────────────────────────
  const pathname = request.nextUrl.pathname

  const isDashboard = pathname.startsWith('/dashboard')
  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'].some(
    (p) => pathname.startsWith(p)
  )

  // Pas connecté → redirection vers /login
  if (isDashboard && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Déjà connecté → redirection vers /dashboard
  if (isAuthPage && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Exclure :
     * - _next/static (fichiers statiques)
     * - _next/image (optimisation images)
     * - favicon.ico
     * - fichiers images
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
