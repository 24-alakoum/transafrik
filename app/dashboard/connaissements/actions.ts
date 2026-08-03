'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { CONTAINER_STATUSES, type ContainerStatus } from '@/lib/container-statuses'

async function getCompanyId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = (await (supabase.from('users') as any)
    .select('company_id').eq('id', user.id).single()) as any
  return { supabase, user, company_id: data?.company_id }
}

export async function createBLAction(formData: any) {
  try {
    const ctx = await getCompanyId()
    if (!ctx?.company_id) return { error: 'Non autorisÃ©' }
    const { supabase, company_id } = ctx

    const { containers, ...blData } = formData

    // Prevent invalid input syntax for UUID / Date empty strings
    if (blData.client_id === '') delete blData.client_id
    if (blData.eta === '') delete blData.eta
    if (blData.arrival_date === '') delete blData.arrival_date

    const { data: bl, error: blError } = await (supabase.from('bills_of_lading') as any)
      .insert({ ...blData, company_id })
      .select('id')
      .single()

    if (blError) return { error: blError.message }

    if (containers?.length > 0) {
      const containersData = containers
        .filter((c: any) => c.container_number?.trim())
        .map((c: any) => ({
          ...c,
          bl_id: bl.id,
          company_id,
          weight_kg: c.weight_kg ? parseFloat(c.weight_kg) : null,
        }))
      if (containersData.length > 0) {
        const { error: cError } = await (supabase.from('containers') as any).insert(containersData)
        if (cError) console.error('[createBL] container error:', cError)
      }
    }

    revalidatePath('/dashboard/connaissements')
    return { success: true, id: bl.id }
  } catch (e: any) {
    return { error: e.message }
  }
}

export async function updateContainerStatusAction(containerId: string, status: string, date?: string) {
  try {
    const ctx = await getCompanyId()
    if (!ctx) return { error: 'Non autorisÃ©' }
    const { supabase } = ctx

    if (!(status in CONTAINER_STATUSES)) return { error: 'Statut de conteneur invalide' }

    const updates: any = { status: status as ContainerStatus, updated_at: new Date().toISOString() }
    if (status === 'en_cours' && date) updates.pickup_date = date
    if (status === 'retourne' && date) updates.return_date = date

    const { error } = await (supabase.from('containers') as any)
      .update(updates)
      .eq('id', containerId)

    if (error) return { error: error.message }
    revalidatePath('/dashboard/connaissements')
    return { success: true }
  } catch (e: any) {
    return { error: e.message }
  }
}

export async function updateBLStatusAction(blId: string, status: string) {
  try {
    const ctx = await getCompanyId()
    if (!ctx) return { error: 'Non autorisÃ©' }
    const { supabase } = ctx

    const updates: any = { status }
    if (status === 'arrive') updates.arrival_date = new Date().toISOString().split('T')[0]

    const { error } = await (supabase.from('bills_of_lading') as any)
      .update(updates)
      .eq('id', blId)

    if (error) return { error: error.message }
    revalidatePath('/dashboard/connaissements')
    return { success: true }
  } catch (e: any) {
    return { error: e.message }
  }
}

export async function updateBLDatesAction(blId: string, data: any) {
  try {
    const ctx = await getCompanyId()
    if (!ctx) return { error: 'Non autorisÃ©' }
    const { supabase } = ctx

    const updates = { ...data, updated_at: new Date().toISOString() }
    if (updates.arrival_date === '') updates.arrival_date = null
    if (updates.created_at === '') delete updates.created_at

    const { error } = await (supabase.from('bills_of_lading') as any)
      .update(updates)
      .eq('id', blId)

    if (error) return { error: error.message }
    revalidatePath('/dashboard/connaissements')
    return { success: true }
  } catch (e: any) {
    return { error: e.message }
  }
}

export async function deleteBLAction(blId: string) {
  try {
    const ctx = await getCompanyId()
    if (!ctx) return { error: 'Non autorisÃ©' }
    const { supabase } = ctx

    await (supabase.from('containers') as any).delete().eq('bl_id', blId)
    const { error } = await (supabase.from('bills_of_lading') as any).delete().eq('id', blId)
    if (error) return { error: error.message }

    revalidatePath('/dashboard/connaissements')
    return { success: true }
  } catch (e: any) {
    return { error: e.message }
  }
}

export async function updateContainerDatesAction(containerId: string, data: any) {
  try {
    const ctx = await getCompanyId()
    if (!ctx) return { error: 'Non autorisÃ©' }
    const { supabase } = ctx

    const updates = { ...data }
    if (updates.pickup_date === '') updates.pickup_date = null
    if (updates.return_date === '') updates.return_date = null

    const { error } = await (supabase.from('containers') as any)
      .update(updates)
      .eq('id', containerId)

    if (error) return { error: error.message }
    revalidatePath('/dashboard/connaissements')
    return { success: true }
  } catch (e: any) {
    return { error: e.message }
  }
}
export async function updateFullBLAction(blId: string, formData: any) {
  try {
    const ctx = await getCompanyId()
    if (!ctx) return { error: 'Non autorisé' }
    const { supabase, company_id } = ctx

    const { containers, ...blData } = formData

    if (blData.client_id === '') blData.client_id = null
    if (blData.eta === '') blData.eta = null
    if (blData.arrival_date === '') blData.arrival_date = null
    if (blData.created_at === '') delete blData.created_at
    if (blData.id) delete blData.id

    const { error: blError } = await (supabase.from('bills_of_lading') as any)
      .update(blData)
      .eq('id', blId)

    if (blError) return { error: blError.message }

    const { data: existingContainers } = await (supabase.from('containers') as any)
      .select('id')
      .eq('bl_id', blId)
      
    const incomingIds = (containers || []).filter((c: any) => c.id).map((c: any) => c.id)
    const toDelete = (existingContainers || []).filter((c: any) => !incomingIds.includes(c.id)).map((c: any) => c.id)

    if (toDelete.length > 0) {
      await (supabase.from('containers') as any).delete().in('id', toDelete)
    }

    if (containers?.length > 0) {
      for (const c of containers) {
        if (!c.container_number?.trim()) continue;
        const payload = {
          ...c,
          bl_id: blId,
          company_id,
          weight_kg: c.weight_kg ? parseFloat(c.weight_kg) : null,
          updated_at: new Date().toISOString(),
        }
        if (payload.id) {
          await (supabase.from('containers') as any).update(payload).eq('id', payload.id)
        } else {
          await (supabase.from('containers') as any).insert([payload])
        }
      }
    }

    revalidatePath('/dashboard/connaissements')
    revalidatePath(`/dashboard/connaissements/${blId}`)
    return { success: true }
  } catch (e: any) {
    return { error: e.message }
  }
}

