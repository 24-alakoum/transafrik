import { createClient } from '@/lib/supabase/server'
import { formatFCFA, formatDate } from '@/lib/utils'
import { EXPENSE_CATEGORIES } from '@/lib/constants'
import { Plus, Download, Search, Paperclip, Wallet, Fuel, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export default async function DepensesPage() {
  const supabase = await createClient()

  // On récupère les dépenses
  const { data: expenses } = await supabase
    .from('expenses')
    .select('*, trips(reference), trucks(plate)')
    .order('date', { ascending: false })

  // Calculs KPI rapides (idéalement aggrégés côté DB)
  const totalAmount = (expenses || []).reduce((sum, e) => sum + Number(e.amount_fcfa), 0)
  const byCategory = (expenses || []).reduce((acc: any, e) => {
    acc[e.category] = (acc[e.category] || 0) + Number(e.amount_fcfa)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-syne font-bold text-text-primary">Dépenses</h1>
          <p className="text-text-secondary mt-1">Suivez les coûts opérationnels de votre flotte.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* L'export CSV sera géré par une action client ou un endpoint */}
          <Button variant="outline" className="hidden sm:flex">
            <Download className="w-4 h-4 mr-2" /> Exporter CSV
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" /> Nouvelle dépense
          </Button>
        </div>
      </div>

      {/* KPIs Catégories principales */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-bg-card rounded-2xl border border-border-base p-5">
          <div className="flex items-center gap-3 mb-2 text-text-secondary">
            <Wallet className="w-5 h-5 text-accent" />
            <span className="font-medium">Total Dépenses</span>
          </div>
          <p className="text-2xl font-syne font-bold text-text-primary">{formatFCFA(totalAmount)}</p>
        </div>
        <div className="bg-bg-card rounded-2xl border border-border-base p-5">
          <div className="flex items-center gap-3 mb-2 text-text-secondary">
            <Fuel className="w-5 h-5 text-warning" />
            <span className="font-medium">Carburant</span>
          </div>
          <p className="text-2xl font-syne font-bold text-text-primary">{formatFCFA(byCategory['carburant'] || 0)}</p>
        </div>
        <div className="bg-bg-card rounded-2xl border border-border-base p-5">
          <div className="flex items-center gap-3 mb-2 text-text-secondary">
            <Wrench className="w-5 h-5 text-info" />
            <span className="font-medium">Maintenance</span>
          </div>
          <p className="text-2xl font-syne font-bold text-text-primary">{formatFCFA(byCategory['maintenance'] || 0)}</p>
        </div>
      </div>

      <div className="bg-bg-card rounded-2xl border border-border-base shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border-base flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input 
              type="text" 
              placeholder="Rechercher une dépense..." 
              className="w-full bg-bg-surface border border-border-base rounded-lg pl-10 pr-4 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
            />
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
                <th className="px-6 py-4">Montant</th>
                <th className="px-6 py-4">Reçu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base">
              {!expenses?.length ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-text-muted">Aucune dépense enregistrée.</td></tr>
              ) : (
                expenses.map((expense) => {
                  const catInfo = EXPENSE_CATEGORIES[expense.category as keyof typeof EXPENSE_CATEGORIES]
                  return (
                    <tr key={expense.id} className="hover:bg-bg-raised/50">
                      <td className="px-6 py-4 text-text-secondary">{formatDate(expense.date)}</td>
                      <td className="px-6 py-4">
                        <Badge variant="default" className="text-xs">{catInfo?.label || expense.category}</Badge>
                      </td>
                      <td className="px-6 py-4 text-text-primary truncate max-w-[200px]">{expense.description || '-'}</td>
                      <td className="px-6 py-4 text-text-secondary">
                        {expense.trips?.reference ? `Voyage ${expense.trips.reference}` : 
                         expense.trucks?.plate ? `Camion ${expense.trucks.plate}` : 'Générale'}
                      </td>
                      <td className="px-6 py-4 font-bold text-text-primary">{formatFCFA(expense.amount_fcfa)}</td>
                      <td className="px-6 py-4">
                        {expense.receipt_url ? (
                           <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full text-accent hover:bg-accent/10">
                             <Paperclip className="w-4 h-4" />
                           </Button>
                        ) : (
                           <span className="text-text-muted text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
