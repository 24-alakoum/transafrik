import { createClient } from '@/lib/supabase/server'
import { formatFCFA, formatDate } from '@/lib/utils'
import { ROLES } from '@/lib/constants'
import { Plus, UserX, Shield, Mail } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export default async function EquipePage() {
  const supabase = await createClient()

  const { data: members } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-syne font-bold text-text-primary">Équipe</h1>
          <p className="text-text-secondary mt-1">Gérez les accès et les rôles de vos collaborateurs.</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" /> Inviter un membre
        </Button>
      </div>

      <div className="bg-bg-card rounded-2xl border border-border-base shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-bg-surface text-text-secondary font-medium border-b border-border-base">
              <tr>
                <th className="px-6 py-4">Membre</th>
                <th className="px-6 py-4">Rôle</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4">Dernière connexion</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base">
              {!members?.length ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-text-muted">Aucun membre trouvé.</td></tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className={`hover:bg-bg-raised/50 ${!member.is_active ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold">
                          {member.full_name?.charAt(0) || <Mail className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">{member.full_name || 'En attente...'}</p>
                          <p className="text-xs text-text-secondary">{member.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        {member.role === 'owner' && <Shield className="w-3.5 h-3.5 text-warning" />}
                        <span className="capitalize font-medium text-text-primary">{member.role}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={member.is_active ? 'success' : 'danger'} className="text-xs">
                        {member.is_active ? 'Actif' : 'Désactivé'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-text-secondary">
                      {member.last_login_at ? formatDate(member.last_login_at) : 'Jamais'}
                    </td>
                    <td className="px-6 py-4">
                      {member.is_active && member.role !== 'owner' && (
                        <Button variant="ghost" size="sm" className="text-danger hover:bg-danger/10">
                          <UserX className="w-4 h-4 mr-1" /> Suspendre
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
