'use client'

import * as React from 'react'
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp, DollarSign, Wrench, Fuel, ShieldAlert, Award, FileText } from 'lucide-react'
import { formatFCFA } from '@/lib/utils'

interface BeneficeVoyageCardProps {
  trip: {
    revenue_fcfa?: number | null
    frais_aller_fcfa?: number | null
    frais_retour_fcfa?: number | null
    expenses?: Array<{
      id: string
      category: string
      amount_fcfa: number
      description?: string
      date?: string
    }>
    revenues?: Array<{
      id: string
      amount_fcfa: number
      description?: string
      date?: string
      status?: string
    }>
  }
}

export function BeneficeVoyageCard({ trip }: BeneficeVoyageCardProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  // Recettes calculation
  const baseRevenue = Number(trip.revenue_fcfa || 0)
  const extraRevenuesSum = (trip.revenues || []).reduce((sum, r) => sum + Number(r.amount_fcfa || 0), 0)
  const totalRecettes = baseRevenue + extraRevenuesSum

  // Charges calculation
  const fraisAllerPrevu = Number(trip.frais_aller_fcfa || 0)
  const fraisRetourPrevu = Number(trip.frais_retour_fcfa || 0)

  // Group expenses by category
  const expensesList = trip.expenses || []
  const fraisAllerExpenses = expensesList.filter(e => e.category === 'frais_aller')
  const fraisRetourExpenses = expensesList.filter(e => e.category === 'frais_retour')
  const maintenanceExpenses = expensesList.filter(e => e.category === 'maintenance')
  const fuelPeageExpenses = expensesList.filter(e => ['carburant', 'peage', 'frais_route'].includes(e.category))
  const driverExpenses = expensesList.filter(e => e.category === 'salaire')
  const otherExpenses = expensesList.filter(e => !['maintenance', 'carburant', 'peage', 'frais_route', 'salaire', 'frais_aller', 'frais_retour'].includes(e.category))

  const totalFraisAllerExpenses = fraisAllerExpenses.reduce((sum, e) => sum + Number(e.amount_fcfa || 0), 0)
  const totalFraisRetourExpenses = fraisRetourExpenses.reduce((sum, e) => sum + Number(e.amount_fcfa || 0), 0)
  const totalMaintenance = maintenanceExpenses.reduce((sum, e) => sum + Number(e.amount_fcfa || 0), 0)
  const totalFuelPeage = fuelPeageExpenses.reduce((sum, e) => sum + Number(e.amount_fcfa || 0), 0)
  const totalDriverSalary = driverExpenses.reduce((sum, e) => sum + Number(e.amount_fcfa || 0), 0)
  const totalOthers = otherExpenses.reduce((sum, e) => sum + Number(e.amount_fcfa || 0), 0)

  // Frais aller/retour: utiliser les dépenses enregistrées si elles existent, sinon les prévisions du voyage
  const fraisAller = fraisAllerExpenses.length > 0 ? totalFraisAllerExpenses : fraisAllerPrevu
  const fraisRetour = fraisRetourExpenses.length > 0 ? totalFraisRetourExpenses : fraisRetourPrevu
  const baseFrais = fraisAller + fraisRetour

  // Total des autres dépenses (hors frais aller/retour pour éviter le double comptage)
  const totalOtherExpensesLinked = totalMaintenance + totalFuelPeage + totalDriverSalary + totalOthers
  const totalCharges = baseFrais + totalOtherExpensesLinked

  // Benefice Net
  const beneficeNet = totalRecettes - totalCharges
  const isProfitable = beneficeNet >= 0

  return (
    <div className="bg-bg-card rounded-2xl border border-border-base p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isProfitable ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
              {isProfitable ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            </div>
            <h3 className="text-lg font-syne font-semibold text-text-primary">Calcul du Bénéfice Net</h3>
          </div>
          <p className="text-xs text-text-secondary">Recette du voyage − Total des charges (frais, maintenance, carburant, salaire)</p>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl border border-border-base bg-bg-surface hover:bg-bg-raised text-accent transition-colors self-start sm:self-auto"
        >
          {isOpen ? (
            <>
              Masquer le détail <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              Dérouler le détail <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Summary KPI grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <div className="bg-bg-surface rounded-xl p-4 border border-border-base">
          <p className="text-xs text-text-secondary font-medium mb-1">Recette Totale</p>
          <p className="text-xl font-syne font-bold text-success">{formatFCFA(totalRecettes)}</p>
        </div>

        <div className="bg-bg-surface rounded-xl p-4 border border-border-base">
          <p className="text-xs text-text-secondary font-medium mb-1">Charges Totales</p>
          <p className="text-xl font-syne font-bold text-danger">{formatFCFA(totalCharges)}</p>
        </div>

        <div className={`rounded-xl p-4 border ${isProfitable ? 'bg-success/10 border-success/30' : 'bg-danger/10 border-danger/30'}`}>
          <p className="text-xs text-text-secondary font-medium mb-1">Bénéfice Net</p>
          <p className={`text-xl font-syne font-bold ${isProfitable ? 'text-success' : 'text-danger'}`}>
            {formatFCFA(beneficeNet)}
          </p>
        </div>
      </div>

      {/* Collapsible detail panel */}
      {isOpen && (
        <div className="pt-4 border-t border-border-base space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Recettes section */}
          <div>
            <h4 className="text-sm font-syne font-bold text-text-primary mb-2 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-success" /> Detail Recettes ({formatFCFA(totalRecettes)})
            </h4>
            <div className="bg-bg-surface rounded-xl p-3 border border-border-base space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border-base/50">
                <span className="text-text-secondary">Prix de prestation du voyage</span>
                <span className="font-semibold text-text-primary">{formatFCFA(baseRevenue)}</span>
              </div>
              {(trip.revenues || []).map(r => (
                <div key={r.id} className="flex justify-between py-1 border-b border-border-base/50">
                  <span className="text-text-secondary">{r.description || 'Recette additionnelle'} {r.date ? `(${r.date})` : ''}</span>
                  <span className="font-semibold text-success">+{formatFCFA(r.amount_fcfa)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Charges section */}
          <div>
            <h4 className="text-sm font-syne font-bold text-text-primary mb-2 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-danger" /> Detail Charges & Dépenses ({formatFCFA(totalCharges)})
            </h4>
            <div className="bg-bg-surface rounded-xl p-3 border border-border-base space-y-3 text-xs">
              {/* Frais aller / retour */}
              <div className="space-y-1">
                <div className="font-semibold text-text-primary flex items-center gap-1.5">
                  <Fuel className="w-3.5 h-3.5 text-warning" /> Frais de Route Aller-Retour ({formatFCFA(baseFrais)})
                </div>
                <div className="pl-5 space-y-1 text-text-secondary">
                  <div className="flex justify-between">
                    <span>Frais aller {fraisAllerExpenses.length > 0 ? '(dépense enregistrée)' : '(prévisionnel)'}</span>
                    <span>{formatFCFA(fraisAller)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Frais retour {fraisRetourExpenses.length > 0 ? '(dépense enregistrée)' : '(prévisionnel)'}</span>
                    <span>{formatFCFA(fraisRetour)}</span>
                  </div>
                </div>
              </div>

              {/* Maintenance */}
              {maintenanceExpenses.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-border-base/50">
                  <div className="font-semibold text-text-primary flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-danger" /> Maintenance & Réparations ({formatFCFA(totalMaintenance)})
                  </div>
                  <div className="pl-5 space-y-1 text-text-secondary">
                    {maintenanceExpenses.map(e => (
                      <div key={e.id} className="flex justify-between">
                        <span>{e.description || 'Entretien / Réparation'}</span>
                        <span className="font-medium text-danger">{formatFCFA(e.amount_fcfa)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fuel & Peage recorded expenses */}
              {fuelPeageExpenses.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-border-base/50">
                  <div className="font-semibold text-text-primary flex items-center gap-1.5">
                    <Fuel className="w-3.5 h-3.5 text-accent" /> Carburant / Péages Enregistrés ({formatFCFA(totalFuelPeage)})
                  </div>
                  <div className="pl-5 space-y-1 text-text-secondary">
                    {fuelPeageExpenses.map(e => (
                      <div key={e.id} className="flex justify-between">
                        <span>{e.description || e.category}</span>
                        <span className="font-medium text-danger">{formatFCFA(e.amount_fcfa)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Driver salary / prime */}
              {driverExpenses.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-border-base/50">
                  <div className="font-semibold text-text-primary flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-purple-400" /> Primes & Salaire Chauffeur ({formatFCFA(totalDriverSalary)})
                  </div>
                  <div className="pl-5 space-y-1 text-text-secondary">
                    {driverExpenses.map(e => (
                      <div key={e.id} className="flex justify-between">
                        <span>{e.description || 'Prime / Gratification chauffeur'}</span>
                        <span className="font-medium text-danger">{formatFCFA(e.amount_fcfa)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Other expenses */}
              {otherExpenses.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-border-base/50">
                  <div className="font-semibold text-text-primary flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-text-muted" /> Autres Charges ({formatFCFA(totalOthers)})
                  </div>
                  <div className="pl-5 space-y-1 text-text-secondary">
                    {otherExpenses.map(e => (
                      <div key={e.id} className="flex justify-between">
                        <span>{e.description || e.category}</span>
                        <span className="font-medium text-danger">{formatFCFA(e.amount_fcfa)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
