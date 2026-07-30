'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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
    if (!ctx?.company_id) return { error: 'Non autorisé' }
    const { supabase, company_id } = ctx

    const { containers, ...blData } = formData

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
    if (!ctx) return { error: 'Non autorisé' }
    const { supabase } = ctx

    const updates: any = { status }
    if (status === 'retire' && date) updates.pickup_date = date
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
    if (!ctx) return { error: 'Non autorisé' }
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

export async function deleteBLAction(blId: string) {
  try {
    const ctx = await getCompanyId()
    if (!ctx) return { error: 'Non autorisé' }
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
