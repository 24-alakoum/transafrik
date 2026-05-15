import { createClient } from '@/lib/supabase/server'
import { formatFCFA, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Search, Send, CheckCircle2 } from 'lucide-react'

export default async function RecettesPage() {
  const supabase = await createClient()

  // Récupérer les paiements enregistrés
  const { data: payments } = await supabase
    .from('payments')
    .select('*, delivery_notes(reference, clients(name))')
    .order('date', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-syne font-bold text-text-primary">Recettes & Paiements</h1>
          <p className="text-text-secondary mt-1">Gérez les encaissements et les relances clients.</p>
        </div>
        <Button>
          Enregistrer un paiement
        </Button>
      </div>

      <div className="bg-bg-card rounded-2xl border border-border-base shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border-base flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input 
              type="text" 
              placeholder="Rechercher un paiement..." 
              className="w-full bg-bg-surface border border-border-base rounded-lg pl-10 pr-4 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-bg-surface text-text-secondary font-medium border-b border-border-base">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Bon de livraison</th>
                <th className="px-6 py-4">Méthode</th>
                <th className="px-6 py-4">Montant</th>
                <th className="px-6 py-4">Référence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base">
              {!payments?.length ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-text-muted">Aucun paiement enregistré.</td></tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-bg-raised/50">
                    <td className="px-6 py-4 text-text-secondary">{formatDate(payment.date)}</td>
                    <td className="px-6 py-4 font-medium text-text-primary">
                      {payment.delivery_notes?.clients?.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-text-secondary">
                      {payment.delivery_notes?.reference || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="default" className="text-xs capitalize">
                        {payment.method.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 font-bold text-success">
                      +{formatFCFA(payment.amount_fcfa)}
                    </td>
                    <td className="px-6 py-4 text-text-secondary">
                      {payment.reference || '-'}
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
