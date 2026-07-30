'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { camionSchema, type CamionInput } from '@/lib/validations/camion'
import { updateCamionAction } from '../../actions'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

export function EditCamionForm({ initialData, camionId }: { initialData: any, camionId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CamionInput>({
    resolver: zodResolver(camionSchema) as any,
    defaultValues: {
      plate: initialData.plate || '',
      chassis_number: initialData.chassis_number || '',
      brand: initialData.brand || '',
      model: initialData.model || '',
      year: initialData.year || undefined,
      type: initialData.type || 'camion',
      capacity_kg: initialData.capacity_kg || undefined,
      fuel_type: initialData.fuel_type || 'diesel',
      status: initialData.status || 'available',
      insurance_number: initialData.insurance_number || '',
      insurance_expiry: initialData.insurance_expiry ? initialData.insurance_expiry.split('T')[0] : '',
      tech_visit_expiry: initialData.tech_visit_expiry ? initialData.tech_visit_expiry.split('T')[0] : '',
      notes: initialData.notes || '',
    }
  })

  const onSubmit = (data: CamionInput) => {
    startTransition(async () => {
      const result = await updateCamionAction(camionId, data)
      
      if (!result.success && result.error) {
        if ('_global' in result.error) {
          toast.error(result.error._global)
        } else {
          Object.entries(result.error).forEach(([field, messages]) => {
            setError(field as keyof CamionInput, { type: 'server', message: (messages as string[])?.[0] })
          })
        }
      } else if (result.success) {
        toast.success('Camion modifié avec succès')
        router.push(`/dashboard/camions`)
        router.refresh()
      }
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/camions">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-syne font-bold text-text-primary">Modifier Camion</h1>
          <p className="text-text-secondary text-sm">Modifiez les informations du véhicule {initialData.plate}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="bg-bg-card rounded-2xl p-6 border border-border-base shadow-sm space-y-4">
          <h2 className="text-lg font-syne font-semibold text-text-primary mb-4">Informations principales</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              {...register('plate')}
              label="Immatriculation *"
              placeholder="Ex: AB-1234-C"
              error={errors.plate?.message}
            />
            <Input
              {...register('chassis_number')}
              label="Numéro de châssis"
              placeholder="Ex: WBA00000000000"
              error={errors.chassis_number?.message}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              {...register('brand')}
              label="Marque"
              placeholder="Ex: Volvo"
            />
            <Input
              {...register('model')}
              label="Modèle"
              placeholder="Ex: FH16"
            />
            <Input
              {...register('year', { valueAsNumber: true })}
              type="number"
              label="Année"
              placeholder="Ex: 2020"
              error={errors.year?.message}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="form-control w-full">
              <label className="label pt-0"><span className="label-text text-text-secondary font-medium">Type</span></label>
              <select {...register('type')} className="select select-bordered bg-bg-surface border-border-base w-full">
                <option value="camion">Camion</option>
                <option value="camionnette">Camionnette</option>
                <option value="remorque">Remorque</option>
                <option value="tracteur">Tracteur</option>
                <option value="pickup">Pickup</option>
              </select>
            </div>
            <Input
              {...register('capacity_kg', { valueAsNumber: true })}
              type="number"
              label="Capacité (kg)"
              error={errors.capacity_kg?.message}
            />
            <div className="form-control w-full">
              <label className="label pt-0"><span className="label-text text-text-secondary font-medium">Carburant</span></label>
              <select {...register('fuel_type')} className="select select-bordered bg-bg-surface border-border-base w-full">
                <option value="diesel">Diesel</option>
                <option value="essence">Essence</option>
                <option value="hybride">Hybride</option>
                <option value="electrique">Électrique</option>
              </select>
            </div>
          </div>

          <div className="form-control w-full">
            <label className="label pt-0"><span className="label-text text-text-secondary font-medium">Statut</span></label>
            <select {...register('status')} className="select select-bordered bg-bg-surface border-border-base w-full">
              <option value="available">Disponible</option>
              <option value="in_transit">En Transit</option>
              <option value="maintenance">En Maintenance</option>
              <option value="inactive">Inactif</option>
            </select>
          </div>
        </div>

        <div className="bg-bg-card rounded-2xl p-6 border border-border-base shadow-sm space-y-4">
          <h2 className="text-lg font-syne font-semibold text-text-primary mb-4">Assurance & Visite Technique</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              {...register('insurance_number')}
              label="N° Assurance"
              placeholder="Ex: AS-9029"
            />
            <Input
              {...register('insurance_expiry')}
              type="date"
              label="Expiration Assurance"
              error={errors.insurance_expiry?.message}
            />
            <Input
              {...register('tech_visit_expiry')}
              type="date"
              label="Expiration Visite Tech."
              error={errors.tech_visit_expiry?.message}
            />
          </div>
          
          <div className="form-control w-full">
            <label className="label pt-0"><span className="label-text text-text-secondary font-medium">Notes additionnelles</span></label>
            <textarea 
              {...register('notes')} 
              className="textarea textarea-bordered bg-bg-surface border-border-base h-24" 
              placeholder="Informations supplémentaires..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link href="/dashboard/camions">
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
