'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { voyageSchema, type VoyageInput } from '@/lib/validations/voyage'
import { updateVoyageAction } from '@/app/dashboard/voyages/actions'
import { useClients, useCamions, useChauffeurs } from '@/lib/queries/hooks'
import { queryKeys } from '@/lib/queries/keys'
import { Save } from 'lucide-react'

interface EditVoyageModalProps {
  isOpen: boolean
  onClose: () => void
  trip: any
}

export function EditVoyageModal({ isOpen, onClose, trip }: EditVoyageModalProps) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = React.useTransition()

  const { data: clientsData } = useClients()
  const { data: trucksData } = useCamions()
  const { data: driversData } = useChauffeurs()

  const clients = clientsData?.data || []
  const trucks = trucksData?.data || []
  const drivers = driversData?.data || []

  const {
    register,
    handleSubmit,
    setError,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<VoyageInput>({
    resolver: zodResolver(voyageSchema) as any,
  })

  React.useEffect(() => {
    if (trip && isOpen) {
      reset({
        origin: trip.origin || '',
        destination: trip.destination || '',
        client_id: trip.client_id || '',
        truck_id: trip.truck_id || '',
        driver_id: trip.driver_id || '',
        cargo_type: trip.cargo_type || '',
        cargo_weight_kg: trip.cargo_weight_kg ?? 0,
        departure_date: trip.departure_date || '',
        port_arrival_date: trip.port_arrival_date || '',
        port_departure_date: trip.port_departure_date || '',
        arrival_date: trip.arrival_date || '',
        aller_days: trip.aller_days ?? undefined,
        retour_days: trip.retour_days ?? undefined,
        revenue_fcfa: trip.revenue_fcfa ?? 0,
        frais_aller_fcfa: trip.frais_aller_fcfa ?? 0,
        frais_retour_fcfa: trip.frais_retour_fcfa ?? 0,
        status: trip.status || 'draft',
        notes: trip.notes || '',
      })
    }
  }, [trip, isOpen, reset])

  const dep = watch('departure_date')
  const pArr = watch('port_arrival_date')
  const pDep = watch('port_departure_date')
  const arr = watch('arrival_date')

  React.useEffect(() => {
    if (dep && pArr) {
      const ms = new Date(pArr).getTime() - new Date(dep).getTime()
      setValue('aller_days', Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24))))
    }
  }, [dep, pArr, setValue])

  React.useEffect(() => {
    if (pDep && arr) {
      const ms = new Date(arr).getTime() - new Date(pDep).getTime()
      setValue('retour_days', Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24))))
    }
  }, [pDep, arr, setValue])

  const onSubmit = (data: VoyageInput) => {
    if (!trip?.id) return

    startTransition(async () => {
      const payload = { ...data }
      if (!payload.client_id) payload.client_id = null
      if (!payload.truck_id) payload.truck_id = null
      if (!payload.driver_id) payload.driver_id = null

      const result = await updateVoyageAction(trip.id, payload)

      if (!result.success && result.error) {
        if (typeof result.error === 'object' && '_global' in result.error) {
          toast.error(result.error._global)
        } else if (typeof result.error === 'object') {
          Object.entries(result.error).forEach(([field, messages]) => {
            setError(field as keyof VoyageInput, { type: 'server', message: (messages as string[])?.[0] })
          })
        }
      } else if (result.success) {
        toast.success('Voyage mis à jour avec succès')
        queryClient.invalidateQueries({ queryKey: queryKeys.voyages.all() })
        onClose()
      }
    })
  }

  if (!trip) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Éditer voyage : ${trip.reference}`}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Trajet */}
        <div className="space-y-4">
          <h3 className="text-sm font-syne font-semibold text-text-secondary uppercase tracking-wider">
            Itinéraire
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              {...register('origin')}
              label="Origine *"
              placeholder="Ex: Bamako"
              error={errors.origin?.message}
            />
            <Input
              {...register('destination')}
              label="Destination *"
              placeholder="Ex: Dakar"
              error={errors.destination?.message}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Input
              {...register('departure_date')}
              type="date"
              label="Départ"
              error={errors.departure_date?.message}
            />
            <Input
              {...register('port_arrival_date')}
              type="date"
              label="Arrivée Port"
              error={errors.port_arrival_date?.message}
            />
            <Input
              {...register('port_departure_date')}
              type="date"
              label="Départ Port"
              error={errors.port_departure_date?.message}
            />
            <Input
              {...register('arrival_date')}
              type="date"
              label="Retour"
              error={errors.arrival_date?.message}
            />
          </div>
        </div>

        {/* Statut & Intervenants */}
        <div className="space-y-4 pt-2 border-t border-border-base">
          <h3 className="text-sm font-syne font-semibold text-text-secondary uppercase tracking-wider">
            Statut & Affectations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="form-control w-full">
              <label className="label pt-0"><span className="label-text text-text-secondary text-xs font-medium">Statut</span></label>
              <select {...register('status')} className="select select-sm select-bordered bg-bg-surface border-border-base w-full">
                <option value="draft">Brouillon</option>
                <option value="loading">En chargement</option>
                <option value="in_transit">En transit</option>
                <option value="delivered">Livré</option>
                <option value="cancelled">Annulé</option>
                <option value="disputed">Litigieux</option>
              </select>
            </div>

            <div className="form-control w-full">
              <label className="label pt-0"><span className="label-text text-text-secondary text-xs font-medium">Client</span></label>
              <select {...register('client_id')} className="select select-sm select-bordered bg-bg-surface border-border-base w-full">
                <option value="">Sélectionner</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="form-control w-full">
              <label className="label pt-0"><span className="label-text text-text-secondary text-xs font-medium">Camion</span></label>
              <select {...register('truck_id')} className="select select-sm select-bordered bg-bg-surface border-border-base w-full">
                <option value="">Sélectionner</option>
                {trucks.map(t => <option key={t.id} value={t.id}>{t.plate}</option>)}
              </select>
            </div>

            <div className="form-control w-full">
              <label className="label pt-0"><span className="label-text text-text-secondary text-xs font-medium">Chauffeur</span></label>
              <select {...register('driver_id')} className="select select-sm select-bordered bg-bg-surface border-border-base w-full">
                <option value="">Sélectionner</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Cargo & Finances */}
        <div className="space-y-4 pt-2 border-t border-border-base">
          <h3 className="text-sm font-syne font-semibold text-text-secondary uppercase tracking-wider">
            Marchandise & Finances
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              {...register('cargo_type')}
              label="Marchandise"
              placeholder="Ex: Ciment, Conteneur..."
              error={errors.cargo_type?.message}
            />
            <Input
              {...register('cargo_weight_kg')}
              type="number"
              label="Poids (kg)"
              error={errors.cargo_weight_kg?.message}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              {...register('revenue_fcfa')}
              type="number"
              label="Revenu (FCFA)"
              error={errors.revenue_fcfa?.message}
            />
            <Input
              {...register('frais_aller_fcfa')}
              type="number"
              label="Frais aller (FCFA)"
              error={errors.frais_aller_fcfa?.message}
            />
            <Input
              {...register('frais_retour_fcfa')}
              type="number"
              label="Frais retour (FCFA)"
              error={errors.frais_retour_fcfa?.message}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border-base">
          <Button variant="ghost" type="button" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" isLoading={isPending}>
            <Save className="w-4 h-4 mr-2" />
            Enregistrer
          </Button>
        </div>
      </form>
    </Modal>
  )
}
