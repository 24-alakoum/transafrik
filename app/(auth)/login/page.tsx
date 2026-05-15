'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { loginSchema, type LoginInput } from '@/lib/validations/auth'
import { loginAction } from './actions'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectPath = searchParams.get('redirect') ?? '/dashboard'
  const [isPending, startTransition] = React.useTransition()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = (data: LoginInput) => {
    startTransition(async () => {
      const result = await loginAction(data)
      
      if (!result.success && result.error) {
        if ('_global' in result.error) {
          toast.error(result.error._global)
        } else {
          Object.entries(result.error).forEach(([field, messages]) => {
            setError(field as keyof LoginInput, { type: 'server', message: messages?.[0] })
          })
        }
      } else if (result.success) {
        toast.success('Connexion réussie')
        router.push(redirectPath)
      }
    })
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-syne font-bold text-text-primary mb-2">Bienvenue</h1>
        <p className="text-text-secondary">Connectez-vous à votre espace TransAfrik</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          {...register('email')}
          type="email"
          label="Adresse email"
          placeholder="nom@entreprise.com"
          icon={<Mail className="w-5 h-5" />}
          error={errors.email?.message}
        />
        
        <div className="space-y-1">
          <Input
            {...register('password')}
            type="password"
            label="Mot de passe"
            placeholder="••••••••••••"
            icon={<Lock className="w-5 h-5" />}
            error={errors.password?.message}
          />
          <div className="flex justify-end">
            <Link 
              href="/forgot-password" 
              className="text-sm font-medium text-accent hover:underline"
            >
              Mot de passe oublié ?
            </Link>
          </div>
        </div>

        <Button 
          type="submit" 
          fullWidth 
          size="lg" 
          isLoading={isPending}
          className="mt-6"
        >
          Se connecter
        </Button>
      </form>

      <div className="mt-8 text-center text-text-secondary">
        Pas encore de compte ?{' '}
        <Link href="/register" className="font-medium text-accent hover:underline">
          Créer un compte
        </Link>
      </div>
    </div>
  )
}
