import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/Button'
import { PLANS } from '@/lib/constants'
import { CheckCircle2, CreditCard, Smartphone } from 'lucide-react'
import { PlanButton } from '@/components/billing/PlanButton'

export default async function FacturationPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string }>
}) {
  const supabase = await createClient()
  const resolvedSearchParams = await searchParams;
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const { data: company } = await supabase
    .from('companies')
    .select('plan, plan_expires_at')
    .eq('id', user.user_metadata?.company_id)
    .single()

  const currentPlan = company?.plan as keyof typeof PLANS || 'trial'
  const planInfo = PLANS[currentPlan]

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-syne font-bold text-text-primary">Abonnement & Facturation</h1>
        <p className="text-text-secondary mt-1">Gérez votre forfait TransAfrik et vos paiements via Mobile Money (Orange, Moov, Wave).</p>
      </div>

      {resolvedSearchParams.payment === 'success' && (
        <div className="bg-success/10 border border-success/30 text-success rounded-xl p-4 flex items-center">
          <CheckCircle2 className="w-5 h-5 mr-3 flex-shrink-0" />
          <p className="font-medium">Merci ! Votre paiement a été initié. Votre abonnement sera mis à jour dès la validation par l'opérateur (quelques secondes).</p>
        </div>
      )}

      <div className="bg-bg-card rounded-2xl border border-border-base shadow-sm p-6 lg:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-syne font-bold text-text-primary">Plan actuel : {planInfo?.label || 'Inconnu'}</h2>
            <span className="bg-success/10 text-success text-xs font-medium px-2 py-1 rounded-full">Actif</span>
          </div>
          <p className="text-text-secondary">
            {currentPlan === 'trial' 
              ? 'Vous êtes en période d\'essai. Passez au niveau supérieur pour débloquer toutes les limites.' 
              : `Vous avez payé ${planInfo?.price} FCFA. Expiration le : ${company?.plan_expires_at ? new Date(company.plan_expires_at).toLocaleDateString('fr-FR') : 'N/A'}`}
          </p>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-text-secondary bg-bg-base px-4 py-2 rounded-lg border border-border-base">
          <Smartphone className="w-4 h-4 text-accent" />
          <span>Sécurisé par CinetPay</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(PLANS).filter(([k]) => k !== 'trial').map(([key, plan]) => {
          const isCurrent = currentPlan === key
          
          return (
            <div key={key} className={`bg-bg-card rounded-2xl border ${isCurrent ? 'border-accent shadow-glow-sm' : 'border-border-base'} p-6 relative flex flex-col`}>
              {isCurrent && (
                 <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-accent text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                   Actuel
                 </div>
              )}
              <h3 className="text-xl font-syne font-bold text-text-primary mb-2">{plan.label}</h3>
              <p className="text-3xl font-syne font-bold text-text-primary mb-6">
                {plan.price.toLocaleString()} <span className="text-sm text-text-secondary font-medium">FCFA/mo</span>
              </p>
              
              <ul className="space-y-3 mb-8 flex-grow">
                <li className="flex items-center gap-2 text-sm text-text-secondary">
                  <CheckCircle2 className="w-4 h-4 text-accent" />
                  Jusqu'à {plan.maxTrucks} camions
                </li>
                <li className="flex items-center gap-2 text-sm text-text-secondary">
                  <CheckCircle2 className="w-4 h-4 text-accent" />
                  Voyages illimités
                </li>
                <li className="flex items-center gap-2 text-sm text-text-secondary">
                  <CheckCircle2 className="w-4 h-4 text-accent" />
                  Support prioritaire
                </li>
              </ul>
              
              <PlanButton 
                planId={key} 
                isCurrent={isCurrent} 
                label={`Payer avec Mobile Money`} 
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
