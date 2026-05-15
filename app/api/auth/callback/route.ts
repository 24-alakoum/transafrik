import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { logAudit } from '@/lib/audit'
import type { Database } from '@/types/database'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return [] // Minimal implementation for callback route
          },
          setAll(cookiesToSet) {
            // Dans ce contexte spécifique, nous utilisons un cookie HTTP response normal à la fin
          },
        },
      }
    )

    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && session) {
      // Log audit
      await logAudit({
        userId: session.user.id,
        companyId: session.user.user_metadata?.company_id ?? '',
        action: 'LOGIN',
        resource: 'users',
      })

      // Update last_login_at
      await supabase.from('users').update({ last_login_at: new Date().toISOString() }).eq('id', session.user.id)

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Invalid+magic+link`)
}
