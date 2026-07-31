import * as React from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'draft' | 'transit' | 'badge-maintenance' | 'badge-transit' | 'badge-late'
  customColorClass?: string
}

function Badge({ className, variant = 'default', customColorClass, children, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-bg-raised text-text-secondary border-border-base',
    success: 'bg-success/15 text-success border-success/30',
    warning: 'bg-warning/15 text-warning border-warning/30',
    danger: 'bg-danger/15 text-danger border-danger/30',
    info: 'bg-info/15 text-info border-info/30',
    draft: 'bg-text-muted/15 text-text-muted border-text-muted/30',
    transit: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    'badge-maintenance': 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    'badge-transit': 'bg-green-500/15 text-green-400 border-green-500/30',
    'badge-late': 'bg-red-500/15 text-red-400 border-red-500/30',
  }

  return (
    <div
      className={cn(
        'badge badge-sm px-2.5 py-3 font-medium whitespace-nowrap',
        customColorClass || variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export { Badge }
