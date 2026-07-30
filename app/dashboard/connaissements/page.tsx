'use client'

import * as React from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Plus, Ship, AlertTriangle, CheckCircle2, Clock, Package, Trash2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { deleteBLAction } from './actions'

const BL_STATUSES: Record<string, { label: string; color: string }> = {
  en_attente:      { label: 'En attente',       color: 'default' },
  arrive:          { label: 'Arrivé',            color: 'info' },
  en_dedouanement: { label: 'En dédouanement',  color: 'warning' },
  disponible:      { label: 'Disponible',        color: 'success' },
  livre:           { label: 'Livré',             color: 'success' },
  termine:         { label: 'Terminé',           color: 'default' },
}

function getDaysRemaining(arrivalDate: string | null, freeDays: number): number | null {
  if (!arrivalDate) return null
  const deadline = new Date(arrivalDate)
  deadline.setDate(deadline.getDate() + freeDays)
  return Math.ceil((deadline.getTime() - Date.now()) / 86400000)
}

function AlertPill({ days, label }: { days: number | null; label: string }) {
  if (days === null) return <span className="text-text-muted text-xs">-</span>
  if (days < 0) return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-danger px-2 py-0.5 rounded-full">
      <AlertTriangle className="w-3 h-3" /> {label}: {Math.abs(days)}j dépassé
    </span>
  )
  if (days <= 3) return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-warning px-2 py-0.5 rounded-full">
      <Clock className="w-3 h-3" /> {label}: {days}j restant
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-success bg-success/10 border border-success/20 px-2 py-0.5 rounded-full">
      <CheckCircle2 className="w-3 h-3" /> {label}: {days}j
    </span>
  )
}

export default function ConnaissementsPage() {
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['bls'],
    queryFn: async () => {
      const res = await fetch('/api/data/bls')
      if (!res.ok) throw new Error('Erreur chargement BLs')
      return res.json()
    },
    staleTime: 30_000,
    placeholderData: (prev: any) => prev,
  })

  const bls = data?.data || []
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  const handleDelete = async (id: string, ref: string) => {
    if (!confirm(`Supprimer le BL ${ref} et tous ses conteneurs ?`)) return
    setDeletingId(id)
    const res = await deleteBLAction(id)
    if (res.success) { toast.success('Connaissement supprimé'); refetch() }
    else toast.error(res.error || 'Erreur')
    setDeletingId(null)
  }

  const urgentBLs = bls.filter((bl: any) => {
    const d = getDaysRemaining(bl.arrival_date, bl.free_time_demurrage_days || 3)
    const det = getDaysRemaining(bl.arrival_date, bl.free_time_detention_days || 7)
    return (d !== null && d <= 3) || (det !== null && det <= 3)
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-syne font-bold text-text-primary flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <Ship className="w-5 h-5 text-blue-400" />
            </div>
            Connaissements (BL)
            {isFetching && !isLoading && <span className="text-xs text-accent font-normal">Actualisation...</span>}
          </h1>
          <p className="text-text-secondary mt-1">Suivi des BLs, conteneurs, détentions et surestaries.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => refetch()} className="p-2 rounded-lg border border-border-base hover:border-accent/40 text-text-muted hover:text-accent transition-colors">
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          <Link href="/dashboard/connaissements/nouveau">
            <Button><Plus className="w-4 h-4 mr-2" />Nouveau BL</Button>
          </Link>
        </div>
      </div>

      {/* Alertes urgentes */}
      {urgentBLs.length > 0 && (
        <div className="bg-danger/10 border border-danger/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-danger shrink-0" />
            <span className="font-semibold text-danger">{urgentBLs.length} alerte(s) urgente(s) — délais critiques</span>
          </div>
          <div className="space-y-1">
            {urgentBLs.map((bl: any) => (
              <p key={bl.id} className="text-sm text-danger/80">
                BL <strong>{bl.reference}</strong> ({bl.clients?.name || 'sans client'}) —{' '}
                <Link href={`/dashboard/connaissements/${bl.id}`} className="underline font-medium">Voir détail →</Link>
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Tableau */}
      {isLoading ? (
        <TableSkeleton rows={8} cols={7} />
      ) : bls.length === 0 ? (
        <div className="bg-bg-card rounded-2xl border border-border-base p-16 text-center">
          <Ship className="w-12 h-12 mx-auto text-text-muted/30 mb-4" />
          <p className="text-lg font-syne font-semibold text-text-primary mb-2">Aucun connaissement</p>
          <p className="text-text-muted text-sm mb-6">Enregistrez votre premier BL pour démarrer le suivi.</p>
          <Link href="/dashboard/connaissements/nouveau">
            <Button><Plus className="w-4 h-4 mr-2" />Créer un BL</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-bg-card rounded-2xl border border-border-base shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-bg-surface text-text-secondary font-medium border-b border-border-base">
                <tr>
                  <th className="px-6 py-4">Référence BL</th>
                  <th className="px-6 py-4">Navire / Port</th>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Arrivée</th>
                  <th className="px-6 py-4">Conteneurs</th>
                  <th className="px-6 py-4">Délais</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-base">
                {bls.map((bl: any) => {
                  const statusInfo = BL_STATUSES[bl.status] || { label: bl.status, color: 'default' }
                  const demDays = getDaysRemaining(bl.arrival_date, bl.free_time_demurrage_days || 3)
                  const detDays = getDaysRemaining(bl.arrival_date, bl.free_time_detention_days || 7)
                  const containers = bl.containers || []
                  const pending = containers.filter((c: any) => c.status !== 'retourne').length
                  const isUrgent = (demDays !== null && demDays <= 3) || (detDays !== null && detDays <= 3)

                  return (
                    <tr key={bl.id} className={`hover:bg-bg-raised/50 transition-colors ${isUrgent ? 'bg-danger/5' : ''}`}>
                      <td className="px-6 py-4">
                        <Link href={`/dashboard/connaissements/${bl.id}`} className="font-semibold text-accent hover:underline flex items-center gap-2">
                          <Ship className="w-4 h-4 text-text-muted" />
                          {bl.reference}
                        </Link>
                        {bl.voyage_number && <p className="text-xs text-text-muted">Voy. {bl.voyage_number}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-text-primary">{bl.vessel_name || '-'}</div>
                        <div className="text-xs text-text-muted">{bl.port_of_discharge || '-'}</div>
                      </td>
                      <td className="px-6 py-4 text-text-secondary">{bl.clients?.name || '-'}</td>
                      <td className="px-6 py-4 text-text-secondary">
                        {bl.arrival_date ? (
                          <span className="font-medium text-text-primary">{formatDate(bl.arrival_date)}</span>
                        ) : bl.eta ? (
                          <span className="italic text-text-muted">ETA {formatDate(bl.eta)}</span>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-text-muted" />
                          <span className="font-medium text-text-primary">{containers.length}</span>
                          {pending > 0 && (
                            <span className="text-xs text-warning bg-warning/10 px-1.5 py-0.5 rounded">
                              {pending} en cours
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <AlertPill days={demDays} label="Surestarie" />
                          <AlertPill days={detDays} label="Détention" />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={statusInfo.color as any}>{statusInfo.label}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDelete(bl.id, bl.reference)}
                          disabled={deletingId === bl.id}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
