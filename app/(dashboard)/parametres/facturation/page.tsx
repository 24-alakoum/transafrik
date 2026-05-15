import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/Button'
import { PLANS } from '@/lib/constants'
import { CheckCircle2, CreditCard } from 'lucide-react'

export default async function FacturationPage() {
  const supabase = await createClient()
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
        <p className="text-text-secondary mt-1">Gérez votre forfait TransAfrik et vos moyens de paiement.</p>
      </div>

      <div className="bg-bg-card rounded-2xl border border-border-base shadow-sm p-6 lg:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-syne font-bold text-text-primary">Plan actuel : {planInfo?.label || 'Inconnu'}</h2>
            <span className="bg-success/10 text-success text-xs font-medium px-2 py-1 rounded-full">Actif</span>
          </div>
          <p className="text-text-secondary">
            {currentPlan === 'trial' 
              ? 'Vous êtes en période d\'essai. Passez au niveau supérieur pour débloquer toutes les limites.' 
              : `Vous êtes facturé ${planInfo?.price} FCFA / mois.`}
          </p>
        </div>
        
        <form action="/api/stripe/checkout" method="POST">
          {/* Action simulée pour lancer Stripe Checkout */}
          <Button size="lg" type="submit">
            <CreditCard className="w-5 h-5 mr-2" />
            {currentPlan === 'trial' ? 'Mettre à niveau' : 'Gérer l\'abonnement'}
          </Button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(PLANS).filter(([k]) => k !== 'trial').map(([key, plan]) => {
          const isCurrent = currentPlan === key
          
          return (
            <div key={key} className={`bg-bg-card rounded-2xl border ${isCurrent ? 'border-accent shadow-glow-sm' : 'border-border-base'} p-6 relative`}>
              {isCurrent && (
                 <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-accent text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                   Actuel
                 </div>
              )}
              <h3 className="text-xl font-syne font-bold text-text-primary mb-2">{plan.label}</h3>
              <p className="text-3xl font-syne font-bold text-text-primary mb-6">
                {plan.price.toLocaleString()} <span className="text-sm text-text-secondary font-medium">FCFA/mo</span>
              </p>
              
              <ul className="space-y-3 mb-8">
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
              
              <Button variant={isCurrent ? "outline" : "primary"} fullWidth disabled={isCurrent}>
                {isCurrent ? 'Plan actuel' : 'Choisir ce plan'}
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
