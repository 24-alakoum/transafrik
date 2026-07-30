'use client'

import { useNotifications } from '@/lib/queries/hooks'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queries/keys'
import { NotificationsClient } from './NotificationsClient'
import { Skeleton } from '@/components/ui/Skeleton'
import { toast } from 'sonner'
import {
  markNotificationReadAction,
  markAllNotificationsReadAction,
  deleteNotificationAction,
} from './actions'

export default function NotificationsPage() {
  const queryClient = useQueryClient()
  const { data, isLoading, isFetching } = useNotifications()
  const notifications = data?.data || []

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all() })

  const handleMarkRead = async (id: string) => {
    const res = await markNotificationReadAction(id)
    if (res.success) {
      toast.success('Notification marquée comme lue')
      invalidate()
    } else {
      toast.error(res.error || 'Erreur')
    }
  }

  const handleMarkAllRead = async () => {
    const res = await markAllNotificationsReadAction()
    if (res.success) {
      toast.success('Toutes les notifications ont été marquées comme lues')
      invalidate()
    } else {
      toast.error(res.error || 'Erreur')
    }
  }

  const handleDelete = async (id: string) => {
    const res = await deleteNotificationAction(id)
    if (res.success) {
      toast.success('Notification supprimée')
      invalidate()
    } else {
      toast.error(res.error || 'Erreur')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-24 rounded-xl" />)}
        </div>
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-4 p-4 rounded-xl border border-border-base bg-bg-card">
              <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <NotificationsClient
      initialNotifications={notifications}
      isFetching={isFetching}
      onMarkRead={handleMarkRead}
      onMarkAllRead={handleMarkAllRead}
      onDelete={handleDelete}
    />
  )
}
