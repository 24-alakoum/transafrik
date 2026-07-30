'use client'

import * as React from 'react'
import Link from 'next/link'
import { useDepenses } from '@/lib/queries/hooks'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queries/keys'
import { formatFCFA } from '@/lib/utils'
import { Plus, Download, Wallet, Fuel, Wrench } from 'lucide-react'
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-syne font-bold text-text-primary">Dépenses</h1>
          <p className="text-text-secondary mt-1">
            Suivez les coûts opérationnels de votre flotte.
            {isFetching && !isLoading && (
              <span className="ml-2 text-accent text-xs">Actualisation...</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="hidden sm:flex">
            <Download className="w-4 h-4 mr-2" /> Exporter CSV
          </Button>
          <Link href="/dashboard/depenses/nouveau">
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Nouvelle dépense
            </Button>
          </Link>
        </div>
      </div>

      {/* KPIs */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-bg-card rounded-2xl border border-border-base p-5 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-40" />
            </div>
          ))}
        </div>
      ) : (
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
      )}

      {isLoading ? (
        <TableSkeleton rows={10} cols={8} />
      ) : (
        <DepensesList initialExpenses={expenses} />
      )}
    </div>
  )
}
