'use client'

import * as React from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useVoyages } from '@/lib/queries/hooks'
import { formatFCFA, formatDate, calculateTripFinancials } from '@/lib/utils'
import { TRIP_STATUSES } from '@/lib/constants'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { VoyageTableActions } from '@/components/voyages/VoyageTableActions'
import Link from 'next/link'
import {
  Plus,
  Download,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
} from 'lucide-react'

const PAGE_SIZE = 10

export default function VoyagesPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const page = Number(searchParams.get('page')) || 1
  const status = searchParams.get('status') || ''
  const search = searchParams.get('q') || ''
  const sortField = searchParams.get('sortField') || 'created_at'
  const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'

  const [searchInput, setSearchInput] = React.useState(search)

  // Sync search input state with URL param on direct load/back navigation
  React.useEffect(() => {
    setSearchInput(search)
  }, [search])

  const { data, isLoading, isFetching } = useVoyages({
    page,
    pageSize: PAGE_SIZE,
    status,
    q: search,
    sortField,
    sortOrder,
  })

  const trips = data?.data || []
  const totalPages = data?.totalPages || 1
  const count = data?.count || 0

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

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    setParam('q', searchInput)
  }

  function clearSearch() {
    setSearchInput('')
    setParam('q', '')
  }

  function toggleSort(field: string) {
    if (sortField === field) {
      const nextOrder = sortOrder === 'asc' ? 'desc' : 'asc'
      const params = new URLSearchParams(searchParams.toString())
      params.set('sortOrder', nextOrder)
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    } else {
      const params = new URLSearchParams(searchParams.toString())
      params.set('sortField', field)
      params.set('sortOrder', 'desc')
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    }
  }

  function renderSortIcon(field: string) {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 opacity-40 ml-1 inline" />
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-accent ml-1 inline" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-accent ml-1 inline" />
    )
  }

  function exportCSV() {
    if (!trips.length) return
    const headers = ['Référence', 'Départ', 'Destination', 'Client', 'Camion', 'Chauffeur', 'Statut', 'Revenu (FCFA)', 'Date départ']
    const rows = trips.map((t: any) => [
      t.reference,
      `"${t.origin}"`,
      `"${t.destination}"`,
      `"${t.clients?.name || ''}"`,
      `"${t.trucks?.plate || ''}"`,
      `"${t.drivers?.full_name || ''}"`,
      t.status,
      t.revenue_fcfa || 0,
      t.departure_date || '',
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `voyages_export_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-syne font-bold text-text-primary">Voyages</h1>
          <p className="text-text-secondary mt-1">
            Gérez vos expéditions, recherches, filtres et éditions.
            {isFetching && !isLoading && (
              <span className="ml-2 text-accent text-xs">Actualisation...</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="hidden sm:flex" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-2" /> Exporter CSV
          </Button>
          <Link href="/dashboard/voyages/nouveau">
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Nouveau voyage
            </Button>
          </Link>
        </div>
      </div>

      {/* Barre de Recherche & Filtres rapides */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Rechercher par ref, origine, destination, cargo..."
            className="w-full pl-10 pr-9 py-2.5 bg-bg-card border border-border-base rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
          />
          {searchInput && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-0.5 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>

        {/* Status Tabs */}
        <div className="bg-bg-card border border-border-base rounded-xl p-1.5 flex overflow-x-auto no-scrollbar gap-1.5">
          <button
            onClick={() => setParam('status', '')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              !status || status === 'all'
                ? 'bg-bg-raised text-text-primary shadow-xs'
                : 'text-text-secondary hover:bg-bg-raised/50'
            }`}
          >
            Tous ({count})
          </button>
          {Object.entries(TRIP_STATUSES).map(([key, value]) => (
            <button
              key={key}
              onClick={() => setParam('status', key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                status === key
                  ? 'bg-bg-raised text-text-primary shadow-xs'
                  : 'text-text-secondary hover:bg-bg-raised/50'
              }`}
            >
              {value.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={10} cols={8} />
      ) : (
        <div className="bg-bg-card rounded-2xl border border-border-base shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-bg-surface text-text-secondary font-medium border-b border-border-base select-none">
                <tr>
                  <th
                    className="px-6 py-4 cursor-pointer hover:text-text-primary transition-colors"
                    onClick={() => toggleSort('reference')}
                  >
                    Référence {renderSortIcon('reference')}
                  </th>
                  <th
                    className="px-6 py-4 cursor-pointer hover:text-text-primary transition-colors"
                    onClick={() => toggleSort('origin')}
                  >
                    Trajet {renderSortIcon('origin')}
                  </th>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Véhicule &amp; Chauffeur</th>
                  <th
                    className="px-6 py-4 cursor-pointer hover:text-text-primary transition-colors"
                    onClick={() => toggleSort('departure_date')}
                  >
                    Dates {renderSortIcon('departure_date')}
                  </th>
                  <th
                    className="px-6 py-4 cursor-pointer hover:text-text-primary transition-colors"
                    onClick={() => toggleSort('revenue_fcfa')}
                  >
                    Revenu {renderSortIcon('revenue_fcfa')}
                  </th>
                  <th className="px-6 py-4">Bénéfice Net</th>
                  <th
                    className="px-6 py-4 cursor-pointer hover:text-text-primary transition-colors"
                    onClick={() => toggleSort('status')}
                  >
                    Statut {renderSortIcon('status')}
                  </th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-base">
                {!trips.length ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-text-muted">
                      {search || status ? (
                        <div className="space-y-2">
                          <p>Aucun voyage ne correspond à vos critères de recherche.</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              clearSearch()
                              setParam('status', '')
                            }}
                          >
                            Réinitialiser les filtres
                          </Button>
                        </div>
                      ) : (
                        'Aucun voyage enregistré.'
                      )}
                    </td>
                  </tr>
                ) : (
                  trips.map((trip: any) => {
                    const statusInfo = TRIP_STATUSES[trip.status as keyof typeof TRIP_STATUSES]
                    const { totalRevenue: totalRec, netProfit, isProfitable: isProfit } = calculateTripFinancials(trip)

                    return (
                      <tr key={trip.id} className="hover:bg-bg-raised/50 transition-colors">
                        <td className="px-6 py-4">
                          <Link
                            href={`/dashboard/voyages/${trip.id}`}
                            className="font-semibold text-accent hover:underline"
                          >
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
                            <span className="text-text-primary font-medium">{trip.trucks?.plate || 'Non assigné'}</span>
                            <span className="text-xs text-text-muted">{trip.drivers?.full_name || 'Sans chauffeur'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-text-secondary">
                          {trip.departure_date ? formatDate(trip.departure_date) : '-'}
                        </td>
                        <td className="px-6 py-4 font-medium text-text-primary">
                          {formatFCFA(trip.revenue_fcfa)}
                        </td>
                        <td className={`px-6 py-4 font-bold text-xs ${isProfit ? 'text-success' : 'text-danger'}`}>
                          {formatFCFA(netProfit)}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={statusInfo?.color as any}>{statusInfo?.label || trip.status}</Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <VoyageTableActions trip={trip} />
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
              <span className="text-sm text-text-secondary">
                Page {page} sur {totalPages} ({count} résultats)
              </span>
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
