'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Truck, Users, Wallet, PlusCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const bottomNavItems = [
  { name: 'Accueil', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Camions', href: '/dashboard/camions', icon: Truck },
  { name: 'Nouveau', href: '/dashboard/voyages/nouveau', icon: PlusCircle, isMain: true },
  { name: 'Chauffeurs', href: '/dashboard/chauffeurs', icon: Users },
  { name: 'Dépenses', href: '/dashboard/depenses', icon: Wallet },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-bg-card border-t border-border-base z-40 pb-safe">
      <div className="flex h-full items-center justify-around px-2">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href
          
          if (item.isMain) {
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className="relative -top-5 flex flex-col items-center justify-center"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-brand flex items-center justify-center shadow-glow text-white border-4 border-bg-base">
                  <item.icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-medium mt-1 text-text-secondary">{item.name}</span>
              </Link>
            )
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-16 h-full gap-1",
                isActive ? "text-accent" : "text-text-secondary hover:text-text-primary"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive && "fill-accent/20")} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
