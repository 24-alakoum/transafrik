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

    const dataToInsert = { ...formData, company_id }
    
    // Convertir les chaînes vides en null
    if (!dataToInsert.client_id) delete dataToInsert.client_id
    if (!dataToInsert.trip_id) delete dataToInsert.trip_id

    const { error } = await (supabase.from('revenues') as any)
      .insert(dataToInsert)

    if (error) {
      if (error.code === '42P01') {
        return { error: "La table revenues n'existe pas dans la base de données Supabase. Veuillez l'ajouter." }
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
