'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { updateStatusChauffeurAction } from '../actions'
import { DRIVER_STATUSES } from '@/lib/constants'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2 } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  available: 'bg-success/10 text-success border-success/30 hover:bg-success/20',
  on_trip: 'bg-accent/10 text-accent border-accent/30 hover:bg-accent/20',
  on_leave: 'bg-warning/10 text-warning border-warning/30 hover:bg-warning/20',
  inactive: 'bg-danger/10 text-danger border-danger/30 hover:bg-danger/20',
}

export function StatusChauffeurChanger({
  chauffeurId,
  currentStatus,
}: {
  chauffeurId: string
  currentStatus: string
}) {
  const router = useRouter()
  const [pending, setPending] = React.useState<string | null>(null)

  const handleChange = async (newStatus: string) => {
    if (newStatus === currentStatus) return
    setPending(newStatus)
    try {
      const result = await updateStatusChauffeurAction(chauffeurId, newStatus)
      if (result.success) {
        toast.success('Statut mis à jour')
        router.refresh()
      } else {
        toast.error((result.error as any)?._global || 'Erreur lors de la mise à jour')
      }
    } catch {
      toast.error('Erreur inattendue')
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="w-full border-t border-border-base mt-6 pt-6 space-y-3">
      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
        Changer le statut
      </p>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(DRIVER_STATUSES).map(([key, info]) => {
          const isActive = key === currentStatus
          const isLoading = pending === key
          return (
            <button
              key={key}
              onClick={() => handleChange(key)}
              disabled={!!pending}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium
                transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed
                ${isActive
                  ? `${STATUS_COLORS[key]} border-current ring-1 ring-current/30`
                  : 'bg-bg-surface border-border-base text-text-secondary hover:border-border-active hover:text-text-primary'
                }
              `}
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
              ) : isActive ? (
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-current shrink-0 opacity-50" />
              )}
              {info.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
