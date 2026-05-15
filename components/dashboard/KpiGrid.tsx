'use client'

import * as React from 'react'
import { TrendingUp, TrendingDown, Truck, Map, Wallet, AlertCircle } from 'lucide-react'
import { cn, formatFCFA } from '@/lib/utils'

export interface KpiData {
  title: string
  value: string | number
  change: number
  trend: 'up' | 'down' | 'neutral'
  icon: 'wallet' | 'map' | 'truck' | 'alert'
  isCurrency?: boolean
}

const icons = {
  wallet: Wallet,
  map: Map,
  truck: Truck,
  alert: AlertCircle,
}

export function KpiGrid({ data }: { data: KpiData[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      {data.map((kpi, i) => {
        const Icon = icons[kpi.icon]
        const isPositive = kpi.trend === 'up'
        const isNegative = kpi.trend === 'down'
        const isNeutral = kpi.trend === 'neutral'
        
        return (
          <div 
            key={i} 
            className="bg-bg-card rounded-2xl p-5 border border-border-base shadow-sm relative overflow-hidden group hover:border-border-active transition-colors"
          >
            {/* Subtle background glow effect */}
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-accent/5 to-transparent rounded-full blur-2xl group-hover:from-accent/10 transition-colors" />
            
            <div className="flex items-center justify-between mb-4 relative z-10">
              <p className="text-sm font-medium text-text-secondary">{kpi.title}</p>
              <div className="w-10 h-10 rounded-xl bg-bg-raised flex items-center justify-center text-text-primary">
                <Icon className="w-5 h-5" />
              </div>
            </div>
            
            <div className="relative z-10">
              <h3 className="text-2xl lg:text-3xl font-syne font-bold text-text-primary mb-2">
                {kpi.isCurrency ? formatFCFA(Number(kpi.value)) : kpi.value}
              </h3>
              
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <span 
                  className={cn(
                    "flex items-center gap-0.5",
                    isPositive ? "text-success" : isNegative ? "text-danger" : "text-text-muted"
                  )}
                >
                  {isPositive && <TrendingUp className="w-4 h-4" />}
                  {isNegative && <TrendingDown className="w-4 h-4" />}
                  {!isNeutral && Math.abs(kpi.change).toFixed(1) + '%'}
                  {isNeutral && '—'}
                </span>
                <span className="text-text-muted text-xs">vs mois dernier</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
