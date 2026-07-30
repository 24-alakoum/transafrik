import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatFCFA, formatDate } from '@/lib/utils'
import { TRIP_STATUSES } from '@/lib/constants'
import { Badge } from '@/components/ui/Badge'
import { AlertTriangle, Building2, MapPin, Edit } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

export default async function ClientDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { id } = await params

  const { data: client } = (await supabase
    .from('clients')
    .select(`
      *,
      trips (
        id, reference, origin, destination, status, departure_date, revenue_fcfa
      ),
      delivery_notes (
        id, reference, status, total_fcfa, due_date
      )
    `)
    .eq('id', id)
    .single()) as any

  if (!client) notFound()

  // Calcul du solde
  const unpaidNotes = (client.delivery_notes || []).filter((note: any) => 
    ['sent', 'viewed', 'late', 'disputed'].includes(note.status)
  )
  const balance = unpaidNotes.reduce((sum: number, note: any) => sum + Number(note.total_fcfa), 0)
  const isOverLimit = client.credit_limit_fcfa ? balance > client.credit_limit_fcfa : false

  return (
    <div className="space-y-6">
      <div className="bg-bg-card rounded-2xl p-6 border border-border-base shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-bg-raised flex items-center justify-center text-text-secondary">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-syne font-bold text-text-primary">{client.name}</h1>
                  <Link href={`/dashboard/clients/${client.id}/editer`}>
                    <Button variant="outline" size="sm" className="h-8 px-3">
                      <Edit className="w-3.5 h-3.5 mr-1" /> Modifier
                    </Button>
                  </Link>
                </div>
                <p className="text-text-secondary text-sm mt-1">
                  {client.sector || 'Secteur non spécifié'}
                  {(client.city || client.country) && (
                    <>
                      {' • '}
                      {client.city}
                      {client.city && client.country ? ', ' : ''}
                      {client.country}
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-bg-surface border border-border-base rounded-xl p-4 min-w-[250px]">
            <p className="text-sm font-medium text-text-secondary mb-1">Solde dû actuel</p>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-syne font-bold text-accent">
                {formatFCFA(balance)}
              </span>
              {isOverLimit && (
                <span className="flex items-center gap-1 text-danger bg-danger/10 px-2 py-1 rounded text-xs font-medium">
                  <AlertTriangle className="w-4 h-4" /> Risque
                </span>
              )}
            </div>
            {client.credit_limit_fcfa && (
              <p className="text-xs text-text-muted mt-2">
                Plafond : {formatFCFA(client.credit_limit_fcfa)}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Historique des voyages */}
        <div className="bg-bg-card rounded-2xl border border-border-base shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-border-base">
            <h3 className="text-lg font-syne font-semibold text-text-primary">Derniers voyages</h3>
          </div>
          <div className="p-2 flex-1 overflow-y-auto max-h-[500px]">
            {!client.trips?.length ? (
              <div className="p-4 text-center text-text-muted">Aucun voyage enregistré</div>
            ) : (
              <div className="divide-y divide-border-base">
                {client.trips.slice(0, 10).map((trip: any) => {
                  const statusInfo = TRIP_STATUSES[trip.status as keyof typeof TRIP_STATUSES]
                  return (
                    <div key={trip.id} className="p-3 hover:bg-bg-raised rounded-lg flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-text-primary">{trip.reference}</span>
                          <Badge variant={statusInfo.color as any} className="text-[10px] px-1.5 py-0.5 h-auto">{statusInfo.label}</Badge>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                          <MapPin className="w-3 h-3" />
                          <span>{trip.origin} → {trip.destination}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-text-primary">{formatFCFA(trip.revenue_fcfa)}</p>
                        <p className="text-xs text-text-muted">{trip.departure_date ? formatDate(trip.departure_date) : '-'}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Factures en attente */}
        <div className="bg-bg-card rounded-2xl border border-border-base shadow-sm flex flex-col">
          <div className="p-5 border-b border-border-base">
            <h3 className="text-lg font-syne font-semibold text-text-primary">Factures & Bons en attente</h3>
          </div>
          <div className="p-2 flex-1 overflow-y-auto max-h-[500px]">
             {!unpaidNotes.length ? (
              <div className="p-4 text-center text-success font-medium">Le client est à jour dans ses paiements.</div>
            ) : (
              <div className="divide-y divide-border-base">
                {unpaidNotes.map((note: any) => (
                  <div key={note.id} className="p-3 hover:bg-bg-raised rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-medium text-text-primary">{note.reference}</p>
                      <p className={`text-xs mt-1 ${new Date(note.due_date) < new Date() ? 'text-danger font-medium' : 'text-text-secondary'}`}>
                        Échéance : {formatDate(note.due_date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-syne font-bold text-text-primary">{formatFCFA(note.total_fcfa)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {client.notes && (
        <div className="bg-bg-card rounded-2xl p-6 border border-border-base shadow-sm space-y-2">
          <h3 className="text-lg font-syne font-semibold text-text-primary">Notes / Observations</h3>
          <p className="text-text-secondary text-sm whitespace-pre-wrap">{client.notes}</p>
        </div>
      )}
    </div>
  )
}
