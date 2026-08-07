'use client'

import * as React from 'react'
import Link from 'next/link'
import { useDepenses } from '@/lib/queries/hooks'
import { formatFCFA } from '@/lib/utils'
import { Plus, Download, Wallet, Fuel, Wrench, TrendingDown, ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { TableSkeleton, Skeleton } from '@/components/ui/Skeleton'
import { DepensesList } from './DepensesList'

export default function DepensesPage() {
  const { data, isLoading, isFetching } = useDepenses()
  const expenses = data?.data || []

  // Calculs KPI
  const totalAmount = expenses.reduce((sum: number, e: any) => sum + Number(e.amount_fcfa), 0)
  const byCategory = expenses.reduce((acc: any, e: any) => {
    acc[e.category] = (acc[e.category] || 0) + Number(e.amount_fcfa)
    return acc
  }, {})

  const kpis = [
    {
      label: 'Total Dépenses',
      value: formatFCFA(totalAmount),
      icon: Wallet,
      color: 'accent',
      iconBg: 'bg-accent/10',
      iconColor: 'text-accent',
      border: 'border-accent/20',
      trend: expenses.length > 0 ? `${expenses.length} entrées` : 'Aucune dépense',
    },
    {
      label: 'Carburant',
      value: formatFCFA(byCategory['carburant'] || 0),
      icon: Fuel,
      color: 'warning',
      iconBg: 'bg-warning/10',
      iconColor: 'text-warning',
      border: 'border-warning/20',
      trend: totalAmount > 0 ? `${Math.round(((byCategory['carburant'] || 0) / totalAmount) * 100)}% du total` : '0% du total',
    },
    {
      label: 'Maintenance',
      value: formatFCFA(byCategory['maintenance'] || 0),
      icon: Wrench,
      color: 'info',
      iconBg: 'bg-info/10',
      iconColor: 'text-info',
      border: 'border-info/20',
      trend: totalAmount > 0 ? `${Math.round(((byCategory['maintenance'] || 0) / totalAmount) * 100)}% du total` : '0% du total',
    },
  ]

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-in-out]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-accent" />
            </div>
            <h1 className="text-2xl lg:text-3xl font-syne font-bold text-text-primary">Dépenses</h1>
          </div>
          <p className="text-text-secondary text-sm pl-12">
            Suivez les coûts opérationnels de votre flotte.
            {isFetching && !isLoading && (
              <span className="ml-2 text-accent text-xs animate-pulse">Actualisation…</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="hidden sm:flex items-center gap-2 text-text-secondary border-border-base hover:border-border-active hover:text-text-primary">
            <Download className="w-4 h-4" /> Exporter CSV
          </Button>
          <Link href="/dashboard/depenses/nouveau">
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> Nouvelle dépense
            </Button>
          </Link>
        </div>
      </div>

      {/* KPIs */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-bg-card rounded-2xl border border-border-base p-5 space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className={`bg-bg-card rounded-2xl border ${kpi.border} p-5 hover:shadow-[0_0_20px_rgba(0,0,0,0.3)] transition-all duration-200 group`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl ${kpi.iconBg} flex items-center justify-center`}>
                  <kpi.icon className={`w-5 h-5 ${kpi.iconColor}`} />
                </div>
                <ArrowUpRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">{kpi.label}</p>
              <p className="text-2xl font-syne font-bold text-text-primary mb-2">{kpi.value}</p>
              <p className="text-xs text-text-secondary">{kpi.trend}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={10} cols={8} />
      ) : (
        <DepensesList initialExpenses={expenses} />
      )}
    </div>
  )
}
