import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatFCFA } from '@/lib/utils'

export default async function AdminCompaniesPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'owner' || profile?.role === 'admin'

  if (!isAdmin) {
    redirect('/dashboard')
  }

  const [{ data: companies }, { data: subscriptions }, { data: users }] = await Promise.all([
    supabase.from('companies').select('id, name, plan, created_at').order('created_at', { ascending: false }),
    supabase.from('subscriptions').select('company_id, plan, status, current_period_end').order('created_at', { ascending: false }),
    supabase.from('users').select('company_id, role, is_active').order('created_at', { ascending: false }),
  ])

  const companyRows = (companies ?? []).map((company: any) => {
    const companyUsers = (users ?? []).filter((item: any) => item.company_id === company.id)
    const companySubscription = (subscriptions ?? []).find((item: any) => item.company_id === company.id)
    return {
      id: company.id,
      name: company.name || 'Entreprise sans nom',
      plan: company.plan || 'trial',
      createdAt: company.created_at,
      userCount: companyUsers.length,
      activeUsers: companyUsers.filter((item: any) => item.is_active !== false).length,
      subscriptionPlan: companySubscription?.plan || company.plan || 'trial',
      subscriptionStatus: companySubscription?.status || 'none',
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-syne font-bold text-text-primary">Entreprises</h1>
          <p className="text-text-secondary mt-1">Liste de toutes les entreprises clientes.</p>
        </div>
        <Link href="/dashboard/admin" className="text-sm font-medium text-accent hover:underline">
          ← Retour à l’administration
        </Link>
      </div>

      <div className="rounded-2xl border border-border-base bg-bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-bg-surface text-text-secondary">
              <tr>
                <th className="px-4 py-3 text-left">Entreprise</th>
                <th className="px-4 py-3 text-left">Plan</th>
                <th className="px-4 py-3 text-left">Abonnement</th>
                <th className="px-4 py-3 text-left">Utilisateurs</th>
                <th className="px-4 py-3 text-left">Créée le</th>
                <th className="px-4 py-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {companyRows.map((company: { id: string; name: string; plan: string; subscriptionPlan: string; subscriptionStatus: string; createdAt: string | null; activeUsers: number; userCount: number }) => (
                <tr key={company.id} className="border-t border-border-base/60">
                  <td className="px-4 py-3 font-medium text-text-primary">{company.name}</td>
                  <td className="px-4 py-3">{company.plan}</td>
                  <td className="px-4 py-3">{company.subscriptionPlan} • {company.subscriptionStatus}</td>
                  <td className="px-4 py-3">{company.activeUsers}/{company.userCount}</td>
                  <td className="px-4 py-3">{company.createdAt ? formatDate(company.createdAt) : '—'}</td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/admin/entreprises/${company.id}`} className="text-accent hover:underline font-medium">
                      Voir détail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
