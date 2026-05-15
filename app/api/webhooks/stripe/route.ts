import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as any,
})

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature') as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error: any) {
    return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 })
  }

  const supabaseAdmin = createAdminClient()

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        const status = subscription.status
        const plan = subscription.items.data[0].price.lookup_key || 'pro' // Exemple
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString()
        const cancelAt = subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null

        // Find company by stripe_customer_id
        const { data: subData } = await supabaseAdmin
          .from('subscriptions')
          .select('company_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (subData?.company_id) {
          // Update subscriptions table
          await supabaseAdmin.from('subscriptions').upsert({
            company_id: subData.company_id,
            stripe_customer_id: customerId,
            stripe_sub_id: subscription.id,
            plan: plan as any,
            status,
            current_period_end: currentPeriodEnd,
            cancel_at: cancelAt,
          })

          // Update company plan field
          if (status === 'active' || status === 'trialing') {
            await supabaseAdmin.from('companies').update({ plan: plan as any }).eq('id', subData.company_id)
          } else {
            await supabaseAdmin.from('companies').update({ plan: 'trial' }).eq('id', subData.company_id)
          }
        }
        break
      default:
        console.log(`Unhandled event type ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Stripe Webhook Error]', error)
    return NextResponse.json({ error: 'Erreur traitement webhook' }, { status: 500 })
  }
}
