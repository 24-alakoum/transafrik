import { createClient } from '@/lib/supabase/server'
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

  // Fetch all members of the company (filtering is handled by Supabase RLS policies)
  const { data: members } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  const memberList = (members ?? []) as unknown as Member[]
  const currentUserId = authUser.id
  const currentUserRole = memberList.find((member) => member.id === currentUserId)?.role ?? 'viewer'

  return (
    <EquipeClient
      initialMembers={memberList}
      currentUserId={currentUserId}
      currentUserRole={currentUserRole}
    />
  )
}
