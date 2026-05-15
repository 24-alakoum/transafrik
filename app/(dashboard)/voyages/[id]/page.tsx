import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'
import { TRIP_STATUSES } from '@/lib/constants'
import { formatFCFA, formatDate } from '@/lib/utils'
import { MapPin, Calendar, Truck, User, Building2, Package } from 'lucide-react'

export default async function VoyageDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { id } = await params

  const { data: trip } = await supabase
    .from('trips')
    .select(`
      *,
      clients(name, phone, email),
      trucks(plate, brand),
      drivers(full_name, phone)
    `)
    .eq('id', id)
    .single()

  if (!trip) {
    notFound()
  }

  const statusInfo = TRIP_STATUSES[trip.status as keyof typeof TRIP_STATUSES]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl lg:text-3xl font-syne font-bold text-text-primary">
              Voyage {trip.reference}
            </h1>
            <Badge variant={statusInfo.color as any}>{statusInfo.label}</Badge>
          </div>
          <p className="text-text-secondary">
            Créé le {formatDate(trip.created_at)}
          </p>
        </div>
        {/* Actions (Update status, Print, etc) */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche (Infos) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-bg-card rounded-2xl p-6 border border-border-base shadow-sm">
            <h2 className="text-lg font-syne font-semibold text-text-primary mb-6">Itinéraire & Marchandise</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="mt-1"><MapPin className="w-5 h-5 text-accent" /></div>
                  <div>
                    <p className="text-sm text-text-secondary font-medium">Départ</p>
                    <p className="text-text-primary font-medium">{trip.origin}</p>
                    {trip.departure_date && <p className="text-sm text-text-muted mt-1">{formatDate(trip.departure_date)}</p>}
                  </div>
                </div>
                <div className="ml-2.5 w-0.5 h-6 bg-border-base" />
                <div className="flex gap-3">
                  <div className="mt-1"><MapPin className="w-5 h-5 text-success" /></div>
                  <div>
                    <p className="text-sm text-text-secondary font-medium">Arrivée</p>
                    <p className="text-text-primary font-medium">{trip.destination}</p>
                    {trip.arrival_date && <p className="text-sm text-text-muted mt-1">{formatDate(trip.arrival_date)}</p>}
                  </div>
                </div>
              </div>
              
              <div className="bg-bg-surface rounded-xl p-4 border border-border-base">
                <div className="flex items-center gap-2 mb-3 text-text-secondary">
                  <Package className="w-4 h-4" />
                  <span className="font-medium text-sm">Marchandise</span>
                </div>
                <p className="text-text-primary font-medium">{trip.cargo_type || 'Non spécifié'}</p>
                {trip.cargo_weight_kg && <p className="text-sm text-text-muted mt-1">{trip.cargo_weight_kg} kg</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Colonne droite (Intervenants) */}
        <div className="space-y-6">
          <div className="bg-bg-card rounded-2xl p-6 border border-border-base shadow-sm space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2 text-text-secondary">
                <Building2 className="w-4 h-4" />
                <span className="font-medium text-sm">Client</span>
              </div>
              <p className="text-text-primary font-medium">{trip.clients?.name || 'Non assigné'}</p>
              {trip.clients?.phone && <p className="text-sm text-text-muted">{trip.clients.phone}</p>}
            </div>
            
            <div className="divider-dark my-2" />
            
            <div>
              <div className="flex items-center gap-2 mb-2 text-text-secondary">
                <Truck className="w-4 h-4" />
                <span className="font-medium text-sm">Camion</span>
              </div>
              <p className="text-text-primary font-medium">{trip.trucks?.plate || 'Non assigné'}</p>
              {trip.trucks?.brand && <p className="text-sm text-text-muted">{trip.trucks.brand}</p>}
            </div>

            <div className="divider-dark my-2" />
            
            <div>
              <div className="flex items-center gap-2 mb-2 text-text-secondary">
                <User className="w-4 h-4" />
                <span className="font-medium text-sm">Chauffeur</span>
              </div>
              <p className="text-text-primary font-medium">{trip.drivers?.full_name || 'Non assigné'}</p>
              {trip.drivers?.phone && <p className="text-sm text-text-muted">{trip.drivers.phone}</p>}
            </div>
          </div>
          
          <div className="bg-bg-card rounded-2xl p-6 border border-border-base shadow-sm">
             <p className="text-sm text-text-secondary font-medium mb-1">Revenu attendu</p>
             <p className="text-2xl font-syne font-bold text-accent">{formatFCFA(trip.revenue_fcfa)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
