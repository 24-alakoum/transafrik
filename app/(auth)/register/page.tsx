'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, Lock, User, Building, Phone } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { registerSchema, type RegisterInput } from '@/lib/validations/auth'
import { registerAction } from './actions'
import { COUNTRIES } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      country: 'ML',
      rgpdConsent: false
    }
  })

  const onSubmit = (data: RegisterInput) => {
    startTransition(async () => {
      const result = await registerAction(data)
      
      if (!result.success && result.error) {
        if ('_global' in result.error) {
          toast.error(result.error._global)
        } else {
          Object.entries(result.error).forEach(([field, messages]) => {
            setError(field as keyof RegisterInput, { type: 'server', message: messages?.[0] })
          })
        }
      } else if (result.success) {
        toast.success('Compte créé avec succès !')
        
        // Auto-login après création
        const supabase = createClient()
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password
        })

        if (!loginError) {
           router.push('/dashboard')
        } else {
           router.push('/login')
        }
      }
    })
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-syne font-bold text-text-primary mb-2">Créer un compte</h1>
        <p className="text-text-secondary">Démarrer votre essai gratuit de 14 jours</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            {...register('fullName')}
            label="Nom complet"
            placeholder="Modibo Keïta"
            icon={<User className="w-5 h-5" />}
            error={errors.fullName?.message}
          />
          <Input
            {...register('phone')}
            label="Téléphone"
            placeholder="+223 XX XX XX XX"
            icon={<Phone className="w-5 h-5" />}
            error={errors.phone?.message}
          />
        </div>

        <Input
          {...register('email')}
          type="email"
          label="Email professionnel"
          placeholder="nom@entreprise.com"
          icon={<Mail className="w-5 h-5" />}
          error={errors.email?.message}
        />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            {...register('companyName')}
            label="Nom de l'entreprise"
            placeholder="TransLogistique S.A"
            icon={<Building className="w-5 h-5" />}
            error={errors.companyName?.message}
          />
          
          <div className="form-control w-full">
            <label className="label pt-0">
              <span className="label-text text-text-secondary font-medium">Pays</span>
            </label>
            <select 
              {...register('country')}
              className="select select-bordered bg-bg-surface border-border-base focus:border-accent w-full"
            >
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
              ))}
            </select>
            {errors.country && <span className="text-danger text-xs mt-1">{errors.country.message}</span>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            {...register('password')}
            type="password"
            label="Mot de passe"
            placeholder="••••••••••••"
            icon={<Lock className="w-5 h-5" />}
            error={errors.password?.message}
          />
          <Input
            {...register('confirmPassword')}
            type="password"
            label="Confirmer le mot de passe"
            placeholder="••••••••••••"
            icon={<Lock className="w-5 h-5" />}
            error={errors.confirmPassword?.message}
          />
        </div>

        <div className="form-control">
          <label className="label cursor-pointer justify-start gap-3">
            <input 
              type="checkbox" 
              {...register('rgpdConsent')} 
              className="checkbox checkbox-accent checkbox-sm" 
            />
            <span className="label-text text-sm">
              J'accepte les <Link href="/terms" className="text-accent hover:underline">conditions d'utilisation</Link> et la <Link href="/privacy" className="text-accent hover:underline">politique de confidentialité</Link>.
            </span>
          </label>
          {errors.rgpdConsent && <span className="text-danger text-xs ml-8">{errors.rgpdConsent.message}</span>}
        </div>

        <Button 
          type="submit" 
          fullWidth 
          size="lg" 
          isLoading={isPending}
          className="mt-2"
        >
          Créer mon compte
        </Button>
      </form>

      <div className="mt-8 text-center text-text-secondary">
        Vous avez déjà un compte ?{' '}
        <Link href="/login" className="font-medium text-accent hover:underline">
          Connectez-vous
        </Link>
      </div>
    </div>
  )
}
