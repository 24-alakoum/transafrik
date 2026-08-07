import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { TRUCK_STATUSES } from '@/lib/constants'
import { ArrowLeft, Edit, Truck, Calendar, Fuel, Weight, FileText, User } from 'lucide-react'
import Link from 'next/link'
import { StatusCamionChanger } from './StatusCamionChanger'

export default async function CamionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const supabase = await createClient()

  const { data: truck, error } = (await supabase
    .from('trucks')
    .select('*, drivers(*)')
    .eq('id', resolvedParams.id)
    .single()) as any

  if (error || !truck) {
    notFound()
  }

  const statusInfo = TRUCK_STATUSES[truck.status as keyof typeof TRUCK_STATUSES] || { label: truck.status || 'Inconnu', color: 'default' }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/camions">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl lg:text-3xl font-syne font-bold text-text-primary">{truck.plate}</h1>
            <p className="text-text-secondary mt-1">{truck.brand} {truck.model} {truck.year ? `(${truck.year})` : ''}</p>
          </div>
        </div>
        <Link href={`/dashboard/camions/${truck.id}/editer`}>
          <Button variant="outline" className="border-border-base hover:border-border-active">
            <Edit className="w-4 h-4 mr-2" /> Modifier le véhicule
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Colonne Gauche - Statut & Synthèse */}
        <div className="md:col-span-1 bg-bg-card rounded-2xl border border-border-base p-6 shadow-sm flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold text-3xl mb-4">
            <Truck className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-syne font-bold text-text-primary">{truck.plate}</h2>
          <p className="text-xs text-text-secondary uppercase tracking-wider mt-1">{truck.type || 'Véhicule'}</p>
          <div className="mt-3">
            <Badge variant={statusInfo.color as any} className="px-3 py-1 text-xs">
              {statusInfo.label}
            </Badge>
          </div>

          <div className="w-full border-t border-border-base mt-6 pt-6 space-y-3 text-left">
            <div className="flex items-center justify-between text-sm text-text-secondary">
              <span className="flex items-center gap-2">
                <Fuel className="w-4 h-4 text-text-muted" /> Carburant
              </span>
              <span className="font-medium text-text-primary capitalize">{truck.fuel_type || 'Diesel'}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-text-secondary">
              <span className="flex items-center gap-2">
                <Weight className="w-4 h-4 text-text-muted" /> Capacité
              </span>
              <span className="font-medium text-text-primary">{truck.capacity_kg ? `${truck.capacity_kg} kg` : '-'}</span>
            </div>
          </div>

          {/* Changer le statut directement */}
          <StatusCamionChanger camionId={truck.id} currentStatus={truck.status} />
        </div>

        {/* Colonne Droite - Informations détaillées */}
        <div className="md:col-span-2 space-y-6">
          {/* Section Caractéristiques & Châssis */}
          <div className="bg-bg-card rounded-2xl border border-border-base p-6 shadow-sm space-y-6">
            <h3 className="text-lg font-syne font-bold text-text-primary flex items-center gap-2">
              <Truck className="w-5 h-5 text-accent" />
              Caractéristiques du Véhicule
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <span className="text-xs text-text-secondary uppercase tracking-wider block">Numéro de Châssis</span>
                <span className="font-mono text-base text-text-primary mt-1 block">
                  {truck.chassis_number || 'Non renseigné'}
                </span>
              </div>
              <div>
                <span className="text-xs text-text-secondary uppercase tracking-wider block">Marque & Modèle</span>
                <span className="text-base text-text-primary mt-1 block">
                  {truck.brand} {truck.model}
                </span>
              </div>
              <div>
                <span className="text-xs text-text-secondary uppercase tracking-wider block">Année de fabrication</span>
                <span className="text-base text-text-primary mt-1 block">
                  {truck.year || 'Non renseignée'}
                </span>
              </div>
              <div>
                <span className="text-xs text-text-secondary uppercase tracking-wider block">Conducteur Principal</span>
                {truck.drivers ? (
                  <Link href={`/dashboard/chauffeurs/${truck.drivers.id}`} className="inline-flex items-center gap-2 text-accent hover:underline mt-1 font-medium">
                    <User className="w-4 h-4" />
                    <span>{truck.drivers.full_name}</span>
                  </Link>
                ) : (
                  <span className="text-base text-text-muted mt-1 block">Aucun conducteur assigné</span>
                )}
              </div>
            </div>
          </div>

          {/* Section Documents & Conformité */}
          <div className="bg-bg-card rounded-2xl border border-border-base p-6 shadow-sm space-y-6">
            <h3 className="text-lg font-syne font-bold text-text-primary flex items-center gap-2">
              <Calendar className="w-5 h-5 text-accent" />
              Assurance & Contrôle Technique
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <span className="text-xs text-text-secondary uppercase tracking-wider block">N° Assurance</span>
                <span className="font-mono text-base text-text-primary mt-1 block">
                  {truck.insurance_number || 'Non renseigné'}
                </span>
              </div>
              <div>
                <span className="text-xs text-text-secondary uppercase tracking-wider block">Expiration Assurance</span>
                <span className="text-base text-text-primary mt-1 block">
                  {truck.insurance_expiry ? new Date(truck.insurance_expiry).toLocaleDateString('fr-FR') : 'Non renseignée'}
                </span>
              </div>
              <div>
                <span className="text-xs text-text-secondary uppercase tracking-wider block">Visite Technique</span>
                <span className="text-base text-text-primary mt-1 block">
                  {truck.tech_visit_expiry ? new Date(truck.tech_visit_expiry).toLocaleDateString('fr-FR') : 'Non renseignée'}
                </span>
              </div>
            </div>
          </div>

          {/* Section Notes */}
          {truck.notes && (
            <div className="bg-bg-card rounded-2xl border border-border-base p-6 shadow-sm space-y-3">
              <h3 className="text-lg font-syne font-bold text-text-primary flex items-center gap-2">
                <FileText className="w-5 h-5 text-accent" />
                Notes
              </h3>
              <p className="text-sm text-text-secondary whitespace-pre-wrap">{truck.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
