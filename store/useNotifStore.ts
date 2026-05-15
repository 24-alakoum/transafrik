import { create } from 'zustand'

export interface AppNotification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  date: Date
}

interface NotifState {
  notifications: AppNotification[]
  unreadCount: number
  addNotification: (notif: Omit<AppNotification, 'id' | 'read' | 'date'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearAll: () => void
}

export const useNotifStore = create<NotifState>((set) => ({
  notifications: [],
  unreadCount: 0,
  addNotification: (notif) =>
    set((state) => {
      const newNotif: AppNotification = {
        ...notif,
        id: Math.random().toString(36).substring(7),
        read: false,
        date: new Date(),
      }
      return {
        notifications: [newNotif, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      }
    }),
  markAsRead: (id) =>
    set((state) => {
      const notifications = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      )
      return {
        notifications,
        unreadCount: notifications.filter((n) => !n.read).length,
      }
    }),
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),
  clearAll: () => set({ notifications: [], unreadCount: 0 }),
}))
