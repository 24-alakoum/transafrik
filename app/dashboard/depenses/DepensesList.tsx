'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queries/keys'
import { formatFCFA, formatDate } from '@/lib/utils'
import { EXPENSE_CATEGORIES } from '@/lib/constants'
import { Search, Edit2, Trash2, ExternalLink, FileText, CheckCircle2, XCircle, Printer, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { toast } from 'sonner'
import { deleteDepenseAction } from './actions'
import Link from 'next/link'

interface DepensesListProps {
  initialExpenses: any[]
}

// Mapping couleur par catégorie
const CATEGORY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  carburant:    { bg: 'bg-warning/10',  text: 'text-warning',  dot: 'bg-warning' },
  maintenance:  { bg: 'bg-info/10',     text: 'text-info',     dot: 'bg-info' },
  peage:        { bg: 'bg-accent/10',   text: 'text-accent',   dot: 'bg-accent' },
  salaire:      { bg: 'bg-success/10',  text: 'text-success',  dot: 'bg-success' },
  assurance:    { bg: 'bg-purple-500/10', text: 'text-purple-400', dot: 'bg-purple-400' },
  amende:       { bg: 'bg-danger/10',   text: 'text-danger',   dot: 'bg-danger' },
  parking:      { bg: 'bg-sky-500/10',  text: 'text-sky-400',  dot: 'bg-sky-400' },
  autre:        { bg: 'bg-bg-raised',   text: 'text-text-secondary', dot: 'bg-text-muted' },
}

export function DepensesList({ initialExpenses }: DepensesListProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = React.useState('')
  const [selectedCategory, setSelectedCategory] = React.useState('all')
  const [selectedReimbursement, setSelectedReimbursement] = React.useState('all')
  const [sortBy, setSortBy] = React.useState('date-desc')
  const [isDeletingId, setIsDeletingId] = React.useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) return
    
    setIsDeletingId(id)
    try {
      const res = await deleteDepenseAction(id)
      if (res.success) {
        toast.success('Dépense supprimée avec succès')
        queryClient.invalidateQueries({ queryKey: queryKeys.depenses.all() })
      } else {
        toast.error(res.error || 'Erreur lors de la suppression')
      }
    } catch {
      toast.error('Erreur inattendue')
    } finally {
      setIsDeletingId(null)
    }
  }

  const filteredExpenses = React.useMemo(() => {
    return initialExpenses
      .filter((expense) => {
        const matchesSearch = 
          (expense.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (expense.trips?.reference || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (expense.trucks?.plate || '').toLowerCase().includes(searchTerm.toLowerCase())
        
        const matchesCategory = selectedCategory === 'all' || expense.category === selectedCategory
        
        const matchesReimbursement = 
          selectedReimbursement === 'all' ||
          (selectedReimbursement === 'reimbursed' && expense.is_reimbursed) ||
          (selectedReimbursement === 'not_reimbursed' && !expense.is_reimbursed)

        return matchesSearch && matchesCategory && matchesReimbursement
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime()
        if (sortBy === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime()
        if (sortBy === 'amount-desc') return Number(b.amount_fcfa) - Number(a.amount_fcfa)
        if (sortBy === 'amount-asc') return Number(a.amount_fcfa) - Number(b.amount_fcfa)
        return 0
      })
  }, [initialExpenses, searchTerm, selectedCategory, selectedReimbursement, sortBy])

  const selectClass = "bg-bg-raised border border-border-base text-text-primary text-xs rounded-lg px-3 py-1.5 focus:border-accent focus:outline-none transition-colors cursor-pointer hover:border-border-active"

  return (
    <div className="bg-bg-card rounded-2xl border border-border-base shadow-sm overflow-hidden flex flex-col">
      {/* Barre d'outils */}
      <div className="p-4 border-b border-border-base bg-bg-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Recherche */}
        <div className="relative w-full lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Rechercher une dépense…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-bg-raised border border-border-base rounded-lg pl-10 pr-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none transition-colors"
          />
        </div>

        {/* Filtres */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-text-muted">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="text-xs font-medium text-text-secondary hidden sm:inline">Filtres :</span>
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={selectClass}
          >
            <option value="all">Toutes catégories</option>
            <option value="carburant">Carburant</option>
            <option value="maintenance">Maintenance</option>
            <option value="peage">Péage</option>
            <option value="salaire">Salaire</option>
            <option value="assurance">Assurance</option>
            <option value="amende">Amende</option>
            <option value="parking">Parking</option>
            <option value="autre">Autre</option>
          </select>

          <select
            value={selectedReimbursement}
            onChange={(e) => setSelectedReimbursement(e.target.value)}
            className={selectClass}
          >
            <option value="all">Tous les statuts</option>
            <option value="reimbursed">Remboursé</option>
            <option value="not_reimbursed">Non remboursé</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={selectClass}
          >
            <option value="date-desc">Plus récent</option>
            <option value="date-asc">Plus ancien</option>
            <option value="amount-desc">Montant ↓</option>
            <option value="amount-asc">Montant ↑</option>
          </select>

          {/* Compteur résultats */}
          <span className="text-xs text-text-muted bg-bg-raised px-2.5 py-1.5 rounded-lg border border-border-base ml-auto lg:ml-0">
            {filteredExpenses.length} résultat{filteredExpenses.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-bg-surface text-text-muted font-medium text-xs uppercase tracking-wider border-b border-border-base">
            <tr>
              <th className="px-5 py-3.5">Date</th>
              <th className="px-5 py-3.5">Catégorie</th>
              <th className="px-5 py-3.5">Description</th>
              <th className="px-5 py-3.5">Affectation</th>
              <th className="px-5 py-3.5">Statut</th>
              <th className="px-5 py-3.5 text-right">Montant</th>
              <th className="px-5 py-3.5 text-center">Justif.</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-base">
            {!filteredExpenses.length ? (
              <tr>
                <td colSpan={8}>
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-12 h-12 rounded-xl bg-bg-raised border border-border-base flex items-center justify-center mb-3">
                      <Search className="w-5 h-5 text-text-muted" />
                    </div>
                    <p className="text-text-muted text-sm font-medium">Aucune dépense trouvée</p>
                    <p className="text-text-muted text-xs mt-1">Modifiez vos filtres ou ajoutez une nouvelle dépense</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredExpenses.map((expense, idx) => {
                const catInfo = EXPENSE_CATEGORIES[expense.category as keyof typeof EXPENSE_CATEGORIES]
                const catColor = CATEGORY_COLORS[expense.category] || CATEGORY_COLORS['autre']
                return (
                  <tr
                    key={expense.id}
                    className="hover:bg-bg-raised/40 transition-colors group"
                  >
                    {/* Date */}
                    <td className="px-5 py-3.5 text-text-secondary text-xs font-medium">
                      {formatDate(expense.date)}
                    </td>

                    {/* Catégorie */}
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${catColor.bg} ${catColor.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${catColor.dot}`} />
                        {catInfo?.label || expense.category}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="px-5 py-3.5 text-text-primary max-w-[180px]">
                      <span className="truncate block text-sm" title={expense.description}>
                        {expense.description || <span className="text-text-muted">—</span>}
                      </span>
                    </td>

                    {/* Affectation */}
                    <td className="px-5 py-3.5">
                      {expense.trips?.reference ? (
                        <Link href={`/dashboard/voyages/${expense.trip_id}`} className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent/80 font-medium transition-colors">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent/60" />
                          Voyage {expense.trips.reference}
                        </Link>
                      ) : expense.trucks?.plate ? (
                        <Link href="/dashboard/camions" className="inline-flex items-center gap-1 text-xs text-info hover:text-info/80 font-medium transition-colors">
                          <span className="w-1.5 h-1.5 rounded-full bg-info/60" />
                          Camion {expense.trucks.plate}
                        </Link>
                      ) : (
                        <span className="text-xs text-text-muted">Générale</span>
                      )}
                    </td>

                    {/* Remboursement */}
                    <td className="px-5 py-3.5">
                      {expense.is_reimbursed ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success bg-success/10 px-2.5 py-1 rounded-lg">
                          <CheckCircle2 className="w-3 h-3" />
                          Remboursé
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted bg-bg-raised px-2.5 py-1 rounded-lg">
                          <XCircle className="w-3 h-3" />
                          Non remboursé
                        </span>
                      )}
                    </td>

                    {/* Montant */}
                    <td className="px-5 py-3.5 text-right">
                      <span className="font-syne font-bold text-text-primary tabular-nums">
                        {formatFCFA(expense.amount_fcfa)}
                      </span>
                    </td>

                    {/* Justificatif */}
                    <td className="px-5 py-3.5 text-center">
                      {expense.receipt_url ? (
                        <a
                          href={expense.receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:text-accent/80 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-text-muted text-xs">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <a href={`/dashboard/depenses/${expense.id}/facture`} target="_blank" rel="noopener noreferrer">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 rounded-lg text-text-secondary hover:text-accent hover:bg-accent/10"
                            title="Imprimer la facture"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </Button>
                        </a>
                        <Link href={`/dashboard/depenses/${expense.id}/editer`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 rounded-lg text-text-secondary hover:text-warning hover:bg-warning/10"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isDeletingId === expense.id}
                          onClick={() => handleDelete(expense.id)}
                          className="h-7 w-7 p-0 rounded-lg text-text-secondary hover:text-danger hover:bg-danger/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {filteredExpenses.length > 0 && (
        <div className="px-5 py-3 border-t border-border-base bg-bg-card flex items-center justify-between">
          <span className="text-xs text-text-muted">
            {filteredExpenses.length} dépense{filteredExpenses.length !== 1 ? 's' : ''} affichée{filteredExpenses.length !== 1 ? 's' : ''}
          </span>
          <span className="text-xs font-syne font-bold text-text-secondary tabular-nums">
            Total affiché : {formatFCFA(filteredExpenses.reduce((s: number, e: any) => s + Number(e.amount_fcfa), 0))}
          </span>
        </div>
      )}
    </div>
  )
}
