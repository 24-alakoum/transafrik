import * as React from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  isLoading?: boolean
  fullWidth?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    // DaisyUI base classes
    const baseClasses = 'btn no-animation font-syne font-semibold transition-all duration-200'

    const variants = {
      primary: 'btn-primary text-white border-none shadow-glow-sm hover:shadow-glow',
      secondary: 'btn-secondary text-white',
      ghost: 'btn-ghost hover:bg-bg-raised text-text-secondary hover:text-text-primary',
      danger: 'btn-error text-white',
      success: 'btn-success text-white',
      outline: 'btn-outline border-border-base text-text-secondary hover:bg-bg-raised hover:border-border-active hover:text-text-primary',
    }

    const sizes = {
      sm: 'btn-sm text-xs',
      md: 'btn-md text-sm',
      lg: 'btn-lg text-base',
      icon: 'btn-square btn-sm',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          (disabled || isLoading) && 'opacity-70 cursor-not-allowed',
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {!isLoading && props.type !== 'submit' && children}
        {isLoading ? (typeof children === 'string' ? children : 'Chargement...') : children}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button }
