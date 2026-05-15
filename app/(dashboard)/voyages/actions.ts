'use server'

import { createClient } from '@/lib/supabase/server'
import { voyageSchema } from '@/lib/validations/voyage'
import { logAudit } from '@/lib/audit'
import { generateReference } from '@/lib/utils'

export async function createVoyageAction(formData: unknown) {
  try {
    const parsed = voyageSchema.safeParse(formData)
    if (!parsed.success) {
      return { success: false, error: parsed.error.flatten().fieldErrors }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: { _global: 'Non autorisé' } }
    }

    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!userData?.company_id) {
      return { success: false, error: { _global: 'Compagnie introuvable' } }
    }

    // Generate unique reference (e.g. TRP-20260515-XXXX)
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '')
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase()
    const reference = `TRP-${dateStr}-${randomStr}`

    const { data: trip, error } = await supabase
      .from('trips')
      .insert({
        ...parsed.data,
        reference,
        company_id: userData.company_id,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (error) {
      return { success: false, error: { _global: error.message } }
    }

    await logAudit({
      userId: user.id,
      companyId: userData.company_id,
      action: 'CREATE_TRIP',
      resource: 'trips',
      resource_id: trip.id,
    })

    return { success: true, tripId: trip.id }
  } catch (err) {
    console.error('[createVoyageAction]', err)
    return { success: false, error: { _global: 'Une erreur inattendue est survenue' } }
  }
}

export async function deleteVoyageAction(id: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Non autorisé' }

    const { data: userData } = await supabase.from('users').select('company_id').eq('id', user.id).single()

    const { error } = await supabase.from('trips').delete().eq('id', id)

    if (error) return { success: false, error: error.message }

    await logAudit({
      userId: user.id,
      companyId: userData?.company_id ?? '',
      action: 'DELETE_TRIP',
      resource: 'trips',
      resource_id: id,
    })

    return { success: true }
  } catch (err) {
    console.error(err)
    return { success: false, error: 'Erreur inattendue' }
  }
}
