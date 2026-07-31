'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Bell, Check, CheckCheck, Trash2, Settings, Info, Truck, Package, FileText, Wrench, AlertTriangle
} from 'lucide-react'

type NotifType = 'maintenance' | 'delivery' | 'payment' | 'trip' | 'system' | 'alert'

interface Notification {
  id: string
  type: NotifType
  title: string
  body: string
  read_at: string | null
  created_at: string
  data?: any
}

const TYPE_CONFIG: Record<NotifType, { icon: React.ReactNode; color: string; bg: string }> = {
  maintenance: { icon: <Wrench className="w-4 h-4" />,      color: 'text-warning',  bg: 'bg-warning/10 border-warning/20' },
  delivery:    { icon: <Package className="w-4 h-4" />,     color: 'text-success',  bg: 'bg-success/10 border-success/20' },
  payment:     { icon: <FileText className="w-4 h-4" />,    color: 'text-accent',   bg: 'bg-accent/10 border-accent/20' },
  trip:        { icon: <Truck className="w-4 h-4" />,       color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20' },
  system:      { icon: <Info className="w-4 h-4" />,        color: 'text-text-muted',bg: 'bg-bg-raised border-border-base' },
  alert:       { icon: <AlertTriangle className="w-4 h-4" />,color: 'text-danger',  bg: 'bg-danger/10 border-danger/20' },
}

function timeAgo(isoDate: string) {
  const diff = Date.now() - new Date(isoDate).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)
  if (mins < 1) return 'À l\'instant'
  if (mins < 60) return `Il y a ${mins} min`
  if (hours < 24) return `Il y a ${hours}h`
  return `Il y a ${days}j`
}

interface NotificationsClientProps {
  initialNotifications: Notification[]
  isFetching?: boolean
  onMarkRead: (id: string) => Promise<void>
  onMarkAllRead: () => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function NotificationsClient({
  initialNotifications,
  isFetching,
  onMarkRead,
  onMarkAllRead,
  onDelete,
}: NotificationsClientProps) {
  const [filter, setFilter] = React.useState<NotifType | 'all' | 'unread'>('all')

  const unreadCount = initialNotifications.filter(n => !n.read_at).length

  const filtered = initialNotifications.filter(n => {
    if (filter === 'unread') return !n.read_at
    if (filter === 'all') return true
    return n.type === filter
  })

  const FILTERS: { label: string; value: NotifType | 'all' | 'unread' }[] = [
    { label: 'Toutes', value: 'all' },
    { label: 'Non lues', value: 'unread' },
    { label: 'Maintenance', value: 'maintenance' },
    { label: 'Alertes', value: 'alert' },
    { label: 'Livraisons', value: 'delivery' },
    { label: 'Paiements', value: 'payment' },
    { label: 'Voyages', value: 'trip' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-syne font-bold text-text-primary flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center">
              <Bell className="w-5 h-5 text-accent" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-danger rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            Notifications
            {isFetching && (
              <span className="text-xs text-accent font-normal">Actualisation...</span>
            )}
          </h1>
          <p className="text-text-secondary mt-1">
            {unreadCount} non lue{unreadCount > 1 ? 's' : ''} · {initialNotifications.length} au total
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border-base bg-bg-card text-text-secondary hover:text-success hover:border-success/40 transition-all text-sm"
          >
            <CheckCheck className="w-4 h-4" />
            Tout marquer comme lu
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              filter === f.value
                ? 'bg-accent text-white shadow-glow-sm'
                : 'bg-bg-card border border-border-base text-text-secondary hover:border-accent/40 hover:text-accent'
            }`}
          >
            {f.value === 'unread' && unreadCount > 0 && (
              <span className={`w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center ${filter === f.value ? 'bg-white/30 text-white' : 'bg-accent/20 text-accent'}`}>
                {unreadCount}
              </span>
            )}
            {f.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-bg-card border border-border-base rounded-2xl">
            <Bell className="w-10 h-10 mx-auto text-text-muted/30 mb-3" />
            <p className="text-text-muted">Aucune notification</p>
          </div>
        ) : filtered.map(n => {
          const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.system
          const isUnread = !n.read_at
          return (
            <div key={n.id} className={`relative flex gap-4 p-4 rounded-xl border transition-all group ${isUnread ? 'bg-accent/5 border-accent/20' : 'bg-bg-card border-border-base hover:bg-bg-raised'}`}>
              {isUnread && (
                <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-accent animate-pulse" />
              )}

              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${cfg.bg} ${cfg.color}`}>
                {cfg.icon}
              </div>

              <div className="flex-1 min-w-0 pr-16">
                <p className={`text-sm font-semibold ${isUnread ? 'text-text-primary' : 'text-text-secondary'}`}>
                  {n.title}
                </p>
                <p className="text-xs text-text-muted mt-0.5 leading-relaxed line-clamp-2">{n.body}</p>
                <p className="text-[10px] text-text-muted/60 mt-1.5">{timeAgo(n.created_at)}</p>
              </div>

              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {isUnread && (
                  <button
                    onClick={() => onMarkRead(n.id)}
                    title="Marquer comme lu"
                    className="w-7 h-7 rounded-lg hover:bg-success/20 text-success flex items-center justify-center transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => onDelete(n.id)}
                  title="Supprimer"
                  className="w-7 h-7 rounded-lg hover:bg-danger/20 text-danger flex items-center justify-center transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Settings CTA */}
      <div className="bg-bg-card border border-border-base rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-bg-raised flex items-center justify-center">
            <Settings className="w-4 h-4 text-text-muted" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">Paramètres des notifications</p>
            <p className="text-xs text-text-muted">Gérez vos préférences d&apos;alertes et canaux</p>
          </div>
        </div>
        <Link href="/dashboard/parametres/notifications" className="text-sm text-accent hover:underline font-medium">Configurer</Link>
      </div>
    </div>
  )
}
