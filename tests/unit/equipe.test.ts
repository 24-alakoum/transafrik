import { vi, describe, it, expect, beforeEach } from 'vitest'
import {
  inviteUserAction,
  updateUserRoleAction,
  deactivateUserAction,
  activateUserAction
} from '../../app/dashboard/equipe/actions'

// Mock Supabase Server client
const mockSupabaseServer = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
}

// Mock Supabase Admin client
const mockSupabaseAdmin = {
  auth: {
    admin: {
      generateLink: vi.fn(),
    },
  },
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabaseServer)),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => mockSupabaseAdmin),
}))

vi.mock('@/lib/audit', () => ({
  logAudit: vi.fn(() => Promise.resolve()),
}))

vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn(() => Promise.resolve()),
}))

describe('Equipe Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
      
      const mockSingle = vi.fn().mockResolvedValueOnce({ data: { company_id: 'comp-1', role: 'viewer' } })
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
      mockSupabaseServer.from.mockReturnValueOnce({ select: mockSelect })

      const res = await inviteUserAction('test@example.com', 'admin')
      expect(res.success).toBe(false)
      expect(res.error).toBe('Droits insuffisants')
    })

    it('generates link and sends email if authorized', async () => {
      mockSupabaseServer.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'owner-id' } } })
      
      const mockSingle = vi.fn().mockResolvedValueOnce({ data: { company_id: 'comp-1', role: 'owner' } })
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
      mockSupabaseServer.from.mockReturnValueOnce({ select: mockSelect })

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
  })

  describe('updateUserRoleAction', () => {
    it('updates role if user is owner', async () => {
      mockSupabaseServer.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'owner-id' } } })
      
      const mockSingle = vi.fn().mockResolvedValueOnce({ data: { company_id: 'comp-1', role: 'owner' } })
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
      mockSupabaseServer.from.mockReturnValueOnce({ select: mockSelect })

      const mockEqUpdate = vi.fn().mockResolvedValueOnce({ error: null })
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEqUpdate })
      mockSupabaseServer.from.mockReturnValueOnce({ update: mockUpdate })

      const res = await updateUserRoleAction('member-id', 'admin')
      expect(res.success).toBe(true)
    })

    it('rejects role update if user is not owner', async () => {
      mockSupabaseServer.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'admin-id' } } })
      
      const mockSingle = vi.fn().mockResolvedValueOnce({ data: { company_id: 'comp-1', role: 'admin' } })
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
      mockSupabaseServer.from.mockReturnValueOnce({ select: mockSelect })

      const res = await updateUserRoleAction('member-id', 'viewer')
      expect(res.success).toBe(false)
      expect(res.error).toBe('Seul le propriétaire peut changer les rôles')
    })
  })

  describe('deactivateUserAction', () => {
    it('deactivates user if admin or owner', async () => {
      mockSupabaseServer.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'admin-id' } } })
      
      const mockSingle = vi.fn().mockResolvedValueOnce({ data: { company_id: 'comp-1', role: 'admin' } })
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
      mockSupabaseServer.from.mockReturnValueOnce({ select: mockSelect })

      const mockEqUpdate = vi.fn().mockResolvedValueOnce({ error: null })
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEqUpdate })
      mockSupabaseServer.from.mockReturnValueOnce({ update: mockUpdate })

      const res = await deactivateUserAction('member-id')
      expect(res.success).toBe(true)
    })
  })

  describe('activateUserAction', () => {
    it('activates user if admin or owner', async () => {
      mockSupabaseServer.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'admin-id' } } })
      
      const mockSingle = vi.fn().mockResolvedValueOnce({ data: { company_id: 'comp-1', role: 'admin' } })
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
      mockSupabaseServer.from.mockReturnValueOnce({ select: mockSelect })

      const mockEqUpdate = vi.fn().mockResolvedValueOnce({ error: null })
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEqUpdate })
      mockSupabaseServer.from.mockReturnValueOnce({ update: mockUpdate })

      const res = await activateUserAction('member-id')
      expect(res.success).toBe(true)
    })
  })
})
