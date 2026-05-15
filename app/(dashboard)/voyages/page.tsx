import { createClient } from '@/lib/supabase/server'
import { formatFCFA, formatDate } from '@/lib/utils'
import { TRIP_STATUSES } from '@/lib/constants'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { Plus, Filter, Download, MapPin } from 'lucide-react'

export default async function VoyagesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()
  const params = await searchParams
  
  const page = Number(params.page) || 1
  const pageSize = 10
  const statusFilter = params.status as string | undefined

  let query = supabase
    .from('trips')
    .select('*, clients(name), trucks(plate), drivers(full_name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  const { data: trips, count } = await query
  const totalPages = Math.ceil((count || 0) / pageSize)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-syne font-bold text-text-primary">Voyages</h1>
          <p className="text-text-secondary mt-1">Gérez vos expéditions et leur suivi.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="hidden sm:flex">
            <Download className="w-4 h-4 mr-2" /> Exporter
          </Button>
          <Link href="/dashboard/voyages/nouveau">
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Nouveau voyage
            </Button>
          </Link>
        </div>
      </div>

      {/* Filtres statiques pour l'instant */}
      <div className="bg-bg-card border border-border-base rounded-xl p-2 flex overflow-x-auto no-scrollbar gap-2">
        <Link href="?status=all" className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${!statusFilter || statusFilter === 'all' ? 'bg-bg-raised text-text-primary' : 'text-text-secondary hover:bg-bg-raised/50'}`}>
          Tous les voyages
        </Link>
        {Object.entries(TRIP_STATUSES).map(([key, value]) => (
          <Link key={key} href={`?status=${key}`} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${statusFilter === key ? 'bg-bg-raised text-text-primary' : 'text-text-secondary hover:bg-bg-raised/50'}`}>
            {value.label}
          </Link>
        ))}
      </div>

      {/* Table/List */}
      <div className="bg-bg-card rounded-2xl border border-border-base shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-bg-surface text-text-secondary font-medium border-b border-border-base">
              <tr>
                <th className="px-6 py-4">Référence</th>
                <th className="px-6 py-4">Trajet</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Véhicule & Chauffeur</th>
                <th className="px-6 py-4">Dates</th>
                <th className="px-6 py-4">Revenu</th>
                <th className="px-6 py-4">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base">
              {!trips?.length ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-text-muted">
                    Aucun voyage trouvé.
                  </td>
                </tr>
              ) : (
                trips.map((trip) => {
                  const statusInfo = TRIP_STATUSES[trip.status as keyof typeof TRIP_STATUSES]
                  return (
                    <tr key={trip.id} className="hover:bg-bg-raised/50 transition-colors">
                      <td className="px-6 py-4">
                        <Link href={`/dashboard/voyages/${trip.id}`} className="font-semibold text-accent hover:underline">
                          {trip.reference}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-text-muted" />
                          <span className="text-text-primary">{trip.origin}</span>
                          <span className="text-text-muted mx-1">→</span>
                          <span className="text-text-primary">{trip.destination}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-text-secondary">{trip.clients?.name || '-'}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-text-primary">{trip.trucks?.plate || 'Non assigné'}</span>
                          <span className="text-xs text-text-muted">{trip.drivers?.full_name || 'Sans chauffeur'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-text-secondary">
                        {trip.departure_date ? formatDate(trip.departure_date) : '-'}
                      </td>
                      <td className="px-6 py-4 font-medium text-text-primary">
                        {formatFCFA(trip.revenue_fcfa)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={statusInfo.color as any}>{statusInfo.label}</Badge>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination basique */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border-base flex items-center justify-between">
            <span className="text-sm text-text-secondary">Page {page} sur {totalPages}</span>
            <div className="flex gap-2">
              <Link href={`?page=${page - 1}${statusFilter ? `&status=${statusFilter}` : ''}`}>
                <Button variant="outline" size="sm" disabled={page === 1}>Précédent</Button>
              </Link>
              <Link href={`?page=${page + 1}${statusFilter ? `&status=${statusFilter}` : ''}`}>
                <Button variant="outline" size="sm" disabled={page === totalPages}>Suivant</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
