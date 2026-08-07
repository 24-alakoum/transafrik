'use client'

import { Bell, Menu, X } from 'lucide-react'
import { useUIStore } from '@/store/useUIStore'
import { useNotifications } from '@/lib/queries/hooks'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Topbar() {
  const { toggleSidebar, sidebarOpen } = useUIStore()
  const { data } = useNotifications()
  const unreadCount = data?.data.filter((notification: any) => !notification.read_at).length ?? 0
  const pathname = usePathname()

  // Breadcrumb label from pathname
  const segment = pathname.split('/').filter(Boolean).pop() ?? 'dashboard'
  const labels: Record<string, string> = {
    dashboard: 'Tableau de bord', voyages: 'Voyages', camions: 'Camions',
    chauffeurs: 'Chauffeurs', clients: 'Clients', bons: 'Bons de livraison',
    depenses: 'Dépenses', tracking: 'Tracking GPS', colis: 'Colis & QR Code',
    notifications: 'Notifications', ia: 'IA & Analyses', parametres: 'Paramètres',
    nouveau: 'Nouveau', equipe: 'Équipe', rgpd: 'RGPD', recettes: 'Recettes',
  }
  const pageTitle = labels[segment] ?? segment

  return (
    <header className="h-16 bg-bg-base/90 backdrop-blur-md border-b border-border-base sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between transition-all duration-300">
      <div className="flex items-center gap-3">
        {/* Burger visible sur tous les écrans */}
        <button
          onClick={toggleSidebar}
          className="p-2 -ml-1 text-text-secondary hover:text-text-primary rounded-lg hover:bg-bg-raised transition-all duration-200 flex items-center justify-center"
          aria-label="Toggle sidebar"
        >
          <span
            className="relative w-5 h-5 flex items-center justify-center"
            style={{ transition: 'transform 0.2s' }}
          >
            {sidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </span>
        </button>

        {/* Séparateur vertical subtil */}
        <div className="w-px h-5 bg-border-base hidden sm:block" />

        <h2 className="hidden sm:block text-sm font-syne font-semibold text-text-primary tracking-wide">
          {pageTitle}
        </h2>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/notifications"
          className="relative p-2 text-text-secondary hover:text-text-primary rounded-full hover:bg-bg-raised transition-colors"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-danger text-white text-[9px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  )
}
