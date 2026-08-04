'use server'

import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit'
import { affectationSchema } from '@/lib/validations/affectation'

export async function createAffectationAction(formData: unknown) {
  try {
    const parsed = affectationSchema.safeParse(formData)
    if (!parsed.success) return { success: false, error: parsed.error.flatten().fieldErrors }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: { _global: 'Non autorisé' } }

    const { data: userData } = (await supabase.from('users').select('company_id').eq('id', user.id).single()) as any

    // Vérifie qu'il n'y a pas déjà une affectation active pour ce camion
    const { data: existingTruck } = await supabase
      .from('affectations')
      .select('id')
      .eq('truck_id', parsed.data.truck_id)
      .is('end_date', null)
      .maybeSingle()

    if (existingTruck) {
      return { success: false, error: { _global: 'Ce camion a déjà une affectation active. Terminez-la avant d\'en créer une nouvelle.' } }
    }

    // Vérifie qu'il n'y a pas déjà une affectation active pour ce chauffeur
    const { data: existingDriver } = await supabase
      .from('affectations')
      .select('id')
      .eq('driver_id', parsed.data.driver_id)
      .is('end_date', null)
      .maybeSingle()

    if (existingDriver) {
      return { success: false, error: { _global: 'Ce chauffeur a déjà une affectation active. Terminez-la avant d\'en créer une nouvelle.' } }
    }

    const { data: affectation, error } = (await supabase
      .from('affectations')
      .insert({
        driver_id: parsed.data.driver_id,
        truck_id: parsed.data.truck_id,
        start_date: parsed.data.start_date || new Date().toISOString(),
        notes: parsed.data.notes,
        company_id: userData?.company_id,
        status: 'active',
      } as any)
      .select('id')
      .single()) as any

    if (error) return { success: false, error: { _global: error.message } }

    // Met à jour le statut du chauffeur
    await (supabase.from('drivers') as any)
      .update({ status: 'on_trip' })
      .eq('id', parsed.data.driver_id)

    await logAudit({
      userId: user.id,
      companyId: userData?.company_id ?? '',
      action: 'CREATE_AFFECTATION',
      resource: 'affectations',
      resourceId: affectation?.id,
    })

    return { success: true }
  } catch (err) {
    return { success: false, error: { _global: 'Erreur inattendue' } }
  }
}

export async function endAffectationAction(affectationId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Non autorisé' }

    const { data: userData } = (await supabase.from('users').select('company_id').eq('id', user.id).single()) as any

    const { data: affectation, error: fetchError } = (await supabase
      .from('affectations')
      .select('driver_id, truck_id')
      .eq('id', affectationId)
      .eq('company_id', userData?.company_id)
      .single()) as any

    if (fetchError || !affectation) return { success: false, error: 'Affectation introuvable' }

    const { error } = await (supabase
      .from('affectations') as any)
      .update({ end_date: new Date().toISOString(), status: 'completed' })
      .eq('id', affectationId)
      .eq('company_id', userData?.company_id)

    if (error) return { success: false, error: error.message }

    // Remet le chauffeur disponible
    await (supabase.from('drivers') as any)
      .update({ status: 'available' })
      .eq('id', affectation.driver_id)

    await logAudit({
      userId: user.id,
      companyId: userData?.company_id ?? '',
      action: 'END_AFFECTATION',
      resource: 'affectations',
      resourceId: affectationId,
    })

    return { success: true }
  } catch (err) {
    return { success: false, error: 'Erreur inattendue' }
  }
}

export async function getActiveAffectationsAction() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Non autorisé', data: [] }

    const { data: userData } = (await supabase.from('users').select('company_id').eq('id', user.id).single()) as any

    const { data, error } = await supabase
      .from('affectations')
      .select('id, driver_id, truck_id, start_date, drivers(full_name), trucks(plate_number)')
      .eq('company_id', userData?.company_id)
      .is('end_date', null)
      .order('start_date', { ascending: false })

    if (error) return { success: false, error: error.message, data: [] }

    return { success: true, data: data ?? [] }
  } catch (err) {
    return { success: false, error: 'Erreur inattendue', data: [] }
  }
}