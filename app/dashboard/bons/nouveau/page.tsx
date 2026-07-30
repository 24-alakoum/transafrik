'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { createBonLivraisonAction } from '../actions'
import { ArrowLeft, FileText } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function NouveauBonPage() {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const [trips, setTrips] = React.useState<any[]>([])
  const [selectedTrip, setSelectedTrip] = React.useState('')

  React.useEffect(() => {
    const fetchTrips = async () => {
      const supabase = createClient()
      // On fetch les voyages sans bon de livraison
      const { data } = await supabase
        .from('trips')
        .select('id, reference, origin, destination, clients(name)')
        .order('created_at', { ascending: false })
      
      setTrips(data || [])
    }
    fetchTrips()
  }, [])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTrip) {
      toast.error('Veuillez sélectionner un voyage')
      return
    }

    startTransition(async () => {
      const result = await createBonLivraisonAction(selectedTrip)
      
      if (!result.success) {
        toast.error(result.error as string)
      } else {
        toast.success('Bon de livraison généré avec succès')
        router.push(`/dashboard/bons/${result.bonId}`)
      }
    })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/bons">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-syne font-bold text-text-primary">Générer un Bon</h1>
          <p className="text-text-secondary text-sm">Créez un bon de livraison à partir d'un voyage</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="bg-bg-card rounded-2xl p-6 border border-border-base shadow-sm space-y-6">
          <div className="form-control w-full">
            <label className="label pt-0"><span className="label-text text-text-secondary font-medium">Sélectionner un voyage</span></label>
            <select 
              value={selectedTrip} 
              onChange={(e) => setSelectedTrip(e.target.value)} 
              className="select select-bordered bg-bg-surface border-border-base w-full h-auto py-3"
            >
              <option value="">-- Choisissez un voyage --</option>
              {trips.map(t => (
                <option key={t.id} value={t.id}>
                  {t.reference} - {t.clients?.name || 'Sans client'} ({t.origin} → {t.destination})
                </option>
              ))}
            </select>
          </div>

          <div className="bg-info/10 text-info p-4 rounded-xl text-sm flex items-start gap-3">
            <FileText className="w-5 h-5 shrink-0 mt-0.5" />
            <p>La génération du bon va automatiquement créer une facture avec un numéro séquentiel et calculer les totaux (incluant la TVA) à partir des lignes du voyage sélectionné.</p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link href="/dashboard/bons">
            <Button variant="ghost" type="button">Annuler</Button>
          </Link>
          <Button type="submit" isLoading={isPending} disabled={!selectedTrip}>
            <FileText className="w-4 h-4 mr-2" />
            Générer le bon
          </Button>
        </div>
      </form>
    </div>
  )
}
