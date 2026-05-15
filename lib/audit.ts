import { createClient } from '@/lib/supabase/server'

interface AuditLogParams {
  userId: string
  companyId: string
  action: string
  resource: string
  resourceId?: string
  oldData?: Record<string, unknown>
  newData?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

/**
 * Enregistre une action dans la table audit_logs.
 * Appelé depuis les Server Actions et les Route Handlers.
 * Ne lève jamais d'exception — les erreurs d'audit ne doivent pas bloquer l'action principale.
 */
export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    const supabase = await createClient()
    await supabase.from('audit_logs').insert({
      user_id: params.userId,
      company_id: params.companyId,
      action: params.action,
      resource: params.resource,
      resource_id: params.resourceId ?? null,
      old_data: params.oldData ?? null,
      new_data: params.newData ?? null,
      ip_address: params.ipAddress ?? null,
      user_agent: params.userAgent ?? null,
    })
  } catch (error) {
    // L'audit ne doit jamais bloquer le flux principal
    console.error('[logAudit] Failed to write audit log:', error)
  }
}

// ── Actions standards ────────────────────────────────
export const AUDIT_ACTIONS = {
  // Auth
  REGISTER: 'REGISTER',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  FAILED_LOGIN: 'FAILED_LOGIN',
  PASSWORD_RESET: 'PASSWORD_RESET',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  // CRUD
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  // Utilisateurs & équipe
  INVITE_USER: 'INVITE_USER',
  CHANGE_ROLE: 'CHANGE_ROLE',
  DEACTIVATE_USER: 'DEACTIVATE_USER',
  // Documents
  GENERATE_PDF: 'GENERATE_PDF',
  SEND_EMAIL: 'SEND_EMAIL',
  // RGPD
  EXPORT_DATA: 'EXPORT_DATA',
  REQUEST_DELETION: 'REQUEST_DELETION',
  CONSENT_GIVEN: 'CONSENT_GIVEN',
  CONSENT_WITHDRAWN: 'CONSENT_WITHDRAWN',
} as const

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS]
