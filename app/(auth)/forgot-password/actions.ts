'use server'

import { createClient } from '@/lib/supabase/server'
import { forgotPasswordSchema } from '@/lib/validations/auth'
import { rateLimiters } from '@/lib/rate-limit'
import { logAudit } from '@/lib/audit'
import { headers } from 'next/headers'

export async function forgotPasswordAction(formData: unknown) {
  try {
    const ip = (await headers()).get('x-forwarded-for') ?? '127.0.0.1'
    
    // Rate limit
    const { success } = await rateLimiters.login.limit(ip)
    if (!success) {
      return { success: false, error: { _global: 'Trop de tentatives. Veuillez réessayer plus tard.' } }
    }

    const parsed = forgotPasswordSchema.safeParse(formData)
    if (!parsed.success) {
      return { success: false, error: parsed.error.flatten().fieldErrors }
    }

    const supabase = await createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    })

    if (error) {
      return { success: false, error: { _global: error.message } }
    }

    // Log audit action
    await logAudit({
      userId: 'system',
      companyId: 'system',
      action: 'PASSWORD_RESET',
      resource: 'auth',
      newData: { email: parsed.data.email },
      ipAddress: ip,
    })

    return { success: true }
  } catch (err) {
    console.error('[forgotPasswordAction]', err)
    return { success: false, error: { _global: 'Une erreur inattendue est survenue' } }
  }
}
