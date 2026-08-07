'use client'

import React from 'react'
import { useUIStore } from '@/store/useUIStore'

export function DashboardContent({ children }: { children: React.ReactNode }) {
  const { sidebarOpen } = useUIStore()
  return (
    <div className={`flex-1 flex flex-col transition-all duration-300 min-h-screen ${sidebarOpen ? 'lg:pl-64' : 'lg:pl-0'}`}>
      {children}
    </div>
  )
}
