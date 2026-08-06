'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { chauffeurSchema, type ChauffeurInput } from '@/lib/validations/chauffeur'
import { updateChauffeurAction } from '../../actions'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

export function EditChauffeurForm({ initialData, chauffeurId }: { initialData: any, chauffeurId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ChauffeurInput>({
    resolver: zodResolver(chauffeurSchema) as any,
    defaultValues: {
      full_name: initialData.full_name || '',
      phone: initialData.phone || '',
      email: initialData.email || '',
      national_id: initialData.national_id || '',
      birth_date: initialData.birth_date || '',
      address: initialData.address || '',
      license_number: initialData.license_number || '',
      license_expiry: initialData.license_expiry || '',
      monthly_salary: initialData.monthly_salary || 0,
      emergency_contact: initialData.emergency_contact || '',
      status: initialData.status || 'available',
    
    }
  })

  const onSubmit = (data: ChauffeurInput) => {
    startTransition(async () => {
      const result = await updateChauffeurAction(chauffeurId, data)
      
      if (!result.success && result.error) {
        if ('_global' in result.error) {
          toast.error(result.error._global as string)
        } else {
          Object.entries(result.error).forEach(([field, messages]) => {
            const msgs = messages as string[]
            setError(field as keyof ChauffeurInput, { type: 'server', message: msgs?.[0] })
          })
        }
      } else if (result.success) {
        toast.success('Chauffeur modifié avec succès')
        router.push(`/dashboard/chauffeurs`)
        router.refresh()
      }
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/chauffeurs">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-syne font-bold text-text-primary">Modifier le Chauffeur</h1>
          <p className="text-text-secondary text-sm">Mettez à jour les informations du conducteur</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="bg-bg-card rounded-2xl p-6 border border-border-base shadow-sm space-y-4">
          <h2 className="text-lg font-syne font-semibold text-text-primary mb-4">Informations personnelles</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              {...register('full_name')}
              label="Nom complet *"
              placeholder="Ex: Amadou Diallo"
              error={errors.full_name?.message}
            />
            <Input
              {...register('phone')}
              label="Téléphone *"
              placeholder="Ex: +223 70 00 00 00"
              error={errors.phone?.message}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              {...register('email')}
              type="email"
              label="Email"
              placeholder="Ex: amadou@example.com"
              error={errors.email?.message}
            />
            <Input
              {...register('national_id')}
              label="N° Pièce d'identité (Chiffré)"
              placeholder="Ex: CI-000000"
              error={errors.national_id?.message}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <Input
              {...register('birth_date')}
              type="date"
              label="Date de naissance"
              error={errors.birth_date?.message}
            />
            <Input
              {...register('address')}
              label="Adresse complète"
              placeholder="Ex: Bamako, ACI 2000"
              error={errors.address?.message}
            />
          </div>
        </div>

        <div className="bg-bg-card rounded-2xl p-6 border border-border-base shadow-sm space-y-4">
          <h2 className="text-lg font-syne font-semibold text-text-primary mb-4">Permis & Contrat</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              {...register('license_number')}
              label="N° Permis de conduire (Chiffré)"
              placeholder="Ex: P-12345678"
            />
            <Input
              {...register('license_expiry')}
              type="date"
              label="Expiration du permis"
              error={errors.license_expiry?.message}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              {...register('monthly_salary')}
              type="number"
              label="Salaire mensuel (FCFA)"
              error={errors.monthly_salary?.message}
            />
            <Input
              {...register('emergency_contact')}
              label="Contact d'urgence"
              placeholder="Nom et numéro"
              error={errors.emergency_contact?.message}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Statut
              </label>
              <select
                {...register('status')}
                className="w-full bg-bg-surface border border-border-base rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-accent text-text-primary"
              >
                <option value="available">Disponible</option>
                <option value="on_trip">En voyage</option>
                <option value="on_leave">Congé</option>
                <option value="inactive">Parti(e)</option>
              </select>
              {errors.status && <p className="mt-1 text-xs text-danger">{errors.status.message}</p>}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link href="/dashboard/chauffeurs">
            <Button variant="ghost" type="button">Annuler</Button>
          </Link>
          <Button type="submit" isLoading={isPending}>
            <Save className="w-4 h-4 mr-2" />
            Enregistrer les modifications
          </Button>
        </div>
      </form>
    </div>
  )
}
