import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { initCinetPayPayment } from '@/lib/cinetpay';
import { PLANS } from '@/lib/constants';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await req.json();
    const { planId } = body;

    if (!planId || !PLANS[planId as keyof typeof PLANS]) {
      return NextResponse.json({ error: 'Plan invalide' }, { status: 400 });
    }

    const plan = PLANS[planId as keyof typeof PLANS];
    const amount = plan.price; // Le prix en FCFA

    // Récupérer les infos de l'utilisateur
    const { data: userData } = await supabase
      .from('users')
      .select('full_name, email, company_id')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const metadata = JSON.stringify({
      company_id: userData.company_id,
      user_id: user.id,
      plan: planId,
    });

    const [name, ...surnameParts] = (userData.full_name || '').split(' ');
    const surname = surnameParts.join(' ') || name;

    const paymentResult = await initCinetPayPayment({
      amount: amount,
      description: `Abonnement TransAfrik - Plan ${plan.label} (1 mois)`,
      customerName: name || 'Client',
      customerSurname: surname || 'TransAfrik',
      customerEmail: userData.email,
      returnUrl: `${appUrl}/parametres/facturation?payment=success`,
      notifyUrl: `${appUrl}/api/payments/cinetpay/webhook`,
      metadata: metadata,
    });

    if (!paymentResult.success) {
      return NextResponse.json({ error: paymentResult.error }, { status: 500 });
    }

    return NextResponse.json({ paymentUrl: paymentResult.paymentUrl });
  } catch (error) {
    console.error('Erreur lors de l\'initialisation du paiement:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
