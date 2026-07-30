'use client'

import * as React from 'react'
import {
  Brain, Fuel, Route, Wrench, TrendingDown,
  AlertTriangle, Zap, BarChart3, Target,
  Truck, Clock, ArrowRight, Lightbulb, Shield, Leaf, RefreshCw, Circle, ShieldAlert
} from 'lucide-react'
import { getAIPredictiveDataAction } from './actions'
import { formatFCFA } from '@/lib/utils'
import { toast } from 'sonner'

type Tab = 'tires' | 'maintenance' | 'fuel' | 'routes'

const EFFICIENCY_COLOR: Record<string, string> = {
  excellent: 'text-success', good: 'text-accent', average: 'text-warning', poor: 'text-danger'
}
const EFFICIENCY_LABEL: Record<string, string> = {
  excellent: 'Excellent', good: 'Bon', average: 'Moyen', poor: 'Mauvais'
}
const SEV_COLOR: Record<string, string> = {
  critical: 'text-danger bg-danger/10 border-danger/30',
  warning:  'text-warning bg-warning/10 border-warning/30',
  info:     'text-accent bg-accent/10 border-accent/30',
}

export default function IAPage() {
  const [tab, setTab] = React.useState<Tab>('tires')
  const [analysisData, setAnalysisData] = React.useState<any>(null)
  const [isPending, startTransition] = React.useTransition()
  const [isLoading, setIsLoading] = React.useState(true)

  const fetchAIData = (showToast = false) => {
    startTransition(async () => {
      const res = await getAIPredictiveDataAction()
      if (res.success) {
        setAnalysisData(res)
        if (showToast) {
          toast.success('Moteur d\'analyse IA actualisé avec succès')
        }
      } else {
        toast.error(res.error || 'Erreur lors du calcul des prédictions IA')
      }
      setIsLoading(false)
    })
  }

  React.useEffect(() => {
    fetchAIData()
  }, [])

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'tires',       label: 'Sécurité & Pneus',        icon: <Shield className="w-4 h-4" /> },
    { id: 'maintenance', label: 'Maintenance Prédictive', icon: <Wrench className="w-4 h-4" /> },
    { id: 'fuel',        label: 'Analyse Carburant',      icon: <Fuel className="w-4 h-4" /> },
    { id: 'routes',      label: 'Optimisation Trajets',   icon: <Route className="w-4 h-4" /> },
  ]

  // KPI aggregates
  const criticalTireAlerts = analysisData?.tireAlerts?.filter((t: any) => t.severity === 'critical').length || 0
  const avgConsumption = analysisData?.fuelEfficiency?.length
    ? (analysisData.fuelEfficiency.reduce((acc: number, f: any) => acc + f.per100km, 0) / analysisData.fuelEfficiency.length).toFixed(1)
    : '0.0'
  const criticalMaintenance = analysisData?.maintenanceSuggestions?.filter((m: any) => m.severity === 'critical').length || 0
  const potentialSavings = analysisData?.savingsEstimate || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-accent/20 border border-purple-500/30 flex items-center justify-center">
            <Brain className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-syne font-bold text-text-primary">Intelligence Artificielle</h1>
            <p className="text-text-secondary mt-0.5">Analyses prédictives, diagnostics des pneus et économies de carburant</p>
          </div>
        </div>
        <button
          onClick={() => fetchAIData(true)}
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-card border border-border-base text-text-secondary hover:text-accent hover:border-accent/40 transition-all text-sm disabled:opacity-55"
        >
          <RefreshCw className={`w-4 h-4 ${isPending ? 'animate-spin' : ''}`} />
          Recalculer IA
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: ShieldAlert,  label: 'Alerte pneus usés',  value: `${criticalTireAlerts} critique${criticalTireAlerts > 1 ? 's' : ''}`, color: 'text-danger', bg: 'from-danger/10' },
          { icon: BarChart3,    label: 'Conso. moy. flotte',  value: `${avgConsumption} L/100`,          color: 'text-accent',      bg: 'from-accent/10' },
          { icon: AlertTriangle,label: 'Interventions urgentes',value: `${criticalMaintenance} alerte${criticalMaintenance > 1 ? 's' : ''}`, color: 'text-warning', bg: 'from-warning/10' },
          { icon: Target,       label: 'Économies estimées',  value: formatFCFA(potentialSavings),        color: 'text-success',     bg: 'from-success/10' },
        ].map((k, i) => (
          <div key={i} className={`bg-bg-card border border-border-base rounded-2xl p-4 bg-gradient-to-br ${k.bg} to-transparent shadow-sm`}>
            <div className="flex items-center gap-2 mb-2">
              <k.icon className={`w-4 h-4 ${k.color}`} />
              <span className="text-xs text-text-muted">{k.label}</span>
            </div>
            <p className={`text-xl font-bold font-syne ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* AI Badge */}
      <div className="flex items-center gap-3 bg-gradient-to-r from-purple-500/10 to-accent/10 border border-purple-500/20 rounded-xl px-4 py-3 shadow-glow-sm">
        <Zap className="w-4 h-4 text-purple-400 shrink-0 animate-pulse" />
        <p className="text-xs sm:text-sm text-text-secondary">
          Modèles d'apprentissage connectés via <strong className="text-text-primary">Supabase Realtime</strong> — Moteur IA de maintenance prédictive actif.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar bg-bg-card border border-border-base rounded-2xl p-1.5 w-fit">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              tab === t.id
                ? 'bg-accent text-white shadow-glow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-text-muted bg-bg-card border border-border-base rounded-2xl">
          <RefreshCw className="w-8 h-8 animate-spin text-accent mb-2" />
          <p className="text-sm font-medium">Lancement des algorithmes de prédiction IA...</p>
        </div>
      ) : (
        <>
          {/* ── TIRES TAB ── */}
          {tab === 'tires' && (
            <div className="space-y-4">
              {!analysisData?.tireAlerts?.length ? (
                <div className="bg-bg-card border border-border-base rounded-2xl p-8 text-center text-text-muted">
                  <Shield className="w-10 h-10 mx-auto text-success/40 mb-3" />
                  Tous les pneumatiques de votre flotte sont en excellent état (wear &lt; 60%).
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysisData.tireAlerts.map((alert: any, idx: number) => (
                    <div 
                      key={idx} 
                      className={`bg-bg-card border rounded-2xl p-5 flex flex-col justify-between shadow-sm transition-all ${
                        alert.severity === 'critical' ? 'border-danger/30 bg-danger/5' : 'border-warning/30 bg-warning/5'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                          alert.severity === 'critical' ? 'bg-danger/10 text-danger border-danger/20' : 'bg-warning/10 text-warning border-warning/20'
                        }`}>
                          <ShieldAlert className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-text-primary">{alert.plate} ({alert.brand || 'Camion'})</p>
                          <p className="text-xs text-text-muted mt-0.5">Position : <span className="font-medium text-text-primary capitalize">{alert.position.replace(/_/g, ' ')}</span></p>
                          <p className="text-sm text-text-secondary mt-2">{alert.description}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between pt-3 border-t border-border-base/50">
                        <span className="text-xs font-semibold text-text-muted">Taux d'usure :</span>
                        <span className={`text-sm font-extrabold ${alert.severity === 'critical' ? 'text-danger' : 'text-warning'}`}>{alert.wear}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── MAINTENANCE TAB ── */}
          {tab === 'maintenance' && (
            <div className="space-y-4">
              {!analysisData?.maintenanceSuggestions?.length ? (
                <div className="bg-bg-card border border-border-base rounded-2xl p-8 text-center text-text-muted">
                  <Wrench className="w-10 h-10 mx-auto text-success/40 mb-3" />
                  Aucune maintenance préventive critique identifiée pour le moment.
                </div>
              ) : (
                <div className="space-y-4">
                  {analysisData.maintenanceSuggestions.map((m: any, i: number) => (
                    <div key={i} className={`bg-bg-card border rounded-2xl p-5 shadow-sm ${SEV_COLOR[m.severity]?.split(' ').slice(1).join(' ') || ''}`}>
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${SEV_COLOR[m.severity] || ''}`}>
                          {m.severity === 'critical' ? <AlertTriangle className="w-5 h-5 text-danger" /> : <Shield className="w-5 h-5 text-warning" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div>
                              <span className="font-semibold text-text-primary">{m.plate}</span>
                              <span className="text-text-muted mx-2">·</span>
                              <span className="font-medium text-text-primary">{m.alert}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-text-muted">Confiance IA :</span>
                              <div className="flex items-center gap-1.5">
                                <div className="w-20 h-1.5 bg-bg-raised rounded-full overflow-hidden">
                                  <div className="h-full bg-accent rounded-full" style={{ width: `${m.confidence}%` }} />
                                </div>
                                <span className="text-xs font-bold text-accent">{m.confidence}%</span>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-text-secondary mt-1">{m.desc}</p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-text-muted">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Échéance estimée : <strong className="text-text-primary">{m.dueIn}</strong></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── FUEL TAB ── */}
          {tab === 'fuel' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysisData?.fuelEfficiency?.map((f: any, i: number) => {
                  const pct = (f.per100km / 35) * 100
                  return (
                    <div key={i} className="bg-bg-card border border-border-base rounded-2xl p-5 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-bg-raised flex items-center justify-center">
                            <Truck className="w-5 h-5 text-text-secondary" />
                          </div>
                          <div>
                            <p className="font-semibold text-text-primary">{f.plate}</p>
                            <p className="text-xs text-text-muted">{f.brand} {f.model}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full bg-bg-raised ${EFFICIENCY_COLOR[f.efficiency]}`}>
                          {EFFICIENCY_LABEL[f.efficiency]}
                        </span>
                      </div>

                      {/* Consumption progress bar */}
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-xs text-text-muted">
                          <span>Consommation réelle moyenne</span>
                          <span className="font-bold text-text-primary">{f.per100km} L/100km</span>
                        </div>
                        <div className="h-2.5 bg-bg-raised rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              f.efficiency === 'excellent' ? 'bg-success' :
                              f.efficiency === 'good' ? 'bg-accent' :
                              f.efficiency === 'average' ? 'bg-warning' : 'bg-danger'
                            }`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-bg-surface rounded-xl p-3 text-center border border-border-base/40">
                          <p className="text-xs text-text-muted mb-0.5">Volume</p>
                          <p className="text-base font-bold text-text-primary">{f.liters.toFixed(0)} L</p>
                        </div>
                        <div className="bg-bg-surface rounded-xl p-3 text-center border border-border-base/40">
                          <p className="text-xs text-text-muted mb-0.5">Coût carburant</p>
                          <p className="text-base font-bold text-orange-400">{formatFCFA(f.cost)}</p>
                        </div>
                      </div>

                      {f.efficiency === 'poor' && (
                        <div className="mt-3 flex items-start gap-2 bg-danger/10 border border-danger/20 rounded-lg p-2.5">
                          <Lightbulb className="w-3.5 h-3.5 text-danger shrink-0 mt-0.5" />
                          <p className="text-xs text-danger">Surconsommation détectée. Vérifier pression des pneus et filtre à air.</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Savings insight */}
              <div className="bg-gradient-to-r from-success/10 to-accent/10 border border-success/20 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-success/20 flex items-center justify-center shrink-0">
                  <Leaf className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="font-semibold text-text-primary">Gain écologique & financier identifié</p>
                  <p className="text-sm text-text-secondary mt-0.5">
                    L'optimisation globale de l'éco-conduite et de la maintenance sur vos véhicules en surconsommation peut vous faire économiser jusqu'à <strong className="text-success">{formatFCFA(potentialSavings)} / mois</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── ROUTES TAB ── */}
          {tab === 'routes' && (
            <div className="space-y-4">
              {analysisData?.optimizedRoutes?.map((r: any, i: number) => (
                <div key={i} className="bg-bg-card border border-border-base rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3 text-lg font-syne font-bold text-text-primary">
                      <span>{r.from}</span>
                      <ArrowRight className="w-5 h-5 text-accent" />
                      <span>{r.to}</span>
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wide text-success">
                      🔥 Gain élevé
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <div className="bg-bg-surface rounded-xl p-3 border border-border-base">
                      <p className="text-xs text-text-muted mb-1">Trajet actuel</p>
                      <p className="text-sm font-medium text-text-secondary">{r.current}</p>
                    </div>
                    <div className="bg-success/5 rounded-xl p-3 border border-success/20">
                      <p className="text-xs text-success mb-1">Trajet optimisé IA</p>
                      <p className="text-sm font-medium text-success">{r.optimized}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-bg-raised rounded-xl px-4 py-2.5">
                    <TrendingDown className="w-4 h-4 text-success shrink-0" />
                    <p className="text-xs sm:text-sm text-text-secondary">
                      Économie calculée : <strong className="text-success">{r.saving}</strong>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
