'use client'

import * as React from 'react'
import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Download, TrendingUp, RefreshCw, Trash2, CheckCircle2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { formatFCFA, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { deleteRecetteAction } from './actions'

export default function RecettesPage() {
  const queryClient = useQueryClient()
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['recettes'],
    queryFn: async () => {
      const res = await fetch('/api/data/recettes')
      if (!res.ok) throw new Error('Erreur de chargement')
      return res.json()
    },
    staleTime: 30_000,
  })

  const recettes = data?.data || []
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  const totalAmount = recettes.reduce((sum: number, r: any) => sum + Number(r.amount_fcfa), 0)
  const encaisses = recettes.filter((r: any) => r.status === 'encaisse').reduce((sum: number, r: any) => sum + Number(r.amount_fcfa), 0)
  const enAttente = recettes.filter((r: any) => r.status === 'en_attente').reduce((sum: number, r: any) => sum + Number(r.amount_fcfa), 0)

  const handleDelete = async (id: string) => {
    if (!confirm('Voulez-vous supprimer cette recette ?')) return
    setDeletingId(id)
    const res = await deleteRecetteAction(id)
    if (res.success) {
      toast.success('Recette supprimée')
      refetch()
    } else {
      toast.error(res.error || 'Erreur')
    }
    setDeletingId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-syne font-bold text-text-primary flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-success/20 border border-success/30 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            Recettes
            {isFetching && !isLoading && <span className="text-xs text-accent font-normal">Actualisation...</span>}
          </h1>
          <p className="text-text-secondary mt-1">Gérez vos revenus (facturation clients, prestations).</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="hidden sm:flex">
            <Download className="w-4 h-4 mr-2" /> Exporter
          </Button>
          <button onClick={() => refetch()} className="p-2 rounded-lg border border-border-base hover:border-accent/40 text-text-muted hover:text-accent transition-colors">
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          <Link href="/dashboard/recettes/nouveau">
            <Button><Plus className="w-4 h-4 mr-2" />Nouvelle recette</Button>
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-bg-card rounded-2xl border border-border-base p-5">
          <p className="text-text-secondary text-sm font-medium mb-1">Total Recettes</p>
          <p className="text-2xl font-syne font-bold text-text-primary">{formatFCFA(totalAmount)}</p>
        </div>
        <div className="bg-bg-card rounded-2xl border border-success/20 bg-success/5 p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-text-secondary text-sm font-medium">Encaissé</p>
            <CheckCircle2 className="w-4 h-4 text-success" />
          </div>
          <p className="text-2xl font-syne font-bold text-success">{formatFCFA(encaisses)}</p>
        </div>
        <div className="bg-bg-card rounded-2xl border border-warning/20 bg-warning/5 p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-text-secondary text-sm font-medium">En attente / Facturé</p>
            <Clock className="w-4 h-4 text-warning" />
          </div>
          <p className="text-2xl font-syne font-bold text-warning">{formatFCFA(enAttente)}</p>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : recettes.length === 0 ? (
        <div className="bg-bg-card rounded-2xl border border-border-base p-16 text-center">
          <TrendingUp className="w-12 h-12 mx-auto text-text-muted/30 mb-4" />
          <p className="text-lg font-syne font-semibold text-text-primary mb-2">Aucune recette</p>
          <p className="text-text-muted text-sm mb-6">Ajoutez votre première recette (revenu, encaissement, facturation).</p>
          <Link href="/dashboard/recettes/nouveau">
            <Button><Plus className="w-4 h-4 mr-2" />Ajouter une recette</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-bg-card rounded-2xl border border-border-base shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-bg-surface text-text-secondary font-medium border-b border-border-base">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Source</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Client / Voyage</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4">Montant</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-base">
                {recettes.map((r: any) => (
                  <tr key={r.id} className="hover:bg-bg-raised/50 transition-colors">
                    <td className="px-6 py-4 text-text-secondary">{formatDate(r.date)}</td>
                    <td className="px-6 py-4 capitalize">{r.source?.replace('_', ' ') || 'Autre'}</td>
                    <td className="px-6 py-4 font-medium text-text-primary">{r.description || '-'}</td>
                    <td className="px-6 py-4 text-text-secondary">
                      {r.clients?.name && <div><span className="text-xs text-text-muted">Client:</span> {r.clients.name}</div>}
                      {r.trips?.reference && <div><span className="text-xs text-text-muted">Voyage:</span> {r.trips.reference}</div>}
                      {!r.clients?.name && !r.trips?.reference && '-'}
                    </td>
                    <td className="px-6 py-4">
                      {r.status === 'encaisse' ? (
                        <Badge variant="success">Encaissé</Badge>
                      ) : (
                        <Badge variant="warning">En attente</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-text-primary">{formatFCFA(r.amount_fcfa)}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(r.id)}
                        disabled={deletingId === r.id}
                        className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-text-muted hover:text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
