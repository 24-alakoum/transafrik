'use server'

import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit'
import { camionSchema } from '@/lib/validations/camion'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function createCamionAction(formData: unknown) {
  try {
    const parsed = camionSchema.safeParse(formData)
    if (!parsed.success) return { success: false, error: parsed.error.flatten().fieldErrors }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: { _global: 'Non autorisé' } }

    const response = await supabase.from('users').select('company_id').eq('id', user.id).single()
    const userData = response.data as any

    const { data: camionData, error } = await supabase
      .from('trucks')
      .insert({ ...parsed.data, company_id: userData?.company_id } as any)
      .select('id')
      .single()
    const camion = camionData as any

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
      resourceId: camion.id,
    })

    revalidatePath('/dashboard/camions')
    return { success: true }
  } catch (err) {
    return { success: false, error: { _global: 'Erreur inattendue' } }
  }
}

export async function deleteCamionAction(id: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Non autorisé' }

    const response = await supabase.from('users').select('company_id').eq('id', user.id).single()
    const userData = response.data as any

    const { error } = await supabase
      .from('trucks')
      .delete()
      .eq('id', id)
      .eq('company_id', userData?.company_id)

    if (error) {
      return { success: false, error: error.message }
    }

    await logAudit({
      userId: user.id,
      companyId: userData?.company_id ?? '',
      action: 'DELETE_TRUCK',
      resource: 'trucks',
      resourceId: id,
    })

    revalidatePath('/dashboard/camions')
    return { success: true }
  } catch (err) {
    return { success: false, error: 'Erreur inattendue' }
  }
}

export async function updateCamionAction(id: string, formData: unknown) {
  try {
    const parsed = camionSchema.safeParse(formData)
    if (!parsed.success) return { success: false, error: parsed.error.flatten().fieldErrors }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: { _global: 'Non autorisé' } }

    const response = await supabase.from('users').select('company_id').eq('id', user.id).single()
    const userData = response.data as any

    const { error } = await (supabase.from('trucks') as any)
      .update(parsed.data)
      .eq('id', id)
      .eq('company_id', userData?.company_id)

    if (error) {
      if (error.code === '23505') { // Unique constraint
        return { success: false, error: { plate: ['Cette plaque existe déjà'] } }
      }
      return { success: false, error: { _global: error.message } }
    }

    await logAudit({
      userId: user.id,
      companyId: userData?.company_id ?? '',
      action: 'UPDATE_TRUCK',
      resource: 'trucks',
      resourceId: id,
    })

    revalidatePath('/dashboard/camions')
    return { success: true }
  } catch (err) {
    return { success: false, error: { _global: 'Erreur inattendue' } }
  }
}
