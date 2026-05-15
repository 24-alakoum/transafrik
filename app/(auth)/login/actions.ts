'use server'

import { createClient } from '@/lib/supabase/server'
import { loginSchema } from '@/lib/validations/auth'
import { rateLimiters } from '@/lib/rate-limit'
import { logAudit } from '@/lib/audit'
import { headers } from 'next/headers'

export async function loginAction(formData: unknown) {
  try {
    // 1. Rate limiting
    const ip = (await headers()).get('x-forwarded-for') ?? '127.0.0.1'
    const { success } = await rateLimiters.login.limit(ip)
    
    if (!success) {
      return { 
        success: false, 
        error: { _global: 'Trop de tentatives. Veuillez réessayer dans 15 minutes.' } 
      }
    }

    // 2. Validation Zod
    const parsed = loginSchema.safeParse(formData)
    if (!parsed.success) {
      return { success: false, error: parsed.error.flatten().fieldErrors }
    }

    // 3. Authentification Supabase
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    })

    if (error) {
      // Log failed attempt
      await logAudit({
        userId: 'system',
        companyId: 'system',
        action: 'FAILED_LOGIN',
        resource: 'auth',
        newData: { email: parsed.data.email, error: error.message },
        ipAddress: ip,
      })
      
      return { 
        success: false, 
        error: { _global: 'Email ou mot de passe incorrect' } 
      }
    }

    if (data.user) {
      // Récupération de l'utilisateur pour le companyId
      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', data.user.id)
        .single()

      // Log success
      await logAudit({
        userId: data.user.id,
        companyId: userData?.company_id ?? '',
        action: 'LOGIN',
        resource: 'auth',
        ipAddress: ip,
      })
      
      // Update last_login_at
      await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', data.user.id)
    }

    return { success: true }
  } catch (err) {
    console.error('[loginAction]', err)
    return { success: false, error: { _global: 'Une erreur inattendue est survenue' } }
  }
}
