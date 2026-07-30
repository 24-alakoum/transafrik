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
  
  const [searchTerm, setSearchTerm] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('all')
  const [sortBy, setSortBy] = React.useState('date_desc')

  const handleDelete = async (id: string, ref: string) => {
    if (!confirm(`Supprimer le BL ${ref} et tous ses conteneurs ?`)) return
    setDeletingId(id)
    const res = await deleteBLAction(id)
    if (res.success) { toast.success('Connaissement supprimé'); refetch() }
    else toast.error(res.error || 'Erreur')
    setDeletingId(null)
  }

  // Rewrite getDaysRemaining to match the logic of [id]/page.tsx (Surestarie stops at pickup, Detention starts at pickup)
  // For the list view, we just show the worst case for demurrage and detention.
  function getBLDaysInfo(bl: any, freeDays: number, type: 'demurrage' | 'detention') {
    if (type === 'demurrage') {
      if (!bl.arrival_date) return null;
      if (!bl.containers?.length) return getDaysRemaining(bl.arrival_date, freeDays);
      let worst: number | null = null;
      for (const c of bl.containers) {
        const endDate = c.pickup_date ? new Date(c.pickup_date) : new Date();
        const start = new Date(bl.arrival_date);
        const deadline = new Date(start);
        deadline.setDate(deadline.getDate() + freeDays);
        const diff = Math.ceil((deadline.getTime() - endDate.getTime()) / 86400000);
        if (worst === null || diff < worst) worst = diff;
      }
      return worst;
    } else {
      if (!bl.containers?.length) return null;
      let worst: number | null = null;
      for (const c of bl.containers) {
        if (c.pickup_date) {
          const endDate = c.return_date ? new Date(c.return_date) : new Date();
          const start = new Date(c.pickup_date);
          const deadline = new Date(start);
          deadline.setDate(deadline.getDate() + freeDays);
          const diff = Math.ceil((deadline.getTime() - endDate.getTime()) / 86400000);
          if (worst === null || diff < worst) worst = diff;
        }
      }
      return worst;
    }
  }

  const urgentBLs = bls.filter((bl: any) => {
    const d = getBLDaysInfo(bl, bl.free_time_demurrage_days || 3, 'demurrage')
    const det = getBLDaysInfo(bl, bl.free_time_detention_days || 7, 'detention')
    return (d !== null && d <= 3) || (det !== null && det <= 3)
  })

  let filteredBls = bls.filter((bl: any) => {
    const matchesSearch = 
      (bl.reference || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bl.vessel_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bl.clients?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bl.port_of_discharge || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || bl.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  filteredBls.sort((a: any, b: any) => {
    if (sortBy === 'date_desc') return new Date(b.created_at || b.arrival_date || 0).getTime() - new Date(a.created_at || a.arrival_date || 0).getTime()
    if (sortBy === 'date_asc') return new Date(a.created_at || a.arrival_date || 0).getTime() - new Date(b.created_at || b.arrival_date || 0).getTime()
    if (sortBy === 'ref_asc') return (a.reference || '').localeCompare(b.reference || '')
    return 0
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

      {/* Filtres et Recherche */}
      <div className="bg-bg-card rounded-2xl border border-border-base p-4 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input 
            type="text" 
            placeholder="Rechercher par référence, navire, client..." 
            className="input-base w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-4">
          <select 
            className="select select-bordered bg-bg-surface border-border-base text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tous les statuts</option>
            {Object.keys(BL_STATUSES).map(k => (
              <option key={k} value={k}>{BL_STATUSES[k].label}</option>
            ))}
          </select>
          <select 
            className="select select-bordered bg-bg-surface border-border-base text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date_desc">Plus récents d'abord</option>
            <option value="date_asc">Plus anciens d'abord</option>
            <option value="ref_asc">Par Référence (A-Z)</option>
          </select>
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
      ) : filteredBls.length === 0 ? (
        <div className="bg-bg-card rounded-2xl border border-border-base p-16 text-center">
          <Ship className="w-12 h-12 mx-auto text-text-muted/30 mb-4" />
          <p className="text-lg font-syne font-semibold text-text-primary mb-2">Aucun connaissement trouvé</p>
          <p className="text-text-muted text-sm mb-6">Modifiez vos filtres ou créez un nouveau BL.</p>
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
                {filteredBls.map((bl: any) => {
                  const statusInfo = BL_STATUSES[bl.status] || { label: bl.status, color: 'default' }
                  const demDays = getBLDaysInfo(bl, bl.free_time_demurrage_days || 3, 'demurrage')
                  const detDays = getBLDaysInfo(bl, bl.free_time_detention_days || 7, 'detention')
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
