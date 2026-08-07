'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queries/keys'
import { toast } from 'sonner'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { depenseSchema, type DepenseInput } from '@/lib/validations/depense'
import { updateDepenseAction } from '../../actions'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { FileUpload } from '@/components/ui/FileUpload'
import { useVoyages, useCamions } from '@/lib/queries/hooks'

const CATEGORIES = [
  { value: 'carburant', label: 'Carburant' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'peage', label: 'Péage' },
  { value: 'salaire', label: 'Salaire' },
  { value: 'assurance', label: 'Assurance' },
  { value: 'amende', label: 'Amende' },
  { value: 'parking', label: 'Parking' },
  { value: 'frais_aller', label: '🡒 Frais Aller (Voyage)' },
  { value: 'frais_retour', label: '🡐 Frais Retour (Voyage)' },
  { value: 'autre', label: 'Autre' },
]

export function EditDepenseForm({ initialData, depenseId }: { initialData: any, depenseId: string }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const { data: voyagesData, isLoading: loadingVoyages } = useVoyages({ pageSize: 100 })
  const { data: camionsData, isLoading: loadingCamions } = useCamions()

  const trips = voyagesData?.data || []
  const trucks = camionsData?.data || []

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DepenseInput>({
    resolver: zodResolver(depenseSchema) as any,
    defaultValues: {
      category: initialData.category || 'autre',
      amount_fcfa: initialData.amount_fcfa || 0,
      date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : '',
      description: initialData.description || '',
      trip_id: initialData.trip_id || null,
      truck_id: initialData.truck_id || null,
      is_reimbursed: initialData.is_reimbursed ?? false,
      receipt_url: initialData.receipt_url || '',
      receipt_size: initialData.receipt_size || null,
    },
  })

  const selectedCategory = watch('category')
  const selectedTripId = watch('trip_id')

  React.useEffect(() => {
    if (!selectedTripId || !['frais_aller', 'frais_retour'].includes(selectedCategory || '')) return
    const trip = trips.find((t: any) => t.id === selectedTripId)
    if (!trip) return
    if (selectedCategory === 'frais_aller' && trip.frais_aller_fcfa) {
      setValue('amount_fcfa', Number(trip.frais_aller_fcfa))
    } else if (selectedCategory === 'frais_retour' && trip.frais_retour_fcfa) {
      setValue('amount_fcfa', Number(trip.frais_retour_fcfa))
    }
  }, [selectedCategory, selectedTripId, trips, setValue])

  const onSubmit = async (data: DepenseInput) => {
    setIsSubmitting(true)
    try {
      const payload = { ...data }
      if (!payload.trip_id) payload.trip_id = null
      if (!payload.truck_id) payload.truck_id = null

      const result = await updateDepenseAction(depenseId, payload)

      if (result.success) {
        toast.success('Dépense mise à jour avec succès')
        queryClient.invalidateQueries({ queryKey: queryKeys.depenses.all() })
        router.push(`/dashboard/depenses`)
      } else if (result.error) {
        setIsSubmitting(false)
        if ('_global' in result.error) {
          toast.error(result.error._global)
        } else {
          Object.entries(result.error).forEach(([field, messages]) => {
            setError(field as keyof DepenseInput, { type: 'server', message: (messages as string[])?.[0] })
          })
          toast.error('Veuillez corriger les erreurs dans le formulaire')
        }
      } else {
        setIsSubmitting(false)
        toast.error('Erreur inattendue, veuillez réessayer')
      }
    } catch (err: any) {
      setIsSubmitting(false)
      toast.error(err?.message || 'Erreur inattendue, veuillez réessayer')
    }
  }

  const onInvalid = () => {
    toast.error('Veuillez corriger les champs requis dans le formulaire')
  }

  const isFraisVoyage = ['frais_aller', 'frais_retour'].includes(selectedCategory || '')

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/depenses">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-syne font-bold text-text-primary">Modifier la Dépense</h1>
          <p className="text-text-secondary text-sm">Modifiez les informations de cette dépense</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-8">
        <div className="bg-bg-card rounded-2xl p-6 border border-border-base shadow-sm space-y-4">
          <h2 className="text-lg font-syne font-semibold text-text-primary mb-4">Informations générales</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control w-full">
              <label className="label pt-0"><span className="label-text text-text-secondary font-medium">Catégorie *</span></label>
              <select {...register('category')} className="select select-bordered bg-bg-surface border-border-base w-full">
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <Input
              {...register('amount_fcfa')}
              type="number"
              step="1"
              min="1"
              label={`Montant (FCFA) *${isFraisVoyage ? ' — Auto depuis voyage' : ''}`}
              error={errors.amount_fcfa?.message}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              {...register('date')}
              type="date"
              label="Date *"
              error={errors.date?.message}
            />
            <div className="form-control w-full flex flex-col justify-end">
              <label className="label cursor-pointer justify-start gap-3">
                <input type="checkbox" {...register('is_reimbursed')} className="checkbox checkbox-primary" />
                <span className="label-text">Cette dépense a-t-elle été remboursée ?</span>
              </label>
            </div>
          </div>

          <div className="form-control w-full">
            <label className="label pt-0"><span className="label-text text-text-secondary font-medium">Description</span></label>
            <textarea
              {...register('description')}
              className="textarea textarea-bordered bg-bg-surface border-border-base h-24"
              placeholder="Détails de la dépense..."
            />
            {errors.description && <p className="mt-1 text-xs text-danger">{errors.description.message}</p>}
          </div>

          <div className="form-control w-full">
            <label className="label pt-0"><span className="label-text text-text-secondary font-medium">Justificatif (Reçu / Facture)</span></label>
            {initialData.receipt_url && (
              <div className="mb-3 flex items-center gap-2 text-sm text-text-secondary">
                <span>Justificatif actuel :</span>
                <a href={initialData.receipt_url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline flex items-center gap-1 font-medium">
                  Voir le fichier actuel
                </a>
              </div>
            )}
            <FileUpload
              onUploadComplete={(url, size) => {
                setValue('receipt_url', url)
                setValue('receipt_size', size)
              }}
              onError={(err) => {
                toast.error(err)
              }}
            />
          </div>
        </div>

        <div className="bg-bg-card rounded-2xl p-6 border border-border-base shadow-sm space-y-4">
          <h2 className="text-lg font-syne font-semibold text-text-primary mb-2">Affectation (Optionnel)</h2>
          {isFraisVoyage && (
            <p className="text-xs text-accent bg-accent/10 rounded-lg px-3 py-2">
              💡 En sélectionnant un voyage, le montant sera auto-rempli depuis les frais {selectedCategory === 'frais_aller' ? 'aller' : 'retour'} prévisionnels.
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control w-full">
              <label className="label pt-0"><span className="label-text text-text-secondary font-medium">Lier à un voyage</span></label>
              <select
                {...register('trip_id')}
                disabled={loadingVoyages}
                className="select select-bordered bg-bg-surface border-border-base w-full"
              >
                <option value="">{loadingVoyages ? 'Chargement...' : 'Aucun voyage'}</option>
                {trips.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.reference} — {t.origin} → {t.destination}
                  </option>
                ))}
              </select>
              {errors.trip_id && <p className="mt-1 text-xs text-danger">{errors.trip_id.message}</p>}
            </div>
            <div className="form-control w-full">
              <label className="label pt-0"><span className="label-text text-text-secondary font-medium">Lier à un camion</span></label>
              <select
                {...register('truck_id')}
                disabled={loadingCamions}
                className="select select-bordered bg-bg-surface border-border-base w-full"
              >
                <option value="">{loadingCamions ? 'Chargement...' : 'Aucun camion'}</option>
                {trucks.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.plate} {t.brand ? `(${t.brand})` : ''}</option>
                ))}
              </select>
              {errors.truck_id && <p className="mt-1 text-xs text-danger">{errors.truck_id.message}</p>}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link href="/dashboard/depenses">
            <Button variant="ghost" type="button">Annuler</Button>
          </Link>
          <Button type="submit" isLoading={isSubmitting}>
            <Save className="w-4 h-4 mr-2" />
            Enregistrer
          </Button>
        </div>
      </form>
    </div>
  )
}

