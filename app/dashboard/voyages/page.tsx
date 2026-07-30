'use client'

import * as React from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useVoyages } from '@/lib/queries/hooks'
import { formatFCFA, formatDate } from '@/lib/utils'
import { TRIP_STATUSES } from '@/lib/constants'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { TableSkeleton } from '@/components/ui/Skeleton'
import Link from 'next/link'
import { Plus, Download, MapPin, ChevronLeft, ChevronRight } from 'lucide-react'

const PAGE_SIZE = 10

export default function VoyagesPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const page = Number(searchParams.get('page')) || 1
  const status = searchParams.get('status') || ''

  const { data, isLoading, isFetching } = useVoyages({
    page,
    pageSize: PAGE_SIZE,
    status,
  })

  const trips = data?.data || []
  const totalPages = data?.totalPages || 1

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    if (key !== 'page') params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-syne font-bold text-text-primary">Voyages</h1>
          <p className="text-text-secondary mt-1">
            Gérez vos expéditions et leur suivi.
            {isFetching && !isLoading && (
              <span className="ml-2 text-accent text-xs">Actualisation...</span>
            )}
          </p>
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

      {/* Filtres */}
      <div className="bg-bg-card border border-border-base rounded-xl p-2 flex overflow-x-auto no-scrollbar gap-2">
        <button
          onClick={() => setParam('status', '')}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${!status || status === 'all' ? 'bg-bg-raised text-text-primary' : 'text-text-secondary hover:bg-bg-raised/50'}`}
        >
          Tous les voyages
        </button>
        {Object.entries(TRIP_STATUSES).map(([key, value]) => (
          <button
            key={key}
            onClick={() => setParam('status', key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${status === key ? 'bg-bg-raised text-text-primary' : 'text-text-secondary hover:bg-bg-raised/50'}`}
          >
            {value.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={10} cols={7} />
      ) : (
        <div className="bg-bg-card rounded-2xl border border-border-base shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-bg-surface text-text-secondary font-medium border-b border-border-base">
                <tr>
                  <th className="px-6 py-4">Référence</th>
                  <th className="px-6 py-4">Trajet</th>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Véhicule &amp; Chauffeur</th>
                  <th className="px-6 py-4">Dates</th>
                  <th className="px-6 py-4">Revenu</th>
                  <th className="px-6 py-4">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-base">
                {!trips.length ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-text-muted">
                      Aucun voyage trouvé.
                    </td>
                  </tr>
                ) : (
                  trips.map((trip: any) => {
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
                          <Badge variant={statusInfo?.color as any}>{statusInfo?.label}</Badge>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-border-base flex items-center justify-between">
              <span className="text-sm text-text-secondary">Page {page} sur {totalPages}</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setParam('page', String(page - 1))}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setParam('page', String(page + 1))}
                >
                  Suivant <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
