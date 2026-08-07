'use client'

import * as React from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useCamions } from '@/lib/queries/hooks'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { CardGridSkeleton } from '@/components/ui/Skeleton'
import { TRUCK_STATUSES } from '@/lib/constants'
import { Plus, AlertTriangle, Search } from 'lucide-react'
import Link from 'next/link'
import { CamionCardActions } from './CamionCardActions'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queries/keys'
import { formatFCFA } from '@/lib/utils'

function CamionsKPIs() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'camions'],
    queryFn: async () => {
      const res = await fetch('/api/data/analytics/camions')
      if (!res.ok) throw new Error('Erreur')
      return res.json()
    }
  })

  if (isLoading || !data) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {data.mostProfitable && (
        <div className="bg-bg-card rounded-2xl border border-success/20 p-5 shadow-sm">
          <p className="text-text-secondary text-sm font-medium mb-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success"></span> Camion le plus rentable
          </p>
          <div className="flex justify-between items-end">
            <p className="text-xl font-syne font-bold text-text-primary">{data.mostProfitable.plate}</p>
            <p className="font-semibold text-success">{formatFCFA(data.mostProfitable.profit)} de profit</p>
          </div>
        </div>
      )}
      {data.mostSpending && (
        <div className="bg-bg-card rounded-2xl border border-danger/20 p-5 shadow-sm">
          <p className="text-text-secondary text-sm font-medium mb-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-danger"></span> Camion qui dépense le plus
          </p>
          <div className="flex justify-between items-end">
            <p className="text-xl font-syne font-bold text-text-primary">{data.mostSpending.plate}</p>
            <p className="font-semibold text-danger">{formatFCFA(data.mostSpending.totalExpense)} de dépenses</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CamionsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()

  const q = searchParams.get('q') || ''
  const statusFilter = searchParams.get('status') || ''
  const typeFilter = searchParams.get('type') || ''

  // Debounce local pour la recherche
  const [localSearch, setLocalSearch] = React.useState(q)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data, isLoading, isFetching } = useCamions({
    q,
    status: statusFilter,
    type: typeFilter,
  })

  const trucks = data?.data || []

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const handleSearch = (val: string) => {
    setLocalSearch(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setParam('q', val), 300)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-syne font-bold text-text-primary">Camions</h1>
          <p className="text-text-secondary mt-1">
            Gérez votre flotte de véhicules.
            {isFetching && !isLoading && (
              <span className="ml-2 text-accent text-xs">Actualisation...</span>
            )}
          </p>
        </div>
        <Link href="/dashboard/camions/nouveau">
          <Button>
            <Plus className="w-4 h-4 mr-2" /> Ajouter un camion
          </Button>
        </Link>
      </div>

      <CamionsKPIs />

      {/* Filtres inline */}
      <div className="bg-bg-card border border-border-base rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Plaque, marque, modèle..."
            value={localSearch}
            onChange={e => handleSearch(e.target.value)}
            className="w-full bg-bg-surface border border-border-base rounded-lg pl-10 pr-4 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
          />
        </div>
        {/* Status */}
        <select
          value={statusFilter}
          onChange={e => setParam('status', e.target.value)}
          className="select select-sm bg-bg-surface border-border-base text-sm rounded-lg"
        >
          <option value="">Tous les statuts</option>
          {Object.entries(TRUCK_STATUSES).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Cards */}
      {isLoading ? (
        <CardGridSkeleton count={8} />
      ) : trucks.length === 0 ? (
        <div className="col-span-full py-12 text-center text-text-muted bg-bg-card rounded-2xl border border-border-base">
          Aucun camion trouvé.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {trucks.map((truck: any) => {
            const statusInfo = TRUCK_STATUSES[truck.status as keyof typeof TRUCK_STATUSES] || { label: truck.status || 'Inconnu', color: 'default' }
            return (
              <div key={truck.id} className="bg-bg-card rounded-2xl border border-border-base shadow-sm p-5 hover:border-border-active transition-colors group relative">
                <div className="flex justify-between items-start mb-4">
                  <div className="pr-6">
                    <Link href={`/dashboard/camions/${truck.id}`} className="hover:underline">
                      <h3 className="text-xl font-syne font-bold text-text-primary tracking-wide">
                        {truck.plate}
                      </h3>
                    </Link>
                    <p className="text-sm text-text-secondary mt-0.5">{truck.brand} {truck.model}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusInfo.color as any} className="text-[10px] px-1.5 py-0.5">{statusInfo.label}</Badge>
                    <CamionCardActions camionId={truck.id} />
                  </div>
                </div>

                <div className="space-y-2 mt-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Type</span>
                    <span className="font-medium text-text-primary capitalize">{truck.type || '-'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Capacité</span>
                    <span className="font-medium text-text-primary">{truck.capacity_kg ? `${truck.capacity_kg} kg` : '-'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Carburant</span>
                    <span className="font-medium text-text-primary capitalize">{truck.fuel_type}</span>
                  </div>
                </div>

                {(truck.insurance_expiry || truck.tech_visit_expiry) && (
                  <div className="mt-4 pt-4 border-t border-border-base">
                    <div className="flex items-center gap-2 text-xs text-warning">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Documents à vérifier</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
