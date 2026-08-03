'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowLeft, Bell, Wrench, AlertTriangle, BarChart3 } from 'lucide-react'
import { toast } from 'sonner'
import { getNotificationPreferencesAction, saveNotificationPreferencesAction, type NotificationPreferences } from './actions'

const DEFAULTS: NotificationPreferences = { maintenance_enabled: true, alerts_enabled: true, reports_enabled: true }

export default function NotificationSettingsPage() {
  const [preferences, setPreferences] = React.useState(DEFAULTS)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  React.useEffect(() => {
    getNotificationPreferencesAction().then((result) => {
      if (result.success) setPreferences(result.preferences ?? DEFAULTS)
      else toast.error(result.error || 'Impossible de charger les préférences')
      setIsLoading(false)
    })
  }, [])
  const save = async () => {
    setIsSaving(true)
    const result = await saveNotificationPreferencesAction(preferences)
    setIsSaving(false)
    if (result.success) toast.success('Préférences enregistrées')
    else toast.error(result.error || 'Enregistrement impossible')
  }
  const options = [
    { key: 'maintenance_enabled' as const, label: 'Maintenances', description: 'Pneus usés, révisions et contrôles à planifier.', icon: Wrench },
    { key: 'alerts_enabled' as const, label: 'Alertes de sécurité', description: 'Excès de vitesse et problèmes critiques détectés.', icon: AlertTriangle },
    { key: 'reports_enabled' as const, label: 'Rapports de flotte', description: 'Synthèses quotidiennes du matin et du soir.', icon: BarChart3 },
  ]
  return <div className="max-w-2xl space-y-6">
    <Link href="/dashboard/parametres" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-accent"><ArrowLeft className="w-4 h-4" /> Retour aux paramètres</Link>
    <div><h1 className="text-2xl font-syne font-bold text-text-primary flex items-center gap-3"><Bell className="w-6 h-6 text-accent" /> Préférences de notifications</h1><p className="text-text-secondary mt-1">Choisissez les alertes enregistrées dans votre espace.</p></div>
    <div className="bg-bg-card border border-border-base rounded-2xl divide-y divide-border-base">
      {options.map(({ key, label, description, icon: Icon }) => <label key={key} className="p-5 flex items-center gap-4 cursor-pointer hover:bg-bg-raised transition-colors">
        <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center"><Icon className="w-5 h-5" /></div><div className="flex-1"><p className="font-medium text-text-primary">{label}</p><p className="text-sm text-text-muted mt-0.5">{description}</p></div>
        <input type="checkbox" checked={preferences[key]} disabled={isLoading} onChange={(event) => setPreferences((current) => ({ ...current, [key]: event.target.checked }))} className="toggle toggle-primary" />
      </label>)}
    </div>
    <button onClick={save} disabled={isLoading || isSaving} className="px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-medium disabled:opacity-50">{isSaving ? 'Enregistrement...' : 'Enregistrer'}</button>
  </div>
}
