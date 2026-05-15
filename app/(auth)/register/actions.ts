'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { registerSchema } from '@/lib/validations/auth'
import { rateLimiters } from '@/lib/rate-limit'
import { headers } from 'next/headers'
import crypto from 'crypto'

export async function registerAction(formData: unknown) {
  try {
    const ip = (await headers()).get('x-forwarded-for') ?? '127.0.0.1'
    
    // 1. Rate limiting (3 inscriptions / heure)
    const { success } = await rateLimiters.register.limit(ip)
    if (!success) {
      return { success: false, error: { _global: 'Trop de tentatives. Veuillez réessayer plus tard.' } }
    }

    // 2. Validation Zod stricte
    const parsed = registerSchema.safeParse(formData)
    if (!parsed.success) {
      return { success: false, error: parsed.error.flatten().fieldErrors }
    }

    const { email, password, fullName, phone, companyName, country, rgpdConsent } = parsed.data

    const supabaseAdmin = createAdminClient()

    // 3. SignUp avec Supabase (atomique pour l'utilisateur dans auth.users)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for this implementation, or set false to require email verification
      user_metadata: { full_name: fullName }
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        return { success: false, error: { email: ['Cet email est déjà utilisé'] } }
      }
      return { success: false, error: { _global: authError.message } }
    }

    const userId = authData.user.id
    const userAgent = (await headers()).get('user-agent') ?? 'unknown'

    // 4. Transaction manuelle (via stored procedure RPC ou insertions séquentielles sécurisées)
    // On crée d'abord la company
    const slug = companyName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + crypto.randomBytes(2).toString('hex')
    
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .insert({
        name: companyName,
        slug,
        email,
        phone,
        country,
        plan: 'trial',
        rgpd_accepted_at: rgpdConsent ? new Date().toISOString() : null,
        rgpd_accepted_version: '1.0',
      })
      .select('id')
      .single()

    if (companyError || !company) {
      // Rollback manual (delete user)
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return { success: false, error: { _global: 'Erreur lors de la création de l\'entreprise' } }
    }

    // On crée le profile user
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        company_id: company.id,
        full_name: fullName,
        email,
        phone,
        role: 'owner',
      })

    if (profileError) {
       // Rollback manual
       await supabaseAdmin.auth.admin.deleteUser(userId)
       await supabaseAdmin.from('companies').delete().eq('id', company.id)
       return { success: false, error: { _global: 'Erreur lors de la création du profil' } }
    }

    // Consent records RGPD
    await supabaseAdmin.from('consent_records').insert({
      user_id: userId,
      type: 'rgpd_policy',
      version: '1.0',
      accepted: true,
      ip_address: ip,
      user_agent: userAgent
    })

    // Audit logs
    await supabaseAdmin.from('audit_logs').insert({
      user_id: userId,
      company_id: company.id,
      action: 'REGISTER',
      resource: 'users',
      resource_id: userId,
      ip_address: ip,
      user_agent: userAgent
    })

    return { success: true }
  } catch (err) {
    console.error('[registerAction]', err)
    return { success: false, error: { _global: 'Une erreur inattendue est survenue' } }
  }
}
