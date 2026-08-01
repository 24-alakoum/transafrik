import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { buildAdminBillingHistory, type AdminPaymentTransaction, type AdminSubscription } from '@/lib/admin'
import { formatDate, formatFCFA } from '@/lib/utils'

export default async function AdminCompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
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

  const [{ data: company }, { data: users }, { data: subscriptions }, { data: trips }, { data: paymentTransactions }] = await Promise.all([
    supabase.from('companies').select('id, name, plan, created_at').eq('id', id).single(),
    supabase.from('users').select('id, full_name, role, is_active, created_at').eq('company_id', id).order('created_at', { ascending: false }),
    supabase.from('subscriptions').select('plan, status, current_period_end').eq('company_id', id).order('created_at', { ascending: false }),
    supabase.from('trips').select('revenue_fcfa, reference, destination, status').eq('company_id', id).order('created_at', { ascending: false }),
    supabase.from('payment_transactions').select('provider, reference, amount, currency, status, plan, created_at').eq('company_id', id).order('created_at', { ascending: false }),
  ])

  const companyName = company?.name || 'Entreprise sans nom'
  const subscription = (subscriptions ?? [])[0]
  const totalRevenue = (trips ?? []).reduce((sum: number, trip: any) => sum + Number(trip.revenue_fcfa || 0), 0)
  const billingHistory = buildAdminBillingHistory({
    subscriptions: (subscriptions ?? []) as AdminSubscription[],
    paymentTransactions: (paymentTransactions ?? []) as AdminPaymentTransaction[],
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-syne font-bold text-text-primary">{companyName}</h1>
          <p className="text-text-secondary mt-1">Détails d’une entreprise cliente.</p>
        </div>
        <Link href="/dashboard/admin/entreprises" className="text-sm font-medium text-accent hover:underline">
          ← Retour aux entreprises
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border-base bg-bg-card p-5">
          <p className="text-sm text-text-secondary">Plan</p>
          <p className="mt-2 text-2xl font-syne font-bold text-text-primary">{company?.plan || 'trial'}</p>
        </div>
        <div className="rounded-2xl border border-border-base bg-bg-card p-5">
          <p className="text-sm text-text-secondary">Utilisateurs</p>
          <p className="mt-2 text-2xl font-syne font-bold text-text-primary">{(users ?? []).length}</p>
        </div>
        <div className="rounded-2xl border border-border-base bg-bg-card p-5">
          <p className="text-sm text-text-secondary">Revenus</p>
          <p className="mt-2 text-2xl font-syne font-bold text-accent">{formatFCFA(totalRevenue)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border-base bg-bg-card overflow-hidden">
          <div className="p-5 border-b border-border-base">
            <h2 className="text-lg font-syne font-semibold text-text-primary">Abonnement</h2>
          </div>
          <div className="p-5 space-y-2 text-sm">
            <p><span className="text-text-secondary">Plan :</span> {subscription?.plan || company?.plan || 'trial'}</p>
            <p><span className="text-text-secondary">Statut :</span> {subscription?.status || 'none'}</p>
            <p><span className="text-text-secondary">Fin de période :</span> {subscription?.current_period_end ? formatDate(subscription.current_period_end) : '—'}</p>
            <p><span className="text-text-secondary">Créée le :</span> {company?.created_at ? formatDate(company.created_at) : '—'}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border-base bg-bg-card overflow-hidden">
          <div className="p-5 border-b border-border-base">
            <h2 className="text-lg font-syne font-semibold text-text-primary">Utilisateurs</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-bg-surface text-text-secondary">
                <tr>
                  <th className="px-4 py-3 text-left">Nom</th>
                  <th className="px-4 py-3 text-left">Rôle</th>
                  <th className="px-4 py-3 text-left">Statut</th>
                </tr>
              </thead>
              <tbody>
                {(users ?? []).map((userProfile: any) => (
                  <tr key={userProfile.id} className="border-t border-border-base/60">
                    <td className="px-4 py-3 font-medium text-text-primary">{userProfile.full_name || 'Utilisateur'}</td>
                    <td className="px-4 py-3">{userProfile.role || '—'}</td>
                    <td className="px-4 py-3">{userProfile.is_active === false ? 'Inactif' : 'Actif'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border-base bg-bg-card overflow-hidden">
        <div className="p-5 border-b border-border-base">
          <h2 className="text-lg font-syne font-semibold text-text-primary">Historique de paiement et d’abonnement</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-bg-surface text-text-secondary">
              <tr>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Référence</th>
                <th className="px-4 py-3 text-left">Plan</th>
                <th className="px-4 py-3 text-left">Montant</th>
                <th className="px-4 py-3 text-left">Statut</th>
                <th className="px-4 py-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {billingHistory.map((entry) => (
                <tr key={entry.id} className="border-t border-border-base/60">
                  <td className="px-4 py-3">{entry.kind === 'payment' ? 'Paiement' : 'Abonnement'}</td>
                  <td className="px-4 py-3">{entry.reference || '—'}</td>
                  <td className="px-4 py-3">{entry.plan || '—'}</td>
                  <td className="px-4 py-3">{entry.amount ? formatFCFA(entry.amount) : '—'}</td>
                  <td className="px-4 py-3">{entry.status || '—'}</td>
                  <td className="px-4 py-3">{entry.createdAt ? formatDate(entry.createdAt) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-border-base bg-bg-card overflow-hidden">
        <div className="p-5 border-b border-border-base">
          <h2 className="text-lg font-syne font-semibold text-text-primary">Voyages / revenus</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-bg-surface text-text-secondary">
              <tr>
                <th className="px-4 py-3 text-left">Référence</th>
                <th className="px-4 py-3 text-left">Destination</th>
                <th className="px-4 py-3 text-left">Statut</th>
                <th className="px-4 py-3 text-left">Revenu</th>
              </tr>
            </thead>
            <tbody>
              {(trips ?? []).map((trip: any) => (
                <tr key={trip.reference} className="border-t border-border-base/60">
                  <td className="px-4 py-3 font-medium text-text-primary">{trip.reference || '—'}</td>
                  <td className="px-4 py-3">{trip.destination || '—'}</td>
                  <td className="px-4 py-3">{trip.status || '—'}</td>
                  <td className="px-4 py-3">{formatFCFA(Number(trip.revenue_fcfa || 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
