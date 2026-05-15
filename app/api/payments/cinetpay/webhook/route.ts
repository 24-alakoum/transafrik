import { NextResponse } from 'next/server';
import { checkCinetPayPayment } from '@/lib/cinetpay';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    // CinetPay envoie les données de notification par POST (x-www-form-urlencoded ou JSON)
    const text = await req.text();
    let data;
    try {
      // Tenter de parser en JSON d'abord
      data = JSON.parse(text);
    } catch {
      // Sinon parser comme form data
      const params = new URLSearchParams(text);
      data = Object.fromEntries(params.entries());
    }

    const { cpm_trans_id } = data;

    if (!cpm_trans_id) {
      return NextResponse.json({ error: 'Transaction ID manquant' }, { status: 400 });
    }

    // Vérifier l'état réel du paiement sur l'API CinetPay (très important pour éviter les fraudes)
    const verification = await checkCinetPayPayment(cpm_trans_id);

    if (verification.success && verification.status === 'ACCEPTED') {
      const paymentData = verification.data;
      const metadataStr = paymentData.metadata;
      
      if (metadataStr) {
        const metadata = JSON.parse(metadataStr);
        const supabaseAdmin = createAdminClient();

        // Mettre à jour le plan de l'entreprise (1 mois d'abonnement)
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + 1);

        const { error: companyError } = await supabaseAdmin
          .from('companies')
          .update({
            plan: metadata.plan,
            plan_expires_at: expiryDate.toISOString(),
          })
          .eq('id', metadata.company_id);

        if (companyError) {
          console.error('Erreur mise à jour compagnie:', companyError);
          // On continue pour enregistrer la transaction, mais on devrait peut-être alerter l'admin
        }

        // Ajouter dans l'historique des abonnements / paiements
        await supabaseAdmin
          .from('subscriptions')
          .upsert({
            company_id: metadata.company_id,
            plan: metadata.plan,
            status: 'active',
            current_period_end: expiryDate.toISOString(),
            stripe_sub_id: `cinetpay_${cpm_trans_id}`, // On réutilise le champ pour stocker l'ID de la transac locale
          }, { onConflict: 'company_id' });

      }
    }

    // CinetPay s'attend à un retour 200 OK
    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook CinetPay Error:', error);
    return NextResponse.json({ error: 'Webhook Handler Failed' }, { status: 500 });
  }
}
