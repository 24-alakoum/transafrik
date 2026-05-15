'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { voyageSchema, type VoyageInput } from '@/lib/validations/voyage'
import { createVoyageAction } from '../actions'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

export default function NouveauVoyagePage() {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  
  // States for dropdowns
  const [clients, setClients] = React.useState<any[]>([])
  const [trucks, setTrucks] = React.useState<any[]>([])
  const [drivers, setDrivers] = React.useState<any[]>([])

  React.useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const [
        { data: cData },
        { data: tData },
        { data: dData }
      ] = await Promise.all([
        supabase.from('clients').select('id, name').eq('is_active', true),
        supabase.from('trucks').select('id, plate').eq('status', 'available'),
        supabase.from('drivers').select('id, full_name').eq('status', 'available')
      ])
      
      setClients(cData || [])
      setTrucks(tData || [])
      setDrivers(dData || [])
    }
    fetchData()
  }, [])

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<VoyageInput>({
    resolver: zodResolver(voyageSchema),
    defaultValues: {
      status: 'draft',
      revenue_fcfa: 0,
      cargo_weight_kg: 0
    }
  })

  const onSubmit = (data: VoyageInput) => {
    startTransition(async () => {
      // Nettoyage des chaînes vides pour les UUIDs
      const payload = { ...data }
      if (!payload.client_id) payload.client_id = null
      if (!payload.truck_id) payload.truck_id = null
      if (!payload.driver_id) payload.driver_id = null

      const result = await createVoyageAction(payload)
      
      if (!result.success && result.error) {
        if ('_global' in result.error) {
          toast.error(result.error._global)
        } else {
          Object.entries(result.error).forEach(([field, messages]) => {
            setError(field as keyof VoyageInput, { type: 'server', message: messages?.[0] })
          })
        }
      } else if (result.success) {
        toast.success('Voyage créé avec succès')
        router.push(`/dashboard/voyages/${result.tripId}`)
      }
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/voyages">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-syne font-bold text-text-primary">Nouveau Voyage</h1>
          <p className="text-text-secondary text-sm">Créez un nouveau dossier d'expédition</p>
        </div>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              {...register('departure_date')}
              type="date"
              label="Date de départ prévue"
              error={errors.departure_date?.message}
            />
            <Input
              {...register('arrival_date')}
              type="date"
              label="Date d'arrivée prévue"
              error={errors.arrival_date?.message}
            />
          </div>
        </div>

        {/* Section Affection */}
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
                {trucks.map(t => <option key={t.id} value={t.id}>{t.plate}</option>)}
              </select>
            </div>

            <div className="form-control w-full">
              <label className="label pt-0"><span className="label-text text-text-secondary font-medium">Chauffeur</span></label>
              <select {...register('driver_id')} className="select select-bordered bg-bg-surface border-border-base w-full">
                <option value="">Sélectionner un chauffeur</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Section Marchandise & Finance */}
        <div className="bg-bg-card rounded-2xl p-6 border border-border-base shadow-sm space-y-4">
          <h2 className="text-lg font-syne font-semibold text-text-primary mb-4">Marchandise & Finances</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              {...register('cargo_type')}
              label="Type de marchandise"
              placeholder="Ex: Ciment"
            />
            <Input
              {...register('cargo_weight_kg')}
              type="number"
              label="Poids (kg)"
            />
            <Input
              {...register('revenue_fcfa')}
              type="number"
              label="Revenu estimé (FCFA)"
              error={errors.revenue_fcfa?.message}
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
          <Link href="/dashboard/voyages">
            <Button variant="ghost" type="button">Annuler</Button>
          </Link>
          <Button type="submit" isLoading={isPending}>
            <Save className="w-4 h-4 mr-2" />
            Créer le voyage
          </Button>
        </div>
      </form>
    </div>
  )
}
