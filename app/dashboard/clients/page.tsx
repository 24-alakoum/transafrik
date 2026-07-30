'use client'

import { useClients } from '@/lib/queries/hooks'
import { formatFCFA } from '@/lib/utils'
import { Plus, Building2, Phone, Mail, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { TableSkeleton } from '@/components/ui/Skeleton'
import Link from 'next/link'

export default function ClientsPage() {
  const { data, isLoading, isFetching } = useClients()
  const clients = data?.data || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-syne font-bold text-text-primary">Clients</h1>
          <p className="text-text-secondary mt-1">
            Gérez votre portefeuille client et leurs encours.
            {isFetching && !isLoading && (
              <span className="ml-2 text-accent text-xs">Actualisation...</span>
            )}
          </p>
        </div>
        <Link href="/dashboard/clients/nouveau">
          <Button>
            <Plus className="w-4 h-4 mr-2" /> Nouveau client
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} cols={5} />
      ) : (
        <div className="bg-bg-card rounded-2xl border border-border-base shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-bg-surface text-text-secondary font-medium border-b border-border-base">
                <tr>
                  <th className="px-6 py-4">Nom &amp; Contact</th>
                  <th className="px-6 py-4">Secteur</th>
                  <th className="px-6 py-4">Conditions de paiement</th>
                  <th className="px-6 py-4">Plafond crédit</th>
                  <th className="px-6 py-4">Solde dû actuel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-base">
                {!clients.length ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-text-muted">
                      Aucun client trouvé.
                    </td>
                  </tr>
                ) : (
                  clients.map((client: any) => (
                    <tr key={client.id} className="hover:bg-bg-raised/50 transition-colors">
                      <td className="px-6 py-4">
                        <Link href={`/dashboard/clients/${client.id}`} className="font-semibold text-accent hover:underline flex items-center gap-2 mb-1">
                          <Building2 className="w-4 h-4 text-text-muted" />
                          {client.name}
                        </Link>
                        <div className="flex items-center gap-3 text-xs text-text-secondary">
                          {client.contact_person && <span>{client.contact_person}</span>}
                          {client.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{client.phone}</span>}
                          {client.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{client.email}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-text-secondary">
                        {client.sector || '-'}
                      </td>
                      <td className="px-6 py-4 text-text-secondary">
                        {client.payment_terms_days} jours
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {client.credit_limit_fcfa ? formatFCFA(client.credit_limit_fcfa) : 'Illimité'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-syne font-bold text-base ${client.balance > 0 ? 'text-text-primary' : 'text-text-muted'}`}>
                            {formatFCFA(client.balance)}
                          </span>
                          {client.isOverLimit && (
                            <div className="flex items-center gap-1 text-danger bg-danger/10 px-2 py-0.5 rounded text-xs font-medium" title="Plafond de crédit dépassé">
                              <AlertTriangle className="w-3 h-3" /> Dépassé
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
