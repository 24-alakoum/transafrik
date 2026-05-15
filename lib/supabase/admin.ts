import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * Client Supabase Admin — SERVICE ROLE KEY.
 * ⚠️ SERVEUR UNIQUEMENT — jamais importé côté client.
 * Bypass RLS — utiliser uniquement pour les opérations d'admin.
 */
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined')
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
