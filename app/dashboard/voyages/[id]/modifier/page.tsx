'use client'

import * as React from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { voyageSchema, type VoyageInput } from '@/lib/validations/voyage'
import { updateVoyageAction } from '../../actions'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useClients, useCamions, useChauffeurs, useVoyage } from '@/lib/queries/hooks'
import { queryKeys } from '@/lib/queries/keys'
import { Modal } from '@/components/ui/Modal'
import { deleteVoyageAction } from '../../actions'

export default function ModifierVoyagePage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const queryClient = useQueryClient()
  const [isPending, startTransition] = React.useTransition()
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [showDeleteModal, setShowDeleteModal] = React.useState(false)

  // Fetching single voyage and options
  const { data: tripData, isLoading: isLoadingTrip } = useVoyage(id)
  const { data: clientsData } = useClients()
  const { data: trucksData } = useCamions()
  const { data: driversData } = useChauffeurs()

  const trip = tripData?.data
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
    defaultValues: {
      status: 'draft',
      revenue_fcfa: 0,
      cargo_weight_kg: 0,
    },
  })

  // Pre-fill form when trip data is loaded
  React.useEffect(() => {
    if (trip) {
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
  }, [trip, reset])

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
    startTransition(async () => {
      const payload = { ...data }
      if (!payload.client_id) payload.client_id = null
      if (!payload.truck_id) payload.truck_id = null
      if (!payload.driver_id) payload.driver_id = null

      const result = await updateVoyageAction(id, payload)

      if (!result.success && result.error) {
        if ('_global' in result.error) {
          toast.error(result.error._global)
        } else {
          Object.entries(result.error).forEach(([field, messages]) => {
            setError(field as keyof VoyageInput, { type: 'server', message: messages?.[0] })
          })
        }
      } else if (result.success) {
        toast.success('Voyage mis à jour avec succès')
        queryClient.invalidateQueries({ queryKey: queryKeys.voyages.all() })
        router.push(`/dashboard/voyages/${id}`)
      }
    })
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    const result = await deleteVoyageAction(id)
    setIsDeleting(false)

    if (result.success) {
      toast.success('Voyage supprimé avec succès')
      queryClient.invalidateQueries({ queryKey: queryKeys.voyages.all() })
      router.push('/dashboard/voyages')
    } else {
      toast.error(result.error || 'Erreur lors de la suppression')
    }
  }

  if (isLoadingTrip) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-8 bg-bg-card rounded-lg w-48 animate-pulse" />
        <TableSkeleton rows={8} cols={2} />
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <h2 className="text-xl font-bold text-text-primary">Voyage introuvable</h2>
        <p className="text-text-secondary mt-2">Le voyage que vous essayez d'éditer n'existe pas.</p>
        <Link href="/dashboard/voyages" className="mt-4 inline-block">
          <Button variant="outline">Retour à la liste</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/voyages/${id}`}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-syne font-bold text-text-primary">
              Modifier le voyage {trip.reference}
            </h1>
            <p className="text-text-secondary text-sm">Mettez à jour les informations du dossier d'expédition</p>
          </div>
        </div>

        <Button
          variant="outline"
          className="text-danger border-danger/30 hover:bg-danger/10"
          onClick={() => setShowDeleteModal(true)}
        >
          <Trash2 className="w-4 h-4 mr-2" /> Supprimer
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Section Trajet */}
        <div className="bg-bg-card rounded-2xl p-6 border border-border-base shadow-sm space-y-4">
          <h2 className="text-lg font-syne font-semibold text-text-primary mb-4">Informations du trajet</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              {...register('origin')}
              label="Lieu de départ *"
              placeholder="Ex: Bamako, Mali"
              error={errors.origin?.message}
            />
            <Input
              {...register('destination')}
              label="Lieu d'arrivée *"
              placeholder="Ex: Dakar, Sénégal"
              error={errors.destination?.message}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              {...register('departure_date')}
              type="date"
              label="Départ Bamako"
              error={errors.departure_date?.message}
            />
            <Input
              {...register('port_arrival_date')}
              type="date"
              label="Arrivée au port"
              error={errors.port_arrival_date?.message}
            />
            <Input
              {...register('port_departure_date')}
              type="date"
              label="Sortie du port"
              error={errors.port_departure_date?.message}
            />
            <Input
              {...register('arrival_date')}
              type="date"
              label="Retour Bamako"
              error={errors.arrival_date?.message}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              {...register('aller_days')}
              type="number"
              label="Jours (Aller)"
              placeholder="Auto calculé"
              error={errors.aller_days?.message}
            />
            <Input
              {...register('retour_days')}
              type="number"
              label="Jours (Retour)"
              placeholder="Auto calculé"
              error={errors.retour_days?.message}
            />
            <div className="form-control w-full">
              <label className="label pt-0"><span className="label-text text-text-secondary font-medium">Statut du voyage</span></label>
              <select {...register('status')} className="select select-bordered bg-bg-surface border-border-base w-full">
                <option value="draft">Brouillon</option>
                <option value="loading">En chargement</option>
                <option value="in_transit">En transit</option>
                <option value="delivered">Livré</option>
                <option value="cancelled">Annulé</option>
                <option value="disputed">Litigieux</option>
              </select>
              {errors.status && <span className="text-danger text-xs mt-1">{errors.status.message}</span>}
            </div>
          </div>
        </div>

        {/* Section Affectations */}
        <div className="bg-bg-card rounded-2xl p-6 border border-border-base shadow-sm space-y-4">
          <h2 className="text-lg font-syne font-semibold text-text-primary mb-4">Affectations</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="form-control w-full">
              <label className="label pt-0"><span className="label-text text-text-secondary font-medium">Client</span></label>
              <select {...register('client_id')} className="select select-bordered bg-bg-surface border-border-base w-full">
                <option value="">Sélectionner un client</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errors.client_id && <span className="text-danger text-xs mt-1">{errors.client_id.message}</span>}
            </div>

            <div className="form-control w-full">
              <label className="label pt-0"><span className="label-text text-text-secondary font-medium">Camion</span></label>
              <select {...register('truck_id')} className="select select-bordered bg-bg-surface border-border-base w-full">
                <option value="">Sélectionner un camion</option>
                {trucks.map(t => <option key={t.id} value={t.id}>{t.plate} ({t.brand || 'Sans marque'})</option>)}
              </select>
              {errors.truck_id && <span className="text-danger text-xs mt-1">{errors.truck_id.message}</span>}
            </div>

            <div className="form-control w-full">
              <label className="label pt-0"><span className="label-text text-text-secondary font-medium">Chauffeur</span></label>
              <select {...register('driver_id')} className="select select-bordered bg-bg-surface border-border-base w-full">
                <option value="">Sélectionner un chauffeur</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
              </select>
              {errors.driver_id && <span className="text-danger text-xs mt-1">{errors.driver_id.message}</span>}
            </div>
          </div>
        </div>

        {/* Section Marchandise & Finances */}
        <div className="bg-bg-card rounded-2xl p-6 border border-border-base shadow-sm space-y-4">
          <h2 className="text-lg font-syne font-semibold text-text-primary mb-4">Marchandise & Finances</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              {...register('cargo_type')}
              label="Type de marchandise"
              placeholder="Ex: Ciment"
              error={errors.cargo_type?.message}
            />
            <Input
              {...register('cargo_weight_kg')}
              type="number"
              label="Poids (kg)"
              error={errors.cargo_weight_kg?.message}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              {...register('revenue_fcfa')}
              type="number"
              label="Revenu estimé (FCFA)"
              error={errors.revenue_fcfa?.message}
            />
            <Input
              {...register('frais_aller_fcfa')}
              type="number"
              label="Frais aller prévus (FCFA)"
              error={errors.frais_aller_fcfa?.message}
            />
            <Input
              {...register('frais_retour_fcfa')}
              type="number"
              label="Frais retour prévus (FCFA)"
              error={errors.frais_retour_fcfa?.message}
            />
          </div>

          <div className="form-control w-full">
            <label className="label pt-0"><span className="label-text text-text-secondary font-medium">Notes & Instructions</span></label>
            <textarea
              {...register('notes')}
              className="textarea textarea-bordered bg-bg-surface border-border-base h-24"
              placeholder="Instructions pour le chauffeur..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link href={`/dashboard/voyages/${id}`}>
            <Button variant="ghost" type="button">Annuler</Button>
          </Link>
          <Button type="submit" isLoading={isPending}>
            <Save className="w-4 h-4 mr-2" />
            Enregistrer les modifications
          </Button>
        </div>
      </form>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Supprimer le voyage"
        footer={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>Annuler</Button>
            <Button variant="outline" className="bg-danger/10 text-danger border-danger/30 hover:bg-danger/20" isLoading={isDeleting} onClick={handleDelete}>
              Confirmer la suppression
            </Button>
          </div>
        }
      >
        <p className="text-text-secondary text-sm">
          Êtes-vous sûr de vouloir supprimer le voyage <strong className="text-text-primary">{trip.reference}</strong> ?
          Cette action est irréversible.
        </p>
      </Modal>
    </div>
  )
}
