'use server'

import { createClient } from '@/lib/supabase/server'
import { resetPasswordSchema } from '@/lib/validations/auth'
import { logAudit } from '@/lib/audit'
import zxcvbn from 'zxcvbn'
import { headers } from 'next/headers'

export async function resetPasswordAction(formData: unknown) {
  try {
    const parsed = resetPasswordSchema.safeParse(formData)
    if (!parsed.success) {
      return { success: false, error: parsed.error.flatten().fieldErrors }
    }

    // Force zxcvbn validation score on server
    const score = zxcvbn(parsed.data.password).score
    if (score < 3) {
      return { success: false, error: { password: ['Le mot de passe est trop faible (score zxcvbn < 3)'] } }
    }

    const supabase = await createClient()
    
    // We update the user's password with the active session code
    const { data, error } = await supabase.auth.updateUser({
      password: parsed.data.password
    })

    if (error) {
      return { success: false, error: { _global: error.message } }
    }

    const ip = (await headers()).get('x-forwarded-for') ?? '127.0.0.1'

    if (data.user) {
      await logAudit({
        userId: data.user.id,
        companyId: data.user.user_metadata?.company_id ?? '',
        action: 'PASSWORD_CHANGED',
        resource: 'users',
        ipAddress: ip,
      })
    }

    return { success: true }
  } catch (err) {
    console.error('[resetPasswordAction]', err)
    return { success: false, error: { _global: 'Une erreur inattendue est survenue' } }
  }
}
