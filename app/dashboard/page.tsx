'use client'

import * as React from 'react'
import { useDashboard } from '@/lib/queries/hooks'
import { KpiGrid, type KpiData } from '@/components/dashboard/KpiGrid'
import { RevenueChart, type RevenueData } from '@/components/dashboard/RevenueChart'
import { Badge } from '@/components/ui/Badge'
import { KpiSkeleton, Skeleton } from '@/components/ui/Skeleton'
import { formatFCFA, formatDate } from '@/lib/utils'
import { TRIP_STATUSES } from '@/lib/constants'
import Link from 'next/link'
import { ArrowRight, AlertTriangle, RefreshCw } from 'lucide-react'

export default function DashboardPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useDashboard()

  // KPIs construits à partir des données réelles
  const kpis: KpiData[] = React.useMemo(() => {
    if (!data) return []
    return [
      {
        title: 'Revenu total',
        value: data.totalRevenue,
        change: 0,
        trend: 'neutral' as const,
        icon: 'wallet',
        isCurrency: true,
      },
      {
        title: 'Voyages en cours',
        value: data.activeTrips,
        change: 0,
        trend: 'neutral' as const,
        icon: 'map',
      },
      {
        title: 'Camions disponibles',
        value: data.activeTrucks,
        change: 0,
        trend: 'neutral' as const,
        icon: 'truck',
      },
      {
        title: 'Total voyages',
        value: data.totalTrips,
        change: 0,
        trend: 'neutral' as const,
        icon: 'alert',
      },
    ]
  }, [data])

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-syne font-bold text-text-primary">Tableau de bord</h1>
          <p className="text-text-secondary mt-1">Bienvenue, voici un aperçu de vos opérations.</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-2 rounded-lg border border-border-base hover:border-accent/40 text-text-muted hover:text-accent transition-colors disabled:opacity-50"
          title="Actualiser"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Alerte */}
      <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 flex items-start sm:items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5 sm:mt-0" />
        <div className="flex-1 text-sm">
          <p className="text-warning font-medium">2 alertes requièrent votre attention</p>
          <p className="text-warning/80">L&apos;assurance du camion AB-1234-ML expire dans 3 jours. 1 paiement client en retard.</p>
        </div>
      </div>

      {/* KPIs */}
      {isLoading ? <KpiSkeleton /> : <KpiGrid data={kpis} />}

      {isError && (
        <div className="p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm">
          Erreur lors du chargement : {error?.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Graphique (2/3) */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="bg-bg-card rounded-2xl border border-border-base h-72 animate-pulse" />
          ) : (
            <RevenueChart data={(data?.chartData || []) as RevenueData[]} />
          )}
        </div>

        {/* Derniers voyages (1/3) */}
        <div className="bg-bg-card rounded-2xl border border-border-base shadow-sm flex flex-col">
          <div className="p-5 border-b border-border-base flex items-center justify-between">
            <h3 className="text-lg font-syne font-semibold text-text-primary">Derniers voyages</h3>
            <Link href="/dashboard/voyages" className="text-accent hover:underline text-sm font-medium flex items-center gap-1">
              Voir tout <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="p-2 flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="space-y-2 p-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-3">
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <div className="text-right space-y-1.5">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !data?.recentTrips?.length ? (
              <div className="p-4 text-center text-text-muted text-sm">Aucun voyage récent</div>
            ) : (
              <div className="divide-y divide-border-base/50">
                {data.recentTrips.map((trip: any) => {
                  const statusInfo = TRIP_STATUSES[trip.status as keyof typeof TRIP_STATUSES]
                  return (
                    <div key={trip.id} className="p-3 hover:bg-bg-raised transition-colors rounded-lg flex items-center justify-between group">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-text-primary">{trip.reference}</span>
                          <Badge variant={statusInfo?.color as any} className="text-[10px] px-1.5 py-0.5 h-auto">
                            {statusInfo?.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-text-secondary truncate max-w-[150px]">
                          Vers {trip.destination} • {trip.clients?.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-text-primary">
                          {formatFCFA(trip.revenue_fcfa)}
                        </p>
                        <p className="text-xs text-text-muted">
                          {trip.departure_date ? formatDate(trip.departure_date) : '-'}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
