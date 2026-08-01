import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/lib/constants'
import EquipeClient, { type Member } from './EquipeClient'

export default async function EquipePage() {
  const supabase = await createClient()

  // Get current authenticated user
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-text-secondary">Veuillez vous connecter pour accéder à cette page.</p>
      </div>
    )
  }

  const { data: currentProfile } = await supabase
    .from('users')
    .select('company_id, role')
    .eq('id', authUser.id)
    .single()

  const companyId = currentProfile?.company_id

  let membersQuery = supabase.from('users').select('*')
  if (companyId) {
    membersQuery = membersQuery.eq('company_id', companyId)
  }

  const { data: members } = await membersQuery.order('created_at', { ascending: false })

  const memberList = (members ?? []) as unknown as Member[]
  const currentUserId = authUser.id
  const currentUserRole = (currentProfile?.role as UserRole | undefined) ?? 'viewer'

  return (
    <EquipeClient
      initialMembers={memberList}
      currentUserId={currentUserId}
      currentUserRole={currentUserRole}
    />
  )
}
