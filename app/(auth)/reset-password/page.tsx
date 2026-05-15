'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Lock, Check } from 'lucide-react'
import { toast } from 'sonner'
import zxcvbn from 'zxcvbn'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validations/auth'
import { resetPasswordAction } from './actions'
import { cn } from '@/lib/utils'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const [passwordScore, setPasswordScore] = React.useState(0)

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const passwordValue = watch('password')

  React.useEffect(() => {
    if (passwordValue) {
      const result = zxcvbn(passwordValue)
      setPasswordScore(result.score) // 0 to 4
    } else {
      setPasswordScore(0)
    }
  }, [passwordValue])

  const onSubmit = (data: ResetPasswordInput) => {
    if (passwordScore < 3) {
      setError('password', { type: 'manual', message: 'Le mot de passe est trop faible' })
      return
    }

    startTransition(async () => {
      const result = await resetPasswordAction(data)
      
      if (!result.success && result.error) {
        if ('_global' in result.error) {
          toast.error(result.error._global)
        } else {
          Object.entries(result.error).forEach(([field, messages]) => {
            setError(field as keyof ResetPasswordInput, { type: 'server', message: messages?.[0] })
          })
        }
      } else if (result.success) {
        toast.success('Mot de passe mis à jour avec succès')
        router.push('/dashboard')
      }
    })
  }

  // Zxcvbn colors based on score
  const scoreColors = ['bg-danger', 'bg-danger', 'bg-warning', 'bg-success', 'bg-success']
  const scoreText = ['Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort']

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-syne font-bold text-text-primary mb-2">Nouveau mot de passe</h1>
        <p className="text-text-secondary">Veuillez choisir un nouveau mot de passe sécurisé</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <Input
            {...register('password')}
            type="password"
            label="Nouveau mot de passe"
            placeholder="••••••••••••"
            icon={<Lock className="w-5 h-5" />}
            error={errors.password?.message}
          />
          
          {/* Password strength indicator */}
          <div className="mt-2">
            <div className="flex gap-1 h-1.5 w-full mb-1">
              {[1, 2, 3, 4].map((level) => (
                <div 
                  key={level} 
                  className={cn(
                    "h-full flex-1 rounded-full transition-all duration-300",
                    passwordValue && level <= passwordScore ? scoreColors[passwordScore] : "bg-bg-raised"
                  )} 
                />
              ))}
            </div>
            {passwordValue && (
              <p className={cn(
                "text-xs font-medium text-right",
                passwordScore < 3 ? "text-danger" : "text-success"
              )}>
                {scoreText[passwordScore]}
              </p>
            )}
          </div>
        </div>

        <Input
          {...register('confirmPassword')}
          type="password"
          label="Confirmer le mot de passe"
          placeholder="••••••••••••"
          icon={<Check className="w-5 h-5" />}
          error={errors.confirmPassword?.message}
        />

        <Button 
          type="submit" 
          fullWidth 
          size="lg" 
          isLoading={isPending}
          className="mt-6"
          disabled={passwordScore < 3 && passwordValue?.length > 0}
        >
          Réinitialiser
        </Button>
      </form>
    </div>
  )
}
