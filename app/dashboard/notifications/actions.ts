'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function markNotificationReadAction(id: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Non autorisé' }

    const { data: userData } = (await supabase.from('users').select('company_id').eq('id', user.id).single()) as any

    const { error } = await (supabase
      .from('notifications') as any)
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
      .eq('company_id', userData?.company_id)

    if (error) return { success: false, error: error.message }
    
    revalidatePath('/dashboard/notifications')
    return { success: true }
  } catch (err) {
    return { success: false, error: 'Erreur inattendue' }
  }
}

export async function markAllNotificationsReadAction() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Non autorisé' }

    const { data: userData } = (await supabase.from('users').select('company_id').eq('id', user.id).single()) as any

    const { error } = await (supabase
      .from('notifications') as any)
      .update({ read_at: new Date().toISOString() })
      .is('read_at', null)
      .eq('company_id', userData?.company_id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard/notifications')
    return { success: true }
  } catch (err) {
    return { success: false, error: 'Erreur inattendue' }
  }
}

export async function deleteNotificationAction(id: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Non autorisé' }

    const { data: userData } = (await supabase.from('users').select('company_id').eq('id', user.id).single()) as any

    const { error } = await (supabase
      .from('notifications') as any)
      .delete()
      .eq('id', id)
      .eq('company_id', userData?.company_id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard/notifications')
    return { success: true }
  } catch (err) {
    return { success: false, error: 'Erreur inattendue' }
  }
}
