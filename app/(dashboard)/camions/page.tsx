import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { TRUCK_STATUSES } from '@/lib/constants'
import { Plus, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default async function CamionsPage() {
  const supabase = await createClient()
  const { data: trucks } = await supabase.from('trucks').select('*').order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-syne font-bold text-text-primary">Camions</h1>
          <p className="text-text-secondary mt-1">Gérez votre flotte de véhicules.</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" /> Ajouter un camion
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {trucks?.map((truck) => {
          const statusInfo = TRUCK_STATUSES[truck.status as keyof typeof TRUCK_STATUSES]
          return (
            <div key={truck.id} className="bg-bg-card rounded-2xl border border-border-base shadow-sm p-5 hover:border-border-active transition-colors group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-syne font-bold text-text-primary tracking-wide">
                    {truck.plate}
                  </h3>
                  <p className="text-sm text-text-secondary mt-0.5">{truck.brand} {truck.model}</p>
                </div>
                <Badge variant={statusInfo.color as any} className="text-xs">{statusInfo.label}</Badge>
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

              {/* Alertes d'expiration */}
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
    </div>
  )
}
