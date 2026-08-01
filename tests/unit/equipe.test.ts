import { vi, describe, it, expect, beforeEach } from 'vitest'
import {
  inviteUserAction,
  updateUserRoleAction,
  deactivateUserAction,
  activateUserAction,
} from '../../app/dashboard/equipe/actions'

const { mockSupabaseServer, mockSupabaseAdmin, mockCreateClient, mockCreateAdminClient } = vi.hoisted(() => {
  const mockSupabaseServer = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  }

  const mockSupabaseAdmin = {
    auth: {
      admin: {
        generateLink: vi.fn(),
      },
    },
  }

  return {
    mockSupabaseServer,
    mockSupabaseAdmin,
    mockCreateClient: vi.fn(async () => mockSupabaseServer),
    mockCreateAdminClient: vi.fn(() => mockSupabaseAdmin),
  }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: mockCreateAdminClient,
}))

vi.mock('@/lib/audit', () => ({
  logAudit: vi.fn(() => Promise.resolve()),
}))

vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn(() => Promise.resolve()),
}))

function setupSupabaseChain(profile: any, updateResult: { error: null } | { error: Error } = { error: null }) {
  const single = vi.fn().mockResolvedValueOnce({ data: profile })
  const select = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({ single }),
  })
  const update = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValueOnce(updateResult),
  })

  mockSupabaseServer.from.mockImplementation(() => ({ select, update }))
  return { select, update, single }
}

describe('Equipe Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseServer.auth.getUser.mockReset()
    mockSupabaseServer.from.mockReset()
    mockSupabaseAdmin.auth.admin.generateLink.mockReset()
    mockCreateClient.mockImplementation(async () => mockSupabaseServer)
    mockCreateAdminClient.mockImplementation(() => mockSupabaseAdmin)
  })

  describe('inviteUserAction', () => {
    it('returns error if user is not authenticated', async () => {
      mockSupabaseServer.auth.getUser.mockResolvedValueOnce({ data: { user: null } })

      const res = await inviteUserAction('test@example.com', 'admin')
      expect(res.success).toBe(false)
      expect(res.error).toBe('Non autorisé')
    })

    it('returns error if current user is not owner or admin', async () => {
      mockSupabaseServer.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-id' } } })
      setupSupabaseChain({ company_id: 'comp-1', role: 'viewer' })

      const res = await inviteUserAction('test@example.com', 'admin')
      expect(res.success).toBe(false)
      expect(res.error).toBe('Droits insuffisants')
    })

    it('generates link and sends email if authorized', async () => {
      mockSupabaseServer.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'owner-id' } } })
      setupSupabaseChain({ company_id: 'comp-1', role: 'owner' })

      mockSupabaseAdmin.auth.admin.generateLink.mockResolvedValueOnce({
        data: { properties: { action_link: 'http://invite-link' } },
        error: null,
      })

      const res = await inviteUserAction('test@example.com', 'admin')
      expect(res.success).toBe(true)
      expect(mockSupabaseAdmin.auth.admin.generateLink).toHaveBeenCalledWith({
        type: 'invite',
        email: 'test@example.com',
        options: {
          data: {
            company_id: 'comp-1',
            role: 'admin',
          },
        },
      })
    })

    it('rejects unsupported roles', async () => {
      mockSupabaseServer.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'owner-id' } } })
      setupSupabaseChain({ company_id: 'comp-1', role: 'owner' })

      const res = await inviteUserAction('test@example.com', 'superadmin')
      expect(res.success).toBe(false)
      expect(res.error).toBe('Rôle non pris en charge')
      expect(mockSupabaseAdmin.auth.admin.generateLink).not.toHaveBeenCalled()
    })
  })

  describe('updateUserRoleAction', () => {
    it('updates role if user is owner', async () => {
      mockSupabaseServer.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'owner-id' } } })
      setupSupabaseChain({ company_id: 'comp-1', role: 'owner' })

      const res = await updateUserRoleAction('member-id', 'admin')
      expect(res.success).toBe(true)
    })

    it('rejects role update if user is not owner', async () => {
      mockSupabaseServer.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'admin-id' } } })
      setupSupabaseChain({ company_id: 'comp-1', role: 'admin' })

      const res = await updateUserRoleAction('member-id', 'viewer')
      expect(res.success).toBe(false)
      expect(res.error).toBe('Seul le propriétaire peut changer les rôles')
    })
  })

  describe('deactivateUserAction', () => {
    it('deactivates user if admin or owner', async () => {
      mockSupabaseServer.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'admin-id' } } })
      setupSupabaseChain({ company_id: 'comp-1', role: 'admin' })

      const res = await deactivateUserAction('member-id')
      expect(res.success).toBe(true)
    })
  })

  describe('activateUserAction', () => {
    it('activates user if admin or owner', async () => {
      mockSupabaseServer.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'admin-id' } } })
      setupSupabaseChain({ company_id: 'comp-1', role: 'admin' })

      const res = await activateUserAction('member-id')
      expect(res.success).toBe(true)
    })
  })
})
