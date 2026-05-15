'use client'

import * as React from 'react'
import { Shield, Download, Trash2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'
import { requestDataExportAction, deleteAccountRequestAction } from './actions'

export default function RgpdPage() {
  const [isExporting, setIsExporting] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    const res = await requestDataExportAction()
    if (res.success) {
      toast.success('Votre archive est en cours de préparation. Un email vous sera envoyé avec le lien ZIP.')
    } else {
      toast.error(res.error || 'Erreur lors de la demande d\'export')
    }
    setIsExporting(false)
  }

  const handleDelete = async () => {
    if (!window.confirm("Êtes-vous sûr ? Cette action déclenche le processus de suppression de vos données personnelles sous 30 jours (Droit à l'oubli).")) return
    setIsDeleting(true)
    const res = await deleteAccountRequestAction()
    if (res.success) {
      toast.success('Demande de suppression enregistrée. Notre équipe va traiter la requête sous 30 jours.')
    } else {
      toast.error(res.error || 'Erreur lors de la demande')
    }
    setIsDeleting(false)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-syne font-bold text-text-primary">Centre de Confidentialité (RGPD)</h1>
        <p className="text-text-secondary mt-1">Gérez vos données personnelles et vos consentements.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-bg-card rounded-2xl border border-border-base p-6">
          <div className="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-4">
            <Download className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-syne font-semibold text-text-primary mb-2">Droit à la portabilité</h2>
          <p className="text-sm text-text-secondary mb-6">
            Obtenez une copie complète de vos données personnelles (profil, journaux d'audit, historiques) au format structuré (JSON/ZIP). Limité à 2 requêtes par 24h.
          </p>
          <Button variant="outline" onClick={handleExport} isLoading={isExporting} fullWidth>
            Demander l'export de mes données
          </Button>
        </div>

        <div className="bg-bg-card rounded-2xl border border-danger/20 p-6">
          <div className="w-12 h-12 rounded-xl bg-danger/10 text-danger flex items-center justify-center mb-4">
            <Trash2 className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-syne font-semibold text-text-primary mb-2">Droit à l'oubli</h2>
          <p className="text-sm text-text-secondary mb-6">
            Demandez la suppression définitive de votre compte et de toutes les données personnelles associées. Cette action est irréversible et sera traitée sous 30 jours.
          </p>
          <Button variant="danger" onClick={handleDelete} isLoading={isDeleting} fullWidth>
            Demander la suppression
          </Button>
        </div>
      </div>

      <div className="bg-bg-card rounded-2xl border border-border-base p-6">
         <h2 className="text-lg font-syne font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-success" /> Historique des consentements
         </h2>
         <div className="bg-bg-surface rounded-xl border border-border-base p-4 flex items-start gap-4">
            <CheckCircle className="w-5 h-5 text-success mt-0.5" />
            <div>
               <p className="font-medium text-text-primary">Conditions Générales d'Utilisation</p>
               <p className="text-sm text-text-secondary">Acceptées lors de l'inscription (v1.0)</p>
            </div>
         </div>
      </div>
    </div>
  )
}
