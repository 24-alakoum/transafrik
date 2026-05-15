'use client'

import * as React from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validations/auth'
import { forgotPasswordAction } from './actions'

export default function ForgotPasswordPage() {
  const [isPending, startTransition] = React.useTransition()
  const [isSubmitted, setIsSubmitted] = React.useState(false)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = (data: ForgotPasswordInput) => {
    startTransition(async () => {
      const result = await forgotPasswordAction(data)
      
      if (!result.success && result.error) {
        if ('_global' in result.error) {
          toast.error(result.error._global)
        } else {
          Object.entries(result.error).forEach(([field, messages]) => {
            setError(field as keyof ForgotPasswordInput, { type: 'server', message: messages?.[0] })
          })
        }
      } else if (result.success) {
        setIsSubmitted(true)
      }
    })
  }

  if (isSubmitted) {
    return (
      <div className="w-full max-w-md mx-auto text-center">
        <div className="w-16 h-16 bg-success/20 text-success rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-syne font-bold text-text-primary mb-4">Email envoyé</h1>
        <p className="text-text-secondary mb-8">
          Si un compte existe avec cette adresse email, vous recevrez un lien pour réinitialiser votre mot de passe.
        </p>
        <Link href="/login" className="btn btn-outline border-border-base text-text-primary hover:bg-bg-raised w-full">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à la connexion
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-8">
        <Link href="/login" className="inline-flex items-center text-sm font-medium text-text-secondary hover:text-text-primary mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Link>
        <h1 className="text-3xl font-syne font-bold text-text-primary mb-2">Mot de passe oublié</h1>
        <p className="text-text-secondary">Entrez votre email pour recevoir un lien de réinitialisation</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          {...register('email')}
          type="email"
          label="Adresse email"
          placeholder="nom@entreprise.com"
          icon={<Mail className="w-5 h-5" />}
          error={errors.email?.message}
        />

        <Button 
          type="submit" 
          fullWidth 
          size="lg" 
          isLoading={isPending}
        >
          Envoyer le lien
        </Button>
      </form>
    </div>
  )
}
