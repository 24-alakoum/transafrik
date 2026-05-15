import { createClient } from '@/lib/supabase/server'
import { formatFCFA, formatDate } from '@/lib/utils'
import { BON_STATUSES } from '@/lib/constants'
import { Plus, Search, FileText } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'

export default async function BonsLivraisonPage() {
  const supabase = await createClient()

  const { data: bons } = await supabase
    .from('delivery_notes')
    .select('*, trips(reference, clients(name))')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-syne font-bold text-text-primary">Bons de livraison</h1>
          <p className="text-text-secondary mt-1">Générez et envoyez vos factures et bons de livraison.</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" /> Créer un bon
        </Button>
      </div>

      <div className="bg-bg-card rounded-2xl border border-border-base shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-bg-surface text-text-secondary font-medium border-b border-border-base">
              <tr>
                <th className="px-6 py-4">Référence</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Voyage Lié</th>
                <th className="px-6 py-4">Émission</th>
                <th className="px-6 py-4">Échéance</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base">
              {!bons?.length ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-text-muted">Aucun bon trouvé.</td></tr>
              ) : (
                bons.map((bon) => {
                  const statusInfo = BON_STATUSES[bon.status as keyof typeof BON_STATUSES]
                  return (
                    <tr key={bon.id} className="hover:bg-bg-raised/50">
                      <td className="px-6 py-4">
                        <Link href={`/dashboard/bons/${bon.id}`} className="font-semibold text-accent hover:underline flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          {bon.reference}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-text-primary">
                        {bon.trips?.clients?.name || '-'}
                      </td>
                      <td className="px-6 py-4 text-text-secondary">
                        {bon.trips?.reference || '-'}
                      </td>
                      <td className="px-6 py-4 text-text-secondary">{formatDate(bon.issued_date)}</td>
                      <td className="px-6 py-4 text-text-secondary">{bon.due_date ? formatDate(bon.due_date) : '-'}</td>
                      <td className="px-6 py-4 font-bold text-text-primary">{formatFCFA(bon.total_fcfa)}</td>
                      <td className="px-6 py-4">
                        <Badge variant={statusInfo.color as any} className="text-xs">{statusInfo.label}</Badge>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
