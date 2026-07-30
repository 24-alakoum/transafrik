'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { TrendingUp, ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toast } from 'sonner'
import { createRecetteAction } from '../actions'
import Link from 'next/link'

export default function NouvelleRecettePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      description: '',
      amount_fcfa: '',
      date: new Date().toISOString().split('T')[0],
      source: 'transport',
      status: 'encaisse',
      reference: '',
      client_id: '',
      trip_id: ''
    }
  })

  const onSubmit = async (data: any) => {
    setIsLoading(true)
    try {
      const result = await createRecetteAction(data)
      if (result.success) {
        toast.success('Recette ajoutée avec succès')
        router.push('/dashboard/recettes')
      } else {
        toast.error(result.error || 'Erreur lors de l\'ajout')
      }
    } catch {
      toast.error('Erreur inattendue')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/recettes">
          <button className="w-9 h-9 rounded-xl border border-border-base flex items-center justify-center text-text-secondary hover:text-accent hover:border-accent/40 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-syne font-bold text-text-primary">Ajouter une recette</h1>
          <p className="text-text-secondary mt-0.5">Enregistrer un revenu ou un encaissement</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-bg-card rounded-2xl border border-border-base p-6 space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-success/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-success" />
          </div>
          <h2 className="text-lg font-syne font-semibold text-text-primary">Détails de la recette</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input {...register('description', { required: true })} label="Description *" placeholder="Ex: Paiement facture Transport Dakar-Bamako" error={errors.description ? 'Requis' : ''} />
          </div>
          <Input {...register('amount_fcfa', { required: true })} label="Montant (FCFA) *" type="number" placeholder="500000" error={errors.amount_fcfa ? 'Requis' : ''} />
          <div className="form-control">
            <label className="label pt-0"><span className="label-text text-text-secondary font-medium">Date *</span></label>
            <input type="date" {...register('date', { required: true })} className="input-base" />
          </div>
          <div className="form-control">
            <label className="label pt-0"><span className="label-text text-text-secondary font-medium">Source</span></label>
            <select {...register('source')} className="select select-bordered bg-bg-surface border-border-base">
              <option value="transport">Transport routier</option>
              <option value="logistique">Logistique / Manutention</option>
              <option value="douane">Frais de dédouanement</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <div className="form-control">
            <label className="label pt-0"><span className="label-text text-text-secondary font-medium">Statut</span></label>
            <select {...register('status')} className="select select-bordered bg-bg-surface border-border-base">
              <option value="encaisse">Encaissé</option>
              <option value="en_attente">En attente de paiement</option>
            </select>
          </div>
          <Input {...register('reference')} label="Référence (Facture/Reçu)" placeholder="FAC-2024-001" />
        </div>

        <div className="divider-dark my-2" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label pt-0"><span className="label-text text-text-secondary font-medium">Client (Optionnel)</span></label>
            <input type="text" {...register('client_id')} placeholder="ID du client" className="input-base text-sm" />
            <p className="text-xs text-text-muted mt-1">L'ID du client si applicable</p>
          </div>
          <div className="form-control">
            <label className="label pt-0"><span className="label-text text-text-secondary font-medium">Voyage (Optionnel)</span></label>
            <input type="text" {...register('trip_id')} placeholder="ID du voyage" className="input-base text-sm" />
            <p className="text-xs text-text-muted mt-1">L'ID du voyage si applicable</p>
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-4">
          <Link href="/dashboard/recettes"><Button type="button" variant="outline">Annuler</Button></Link>
          <Button type="submit" isLoading={isLoading}>
            <Save className="w-4 h-4 mr-2" /> Enregistrer la recette
          </Button>
        </div>
      </form>
    </div>
  )
}
