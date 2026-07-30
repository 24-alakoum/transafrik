'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatFCFA, formatDate } from '@/lib/utils'
import { EXPENSE_CATEGORIES } from '@/lib/constants'
import { ArrowLeft, Edit2, Trash2, Plus, Search, FileText, CheckCircle2, XCircle, Package, Receipt, Wallet, Fuel, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ligneDepenseSchema, type LigneDepenseInput } from '@/lib/validations/ligne_depense'
import { createLigneDepenseAction, updateLigneDepenseAction, deleteLigneDepenseAction } from '../actions'
import { toast } from 'sonner'

interface ExpenseDetailsClientProps {
  expense: any
  initialLines: any[]
}

export function ExpenseDetailsClient({ expense, initialLines }: ExpenseDetailsClientProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = React.useState('')
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingLine, setEditingLine] = React.useState<any | null>(null)
  const [isActionPending, setIsActionPending] = React.useState(false)

  const catInfo = EXPENSE_CATEGORIES[expense.category as keyof typeof EXPENSE_CATEGORIES]

  // Form setup
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors }
  } = useForm<LigneDepenseInput>({
    resolver: zodResolver(ligneDepenseSchema) as any,
    defaultValues: {
      expense_id: expense.id,
      description: '',
      quantity: 1,
      unit: 'unité',
      unit_price_fcfa: 0
    }
  })

  // Open modal for creating a new line
  const handleOpenAddModal = () => {
    setEditingLine(null)
    reset({
      expense_id: expense.id,
      description: '',
      quantity: 1,
      unit: 'unité',
      unit_price_fcfa: 0
    })
    setIsModalOpen(true)
  }

  // Open modal for editing a line
  const handleOpenEditModal = (line: any) => {
    setEditingLine(line)
    reset({
      expense_id: expense.id,
      description: line.description,
      quantity: line.quantity,
      unit: line.unit,
      unit_price_fcfa: line.unit_price_fcfa
    })
    setIsModalOpen(true)
  }

  const [_, startTransition] = React.useTransition()

  // Handle Form Submission (Add or Edit)
  const onSubmit = (data: LigneDepenseInput) => {
    setIsActionPending(true)
    startTransition(async () => {
      let res
      if (editingLine) {
        res = await updateLigneDepenseAction(editingLine.id, data)
      } else {
        res = await createLigneDepenseAction(data)
      }

      if (res.success) {
        toast.success(editingLine ? 'Ligne modifiée avec succès' : 'Ligne ajoutée avec succès')
        setIsModalOpen(false)
        router.refresh()
      } else {
        toast.error((res.error as any)?._global || 'Une erreur est survenue')
      }
      setIsActionPending(false)
    })
  }

  // Handle deleting a line
  const handleDeleteLine = async (lineId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette ligne de dépense ?')) return
    
    startTransition(async () => {
      const res = await deleteLigneDepenseAction(lineId, expense.id)
      if (res.success) {
        toast.success('Ligne supprimée avec succès')
        router.refresh()
      } else {
        toast.error((res.error as any) || 'Erreur lors de la suppression')
      }
    })
  }

  // Filter lines
  const filteredLines = React.useMemo(() => {
    return initialLines.filter(line => 
      line.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (line.unit || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [initialLines, searchTerm])

  return (
    <div className="space-y-6">
      {/* Retour / En-tête */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/depenses">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-syne font-bold text-text-primary">Détail de la Dépense</h1>
            <Badge variant="default" className="text-xs uppercase">{catInfo?.label || expense.category}</Badge>
          </div>
          <p className="text-text-secondary text-sm">Gérez les détails et les lignes d'articles de cette dépense</p>
        </div>
      </div>

      {/* Dépense Infos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-bg-card rounded-2xl border border-border-base p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border-base">
            <h2 className="text-lg font-syne font-semibold text-text-primary">Informations Dépense</h2>
            {expense.is_reimbursed ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-success bg-success/10 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" /> Remboursé
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-text-muted bg-bg-raised px-2.5 py-1 rounded-full">
                <XCircle className="w-3.5 h-3.5" /> Non remboursé
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-text-secondary">Montant global</p>
              <p className="text-xl font-syne font-bold text-accent">{formatFCFA(expense.amount_fcfa)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-text-secondary">Date de facturation</p>
              <p className="text-sm font-medium text-text-primary">{formatDate(expense.date)}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-text-secondary mb-1">Description / Motif</p>
            <p className="text-sm text-text-primary bg-bg-surface border border-border-base rounded-xl p-3 min-h-[60px] whitespace-pre-wrap">
              {expense.description || 'Aucune description fournie.'}
            </p>
          </div>

          {/* Justificatif */}
          <div>
            <p className="text-xs font-medium text-text-secondary mb-1">Justificatif</p>
            {expense.receipt_url ? (
              <a 
                href={expense.receipt_url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-2 p-3 bg-accent/5 hover:bg-accent/10 border border-accent/20 rounded-xl text-accent text-sm font-medium w-full max-w-sm transition-colors"
              >
                <FileText className="w-5 h-5 shrink-0" />
                <span className="truncate">Visualiser le reçu justificatif</span>
              </a>
            ) : (
              <p className="text-xs text-text-muted italic">Aucun document justificatif téléversé.</p>
            )}
          </div>
        </div>

        {/* Liens d'affectation */}
        <div className="bg-bg-card rounded-2xl border border-border-base p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-syne font-semibold text-text-primary pb-3 border-b border-border-base">Affectation</h2>

          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-text-secondary mb-1">Voyage associé</p>
              {expense.trips ? (
                <Link href={`/dashboard/voyages/${expense.trip_id}`}>
                  <div className="p-3 bg-bg-surface hover:bg-bg-raised border border-border-base rounded-xl flex items-center gap-3 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text-primary">Voyage {expense.trips.reference}</p>
                      <p className="text-xs text-text-secondary">Voir le détail du voyage</p>
                    </div>
                  </div>
                </Link>
              ) : (
                <p className="text-xs text-text-muted italic">Non lié à un voyage.</p>
              )}
            </div>

            <div>
              <p className="text-xs font-medium text-text-secondary mb-1">Camion associé</p>
              {expense.trucks ? (
                <Link href={`/dashboard/camions`}>
                  <div className="p-3 bg-bg-surface hover:bg-bg-raised border border-border-base rounded-xl flex items-center gap-3 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-info/10 text-info flex items-center justify-center">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text-primary">Camion {expense.trucks.plate}</p>
                      <p className="text-xs text-text-secondary">Voir le détail du parc camion</p>
                    </div>
                  </div>
                </Link>
              ) : (
                <p className="text-xs text-text-muted italic">Non lié à un camion.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section Lignes de Dépense */}
      <div className="bg-bg-card rounded-2xl border border-border-base shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-border-base flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-syne font-semibold text-text-primary">Lignes de Dépenses</h3>
            <p className="text-text-secondary text-xs mt-0.5">Détaillez les articles individuels facturés dans cette dépense.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input 
                type="text" 
                placeholder="Rechercher une ligne..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-bg-surface border border-border-base rounded-lg pl-10 pr-4 py-1.5 text-xs text-text-primary focus:border-accent focus:outline-none w-full"
              />
            </div>
            <Button onClick={handleOpenAddModal} size="sm">
              <Plus className="w-4 h-4 mr-1.5" /> Ajouter une ligne
            </Button>
          </div>
        </div>

        {/* Tableau des lignes */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-bg-surface text-text-secondary font-medium border-b border-border-base">
              <tr>
                <th className="px-6 py-3">Description</th>
                <th className="px-6 py-3">Quantité</th>
                <th className="px-6 py-3">Unité</th>
                <th className="px-6 py-3 text-right">Prix unitaire</th>
                <th className="px-6 py-3 text-right">Montant Total</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base">
              {!filteredLines.length ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-text-muted">
                    Aucune ligne renseignée pour cette dépense. Cliquez sur "Ajouter une ligne" pour commencer.
                  </td>
                </tr>
              ) : (
                filteredLines.map((line) => (
                  <tr key={line.id} className="hover:bg-bg-raised/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-text-primary">{line.description}</td>
                    <td className="px-6 py-4 text-text-secondary">{line.quantity}</td>
                    <td className="px-6 py-4 text-text-secondary">{line.unit}</td>
                    <td className="px-6 py-4 text-right text-text-secondary">{formatFCFA(line.unit_price_fcfa)}</td>
                    <td className="px-6 py-4 text-right font-bold text-text-primary">{formatFCFA(line.total_fcfa)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleOpenEditModal(line)}
                          className="h-8 w-8 p-0 rounded-lg text-text-secondary hover:text-accent hover:bg-accent/10"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteLine(line.id)}
                          className="h-8 w-8 p-0 rounded-lg text-text-secondary hover:text-danger hover:bg-danger/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal d'Ajout / Modification d'une Ligne */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingLine ? 'Modifier la Ligne' : 'Ajouter une Ligne de Dépense'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} disabled={isActionPending}>
              Annuler
            </Button>
            <Button onClick={handleSubmit(onSubmit)} isLoading={isActionPending}>
              {editingLine ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            {...register('description')}
            label="Description *"
            placeholder="Ex: Remplacement filtre à huile"
            error={errors.description?.message}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              {...register('quantity')}
              type="number"
              label="Quantité *"
              placeholder="Ex: 1"
              error={errors.quantity?.message}
            />
            <Input
              {...register('unit')}
              label="Unité *"
              placeholder="Ex: unité, litres, jours"
              error={errors.unit?.message}
            />
          </div>

          <Input
            {...register('unit_price_fcfa')}
            type="number"
            label="Prix Unitaire (FCFA) *"
            placeholder="Ex: 5000"
            error={errors.unit_price_fcfa?.message}
          />
        </form>
      </Modal>
    </div>
  )
}
