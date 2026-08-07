'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  Building2, 
  FileText, 
  Wallet, 
  Settings, 
  LogOut,
  MapIcon,
  Radio,
  Package,
  Bell,
  Brain,
  Ship,
  TrendingUp,
  Wrench,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store/useUIStore'
import { useAuthStore } from '@/store/useAuthStore'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Company, User } from '@/types'

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['owner', 'admin', 'manager', 'secretary', 'driver', 'accountant', 'dispatcher', 'viewer'] },
  { name: 'Voyages', href: '/dashboard/voyages', icon: MapIcon, roles: ['owner', 'admin', 'manager', 'secretary', 'dispatcher'] },
  { name: 'Camions', href: '/dashboard/camions', icon: Truck, roles: ['owner', 'admin', 'manager', 'secretary', 'dispatcher'] },
  { name: 'Maintenance', href: '/dashboard/camions/maintenance', icon: Wrench, roles: ['owner', 'admin', 'manager'] },
  { name: 'Chauffeurs', href: '/dashboard/chauffeurs', icon: Users, roles: ['owner', 'admin', 'manager', 'secretary'] },
  { name: 'Clients', href: '/dashboard/clients', icon: Building2, roles: ['owner', 'admin', 'manager', 'secretary'] },
  { name: 'Connaissements (BL)', href: '/dashboard/connaissements', icon: Ship, roles: ['owner', 'admin', 'manager', 'secretary', 'dispatcher'] },
  { name: 'Dépenses', href: '/dashboard/depenses', icon: Wallet, roles: ['owner', 'admin', 'manager', 'secretary', 'accountant', 'dispatcher'] },
  { name: 'Recettes', href: '/dashboard/recettes', icon: TrendingUp, roles: ['owner', 'admin', 'manager', 'accountant'] },
  { name: 'Équipe', href: '/dashboard/equipe', icon: Users, roles: ['owner', 'admin'] },
  { name: 'Admin', href: '/dashboard/admin', icon: Building2, roles: ['owner', 'admin'] },
]

const advancedNavItems = [
  { name: 'Tracking GPS', href: '/dashboard/tracking', icon: Radio, badge: null, roles: ['owner', 'admin', 'manager', 'secretary', 'driver'] },
  { name: 'Colis & QR Code', href: '/dashboard/colis', icon: Package, badge: null, roles: ['owner', 'admin', 'manager', 'secretary', 'dispatcher'] },
  { name: 'Notifications', href: '/dashboard/notifications', icon: Bell, badge: '3', roles: ['owner', 'admin', 'manager', 'secretary', 'dispatcher', 'accountant', 'driver'] },
  { name: 'IA & Analyses', href: '/dashboard/ia', icon: Brain, badge: null, roles: ['owner', 'admin', 'manager'] },
]

type SidebarProps = {
  user?: User | null
  company?: Company | null
}

export function Sidebar({ user: serverUser, company: serverCompany }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { sidebarOpen, setSidebarOpen } = useUIStore()
  const { user: storedUser, company: storedCompany, logout } = useAuthStore()
  const user = serverUser ?? storedUser
  const company = serverCompany ?? storedCompany
  const storedRole = (user?.role as string | undefined) ?? 'viewer'
  // Le schéma actuel utilise « staff » alors que la navigation utilisait des
  // rôles plus détaillés. Ces membres doivent voir les pages opérationnelles.
  const userRole = storedRole === 'staff' ? 'manager' : storedRole

  const visibleNavItems = navItems.filter((item) => item.roles.includes(userRole))
  const visibleAdvancedNavItems = advancedNavItems.filter((item) => item.roles.includes(userRole))

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    logout()
    router.push('/login')
  }

  return (
    <>
      {/* Overlay (mobile + desktop when sidebar open) */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen w-64 bg-bg-card border-r border-border-base transition-transform duration-300 ease-in-out flex flex-col",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-border-base">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center shadow-glow-sm">
              <span className="font-syne font-bold text-white">T</span>
            </div>
            <span className="font-syne font-bold text-xl text-text-primary tracking-tight">TransAfrik</span>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "nav-item",
                  isActive && "nav-item-active"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            )
          })}

          <div className="divider-dark my-6" />

          {/* Section Avancée */}
          <p className="px-3 mb-2 text-[10px] font-bold text-text-muted uppercase tracking-widest">Avancé</p>
          {visibleAdvancedNavItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href))
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "nav-item relative",
                  isActive && "nav-item-active"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
                {item.badge && (
                  <span className="ml-auto w-5 h-5 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}

          <div className="divider-dark my-4" />
          
          <Link
            href="/dashboard/parametres"
            className={cn(
              "nav-item",
              pathname.startsWith('/dashboard/parametres') && "nav-item-active"
            )}
            onClick={() => setSidebarOpen(false)}
          >
            <Settings className="w-5 h-5" />
            Paramètres
          </Link>
        </div>

        {/* User Card */}
        <div className="p-4 border-t border-border-base bg-bg-surface">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{user?.full_name}</p>
              <p className="text-xs text-text-muted truncate">{company?.name || 'Entreprise'}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-sm text-text-secondary hover:text-danger transition-colors py-2 rounded-md hover:bg-danger/10"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </aside>
    </>
  )
}
