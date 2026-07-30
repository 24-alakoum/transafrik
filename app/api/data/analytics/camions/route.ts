import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { data: userData } = (await (supabase.from('users') as any)
      .select('company_id').eq('id', user.id).single()) as any
    if (!userData?.company_id) return NextResponse.json({ error: 'Compagnie non trouvée' }, { status: 404 })

    // Récupérer les camions
    const { data: trucks } = await (supabase.from('trucks') as any)
      .select('id, plate')
      .eq('company_id', userData.company_id)

    // Récupérer les voyages pour calculer les revenus
    const { data: trips } = await (supabase.from('trips') as any)
      .select('truck_id, revenue_fcfa')
      .eq('company_id', userData.company_id)
      .not('truck_id', 'is', null)

    // Récupérer les dépenses pour calculer les dépenses
    const { data: expenses } = await (supabase.from('expenses') as any)
      .select('truck_id, amount_fcfa')
      .eq('company_id', userData.company_id)
      .not('truck_id', 'is', null)

    const stats = (trucks || []).map((t: any) => {
      const truckTrips = (trips || []).filter((tr: any) => tr.truck_id === t.id)
      const truckExpenses = (expenses || []).filter((ex: any) => ex.truck_id === t.id)

      const totalRevenue = truckTrips.reduce((sum: number, tr: any) => sum + (Number(tr.revenue_fcfa) || 0), 0)
      const totalExpense = truckExpenses.reduce((sum: number, ex: any) => sum + (Number(ex.amount_fcfa) || 0), 0)
      const profit = totalRevenue - totalExpense

      return {
        id: t.id,
        plate: t.plate,
        totalRevenue,
        totalExpense,
        profit
      }
    })

    const mostSpending = stats.reduce((prev: any, current: any) => (prev.totalExpense > current.totalExpense) ? prev : current, { totalExpense: -1 })
    const mostProfitable = stats.reduce((prev: any, current: any) => (prev.profit > current.profit) ? prev : current, { profit: -Infinity })

    return NextResponse.json({
      mostSpending: mostSpending.totalExpense > 0 ? mostSpending : null,
      mostProfitable: mostProfitable.profit !== -Infinity ? mostProfitable : null
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
