'use server'

import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit'
import { clientSchema } from '@/lib/validations/client'

export async function createClientAction(formData: unknown) {
  try {
    const parsed = clientSchema.safeParse(formData)
    if (!parsed.success) return { success: false, error: parsed.error.flatten().fieldErrors }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: { _global: 'Non autorisé' } }

    const { data: userData } = (await supabase.from('users').select('company_id').eq('id', user.id).single()) as any

    const { data: clientData, error } = (await supabase
      .from('clients')
      .insert({ ...parsed.data, company_id: userData?.company_id } as any)
      .select('id')
      .single()) as any

    if (error) {
      if (error.code === '23505') { // Unique constraint
        return { success: false, error: { name: ['Ce client existe déjà'] } }
      }
      return { success: false, error: { _global: error.message } }
    }

    await logAudit({
      userId: user.id,
      companyId: userData?.company_id ?? '',
      action: 'CREATE_CLIENT',
      resource: 'clients',
      resourceId: clientData?.id,
    })

    return { success: true }
  } catch (err) {
    return { success: false, error: { _global: 'Erreur inattendue' } }
  }
}

export async function updateClientAction(clientId: string, formData: unknown) {
  try {
    const parsed = clientSchema.safeParse(formData)
    if (!parsed.success) return { success: false, error: parsed.error.flatten().fieldErrors }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: { _global: 'Non autorisé' } }

    const { data: userData } = (await supabase.from('users').select('company_id').eq('id', user.id).single()) as any

    const { error } = await (supabase
      .from('clients') as any)
      .update(parsed.data)
      .eq('id', clientId)
      .eq('company_id', userData?.company_id)

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: { name: ['Ce client existe déjà'] } }
      }
      return { success: false, error: { _global: error.message } }
    }

    await logAudit({
      userId: user.id,
      companyId: userData?.company_id ?? '',
      action: 'UPDATE_CLIENT',
      resource: 'clients',
      resourceId: clientId,
    })

    return { success: true }
  } catch (err) {
    return { success: false, error: { _global: 'Erreur inattendue' } }
  }
}
