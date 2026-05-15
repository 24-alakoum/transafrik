import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, icon, disabled, ...props }, ref) => {
    return (
      <div className="form-control w-full">
        {label && (
          <label className="label pt-0">
            <span className="label-text text-text-secondary font-medium">{label}</span>
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
              {icon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              'input-base',
              icon && 'pl-10',
              error && 'border-danger focus:border-danger text-danger',
              disabled && 'bg-bg-base cursor-not-allowed opacity-60',
              className
            )}
            ref={ref}
            disabled={disabled}
            {...props}
          />
        </div>
        {error && (
          <label className="label pb-0">
            <span className="label-text-alt text-danger">{error}</span>
          </label>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
