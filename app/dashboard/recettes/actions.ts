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

export async function createRecetteAction(formData: any) {
  try {
    const ctx = await getCompanyId()
    if (!ctx?.company_id) return { error: 'Non autorisé' }
    const { supabase, company_id } = ctx

    const dataToInsert: any = {
      company_id,
      description: formData.description || 'Recette sans description',
      amount_fcfa: Number(formData.amount_fcfa || 0),
      date: formData.date || new Date().toISOString().split('T')[0],
      source: formData.source || 'transport',
      status: formData.status || 'encaisse',
      reference: formData.reference || null,
      client_id: formData.client_id || null,
      trip_id: formData.trip_id || null,
    }

    // Nettoyer les chaînes vides pour éviter les erreurs de type UUID ou FK
    if (dataToInsert.client_id === '') dataToInsert.client_id = null
    if (dataToInsert.trip_id === '') dataToInsert.trip_id = null
    if (dataToInsert.reference === '') dataToInsert.reference = null

    const { error } = await (supabase.from('revenues') as any)
      .insert(dataToInsert)

    if (error) {
      console.error('[createRecetteAction error]', error)
      if (error.code === '42P01') {
        return { error: "La table 'revenues' n'existe pas encore dans votre base Supabase. Veuillez l'ajouter ou ré-exécuter le script database_schema.sql." }
      }
      if (error.code === '42703') {
        return { error: `Colonne manquante dans le schéma Supabase : ${error.message}` }
      }
      return { error: error.message }
    }

    revalidatePath('/dashboard/recettes')
    return { success: true }
  } catch (e: any) {
    return { error: e.message }
  }
}

export async function deleteRecetteAction(id: string) {
  try {
    const ctx = await getCompanyId()
    if (!ctx) return { error: 'Non autorisé' }
    const { supabase } = ctx

    const { error } = await (supabase.from('revenues') as any).delete().eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/dashboard/recettes')
    return { success: true }
  } catch (e: any) {
    return { error: e.message }
  }
}
