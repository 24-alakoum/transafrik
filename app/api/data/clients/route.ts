import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/data/clients
 */
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { data: userData, error: userError } = (await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()) as any

    if (userError || !userData?.company_id) {
      return NextResponse.json({ error: 'Entreprise introuvable' }, { status: 403 })
    }

    const { data: clients, error } = await supabase
      .from('clients')
      .select(`
        *,
        trips (
          delivery_notes (
            total_fcfa,
            status
          )
        )
      `)
      .eq('company_id', userData.company_id)
      .order('name', { ascending: true }) as any

    if (error) throw error

    // Calcul du solde dû
    const clientsWithBalance = (clients || []).map((client: any) => {
      let balance = 0;
      (client.trips || []).forEach((trip: any) => {
        (trip.delivery_notes || []).forEach((note: any) => {
          if (['sent', 'viewed', 'late', 'disputed'].includes(note.status)) {
            balance += Number(note.total_fcfa || 0)
          }
        })
      })
      const isOverLimit = client.credit_limit_fcfa ? balance > client.credit_limit_fcfa : false
      return { ...client, balance, isOverLimit }
    })

    return NextResponse.json({ data: clientsWithBalance })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
