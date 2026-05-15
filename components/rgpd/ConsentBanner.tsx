'use client'

import * as React from 'react'
import { Cookie, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function ConsentBanner() {
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    // Vérifier si le consentement a déjà été donné
    const consent = localStorage.getItem('transafrik_cookie_consent')
    if (!consent) {
      setIsVisible(true)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('transafrik_cookie_consent', 'all')
    setIsVisible(false)
    // Ici on pourrait aussi déclencher une Server Action pour enregistrer l'IP et le timestamp dans consent_records si l'user n'est pas connecté
  }

  const handleDecline = () => {
    localStorage.setItem('transafrik_cookie_consent', 'essential')
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 md:pb-8 flex justify-center pointer-events-none">
      <div className="bg-bg-card border border-border-base shadow-2xl rounded-2xl p-6 max-w-4xl w-full flex flex-col md:flex-row gap-6 items-start md:items-center pointer-events-auto relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl" />
        
        <div className="flex-1 relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Cookie className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-syne font-bold text-text-primary">Respect de votre vie privée</h3>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">
            TransAfrik utilise des cookies essentiels au fonctionnement de la plateforme (sécurité, authentification). 
            Nous utilisons également des cookies analytiques optionnels pour comprendre comment vous utilisez notre outil et l'améliorer. 
            Aucune donnée n'est revendue à des tiers.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto relative z-10">
          <Button variant="outline" onClick={handleDecline} className="whitespace-nowrap">
            Uniquement l'essentiel
          </Button>
          <Button onClick={handleAccept} className="whitespace-nowrap">
            Tout accepter
          </Button>
        </div>
        
        <button 
          onClick={handleDecline}
          className="absolute top-4 right-4 text-text-muted hover:text-text-primary p-1 md:hidden"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
