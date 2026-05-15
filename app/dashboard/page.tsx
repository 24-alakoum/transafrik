import { createClient } from '@/lib/supabase/server'
import { KpiGrid, type KpiData } from '@/components/dashboard/KpiGrid'
import { RevenueChart, type RevenueData } from '@/components/dashboard/RevenueChart'
import { Badge } from '@/components/ui/Badge'
import { formatFCFA, formatDate } from '@/lib/utils'
import { TRIP_STATUSES } from '@/lib/constants'
import Link from 'next/link'
import { ArrowRight, AlertTriangle } from 'lucide-react'

// Ceci est un Server Component
export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetching data in parallel
  const [
    { data: recentTrips },
    { count: totalTrips },
    { count: activeTrucks },
    { data: revenueDataRaw }
  ] = await Promise.all([
    supabase
      .from('trips')
      .select('id, reference, destination, revenue_fcfa, status, departure_date, clients(name)')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('trips').select('*', { count: 'exact', head: true }),
    supabase.from('trucks').select('*', { count: 'exact', head: true }).eq('status', 'available'),
    // Simulation pour les revenus - idéalement on fait une aggregation SQL complexe
    Promise.resolve({ data: null }) 
  ])

  // Mock des KPIs pour l'exemple (en production: vraies aggrégations SQL)
  const kpis: KpiData[] = [
    {
      title: 'Revenu mensuel',
      value: 12500000,
      change: 12.5,
      trend: 'up',
      icon: 'wallet',
      isCurrency: true
    },
    {
      title: 'Voyages en cours',
      value: 8,
      change: -2.4,
      trend: 'down',
      icon: 'map'
    },
    {
      title: 'Camions disponibles',
      value: activeTrucks || 0,
      change: 0,
      trend: 'neutral',
      icon: 'truck'
    },
    {
      title: 'Alertes maintenance',
      value: 2,
      change: 100,
      trend: 'down', // plus d'alertes = négatif
      icon: 'alert'
    }
  ]

  // Mock des données graphiques (en production: group by month)
  const chartData: RevenueData[] = [
    { month: 'Jan', revenue: 4000000, expenses: 2400000 },
    { month: 'Fév', revenue: 3000000, expenses: 1398000 },
    { month: 'Mar', revenue: 2000000, expenses: 9800000 },
    { month: 'Avr', revenue: 2780000, expenses: 3908000 },
    { month: 'Mai', revenue: 1890000, expenses: 4800000 },
    { month: 'Juin', revenue: 2390000, expenses: 3800000 },
    { month: 'Juil', revenue: 3490000, expenses: 4300000 },
  ]

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-syne font-bold text-text-primary">Tableau de bord</h1>
        <p className="text-text-secondary mt-1">Bienvenue, voici un aperçu de vos opérations.</p>
      </div>

      {/* Alertes prioritaires (Hardcodées pour l'exemple) */}
      <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 flex items-start sm:items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5 sm:mt-0" />
        <div className="flex-1 text-sm">
          <p className="text-warning font-medium">2 alertes requièrent votre attention</p>
          <p className="text-warning/80">L'assurance du camion AB-1234-ML expire dans 3 jours. 1 paiement client en retard.</p>
        </div>
      </div>

      {/* KPIs */}
      <KpiGrid data={kpis} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Graphique (2/3) */}
        <div className="lg:col-span-2">
          <RevenueChart data={chartData} />
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
            {!recentTrips?.length ? (
              <div className="p-4 text-center text-text-muted text-sm">Aucun voyage récent</div>
            ) : (
              <div className="divide-y divide-border-base/50">
                {recentTrips.map((trip) => {
                  const statusInfo = TRIP_STATUSES[trip.status as keyof typeof TRIP_STATUSES]
                  return (
                    <div key={trip.id} className="p-3 hover:bg-bg-raised transition-colors rounded-lg flex items-center justify-between group">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-text-primary">{trip.reference}</span>
                          <Badge variant={statusInfo.color as any} className="text-[10px] px-1.5 py-0.5 h-auto">
                            {statusInfo.label}
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
