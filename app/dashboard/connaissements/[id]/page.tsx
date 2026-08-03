'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Ship, Package, ArrowLeft, AlertTriangle, CheckCircle2, Clock, Edit2, RefreshCw, Trash2, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { Input } from '@/components/ui/Input'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { updateContainerStatusAction, updateBLStatusAction, updateBLDatesAction, deleteBLAction, updateContainerDatesAction } from '../actions'
import Link from 'next/link'
import { CONTAINER_STATUSES, CONTAINER_STATUS_FLOW, type ContainerStatus } from '@/lib/container-statuses'

const BL_STATUSES = ['en_attente', 'arrive', 'en_dedouanement', 'disponible', 'livre', 'termine']
const BL_STATUS_LABELS: Record<string, string> = {
  en_attente: 'En attente', arrive: 'Arrivé', en_dedouanement: 'En dédouanement',
  disponible: 'Disponible', livre: 'Livré', termine: 'Terminé'
}

function getDaysInfo(startDate: string | null, freeDays: number, endDate: string | null = null) {
  if (!startDate) return null
  const start = new Date(startDate)
  const deadline = new Date(start)
  deadline.setDate(deadline.getDate() + freeDays)
  
  const limitDate = endDate ? new Date(endDate) : new Date()
  const diff = Math.ceil((deadline.getTime() - limitDate.getTime()) / (1000 * 60 * 60 * 24))
  return { days: diff, deadline, overdue: diff < 0 }
}

export default function BLDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const blId = params.id as string
  const [updatingContainer, setUpdatingContainer] = React.useState<string | null>(null)
  const [updatingBL, setUpdatingBL] = React.useState(false)

  const [isEditingBL, setIsEditingBL] = React.useState(false)
  const [isDeletingBL, setIsDeletingBL] = React.useState(false)
  
  const [editContainerId, setEditContainerId] = React.useState<string | null>(null)

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

  const handleUpdateBLDates = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setUpdatingBL(true)
    const formData = new FormData(e.currentTarget)
    const payload = {
      arrival_date: formData.get('arrival_date'),
      created_at: formData.get('created_at') ? new Date(formData.get('created_at') as string).toISOString() : undefined,
      free_time_demurrage_days: parseInt(formData.get('free_time_demurrage_days') as string) || 3,
      free_time_detention_days: parseInt(formData.get('free_time_detention_days') as string) || 7,
    }
    const res = await updateBLDatesAction(blId, payload)
    if (res.success) {
      toast.success('Dates mises à jour')
      setIsEditingBL(false)
      refetch()
    } else {
      toast.error(res.error || 'Erreur')
    }
    setUpdatingBL(false)
  }

  const handleDeleteBL = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce connaissement ?')) return
    setUpdatingBL(true)
    const res = await deleteBLAction(blId)
    if (res.success) {
      toast.success('Connaissement supprimé')
      router.push('/dashboard/connaissements')
    } else {
      toast.error(res.error || 'Erreur')
      setUpdatingBL(false)
    }
  }

  const handleUpdateContainerDates = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editContainerId) return
    setUpdatingContainer(editContainerId)
    const formData = new FormData(e.currentTarget)
    const payload = {
      pickup_date: formData.get('pickup_date'),
      return_date: formData.get('return_date'),
    }
    const res = await updateContainerDatesAction(editContainerId, payload)
    if (res.success) {
      toast.success('Dates conteneur mises à jour')
      setEditContainerId(null)
      refetch()
    } else {
      toast.error(res.error || 'Erreur')
    }
    setUpdatingContainer(null)
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

  // Surestarie (Demurrage) begins at arrival_date. It stops at pickup_date.
  // We find the worst case among containers.
  let demurrage: ReturnType<typeof getDaysInfo> = null;
  if (bl.arrival_date) {
    if (!bl.containers?.length) {
      demurrage = getDaysInfo(bl.arrival_date, bl.free_time_demurrage_days || 3, null);
    } else {
      for (const c of bl.containers) {
        const info = getDaysInfo(bl.arrival_date, bl.free_time_demurrage_days || 3, c.pickup_date || null);
        if (info && (!demurrage || info.days < demurrage.days)) {
          demurrage = info;
        }
      }
    }
  }

  // Detention begins at pickup_date. It stops at return_date.
  let detention: ReturnType<typeof getDaysInfo> = null;
  if (bl.containers?.length) {
    for (const c of bl.containers) {
      if (c.pickup_date) {
        const info = getDaysInfo(c.pickup_date, bl.free_time_detention_days || 7, c.return_date || null);
        if (info && (!detention || info.days < detention.days)) {
          detention = info;
        }
      }
    }
  }

  return (
    <div className="space-y-6 max-w-5xl min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <Link href="/dashboard/connaissements">
            <button className="w-9 h-9 rounded-xl border border-border-base flex items-center justify-center text-text-secondary hover:text-accent hover:border-accent/40 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-2xl font-syne font-bold text-text-primary flex items-center gap-3">
              <Ship className="w-6 h-6 text-blue-400" /> {bl.reference}
            </h1>
            <p className="text-text-secondary mt-0.5">{bl.vessel_name} • {bl.port_of_discharge}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/dashboard/connaissements/${blId}/modifier`}>
            <Button variant="outline" size="sm">
              <Edit2 className="w-4 h-4 mr-2" /> Modifier B/L
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={handleDeleteBL} disabled={updatingBL} className="text-danger hover:text-danger hover:bg-danger/10 border-danger/20">
            <Trash2 className="w-4 h-4 mr-2" /> Supprimer
          </Button>
          <button onClick={() => refetch()} className="p-2 rounded-lg border border-border-base hover:border-accent/40 text-text-muted hover:text-accent transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
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
          {bl.created_at && <p className="text-xs text-text-muted mt-2">Enregistré le: {formatDate(bl.created_at)}</p>}
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
          ) : <p className="text-xs text-text-muted mt-1">Aucun conteneur retiré ou tous retournés</p>}
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
              const stInfo = container.status in CONTAINER_STATUSES
                ? CONTAINER_STATUSES[container.status as ContainerStatus]
                : { label: container.status, color: 'default' }
              return (
                <div key={container.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start gap-4 min-w-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                      <span className="font-mono font-bold text-text-primary text-lg break-all">{container.container_number || 'N/A'}</span>
                      <Badge variant="default" className="text-xs">{container.type}</Badge>
                      <Badge variant={stInfo.color as any} className="text-xs">{stInfo.label}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-text-muted mb-3">
                      {container.seal_number && <span>Plomb: {container.seal_number}</span>}
                      {container.cargo_description && <span>Cargo: {container.cargo_description}</span>}
                      {container.weight_kg && <span>Poids: {container.weight_kg} kg</span>}
                      {container.pickup_date && <span>Retiré le: {formatDate(container.pickup_date)}</span>}
                      {container.return_date && <span>Retourné le: {formatDate(container.return_date)}</span>}
                      {container.updated_at && <span>Modifié le: {formatDate(container.updated_at)}</span>}
                    </div>

                    {editContainerId === container.id ? (
                      <form onSubmit={handleUpdateContainerDates} className="bg-bg-surface border border-border-base rounded-lg p-3 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end max-w-2xl">
                        <div className="form-control">
                          <label className="label pt-0"><span className="label-text text-xs text-text-secondary font-medium">Date retrait (Sortie port)</span></label>
                          <input type="date" name="pickup_date" defaultValue={container.pickup_date || ''} className="input-base text-sm py-1.5" />
                        </div>
                        <div className="form-control">
                          <label className="label pt-0"><span className="label-text text-xs text-text-secondary font-medium">Date retour</span></label>
                          <input type="date" name="return_date" defaultValue={container.return_date || ''} className="input-base text-sm py-1.5" />
                        </div>
                        <div className="flex gap-2 mb-1">
                          <Button type="button" variant="outline" size="sm" onClick={() => setEditContainerId(null)}>Annuler</Button>
                          <Button type="submit" size="sm" disabled={updatingContainer === container.id}>Sauver</Button>
                        </div>
                      </form>
                    ) : (
                      <button onClick={() => setEditContainerId(container.id)} className="text-xs text-accent hover:underline flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Modifier dates sortie/retour
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4 sm:mt-0 shrink-0">
                    {CONTAINER_STATUS_FLOW[container.status as ContainerStatus] && (() => {
                      const nextStatus = CONTAINER_STATUS_FLOW[container.status as ContainerStatus]!
                      return <Button size="sm" variant={nextStatus === 'retourne' ? 'success' : 'outline'} disabled={updatingContainer === container.id} onClick={() => handleContainerStatus(container.id, nextStatus)}>Passer à {CONTAINER_STATUSES[nextStatus].label}</Button>
                    })()}
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
            <div className="flex justify-between"><span className="text-text-secondary">Enregistré le</span><span className="text-text-primary">{bl.created_at ? formatDate(bl.created_at) : '-'}</span></div>
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
