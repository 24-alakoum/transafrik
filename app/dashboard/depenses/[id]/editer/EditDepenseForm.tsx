'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { depenseSchema, type DepenseInput } from '@/lib/validations/depense'
import { updateDepenseAction } from '../../actions'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { FileUpload } from '@/components/ui/FileUpload'

export function EditDepenseForm({ initialData, depenseId }: { initialData: any, depenseId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  
  const [trips, setTrips] = React.useState<any[]>([])
  const [trucks, setTrucks] = React.useState<any[]>([])

  React.useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const [
        { data: tripsData },
        { data: trucksData }
      ] = await Promise.all([
        supabase.from('trips').select('id, reference').order('created_at', { ascending: false }).limit(50),
        supabase.from('trucks').select('id, plate').order('created_at', { ascending: false })
      ])
      
      setTrips(tripsData || [])
      setTrucks(trucksData || [])
    }
    fetchData()
  }, [])

  const {
    register,
    handleSubmit,
    setError,
    setValue,
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
      receipt_size: initialData.receipt_size || null
    }
  })

  const onSubmit = (data: DepenseInput) => {
    startTransition(async () => {
      const payload = { ...data }
      if (!payload.trip_id) payload.trip_id = null
      if (!payload.truck_id) payload.truck_id = null

      const result = await updateDepenseAction(depenseId, payload)
      
      if (!result.success && result.error) {
        if ('_global' in result.error) {
          toast.error(result.error._global)
        } else {
          Object.entries(result.error).forEach(([field, messages]) => {
            setError(field as keyof DepenseInput, { type: 'server', message: messages?.[0] })
          })
        }
      } else if (result.success) {
        toast.success('Dépense mise à jour avec succès')
        router.push(`/dashboard/depenses`)
        router.refresh()
      }
    })
  }

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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="bg-bg-card rounded-2xl p-6 border border-border-base shadow-sm space-y-4">
          <h2 className="text-lg font-syne font-semibold text-text-primary mb-4">Informations générales</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control w-full">
              <label className="label pt-0"><span className="label-text text-text-secondary font-medium">Catégorie *</span></label>
              <select {...register('category')} className="select select-bordered bg-bg-surface border-border-base w-full">
                <option value="carburant">Carburant</option>
                <option value="maintenance">Maintenance</option>
                <option value="peage">Péage</option>
                <option value="salaire">Salaire</option>
                <option value="assurance">Assurance</option>
                <option value="amende">Amende</option>
                <option value="parking">Parking</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <Input
              {...register('amount_fcfa')}
              type="number"
              label="Montant (FCFA) *"
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
          <h2 className="text-lg font-syne font-semibold text-text-primary mb-4">Affectation (Optionnel)</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control w-full">
              <label className="label pt-0"><span className="label-text text-text-secondary font-medium">Lier à un voyage</span></label>
              <select {...register('trip_id')} className="select select-bordered bg-bg-surface border-border-base w-full">
                <option value="">Aucun voyage</option>
                {trips.map(t => <option key={t.id} value={t.id}>{t.reference}</option>)}
              </select>
            </div>
            <div className="form-control w-full">
              <label className="label pt-0"><span className="label-text text-text-secondary font-medium">Lier à un camion</span></label>
              <select {...register('truck_id')} className="select select-bordered bg-bg-surface border-border-base w-full">
                <option value="">Aucun camion</option>
                {trucks.map(t => <option key={t.id} value={t.id}>{t.plate}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link href="/dashboard/depenses">
            <Button variant="ghost" type="button">Annuler</Button>
          </Link>
          <Button type="submit" isLoading={isPending}>
            <Save className="w-4 h-4 mr-2" />
            Enregistrer
          </Button>
        </div>
      </form>
    </div>
  )
}
