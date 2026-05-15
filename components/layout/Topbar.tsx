'use client'

import { Bell, Menu } from 'lucide-react'
import { useUIStore } from '@/store/useUIStore'
import { useNotifStore } from '@/store/useNotifStore'

export function Topbar() {
  const { toggleSidebar } = useUIStore()
  const { unreadCount } = useNotifStore()

  return (
    <header className="h-16 lg:h-20 bg-bg-base/80 backdrop-blur-md border-b border-border-base sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="lg:hidden p-2 -ml-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-bg-raised"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        {/* Le titre de la page sera géré par un composant PageHeader spécifique à chaque page */}
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2 text-text-secondary hover:text-text-primary rounded-full hover:bg-bg-raised transition-colors">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent animate-pulse" />
          )}
        </button>
      </div>
    </header>
  )
}
