'use client'

import * as React from 'react'
import { Plus, UserX, UserCheck, Shield, Mail, Search, Edit2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { USER_ROLES, type UserRole } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import {
  inviteUserAction,
  updateUserRoleAction,
  deactivateUserAction,
  activateUserAction
} from './actions'

export interface Member {
  id: string
  company_id: string
  full_name: string
  email: string
  role: UserRole
  is_active: boolean
  last_login_at: string | null
  created_at: string
}

interface EquipeClientProps {
  initialMembers: Member[]
  currentUserId: string
  currentUserRole: UserRole
}

export default function EquipeClient({ initialMembers, currentUserId, currentUserRole }: EquipeClientProps) {
  const [members, setMembers] = React.useState<Member[]>(initialMembers)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [isInviteOpen, setIsInviteOpen] = React.useState(false)
  
  // Invite form state
  const [inviteEmail, setInviteEmail] = React.useState('')
  const [inviteRole, setInviteRole] = React.useState<UserRole>('viewer')
  const [isInviting, setIsInviting] = React.useState(false)

  // Role editing state
  const [editingMemberId, setEditingMemberId] = React.useState<string | null>(null)
  const [selectedRole, setSelectedRole] = React.useState<UserRole>('viewer')
  const [isUpdatingRole, setIsUpdatingRole] = React.useState(false)

  // Action status loading state
  const [loadingMemberId, setLoadingMemberId] = React.useState<string | null>(null)

  const canManageUsers = currentUserRole === 'owner' || currentUserRole === 'admin'
  const isOwner = currentUserRole === 'owner'

  // Filter members
  const filteredMembers = React.useMemo(() => {
    return members.filter((member) => {
      const nameMatch = member.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      const emailMatch = member.email?.toLowerCase().includes(searchQuery.toLowerCase())
      const roleMatch = USER_ROLES[member.role]?.label.toLowerCase().includes(searchQuery.toLowerCase())
      return nameMatch || emailMatch || roleMatch
    })
  }, [members, searchQuery])

  // Handle Invite Submit
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail) {
      toast.error('Veuillez saisir une adresse email valide.')
      return
    }

    setIsInviting(true)
    try {
      const res = await inviteUserAction(inviteEmail, inviteRole)
      if (res.success) {
        toast.success(`Invitation envoyée avec succès à ${inviteEmail}`)
        setIsInviteOpen(false)
        setInviteEmail('')
        setInviteRole('viewer')
        // Optionnel: Re-fetch ou ajouter un membre fictif en attente
        // Puisque l'utilisateur n'est pas encore créé dans public.users (en attente d'inscription),
        // il apparaîtra dès qu'il aura accepté l'invitation.
      } else {
        toast.error(res.error || "Erreur lors de l'invitation")
      }
    } catch (err) {
      toast.error("Une erreur inattendue est survenue")
    } finally {
      setIsInviting(false)
    }
  }

  // Handle Role Change
  const handleRoleChange = async (memberId: string, role: UserRole) => {
    setIsUpdatingRole(true)
    try {
      const res = await updateUserRoleAction(memberId, role)
      if (res.success) {
        setMembers((prev) =>
          prev.map((m) => (m.id === memberId ? { ...m, role } : m))
        )
        toast.success('Rôle mis à jour avec succès')
        setEditingMemberId(null)
      } else {
        toast.error(res.error || 'Erreur lors de la mise à jour du rôle')
      }
    } catch (err) {
      toast.error("Erreur de communication avec le serveur")
    } finally {
      setIsUpdatingRole(false)
    }
  }

  // Handle Suspend/Activate Toggle
  const handleStatusToggle = async (member: Member) => {
    setLoadingMemberId(member.id)
    try {
      if (member.is_active) {
        const res = await deactivateUserAction(member.id)
        if (res.success) {
          setMembers((prev) =>
            prev.map((m) => (m.id === member.id ? { ...m, is_active: false } : m))
          )
          toast.success(`${member.full_name || 'Utilisateur'} suspendu avec succès`)
        } else {
          toast.error(res.error || 'Erreur lors de la désactivation')
        }
      } else {
        const res = await activateUserAction(member.id)
        if (res.success) {
          setMembers((prev) =>
            prev.map((m) => (m.id === member.id ? { ...m, is_active: true } : m))
          )
          toast.success(`${member.full_name || 'Utilisateur'} réactivé avec succès`)
        } else {
          toast.error(res.error || 'Erreur lors de la réactivation')
        }
      }
    } catch (err) {
      toast.error('Erreur lors du changement de statut')
    } finally {
      setLoadingMemberId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-syne font-bold text-text-primary">Équipe</h1>
          <p className="text-text-secondary mt-1">Gérez les accès et les rôles de vos collaborateurs.</p>
        </div>
        {canManageUsers && (
          <Button onClick={() => setIsInviteOpen(true)} className="shadow-lg hover:shadow-xl transition-all duration-200">
            <Plus className="w-4 h-4 mr-2" /> Inviter un membre
          </Button>
        )}
      </div>

      {/* Controls & Search bar */}
      <div className="flex items-center gap-3 bg-bg-card border border-border-base rounded-xl p-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Rechercher par nom, email ou rôle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-bg-surface border border-border-base rounded-lg focus:outline-none focus:border-accent transition-colors"
          />
        </div>
      </div>

      {/* Members table */}
      <div className="bg-bg-card rounded-2xl border border-border-base shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-bg-surface text-text-secondary font-medium border-b border-border-base">
              <tr>
                <th className="px-6 py-4">Membre</th>
                <th className="px-6 py-4">Rôle</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4">Dernière connexion</th>
                {canManageUsers && <th className="px-6 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-muted">
                    {searchQuery ? 'Aucun collaborateur ne correspond à votre recherche.' : 'Aucun membre trouvé.'}
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const isSelf = member.id === currentUserId
                  const isMemberOwner = member.role === 'owner'

                  return (
                    <tr
                      key={member.id}
                      className={`hover:bg-bg-raised/50 transition-colors duration-150 ${
                        !member.is_active ? 'opacity-60 bg-bg-base/30' : ''
                      }`}
                    >
                      {/* Name and Email */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold text-sm">
                            {member.full_name?.charAt(0).toUpperCase() || <Mail className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-medium text-text-primary">
                                {member.full_name || 'Invitation en attente...'}
                              </p>
                              {isSelf && (
                                <Badge variant="default" className="text-[10px] px-1.5 py-0">
                                  Vous
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-text-secondary">{member.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role selection/badge */}
                      <td className="px-6 py-4">
                        {editingMemberId === member.id ? (
                          <div className="flex items-center gap-2">
                            <select
                              value={selectedRole}
                              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                              disabled={isUpdatingRole}
                              className="px-2 py-1 text-xs border border-border-base rounded bg-bg-surface focus:outline-none focus:border-accent text-text-primary"
                            >
                              {Object.entries(USER_ROLES).map(([key, value]) => {
                                // Seul l'owner peut assigner le rôle d'owner
                                if (key === 'owner' && !isOwner) return null
                                return (
                                  <option key={key} value={key}>
                                    {value.label}
                                  </option>
                                )
                              })}
                            </select>
                            <Button
                              size="sm"
                              disabled={isUpdatingRole}
                              onClick={() => handleRoleChange(member.id, selectedRole)}
                            >
                              {isUpdatingRole ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                'Valider'
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={isUpdatingRole}
                              onClick={() => setEditingMemberId(null)}
                            >
                              Annuler
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5">
                              {isMemberOwner && <Shield className="w-3.5 h-3.5 text-warning" />}
                              <span className="font-medium text-text-primary">
                                {USER_ROLES[member.role]?.label || member.role}
                              </span>
                            </div>
                            {canManageUsers && !isSelf && !isMemberOwner && (
                              <button
                                onClick={() => {
                                  setEditingMemberId(member.id)
                                  setSelectedRole(member.role)
                                }}
                                className="text-text-muted hover:text-accent transition-colors"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <Badge variant={member.is_active ? 'success' : 'danger'} className="text-xs">
                          {member.is_active ? 'Actif' : 'Suspendu'}
                        </Badge>
                      </td>

                      {/* Last login date */}
                      <td className="px-6 py-4 text-text-secondary">
                        {member.last_login_at ? formatDate(member.last_login_at) : 'Jamais connecté'}
                      </td>

                      {/* Action buttons */}
                      {canManageUsers && (
                        <td className="px-6 py-4 text-right">
                          {!isSelf && !isMemberOwner && (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={loadingMemberId === member.id}
                              onClick={() => handleStatusToggle(member)}
                              className={
                                member.is_active
                                  ? 'text-danger hover:bg-danger/10 hover:text-danger'
                                  : 'text-success hover:bg-success/10 hover:text-success'
                              }
                            >
                              {loadingMemberId === member.id ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-1" />
                              ) : member.is_active ? (
                                <UserX className="w-4 h-4 mr-1" />
                              ) : (
                                <UserCheck className="w-4 h-4 mr-1" />
                              )}
                              {member.is_active ? 'Suspendre' : 'Activer'}
                            </Button>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      <Modal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} title="Inviter un collaborateur">
        <form onSubmit={handleInvite} className="space-y-4">
          <Input
            label="Adresse email"
            type="email"
            placeholder="collaborateur@entreprise.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
            disabled={isInviting}
          />
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text text-text-secondary font-medium">Rôle attribué</span>
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as UserRole)}
              disabled={isInviting}
              className="w-full px-3 py-2 border border-border-base rounded-lg bg-bg-surface text-text-primary focus:outline-none focus:border-accent"
            >
              {Object.entries(USER_ROLES).map(([key, value]) => {
                if (key === 'owner') return null // Ne pas pouvoir inviter un autre owner
                return (
                  <option key={key} value={key}>
                    {value.label}
                  </option>
                )
              })}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border-base">
            <Button variant="ghost" type="button" onClick={() => setIsInviteOpen(false)} disabled={isInviting}>
              Annuler
            </Button>
            <Button type="submit" disabled={isInviting}>
              {isInviting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Envoi...
                </>
              ) : (
                'Envoyer l\'invitation'
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
