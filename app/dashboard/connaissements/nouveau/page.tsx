'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { Ship, Plus, Trash2, Package, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toast } from 'sonner'
import { createBLAction } from '../actions'
import Link from 'next/link'

const CONTAINER_TYPES = ['20\'DC', '40\'DC', '40\'HC', '45\'HC', '20\'Reefer', '40\'Reefer', '20\'OT', '40\'OT']

export default function NouveauBLPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)

  const { register, handleSubmit, control, formState: { errors } } = useForm({
    defaultValues: {
      reference: '',
      vessel_name: '',
      voyage_number: '',
      port_of_loading: '',
      port_of_discharge: '',
      eta: '',
      arrival_date: '',
      client_id: '',
      free_time_demurrage_days: 3,
      free_time_detention_days: 7,
      status: 'en_attente',
      notes: '',
      containers: [{ container_number: '', type: "20'DC", seal_number: '', cargo_description: '', weight_kg: '', status: 'au_port' }]
    }
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'containers' })

  const onSubmit = async (data: any) => {
    setIsLoading(true)
    try {
      const result = await createBLAction(data)
      if (result.success) {
        toast.success('Connaissement créé avec succès !')
        router.push(`/dashboard/connaissements/${result.id}`)
      } else {
        toast.error(result.error || 'Erreur lors de la création')
      }
    } catch {
      toast.error('Erreur inattendue')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/connaissements">
          <button className="w-9 h-9 rounded-xl border border-border-base flex items-center justify-center text-text-secondary hover:text-accent hover:border-accent/40 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-syne font-bold text-text-primary">Nouveau Connaissement</h1>
          <p className="text-text-secondary mt-0.5">Enregistrez un nouveau BL avec ses conteneurs</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Infos BL */}
        <div className="bg-bg-card rounded-2xl border border-border-base p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Ship className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-lg font-syne font-semibold text-text-primary">Informations du Connaissement</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input {...register('reference', { required: true })} label="Référence BL *" placeholder="BL-2024-001" error={errors.reference ? 'Requis' : ''} />
            <Input {...register('vessel_name')} label="Nom du navire" placeholder="MSC DIANA" />
            <Input {...register('voyage_number')} label="N° de voyage" placeholder="0VY01234" />
            <Input {...register('port_of_loading')} label="Port de chargement" placeholder="Shanghai, CN" />
            <Input {...register('port_of_discharge')} label="Port de déchargement" placeholder="Dakar, SN" />
            <div className="form-control">
              <label className="label pt-0"><span className="label-text text-text-secondary font-medium">Statut</span></label>
              <select {...register('status')} className="select select-bordered bg-bg-surface border-border-base">
                <option value="en_attente">En attente</option>
                <option value="arrive">Arrivé</option>
                <option value="en_dedouanement">En dédouanement</option>
                <option value="disponible">Disponible</option>
                <option value="livre">Livré</option>
                <option value="termine">Terminé</option>
              </select>
            </div>
            <div className="form-control">
              <label className="label pt-0"><span className="label-text text-text-secondary font-medium">ETA prévu</span></label>
              <input type="date" {...register('eta')} className="input-base" />
            </div>
            <div className="form-control">
              <label className="label pt-0"><span className="label-text text-text-secondary font-medium">Date d'arrivée réelle</span></label>
              <input type="date" {...register('arrival_date')} className="input-base" />
            </div>
          </div>
        </div>

        {/* Délais franchise */}
        <div className="bg-bg-card rounded-2xl border border-warning/20 p-6">
          <h2 className="text-lg font-syne font-semibold text-text-primary mb-2">Délais de franchise</h2>
          <p className="text-sm text-text-secondary mb-4">Les alertes se déclencheront automatiquement en approchant de ces délais.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label pt-0"><span className="label-text text-text-secondary font-medium">Franchise surestarie (jours)</span></label>
              <input type="number" {...register('free_time_demurrage_days', { valueAsNumber: true })} defaultValue={3} min={0} className="input-base" />
              <p className="text-xs text-text-muted mt-1">Délai au port avant facturation (défaut: 3j)</p>
            </div>
            <div className="form-control">
              <label className="label pt-0"><span className="label-text text-text-secondary font-medium">Franchise détention (jours)</span></label>
              <input type="number" {...register('free_time_detention_days', { valueAsNumber: true })} defaultValue={7} min={0} className="input-base" />
              <p className="text-xs text-text-muted mt-1">Délai de retour conteneur (défaut: 7j)</p>
            </div>
          </div>
        </div>

        {/* Conteneurs */}
        <div className="bg-bg-card rounded-2xl border border-border-base p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center">
                <Package className="w-5 h-5 text-accent" />
              </div>
              <h2 className="text-lg font-syne font-semibold text-text-primary">Conteneurs ({fields.length})</h2>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => append({ container_number: '', type: "20'DC", seal_number: '', cargo_description: '', weight_kg: '', status: 'au_port' })}>
              <Plus className="w-4 h-4 mr-2" /> Ajouter
            </Button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="bg-bg-surface rounded-xl border border-border-base p-4 relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-text-secondary">Conteneur #{index + 1}</span>
                  {fields.length > 1 && (
                    <button type="button" onClick={() => remove(index)} className="w-7 h-7 rounded-lg text-danger hover:bg-danger/10 flex items-center justify-center transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input {...register(`containers.${index}.container_number`)} label="N° Conteneur" placeholder="MSCU1234567" />
                  <div className="form-control">
                    <label className="label pt-0"><span className="label-text text-text-secondary font-medium">Type</span></label>
                    <select {...register(`containers.${index}.type`)} className="select select-sm select-bordered bg-bg-surface border-border-base text-sm">
                      {CONTAINER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <Input {...register(`containers.${index}.seal_number`)} label="N° Plomb" placeholder="SL123456" />
                  <div className="sm:col-span-2">
                    <Input {...register(`containers.${index}.cargo_description`)} label="Description marchandise" placeholder="Équipements industriels" />
                  </div>
                  <Input {...register(`containers.${index}.weight_kg`)} label="Poids (kg)" placeholder="24000" type="number" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-bg-card rounded-2xl border border-border-base p-6">
          <label className="label pt-0"><span className="label-text text-text-secondary font-medium">Notes</span></label>
          <textarea {...register('notes')} rows={3} placeholder="Informations supplémentaires..." className="input-base resize-none w-full" />
        </div>

        <div className="flex gap-3 justify-end">
          <Link href="/dashboard/connaissements"><Button type="button" variant="outline">Annuler</Button></Link>
          <Button type="submit" isLoading={isLoading}>
            <Ship className="w-4 h-4 mr-2" /> Enregistrer le BL
          </Button>
        </div>
      </form>
    </div>
  )
}
