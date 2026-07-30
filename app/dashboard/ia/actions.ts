'use server'

import { createClient } from '@/lib/supabase/server'
import { runAIPredictiveAnalysis } from '@/lib/telemetry'

export async function getAIPredictiveDataAction() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Non autorisé' }

    const { data: userData } = (await supabase.from('users').select('company_id').eq('id', user.id).single()) as any
    const companyId = userData?.company_id

    if (!companyId) return { success: false, error: 'Compagnie introuvable' }

    const analysis = await runAIPredictiveAnalysis(companyId)

    return { success: true, ...analysis }
  } catch (err: any) {
    return { success: false, error: err.message || 'Erreur inattendue' }
  }
}
