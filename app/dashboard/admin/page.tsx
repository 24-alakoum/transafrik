import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { buildAdminBillingHistory, buildAdminOverview, type AdminCompany, type AdminPaymentTransaction, type AdminSubscription, type AdminTrip, type AdminUser } from '@/lib/admin'
import { formatFCFA, formatDate } from '@/lib/utils'

export default async function AdminPage() {
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

  const [{ data: companiesData }, { data: usersData }, { data: subscriptionsData }, { data: tripsData }, { data: paymentTransactionsData }] = await Promise.all([
    supabase.from('companies').select('id, name, plan, created_at').order('created_at', { ascending: false }),
    supabase.from('users').select('id, company_id, full_name, role, is_active, created_at').order('created_at', { ascending: false }),
    supabase.from('subscriptions').select('company_id, plan, status, current_period_end').order('created_at', { ascending: false }),
    supabase.from('trips').select('company_id, revenue_fcfa').order('created_at', { ascending: false }),
    supabase.from('payment_transactions').select('company_id, provider, reference, amount, currency, status, plan, created_at').order('created_at', { ascending: false }),
  ])

  const companies = (companiesData ?? []) as AdminCompany[]
  const users = (usersData ?? []) as AdminUser[]
  const subscriptions = (subscriptionsData ?? []) as AdminSubscription[]
  const trips = (tripsData ?? []) as AdminTrip[]
  const paymentTransactions = (paymentTransactionsData ?? []) as AdminPaymentTransaction[]

  const overview = buildAdminOverview({ companies, users, subscriptions, trips })
  const billingHistory = buildAdminBillingHistory({ subscriptions, paymentTransactions })

  const companyMap = new Map(companies.map((company) => [company.id, company.name || 'Entreprise sans nom']))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-syne font-bold text-text-primary">Administration globale</h1>
        <p className="text-text-secondary mt-1">Vue multi-entreprises : utilisateurs, abonnements et chiffre d’affaires.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border-base bg-bg-card p-5">
          <p className="text-sm text-text-secondary">Entreprises</p>
          <p className="mt-2 text-3xl font-syne font-bold text-text-primary">{overview.totalCompanies}</p>
        </div>
        <div className="rounded-2xl border border-border-base bg-bg-card p-5">
          <p className="text-sm text-text-secondary">Utilisateurs</p>
          <p className="mt-2 text-3xl font-syne font-bold text-text-primary">{overview.totalUsers}</p>
        </div>
        <div className="rounded-2xl border border-border-base bg-bg-card p-5">
          <p className="text-sm text-text-secondary">Abonnements actifs</p>
          <p className="mt-2 text-3xl font-syne font-bold text-text-primary">{overview.activeSubscriptions}</p>
        </div>
        <div className="rounded-2xl border border-border-base bg-bg-card p-5">
          <p className="text-sm text-text-secondary">Revenus totaux</p>
          <p className="mt-2 text-3xl font-syne font-bold text-accent">{formatFCFA(overview.totalRevenue)}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border-base bg-bg-card overflow-hidden">
        <div className="p-5 border-b border-border-base">
          <h2 className="text-lg font-syne font-semibold text-text-primary">Entreprises et activité</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-bg-surface text-text-secondary">
              <tr>
                <th className="px-4 py-3 text-left">Entreprise</th>
                <th className="px-4 py-3 text-left">Plan</th>
                <th className="px-4 py-3 text-left">Abonnement</th>
                <th className="px-4 py-3 text-left">Utilisateurs</th>
                <th className="px-4 py-3 text-left">Revenus</th>
                <th className="px-4 py-3 text-left">Créée le</th>
              </tr>
            </thead>
            <tbody>
              {overview.companies.map((company) => (
                <tr key={company.id} className="border-t border-border-base/60">
                  <td className="px-4 py-3 font-medium text-text-primary">{company.name}</td>
                  <td className="px-4 py-3">{company.plan}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-medium text-text-primary">{company.subscriptionPlan}</span>
                      <span className="text-xs text-text-secondary">{company.subscriptionStatus}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{company.activeUsers}/{company.userCount}</td>
                  <td className="px-4 py-3">{formatFCFA(company.revenue)}</td>
                  <td className="px-4 py-3">{company.createdAt ? formatDate(company.createdAt) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-border-base bg-bg-card overflow-hidden">
        <div className="p-5 border-b border-border-base">
          <h2 className="text-lg font-syne font-semibold text-text-primary">Historique paiements et abonnements</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-bg-surface text-text-secondary">
              <tr>
                <th className="px-4 py-3 text-left">Entreprise</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Référence</th>
                <th className="px-4 py-3 text-left">Plan</th>
                <th className="px-4 py-3 text-left">Montant</th>
                <th className="px-4 py-3 text-left">Statut</th>
              </tr>
            </thead>
            <tbody>
              {billingHistory.map((entry) => (
                <tr key={entry.id} className="border-t border-border-base/60">
                  <td className="px-4 py-3 font-medium text-text-primary">{companyMap.get(entry.companyId) || '—'}</td>
                  <td className="px-4 py-3">{entry.kind === 'payment' ? 'Paiement' : 'Abonnement'}</td>
                  <td className="px-4 py-3">{entry.reference || '—'}</td>
                  <td className="px-4 py-3">{entry.plan || '—'}</td>
                  <td className="px-4 py-3">{entry.amount ? formatFCFA(entry.amount) : '—'}</td>
                  <td className="px-4 py-3">{entry.status || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border-base bg-bg-card overflow-hidden">
          <div className="p-5 border-b border-border-base">
            <h2 className="text-lg font-syne font-semibold text-text-primary">Utilisateurs par entreprise</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-bg-surface text-text-secondary">
                <tr>
                  <th className="px-4 py-3 text-left">Utilisateur</th>
                  <th className="px-4 py-3 text-left">Entreprise</th>
                  <th className="px-4 py-3 text-left">Rôle</th>
                  <th className="px-4 py-3 text-left">Statut</th>
                </tr>
              </thead>
              <tbody>
                {users.map((userProfile) => (
                  <tr key={userProfile.id || `${userProfile.company_id}-${userProfile.role}`} className="border-t border-border-base/60">
                    <td className="px-4 py-3 font-medium text-text-primary">{userProfile.full_name || 'Utilisateur'}</td>
                    <td className="px-4 py-3">{companyMap.get(userProfile.company_id) || '—'}</td>
                    <td className="px-4 py-3">{userProfile.role || '—'}</td>
                    <td className="px-4 py-3">{userProfile.is_active === false ? 'Inactif' : 'Actif'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-border-base bg-bg-card overflow-hidden">
          <div className="p-5 border-b border-border-base">
            <h2 className="text-lg font-syne font-semibold text-text-primary">Abonnements</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-bg-surface text-text-secondary">
                <tr>
                  <th className="px-4 py-3 text-left">Entreprise</th>
                  <th className="px-4 py-3 text-left">Plan</th>
                  <th className="px-4 py-3 text-left">Statut</th>
                  <th className="px-4 py-3 text-left">Fin</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((subscription, index) => (
                  <tr key={`${subscription.company_id}-${index}`} className="border-t border-border-base/60">
                    <td className="px-4 py-3 font-medium text-text-primary">{companyMap.get(subscription.company_id) || '—'}</td>
                    <td className="px-4 py-3">{subscription.plan || '—'}</td>
                    <td className="px-4 py-3">{subscription.status || '—'}</td>
                    <td className="px-4 py-3">{subscription.current_period_end ? formatDate(subscription.current_period_end) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
