'use server'

import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit'
import { rateLimiters } from '@/lib/rate-limit'
import { headers } from 'next/headers'

export async function requestDataExportAction() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Non autorisé' }

    const ip = (await headers()).get('x-forwarded-for') ?? '127.0.0.1'
    
    // Rate limit: 2 requests per 24 hours pour l'export RGPD (simulation ici avec upstash/redis si configuré, ou on laisse passer)
    // Pour simplifier, on logue juste la requête dans data_requests
    const { data: userData } = await supabase.from('users').select('company_id').eq('id', user.id).single()

    const { error } = await supabase.from('data_requests').insert({
      user_id: user.id,
      company_id: userData?.company_id,
      type: 'export',
      status: 'pending'
    })

    if (error) throw error

    await logAudit({
      userId: user.id,
      companyId: userData?.company_id ?? '',
      action: 'RGPD_EXPORT_REQUEST',
      resource: 'users',
      ipAddress: ip
    })

    return { success: true }
  } catch (err) {
    return { success: false, error: 'Erreur inattendue' }
  }
}

export async function deleteAccountRequestAction() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Non autorisé' }

    const { data: userData } = await supabase.from('users').select('company_id').eq('id', user.id).single()
    const ip = (await headers()).get('x-forwarded-for') ?? '127.0.0.1'

    const { error } = await supabase.from('data_requests').insert({
      user_id: user.id,
      company_id: userData?.company_id,
      type: 'deletion',
      status: 'pending'
    })

    if (error) throw error

    await logAudit({
      userId: user.id,
      companyId: userData?.company_id ?? '',
      action: 'RGPD_DELETION_REQUEST',
      resource: 'users',
      ipAddress: ip
    })

    return { success: true }
  } catch (err) {
    return { success: false, error: 'Erreur inattendue' }
  }
}
