'use client'

import * as React from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Wrench,
  AlertTriangle,
  Info,
  CheckCircle,
  Clock,
  XCircle,
  Truck,
  Plus,
  Filter,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'

async function fetchMaintenance(params: Record<string, string>) {
  const url = new URL('/api/data/maintenance', window.location.origin)
  Object.entries(params).forEach(([k, v]) => { if (v) url.searchParams.set(k, v) })
  const res = await fetch(url.toString(), { credentials: 'include' })
  if (!res.ok) throw new Error('Erreur lors du chargement')
  return res.json()
}

async function patchMaintenanceStatus(id: string, status: string) {
  const res = await fetch('/api/data/maintenance', {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, status }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erreur')
  return data
}

const SEVERITY_INFO = {
  info: { label: 'Info', color: 'badge-transit' as const, icon: Info, bg: 'bg-blue-500/10 border-blue-500/20 text-blue-400' },
  warning: { label: 'Avertissement', color: 'badge-maintenance' as const, icon: AlertTriangle, bg: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' },
  critical: { label: 'Critique', color: 'badge-late' as const, icon: ShieldAlert, bg: 'bg-red-500/10 border-red-500/20 text-red-400' },
}

const STATUS_INFO = {
  open: { label: 'Ouvert', icon: Clock, color: 'text-warning' },
  in_progress: { label: 'En cours', icon: Wrench, color: 'text-accent' },
  resolved: { label: 'Résolu', icon: CheckCircle, color: 'text-success' },
  cancelled: { label: 'Annulé', icon: XCircle, color: 'text-text-muted' },
}

export default function MaintenancePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()

  const status = searchParams.get('status') || ''
  const severity = searchParams.get('severity') || ''
  const [updatingId, setUpdatingId] = React.useState<string | null>(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['maintenance', { status, severity }],
    queryFn: () => fetchMaintenance({ status, severity }),
  })

  const alerts: any[] = data?.data || []

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  async function handleStatusChange(id: string, newStatus: string) {
    setUpdatingId(id)
    try {
      await patchMaintenanceStatus(id, newStatus)
      toast.success('Statut mis à jour')
      queryClient.invalidateQueries({ queryKey: ['maintenance'] })
    } catch (err: any) {
      toast.error(err.message || 'Erreur')
    } finally {
      setUpdatingId(null)
    }
  }

  // KPIs
  const openCount = alerts.filter(a => a.status === 'open').length
  const criticalCount = alerts.filter(a => a.severity === 'critical').length
  const inProgressCount = alerts.filter(a => a.status === 'in_progress').length
  const resolvedCount = alerts.filter(a => a.status === 'resolved').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-syne font-bold text-text-primary flex items-center gap-3">
            <Wrench className="w-8 h-8 text-accent" />
            Maintenance
          </h1>
          <p className="text-text-secondary mt-1">Alertes de maintenance préventive et corrective de votre flotte.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Alertes ouvertes', value: openCount, icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
          { label: 'Critiques', value: criticalCount, icon: ShieldAlert, color: 'text-danger', bg: 'bg-danger/10' },
          { label: 'En cours', value: inProgressCount, icon: Wrench, color: 'text-accent', bg: 'bg-accent/10' },
          { label: 'Résolus', value: resolvedCount, icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-bg-card rounded-2xl p-5 border border-border-base shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-6 h-6 ${color}`} />
            </div>
            <div>
              <p className="text-2xl font-syne font-bold text-text-primary">{value}</p>
              <p className="text-xs text-text-secondary">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-text-muted" />
          <span className="text-sm text-text-secondary font-medium">Filtrer :</span>
        </div>

        {/* Status filter */}
        <div className="flex flex-wrap gap-2">
          {[
            { val: '', label: 'Tous les statuts' },
            { val: 'open', label: 'Ouvert' },
            { val: 'in_progress', label: 'En cours' },
            { val: 'resolved', label: 'Résolu' },
            { val: 'cancelled', label: 'Annulé' },
          ].map(({ val, label }) => (
            <button
              key={val}
              onClick={() => setParam('status', val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                status === val
                  ? 'bg-accent text-white'
                  : 'bg-bg-card border border-border-base text-text-secondary hover:border-accent/50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 md:ml-4">
          {[
            { val: '', label: 'Toute sévérité' },
            { val: 'info', label: 'Info' },
            { val: 'warning', label: 'Avertissement' },
            { val: 'critical', label: '🔴 Critique' },
          ].map(({ val, label }) => (
            <button
              key={val}
              onClick={() => setParam('severity', val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                severity === val
                  ? 'bg-warning text-white'
                  : 'bg-bg-card border border-border-base text-text-secondary hover:border-warning/50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts List */}
      {isLoading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : !alerts.length ? (
        <div className="bg-bg-card rounded-2xl border border-border-base p-16 text-center space-y-3">
          <CheckCircle className="w-12 h-12 text-success mx-auto opacity-50" />
          <p className="text-text-primary font-semibold">Aucune alerte de maintenance</p>
          <p className="text-sm text-text-muted">
            {status || severity ? 'Aucune alerte ne correspond à vos filtres.' : 'Votre flotte est en bonne santé !'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert: any) => {
            const sevInfo = SEVERITY_INFO[alert.severity as keyof typeof SEVERITY_INFO] || SEVERITY_INFO.info
            const statInfo = STATUS_INFO[alert.status as keyof typeof STATUS_INFO] || STATUS_INFO.open
            const SevIcon = sevInfo.icon
            const StatIcon = statInfo.icon

            return (
              <div
                key={alert.id}
                className={`bg-bg-card rounded-2xl border p-5 shadow-sm transition-all ${
                  alert.severity === 'critical'
                    ? 'border-danger/30 hover:border-danger/50'
                    : alert.severity === 'warning'
                    ? 'border-warning/20 hover:border-warning/40'
                    : 'border-border-base hover:border-border-active'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  {/* Icon & severity */}
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${sevInfo.bg}`}>
                    <SevIcon className="w-5 h-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold text-text-primary">{alert.title}</span>
                      <Badge variant={sevInfo.color}>{sevInfo.label}</Badge>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${statInfo.color}`}>
                        <StatIcon className="w-3.5 h-3.5" />
                        {statInfo.label}
                      </span>
                    </div>

                    <p className="text-sm text-text-secondary mb-2">{alert.description}</p>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
                      {alert.trucks && (
                        <span className="flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5" />
                          {alert.trucks.plate} {alert.trucks.brand ? `(${alert.trucks.brand})` : ''}
                        </span>
                      )}
                      <span>Type: {alert.type}</span>
                      {alert.due_date && <span>Échéance: {formatDate(alert.due_date)}</span>}
                      {alert.resolved_at && <span className="text-success">Résolu le: {formatDate(alert.resolved_at)}</span>}
                      {alert.ai_generated && (
                        <span className="text-accent font-medium">🤖 Généré par IA</span>
                      )}
                    </div>
                  </div>

                  {/* Action selector */}
                  {alert.status !== 'resolved' && alert.status !== 'cancelled' && (
                    <div className="shrink-0">
                      <select
                        value={alert.status}
                        disabled={updatingId === alert.id}
                        onChange={(e) => handleStatusChange(alert.id, e.target.value)}
                        className="select select-sm select-bordered bg-bg-surface border-border-base text-xs rounded-xl"
                      >
                        <option value="open">Ouvert</option>
                        <option value="in_progress">En cours</option>
                        <option value="resolved">Résolu ✓</option>
                        <option value="cancelled">Annuler</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
