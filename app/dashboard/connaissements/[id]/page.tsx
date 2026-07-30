'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Ship, Package, ArrowLeft, AlertTriangle, CheckCircle2, Clock, Edit2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { updateContainerStatusAction, updateBLStatusAction } from '../actions'
import Link from 'next/link'

const CONTAINER_STATUSES: Record<string, { label: string; color: string }> = {
  au_port: { label: 'Au port', color: 'info' },
  retire: { label: 'Retiré', color: 'warning' },
  en_transit: { label: 'En transit', color: 'warning' },
  decharge: { label: 'Déchargé', color: 'success' },
  retourne: { label: 'Retourné', color: 'default' },
}

const BL_STATUSES = ['en_attente', 'arrive', 'en_dedouanement', 'disponible', 'livre', 'termine']
const BL_STATUS_LABELS: Record<string, string> = {
  en_attente: 'En attente', arrive: 'Arrivé', en_dedouanement: 'En dédouanement',
  disponible: 'Disponible', livre: 'Livré', termine: 'Terminé'
}

function getDaysInfo(arrivalDate: string | null, freeDays: number) {
  if (!arrivalDate) return null
  const arrival = new Date(arrivalDate)
  const deadline = new Date(arrival)
  deadline.setDate(deadline.getDate() + freeDays)
  const today = new Date()
  const diff = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return { days: diff, deadline, overdue: diff < 0 }
}

export default function BLDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const blId = params.id as string
  const [updatingContainer, setUpdatingContainer] = React.useState<string | null>(null)
  const [updatingBL, setUpdatingBL] = React.useState(false)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['bl', blId],
    queryFn: async () => {
      const res = await fetch(`/api/data/bls/${blId}`)
      if (!res.ok) throw new Error('BL non trouvé')
      return res.json()
    },
    staleTime: 30_000,
  })

  const bl = data?.data

  const handleContainerStatus = async (containerId: string, status: string) => {
    setUpdatingContainer(containerId)
    const date = new Date().toISOString().split('T')[0]
    const res = await updateContainerStatusAction(containerId, status, date)
    if (res.success) {
      toast.success('Statut conteneur mis à jour')
      refetch()
      queryClient.invalidateQueries({ queryKey: ['bls'] })
    } else {
      toast.error(res.error || 'Erreur')
    }
    setUpdatingContainer(null)
  }

  const handleBLStatus = async (status: string) => {
    setUpdatingBL(true)
    const res = await updateBLStatusAction(blId, status)
    if (res.success) {
      toast.success('Statut BL mis à jour')
      refetch()
      queryClient.invalidateQueries({ queryKey: ['bls'] })
    } else {
      toast.error(res.error || 'Erreur')
    }
    setUpdatingBL(false)
  }

  if (isLoading) return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({length: 3}).map((_,i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  )

  if (!bl) return (
    <div className="text-center py-16">
      <p className="text-text-muted">Connaissement non trouvé</p>
      <Link href="/dashboard/connaissements"><Button className="mt-4" variant="outline">Retour</Button></Link>
    </div>
  )

  const demurrage = getDaysInfo(bl.arrival_date, bl.free_time_demurrage_days || 3)
  const detention = getDaysInfo(bl.arrival_date, bl.free_time_detention_days || 7)

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/connaissements">
            <button className="w-9 h-9 rounded-xl border border-border-base flex items-center justify-center text-text-secondary hover:text-accent hover:border-accent/40 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-syne font-bold text-text-primary flex items-center gap-3">
              <Ship className="w-6 h-6 text-blue-400" /> {bl.reference}
            </h1>
            <p className="text-text-secondary mt-0.5">{bl.vessel_name} • {bl.port_of_discharge}</p>
          </div>
        </div>
        <button onClick={() => refetch()} className="p-2 rounded-lg border border-border-base hover:border-accent/40 text-text-muted hover:text-accent transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Alertes délais */}
      {((demurrage && demurrage.days <= 3) || (detention && detention.days <= 3)) && (
        <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-danger" />
            <span className="font-semibold text-danger">Délais critiques</span>
          </div>
          {demurrage && demurrage.days <= 3 && (
            <p className="text-sm text-danger/80">
              🚨 Surestarie : {demurrage.overdue ? `dépassée de ${Math.abs(demurrage.days)} jour(s)` : `${demurrage.days} jour(s) restant(s)`} 
              — Échéance: {formatDate(demurrage.deadline.toISOString())}
            </p>
          )}
          {detention && detention.days <= 3 && (
            <p className="text-sm text-danger/80">
              🚨 Détention : {detention.overdue ? `dépassée de ${Math.abs(detention.days)} jour(s)` : `${detention.days} jour(s) restant(s)`}
              — Échéance: {formatDate(detention.deadline.toISOString())}
            </p>
          )}
        </div>
      )}

      {/* Cartes infos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-bg-card rounded-2xl border border-border-base p-5">
          <p className="text-text-secondary text-sm mb-1">Client</p>
          <p className="font-semibold text-text-primary">{bl.clients?.name || '-'}</p>
          {bl.clients?.phone && <p className="text-xs text-text-muted mt-1">{bl.clients.phone}</p>}
        </div>
        <div className={`bg-bg-card rounded-2xl border p-5 ${
          demurrage ? (demurrage.overdue ? 'border-danger/40 bg-danger/5' : demurrage.days <= 3 ? 'border-warning/40 bg-warning/5' : 'border-border-base') : 'border-border-base'
        }`}>
          <p className="text-text-secondary text-sm mb-1">Surestarie (port)</p>
          <p className="font-semibold text-text-primary">{bl.free_time_demurrage_days || 3} jours franchise</p>
          {demurrage ? (
            <p className={`text-xs mt-1 font-medium ${ demurrage.overdue ? 'text-danger' : demurrage.days <= 3 ? 'text-warning' : 'text-success'}`}>
              {demurrage.overdue ? `⚠ Dépassée de ${Math.abs(demurrage.days)}j` : `✓ ${demurrage.days}j restant(s)`}
            </p>
          ) : <p className="text-xs text-text-muted mt-1">Date d'arrivée non renseignée</p>}
        </div>
        <div className={`bg-bg-card rounded-2xl border p-5 ${
          detention ? (detention.overdue ? 'border-danger/40 bg-danger/5' : detention.days <= 3 ? 'border-warning/40 bg-warning/5' : 'border-border-base') : 'border-border-base'
        }`}>
          <p className="text-text-secondary text-sm mb-1">Détention (conteneur)</p>
          <p className="font-semibold text-text-primary">{bl.free_time_detention_days || 7} jours franchise</p>
          {detention ? (
            <p className={`text-xs mt-1 font-medium ${ detention.overdue ? 'text-danger' : detention.days <= 3 ? 'text-warning' : 'text-success'}`}>
              {detention.overdue ? `⚠ Dépassée de ${Math.abs(detention.days)}j` : `✓ ${detention.days}j restant(s)`}
            </p>
          ) : <p className="text-xs text-text-muted mt-1">Date d'arrivée non renseignée</p>}
        </div>
      </div>

      {/* Changement statut BL */}
      <div className="bg-bg-card rounded-2xl border border-border-base p-5">
        <h3 className="font-syne font-semibold text-text-primary mb-4">Statut du connaissement</h3>
        <div className="flex flex-wrap gap-2">
          {BL_STATUSES.map(s => (
            <button
              key={s}
              onClick={() => handleBLStatus(s)}
              disabled={updatingBL || bl.status === s}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                bl.status === s
                  ? 'bg-accent text-white shadow-glow-sm'
                  : 'bg-bg-raised border border-border-base text-text-secondary hover:border-accent/40 hover:text-accent'
              } disabled:opacity-50`}
            >
              {BL_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Conteneurs */}
      <div className="bg-bg-card rounded-2xl border border-border-base overflow-hidden">
        <div className="p-5 border-b border-border-base flex items-center gap-3">
          <Package className="w-5 h-5 text-accent" />
          <h3 className="font-syne font-semibold text-text-primary">Conteneurs ({bl.containers?.length || 0})</h3>
        </div>
        {!bl.containers?.length ? (
          <div className="p-12 text-center text-text-muted">Aucun conteneur associé</div>
        ) : (
          <div className="divide-y divide-border-base">
            {bl.containers.map((container: any) => {
              const stInfo = CONTAINER_STATUSES[container.status] || { label: container.status, color: 'default' }
              return (
                <div key={container.id} className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono font-bold text-text-primary text-lg">{container.container_number || 'N/A'}</span>
                      <Badge variant="default" className="text-xs">{container.type}</Badge>
                      <Badge variant={stInfo.color as any} className="text-xs">{stInfo.label}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-text-muted">
                      {container.seal_number && <span>Plomb: {container.seal_number}</span>}
                      {container.cargo_description && <span>Cargo: {container.cargo_description}</span>}
                      {container.weight_kg && <span>Poids: {container.weight_kg} kg</span>}
                      {container.pickup_date && <span>Retiré le: {formatDate(container.pickup_date)}</span>}
                      {container.return_date && <span>Retourné le: {formatDate(container.return_date)}</span>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {container.status === 'au_port' && (
                      <Button size="sm" variant="outline" disabled={updatingContainer === container.id} onClick={() => handleContainerStatus(container.id, 'retire')}>
                        Retirer
                      </Button>
                    )}
                    {container.status === 'retire' && (
                      <Button size="sm" variant="outline" disabled={updatingContainer === container.id} onClick={() => handleContainerStatus(container.id, 'decharge')}>
                        Décharger
                      </Button>
                    )}
                    {(container.status === 'retire' || container.status === 'decharge') && (
                      <Button size="sm" variant="success" disabled={updatingContainer === container.id} onClick={() => handleContainerStatus(container.id, 'retourne')}>
                        Retourné ✓
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Infos complémentaires */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-bg-card rounded-2xl border border-border-base p-5">
          <h4 className="font-syne font-semibold text-text-primary mb-3">Dates</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-text-secondary">ETA prévu</span><span className="text-text-primary">{bl.eta ? formatDate(bl.eta) : '-'}</span></div>
            <div className="flex justify-between"><span className="text-text-secondary">Arrivée réelle</span><span className="text-text-primary">{bl.arrival_date ? formatDate(bl.arrival_date) : 'Non renseignée'}</span></div>
            <div className="flex justify-between"><span className="text-text-secondary">Port chargement</span><span className="text-text-primary">{bl.port_of_loading || '-'}</span></div>
            <div className="flex justify-between"><span className="text-text-secondary">Port déchargement</span><span className="text-text-primary">{bl.port_of_discharge || '-'}</span></div>
          </div>
        </div>
        {bl.notes && (
          <div className="bg-bg-card rounded-2xl border border-border-base p-5">
            <h4 className="font-syne font-semibold text-text-primary mb-3">Notes</h4>
            <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">{bl.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
