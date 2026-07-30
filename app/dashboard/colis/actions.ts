'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createColis(data: any) {
  const supabase = await createClient()

  // On récupère le user connecté
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Non autorisé' }
  }

  // On récupère la compagnie
  const { data: userData } = (await supabase
    .from('users')
    .select('company_id')
    .eq('id', user.id)
    .single()) as any

  if (!userData?.company_id) {
    return { error: "Compagnie non trouvée" }
  }

  const {
    recipient_name,
    recipient_phone,
    recipient_address,
    description,
    weight_kg,
    estimated_delivery,
    notes,
    reference,
    qr_code
  } = data

  const { error } = await supabase
    .from('packages')
    .insert({
      company_id: userData.company_id,
      reference,
      qr_code,
      recipient_name,
      recipient_phone,
      recipient_address,
      description,
      weight_kg: weight_kg ? parseFloat(weight_kg) : null,
      estimated_delivery: estimated_delivery || null,
      notes,
      created_by: user.id,
      status: 'pending'
    } as any)

  if (error) {
    console.error('Erreur lors de la création du colis:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/colis')
  return { success: true }
}
