'use client'

import { useState, useEffect, useTransition } from 'react'
import { 
  MapPin, Truck, Navigation, Radio, 
  Activity, Clock, Gauge, RefreshCw,
  AlertCircle, ChevronRight, Circle
} from 'lucide-react'
import { getTrackingDataAction } from './actions'
import { toast } from 'sonner'

interface TruckWithGPS {
  id: string
  plate: string
  brand: string | null
  model: string | null
  status: string
  lastPosition: {
    latitude: number
    longitude: number
    speed_kmh: number | null
    recorded_at: string
  } | null
  activeTrip: {
    reference: string
    destination: string
  } | null
}

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  available:    { label: 'Disponible',   color: 'text-success bg-success/10',  dot: 'bg-success' },
  in_transit:   { label: 'En transit',   color: 'text-accent bg-accent/10',    dot: 'bg-accent animate-pulse' },
  maintenance:  { label: 'Maintenance',  color: 'text-warning bg-warning/10',  dot: 'bg-warning' },
  out_of_service:{ label: 'Hors service',color: 'text-danger bg-danger/10',    dot: 'bg-danger' },
}

function timeAgo(isoDate: string) {
  const mins = Math.floor((Date.now() - new Date(isoDate).getTime()) / 60000)
  if (mins < 1) return 'À l\'instant'
  if (mins < 60) return `Il y a ${mins} min`
  return `Il y a ${Math.floor(mins / 60)}h`
}

function MapPlaceholder({ truck }: { truck: TruckWithGPS | null }) {
  if (!truck?.lastPosition) return (
    <div className="flex-1 flex flex-col items-center justify-center text-text-muted gap-3">
      <MapPin className="w-10 h-10 opacity-30" />
      <p className="text-sm">Sélectionnez un camion pour voir sa position</p>
    </div>
  )

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative bg-bg-surface rounded-xl overflow-hidden min-h-[350px]">
      {/* Simulated map grid */}
      <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" className="text-accent"/>
      </svg>
      
      {/* Truck marker */}
      <div className="relative z-10 flex flex-col items-center gap-2">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-accent/20 border-2 border-accent animate-ping absolute inset-0" />
          <div className="w-16 h-16 rounded-full bg-accent/10 border-2 border-accent flex items-center justify-center relative">
            <Truck className="w-8 h-8 text-accent" />
          </div>
        </div>
        <div className="bg-bg-card border border-border-base rounded-lg px-4 py-2 shadow-lg text-center">
          <p className="font-bold text-text-primary">{truck.plate}</p>
          <p className="text-xs text-text-muted">
            {truck.lastPosition.latitude.toFixed(5)}°N, {truck.lastPosition.longitude.toFixed(5)}°W
          </p>
        </div>
      </div>

      {/* Speed indicator */}
      <div className="absolute bottom-4 right-4 bg-bg-card border border-border-base rounded-lg p-3 flex items-center gap-2 shadow-md">
        <Gauge className="w-4.5 h-4.5 text-accent" />
        <span className="font-bold text-text-primary text-sm">{truck.lastPosition.speed_kmh ?? 0}</span>
        <span className="text-xs text-text-muted">km/h</span>
      </div>

      <div className="absolute bottom-4 left-4 bg-bg-card border border-border-base rounded-lg p-2 text-[10px] text-text-muted shadow-md">
        <p className="font-medium text-text-primary">🛰️ Télémétrie GPS en temps réel active</p>
        <p className="mt-0.5 opacity-70">Intervalle de rafraîchissement automatique : 5s</p>
      </div>
    </div>
  )
}

export default function TrackingPage() {
  const [trucks, setTrucks] = useState<TruckWithGPS[]>([])
  const [selectedTruck, setSelectedTruck] = useState<TruckWithGPS | null>(null)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(true)

  const fetchTrackingData = (showToast = false) => {
    startTransition(async () => {
      const res = await getTrackingDataAction()
      if (res.success && res.trucks) {
        setTrucks(res.trucks)
        setLastRefresh(new Date())
        
        // Match currently selected truck if exists
        if (selectedTruck) {
          const updated = res.trucks.find(t => t.id === selectedTruck.id)
          if (updated) setSelectedTruck(updated)
        } else if (res.trucks.length > 0) {
          setSelectedTruck(res.trucks[0])
        }

        if (showToast) {
          toast.success('Données GPS mises à jour')
        }
      } else {
        toast.error(res.error || 'Erreur lors du chargement du tracking')
      }
      setIsLoading(false)
    })
  }

  // Initial load
  useEffect(() => {
    fetchTrackingData()

    // Real-time automatic updates every 5 seconds
    const interval = setInterval(() => {
      fetchTrackingData(false)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const activeTrucks = trucks.filter(t => t.status === 'in_transit')
  const totalInTransit = activeTrucks.length
  const avgSpeed = activeTrucks.reduce((acc, t) => acc + (t.lastPosition?.speed_kmh ?? 0), 0) / (activeTrucks.length || 1)
  const offlineCount = trucks.filter(t => !t.lastPosition).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-syne font-bold text-text-primary flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center">
              <Radio className="w-5 h-5 text-accent animate-pulse" />
            </div>
            Tracking GPS
          </h1>
          <p className="text-text-secondary mt-1">Positions et vitesse de vos camions en temps réel</p>
        </div>
        <button
          onClick={() => fetchTrackingData(true)}
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-card border border-border-base text-text-secondary hover:text-accent hover:border-accent/40 transition-all text-sm disabled:opacity-55"
        >
          <RefreshCw className={`w-4 h-4 ${isPending ? 'animate-spin' : ''}`} />
          Actualiser
          <span className="text-xs text-text-muted ml-1">
            {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Truck,    label: 'Camions total',      value: trucks.length,              color: 'text-text-primary' },
          { icon: Activity, label: 'En transit',         value: totalInTransit,             color: 'text-accent' },
          { icon: Gauge,    label: 'Vitesse moy.',       value: `${avgSpeed.toFixed(0)} km/h`, color: 'text-success' },
          { icon: AlertCircle, label: 'Hors contact',   value: offlineCount,               color: 'text-warning' },
        ].map((kpi, i) => (
          <div key={i} className="bg-bg-card border border-border-base rounded-2xl p-4 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-bg-raised flex items-center justify-center shrink-0">
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
            </div>
            <div>
              <p className="text-xs text-text-muted">{kpi.label}</p>
              <p className={`text-xl font-bold font-syne ${kpi.color}`}>{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Panel: Truck List + Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[500px]">
        {/* Truck List */}
        <div className="bg-bg-card border border-border-base rounded-2xl flex flex-col overflow-hidden max-h-[600px] shadow-sm">
          <div className="p-4 border-b border-border-base">
            <h3 className="font-syne font-semibold text-text-primary">Flotte ({trucks.length})</h3>
          </div>
          
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-text-muted">
              <RefreshCw className="w-8 h-8 animate-spin text-accent mb-2" />
              <p className="text-sm">Chargement des positions...</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto divide-y divide-border-base/50 p-2">
              {trucks.length === 0 ? (
                <p className="text-center py-10 text-xs text-text-muted">Aucun camion enregistré dans la base de données.</p>
              ) : (
                trucks.map((truck) => {
                  const cfg = STATUS_CONFIG[truck.status] ?? STATUS_CONFIG.available
                  const isSelected = selectedTruck?.id === truck.id
                  return (
                    <button
                      key={truck.id}
                      onClick={() => setSelectedTruck(truck)}
                      className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 group ${
                        isSelected ? 'bg-accent/10 border border-accent/30' : 'hover:bg-bg-raised'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? 'bg-accent/20' : 'bg-bg-raised'}`}>
                          <Truck className={`w-5 h-5 ${isSelected ? 'text-accent' : 'text-text-secondary'}`} />
                        </div>
                        <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-bg-card ${cfg.dot}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-text-primary text-sm">{truck.plate}</p>
                        <p className="text-xs text-text-muted truncate">{truck.brand} {truck.model}</p>
                        {truck.activeTrip && (
                          <p className="text-xs text-accent mt-0.5 flex items-center gap-1">
                            <Navigation className="w-3 h-3 animate-pulse" />
                            → {truck.activeTrip.destination}
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        {truck.lastPosition ? (
                          <>
                            <p className="text-sm font-bold text-text-primary">{truck.lastPosition.speed_kmh ?? 0} km/h</p>
                            <p className="text-[10px] text-text-muted flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              {timeAgo(truck.lastPosition.recorded_at)}
                            </p>
                          </>
                        ) : (
                          <p className="text-xs text-text-muted">Aucun signal</p>
                        )}
                      </div>
                      <ChevronRight className={`w-4 h-4 text-text-muted transition-transform ${isSelected ? 'rotate-90' : 'group-hover:translate-x-1'}`} />
                    </button>
                  )
                })
              )}
            </div>
          )}
        </div>

        {/* Map Panel */}
        <div className="lg:col-span-2 bg-bg-card border border-border-base rounded-2xl flex flex-col overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border-base flex items-center justify-between">
            <h3 className="font-syne font-semibold text-text-primary">
              {selectedTruck ? (
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-accent" />
                  {selectedTruck.plate} — {selectedTruck.brand} {selectedTruck.model}
                </span>
              ) : 'Carte'}
            </h3>
            {selectedTruck && (
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_CONFIG[selectedTruck.status]?.color}`}>
                <Circle className="w-2 h-2 inline mr-1 fill-current" />
                {STATUS_CONFIG[selectedTruck.status]?.label}
              </span>
            )}
          </div>
          
          <div className="flex-1 p-4 flex flex-col">
            <MapPlaceholder truck={selectedTruck} />
          </div>
          
          {selectedTruck?.activeTrip && (
            <div className="border-t border-border-base p-3 bg-accent/5 flex items-center gap-3">
              <Navigation className="w-4 h-4 text-accent shrink-0" />
              <div className="flex-1">
                <span className="text-sm font-medium text-text-primary">{selectedTruck.activeTrip.reference}</span>
                <span className="text-text-muted mx-2">→</span>
                <span className="text-sm text-accent">{selectedTruck.activeTrip.destination}</span>
              </div>
              <span className="text-xs text-text-muted">Voyage actif</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
