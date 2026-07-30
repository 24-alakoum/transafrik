'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queries/keys'
import { formatFCFA, formatDate } from '@/lib/utils'
import { EXPENSE_CATEGORIES } from '@/lib/constants'
import { Search, Edit2, Trash2, ExternalLink, FileText, CheckCircle2, XCircle, Printer } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { toast } from 'sonner'
import { deleteDepenseAction } from './actions'
import Link from 'next/link'

interface DepensesListProps {
  initialExpenses: any[]
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

  return (
    <div className="bg-bg-card rounded-2xl border border-border-base shadow-sm overflow-hidden flex flex-col">
      {/* Barre d'outils */}
      <div className="p-4 border-b border-border-base flex flex-col md:flex-row md:items-center justify-between gap-4 bg-bg-surface/50">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input 
            type="text" 
            placeholder="Rechercher une dépense..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-bg-surface border border-border-base rounded-lg pl-10 pr-4 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-text-secondary">Catégorie:</span>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="select select-sm bg-bg-surface border-border-base text-xs rounded-lg">
              <option value="all">Toutes</option>
              <option value="carburant">Carburant</option>
              <option value="maintenance">Maintenance</option>
              <option value="peage">Péage</option>
              <option value="salaire">Salaire</option>
              <option value="assurance">Assurance</option>
              <option value="amende">Amende</option>
              <option value="parking">Parking</option>
              <option value="autre">Autre</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-text-secondary">Statut:</span>
            <select value={selectedReimbursement} onChange={(e) => setSelectedReimbursement(e.target.value)} className="select select-sm bg-bg-surface border-border-base text-xs rounded-lg">
              <option value="all">Tous les statuts</option>
              <option value="reimbursed">Remboursé</option>
              <option value="not_reimbursed">Non remboursé</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-text-secondary">Trier par:</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="select select-sm bg-bg-surface border-border-base text-xs rounded-lg">
              <option value="date-desc">Date (Récent → Ancien)</option>
              <option value="date-asc">Date (Ancien → Récent)</option>
              <option value="amount-desc">Montant (Grand → Petit)</option>
              <option value="amount-asc">Montant (Petit → Grand)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-bg-surface text-text-secondary font-medium border-b border-border-base">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Catégorie</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4">Affectation</th>
              <th className="px-6 py-4">Remboursement</th>
              <th className="px-6 py-4">Montant</th>
              <th className="px-6 py-4">Justificatif</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-base">
            {!filteredExpenses.length ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-text-muted">
                  Aucune dépense trouvée.
                </td>
              </tr>
            ) : (
              filteredExpenses.map((expense) => {
                const catInfo = EXPENSE_CATEGORIES[expense.category as keyof typeof EXPENSE_CATEGORIES]
                return (
                  <tr key={expense.id} className="hover:bg-bg-raised/50 transition-colors">
                    <td className="px-6 py-4 text-text-secondary">{formatDate(expense.date)}</td>
                    <td className="px-6 py-4">
                      <Badge variant="default" className="text-xs">{catInfo?.label || expense.category}</Badge>
                    </td>
                    <td className="px-6 py-4 text-text-primary truncate max-w-[200px]" title={expense.description}>
                      {expense.description || '-'}
                    </td>
                    <td className="px-6 py-4 text-text-secondary">
                      {expense.trips?.reference ? (
                        <Link href={`/dashboard/voyages/${expense.trip_id}`} className="text-accent hover:underline">
                          Voyage {expense.trips.reference}
                        </Link>
                      ) : expense.trucks?.plate ? (
                        <Link href={`/dashboard/camions`} className="text-accent hover:underline">
                          Camion {expense.trucks.plate}
                        </Link>
                      ) : (
                        <span className="text-text-muted">Générale</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {expense.is_reimbursed ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-success bg-success/10 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Remboursé
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-text-muted bg-bg-raised px-2 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3" /> Non remboursé
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-text-primary">{formatFCFA(expense.amount_fcfa)}</td>
                    <td className="px-6 py-4">
                      {expense.receipt_url ? (
                        <a href={expense.receipt_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline">
                          <FileText className="w-4 h-4 text-accent" />
                          <span>Voir reçu</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-text-muted text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a href={`/dashboard/depenses/${expense.id}/facture`} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg text-text-secondary hover:text-accent hover:bg-accent/10" title="Imprimer la facture">
                            <Printer className="w-4 h-4" />
                          </Button>
                        </a>
                        <Link href={`/dashboard/depenses/${expense.id}/editer`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg text-text-secondary hover:text-accent hover:bg-accent/10">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          disabled={isDeletingId === expense.id}
                          onClick={() => handleDelete(expense.id)}
                          className="h-8 w-8 p-0 rounded-lg text-text-secondary hover:text-danger hover:bg-danger/10"
                        >
                          <Trash2 className="w-4 h-4" />
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
    </div>
  )
}
