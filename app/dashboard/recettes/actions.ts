'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

async function getCompanyId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = (await (supabase.from('users') as any)
    .select('company_id').eq('id', user.id).single()) as any

  return { supabase, user, company_id: data?.company_id }
}

export async function createRecetteAction(formData: any) {
  try {
    const ctx = await getCompanyId()
    if (!ctx?.company_id) return { error: 'Non autorisé ou session expirée' }
    const { supabase, company_id } = ctx

    const amount = Number(formData.amount_fcfa)
    if (!amount || isNaN(amount) || amount <= 0) {
      return { error: 'Le montant doit être un nombre valide supérieur à 0' }
    }

    const dataToInsert: any = {
      company_id,
      description: formData.description?.trim() || 'Recette sans description',
      amount_fcfa: amount,
      date: formData.date || new Date().toISOString().split('T')[0],
      source: formData.source || 'transport',
      status: formData.status || 'encaisse',
      reference: formData.reference?.trim() || null,
      client_id: formData.client_id || null,
      trip_id: formData.trip_id || null,
    }

    // Clean empty strings to null for UUID / FK fields
    if (dataToInsert.client_id === '') dataToInsert.client_id = null
    if (dataToInsert.trip_id === '') dataToInsert.trip_id = null
    if (dataToInsert.reference === '') dataToInsert.reference = null

    let { error } = await (supabase.from('revenues') as any)
      .insert(dataToInsert)

    // Fallback to admin client if RLS or permission fails
    if (error && (error.code === '42501' || error.message?.includes('row-level security'))) {
      try {
        const adminSupabase = createAdminClient()
        const { error: adminErr } = await (adminSupabase.from('revenues') as any).insert(dataToInsert)
        if (!adminErr) error = null
      } catch (adminEx) {
        console.error('[createRecetteAction Admin Fallback Failed]', adminEx)
      }
    }

    if (error) {
      console.error('[createRecetteAction error]', error)
      if (error.code === '42P01') {
        return { error: "La table 'revenues' n'existe pas encore dans votre base Supabase. Veuillez vérifier le schéma SQL." }
      }
      if (error.code === '42703') {
        return { error: `Colonne manquante dans le schéma Supabase : ${error.message}` }
      }
      return { error: error.message }
    }

    if (dataToInsert.trip_id) {
      await syncTripRevenue(supabase, dataToInsert.trip_id)
    }

    revalidatePath('/dashboard/recettes')
    return { success: true }
  } catch (e: any) {
    console.error('[createRecetteAction Exception]', e)
    return { error: e.message || 'Erreur inattendue lors de la création' }
  }
}

async function syncTripRevenue(supabase: any, tripId: string | null | undefined) {
  if (!tripId) return
  try {
    const { data: revList } = await supabase
      .from('revenues')
      .select('amount_fcfa')
      .eq('trip_id', tripId)

    const totalRev = (revList || []).reduce((sum: number, r: any) => sum + Number(r.amount_fcfa || 0), 0)

    await supabase
      .from('trips')
      .update({
        revenue_fcfa: totalRev,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tripId)
  } catch (err) {
    console.error('[syncTripRevenue Error]', err)
  }
}

export async function deleteRecetteAction(id: string) {
  try {
    const ctx = await getCompanyId()
    if (!ctx) return { error: 'Non autorisé' }
    const { supabase, company_id } = ctx

    const { data: existingRev } = await (supabase.from('revenues') as any)
      .select('trip_id')
      .eq('id', id)
      .maybeSingle()

    let { error } = await (supabase.from('revenues') as any)
      .delete()
      .eq('id', id)
      .eq('company_id', company_id)

    if (error && (error.code === '42501' || error.message?.includes('row-level security'))) {
      try {
        const adminSupabase = createAdminClient()
        const { error: adminErr } = await (adminSupabase.from('revenues') as any)
          .delete()
          .eq('id', id)
        if (!adminErr) error = null
      } catch (adminEx) {
        console.error('[deleteRecetteAction Admin Fallback Failed]', adminEx)
      }
    }

    if (error) return { error: error.message }

    if (existingRev?.trip_id) {
      await syncTripRevenue(supabase, existingRev.trip_id)
    }

    revalidatePath('/dashboard/recettes')
    return { success: true }
  } catch (e: any) {
    return { error: e.message }
  }
}

