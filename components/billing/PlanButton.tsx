'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PlanButtonProps {
  planId: string;
  isCurrent: boolean;
  label: string;
}

export function PlanButton({ planId, isCurrent, label }: PlanButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/payments/cinetpay/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'initialisation du paiement');
      }

      if (data.paymentUrl) {
        // Rediriger vers la page de paiement CinetPay (Mobile Money)
        window.location.href = data.paymentUrl;
      }
    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error(error.message || 'Impossible de lancer le paiement.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      variant={isCurrent ? "outline" : "primary"} 
      fullWidth 
      disabled={isCurrent || isLoading}
      onClick={handleSubscribe}
    >
      {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : (!isCurrent && <CreditCard className="w-5 h-5 mr-2" />)}
      {isCurrent ? 'Plan actuel' : label}
    </Button>
  );
}
