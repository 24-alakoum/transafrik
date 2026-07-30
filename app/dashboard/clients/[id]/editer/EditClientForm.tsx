'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { clientSchema, type ClientInput } from '@/lib/validations/client'
import { updateClientAction } from '../../actions'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

export function EditClientForm({ initialData, clientId }: { initialData: any, clientId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ClientInput>({
    resolver: zodResolver(clientSchema) as any,
    defaultValues: {
      name: initialData.name || '',
      sector: initialData.sector || '',
      contact_person: initialData.contact_person || '',
      email: initialData.email || '',
      phone: initialData.phone || '',
      address: initialData.address || '',
      city: initialData.city || '',
      country: initialData.country || '',
      payment_terms_days: initialData.payment_terms_days || 30,
      credit_limit_fcfa: initialData.credit_limit_fcfa || null,
      is_active: initialData.is_active ?? true,
      notes: initialData.notes || '',
    }
  })

  const onSubmit = (data: ClientInput) => {
    startTransition(async () => {
      const result = await updateClientAction(clientId, data)
      
      if (!result.success && result.error) {
        if ('_global' in result.error) {
          toast.error(result.error._global)
        } else {
          Object.entries(result.error).forEach(([field, messages]) => {
            setError(field as keyof ClientInput, { type: 'server', message: messages?.[0] })
          })
        }
      } else if (result.success) {
        toast.success('Client mis à jour avec succès')
        router.push(`/dashboard/clients/${clientId}`)
        router.refresh()
      }
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/clients/${clientId}`}>
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-syne font-bold text-text-primary">Modifier le Client</h1>
          <p className="text-text-secondary text-sm">Modifiez les informations de {initialData.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="bg-bg-card rounded-2xl p-6 border border-border-base shadow-sm space-y-4">
          <h2 className="text-lg font-syne font-semibold text-text-primary mb-4">Informations générales</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              {...register('name')}
              label="Nom de l'entreprise ou du client *"
              placeholder="Ex: Entreprise S.A."
              error={errors.name?.message}
            />
            <Input
              {...register('sector')}
              label="Secteur d'activité"
              placeholder="Ex: Construction"
              error={errors.sector?.message}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              {...register('contact_person')}
              label="Personne de contact"
              placeholder="Ex: Jean Dupont"
              error={errors.contact_person?.message}
            />
            <Input
              {...register('email')}
              type="email"
              label="Email"
              placeholder="Ex: contact@entreprise.com"
              error={errors.email?.message}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              {...register('phone')}
              label="Téléphone"
              placeholder="Ex: +223 70 00 00 00"
              error={errors.phone?.message}
            />
            <Input
              {...register('address')}
              label="Adresse complète"
              placeholder="Ex: Bamako, ACI 2000"
              error={errors.address?.message}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              {...register('city')}
              label="Ville"
              placeholder="Ex: Bamako"
              error={errors.city?.message}
            />
            <Input
              {...register('country')}
              label="Pays"
              placeholder="Ex: Mali"
              error={errors.country?.message}
            />
          </div>

          <div className="form-control w-full">
            <label className="label pt-0">
              <span className="label-text text-text-secondary font-medium">Notes / Observations</span>
            </label>
            <textarea
              {...register('notes')}
              placeholder="Notes ou remarques particulières concernant ce client..."
              className="textarea textarea-bordered bg-bg-surface border-border-base focus:border-accent w-full min-h-[100px]"
            />
            {errors.notes && <span className="text-danger text-xs mt-1">{errors.notes.message}</span>}
          </div>
        </div>

        <div className="bg-bg-card rounded-2xl p-6 border border-border-base shadow-sm space-y-4">
          <h2 className="text-lg font-syne font-semibold text-text-primary mb-4">Paramètres financiers</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control w-full">
              <label className="label pt-0"><span className="label-text text-text-secondary font-medium">Délai de paiement (jours)</span></label>
              <select {...register('payment_terms_days', { valueAsNumber: true })} className="select select-bordered bg-bg-surface border-border-base w-full">
                <option value="7">7 jours</option>
                <option value="15">15 jours</option>
                <option value="30">30 jours</option>
                <option value="45">45 jours</option>
                <option value="60">60 jours</option>
                <option value="90">90 jours</option>
              </select>
            </div>
            <Input
              {...register('credit_limit_fcfa')}
              type="number"
              label="Limite de crédit (FCFA)"
              error={errors.credit_limit_fcfa?.message}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link href={`/dashboard/clients/${clientId}`}>
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
