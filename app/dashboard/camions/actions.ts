'use server'

import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit'
import { camionSchema } from '@/lib/validations/camion'
import { headers } from 'next/headers'

export async function createCamionAction(formData: unknown) {
  try {
    const parsed = camionSchema.safeParse(formData)
    if (!parsed.success) return { success: false, error: parsed.error.flatten().fieldErrors }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: { _global: 'Non autorisé' } }

    const { data: userData } = await supabase.from('users').select('company_id').eq('id', user.id).single()

    const { data: camion, error } = await supabase
      .from('trucks')
      .insert({ ...parsed.data, company_id: userData?.company_id })
      .select('id')
      .single()

    if (error) {
      if (error.code === '23505') { // Unique constraint
        return { success: false, error: { plate: ['Cette plaque existe déjà'] } }
      }
      return { success: false, error: { _global: error.message } }
    }

    await logAudit({
      userId: user.id,
      companyId: userData?.company_id ?? '',
      action: 'CREATE_TRUCK',
      resource: 'trucks',
      resource_id: camion.id,
    })

    return { success: true }
  } catch (err) {
    return { success: false, error: { _global: 'Erreur inattendue' } }
  }
}
