import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { BottomNav } from '@/components/layout/BottomNav'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { NotificationsRealtime } from '@/components/providers/NotificationsRealtime'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  return (
    <QueryProvider>
      <NotificationsRealtime />
      <div className="min-h-screen bg-bg-base flex flex-col lg:flex-row">
        <Sidebar />
        
        <div className="flex-1 flex flex-col lg:pl-64 transition-all duration-300 min-h-screen">
          <Topbar />
          
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden pb-24 lg:pb-8">
            <div className="max-w-7xl mx-auto w-full">
              {children}
            </div>
          </main>

          <BottomNav />
        </div>
      </div>
    </QueryProvider>
  )
}
