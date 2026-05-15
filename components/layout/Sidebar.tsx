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
  MapIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store/useUIStore'
import { useAuthStore } from '@/store/useAuthStore'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Voyages', href: '/dashboard/voyages', icon: MapIcon },
  { name: 'Camions', href: '/dashboard/camions', icon: Truck },
  { name: 'Chauffeurs', href: '/dashboard/chauffeurs', icon: Users },
  { name: 'Clients', href: '/dashboard/clients', icon: Building2 },
  { name: 'Bons de livraison', href: '/dashboard/bons', icon: FileText },
  { name: 'Dépenses', href: '/dashboard/depenses', icon: Wallet },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { sidebarOpen, setSidebarOpen } = useUIStore()
  const { user, company, logout } = useAuthStore()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    logout()
    router.push('/login')
  }

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen w-64 bg-bg-card border-r border-border-base transition-transform duration-300 ease-in-out flex flex-col",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
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
          {navItems.map((item) => {
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
