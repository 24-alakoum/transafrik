'use server'

import { createClient } from '@/lib/supabase/server'

export type NotificationPreferences = {
  maintenance_enabled: boolean
  alerts_enabled: boolean
  reports_enabled: boolean
}

const defaults: NotificationPreferences = { maintenance_enabled: true, alerts_enabled: true, reports_enabled: true }

export async function getNotificationPreferencesAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non autorisé' }
  const { data: userData } = await (supabase.from('users') as any).select('company_id').eq('id', user.id).single()
  if (!userData?.company_id) return { success: false, error: 'Entreprise introuvable' }
  const { data, error } = await (supabase.from('notification_preferences') as any).select('maintenance_enabled, alerts_enabled, reports_enabled').eq('company_id', userData.company_id).maybeSingle()
  if (error) return { success: false, error: error.message }
  return { success: true, preferences: { ...defaults, ...data } as NotificationPreferences }
}

export async function saveNotificationPreferencesAction(preferences: NotificationPreferences) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non autorisé' }
  const { data: userData } = await (supabase.from('users') as any).select('company_id').eq('id', user.id).single()
  if (!userData?.company_id) return { success: false, error: 'Entreprise introuvable' }
  const { error } = await (supabase.from('notification_preferences') as any).upsert({ company_id: userData.company_id, ...preferences, updated_at: new Date().toISOString() })
  if (error) return { success: false, error: error.message }
  return { success: true }
}
