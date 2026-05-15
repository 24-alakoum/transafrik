'use client'

import * as React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatFCFA } from '@/lib/utils'

export interface RevenueData {
  month: string
  revenue: number
  expenses: number
}

interface RevenueChartProps {
  data: RevenueData[]
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <div className="bg-bg-card rounded-2xl p-5 border border-border-base shadow-sm w-full h-[400px]">
      <h3 className="text-lg font-syne font-semibold text-text-primary mb-6">Évolution financière</h3>
      
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#252E42" vertical={false} />
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#8F9BB3', fontSize: 12 }}
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#8F9BB3', fontSize: 12 }}
              tickFormatter={(value) => {
                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
                if (value >= 1000) return `${(value / 1000).toFixed(0)}k`
                return value.toString()
              }}
            />
            <Tooltip
              cursor={{ fill: '#252E42', opacity: 0.4 }}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-bg-surface border border-border-base p-3 rounded-lg shadow-xl">
                      <p className="font-medium text-text-primary mb-2">{label}</p>
                      {payload.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm mb-1">
                          <div 
                            className="w-3 h-3 rounded-sm" 
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="text-text-secondary">
                            {entry.name === 'revenue' ? 'Revenus' : 'Dépenses'} :
                          </span>
                          <span className="font-medium text-text-primary">
                            {formatFCFA(entry.value as number)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )
                }
                return null
              }}
            />
            <Bar 
              dataKey="revenue" 
              name="revenue" 
              fill="#4361EE" 
              radius={[4, 4, 0, 0]} 
              maxBarSize={40}
            />
            <Bar 
              dataKey="expenses" 
              name="expenses" 
              fill="#EF476F" 
              radius={[4, 4, 0, 0]} 
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
