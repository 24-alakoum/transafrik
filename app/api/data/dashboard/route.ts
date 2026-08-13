import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/data/dashboard
 * KPIs du tableau de bord principal
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

    const companyId = userData.company_id

    const [
      { data: recentTrips },
      { count: totalTrips },
      { count: activeTrucks },
      { count: activeTripsCount },
      { data: revenueRaw },
      { data: expensesRaw },
    ] = await Promise.all([
      supabase
        .from('trips')
        .select('id, reference, destination, revenue_fcfa, status, departure_date, clients(name)')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(5) as any,
      supabase.from('trips').select('*', { count: 'exact', head: true }).eq('company_id', companyId),
      supabase.from('trucks').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'available'),
      // Voyages en cours (draft, planned, loading, in_transit)
      supabase.from('trips').select('*', { count: 'exact', head: true }).eq('company_id', companyId).in('status', ['draft', 'planned', 'loading', 'in_transit']),
      // Revenus des 7 derniers mois
      supabase
        .from('trips')
        .select('revenue_fcfa, departure_date')
        .eq('company_id', companyId)
        .not('revenue_fcfa', 'is', null) as any,
      // Dépenses des 7 derniers mois
      supabase
        .from('expenses')
        .select('amount_fcfa, date')
        .eq('company_id', companyId) as any,
    ])

    // Agrégation mensuelle des revenus et dépenses
    const now = new Date()
    const months = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (6 - i), 1)
      return {
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleDateString('fr-FR', { month: 'short' }),
        revenue: 0,
        expenses: 0,
      }
    })

    ;(revenueRaw || []).forEach((trip: any) => {
      if (!trip.departure_date) return
      const key = trip.departure_date.substring(0, 7)
      const month = months.find(m => m.key === key)
      if (month) month.revenue += Number(trip.revenue_fcfa || 0)
    })

    ;(expensesRaw || []).forEach((exp: any) => {
      if (!exp.date) return
      const key = exp.date.substring(0, 7)
      const month = months.find(m => m.key === key)
      if (month) month.expenses += Number(exp.amount_fcfa || 0)
    })

    // KPIs globaux
    const totalRevenue = (revenueRaw || []).reduce((s: number, t: any) => s + Number(t.revenue_fcfa || 0), 0)
    const totalExpenses = (expensesRaw || []).reduce((s: number, e: any) => s + Number(e.amount_fcfa || 0), 0)
    const totalBenefit = totalRevenue - totalExpenses

    return NextResponse.json({
      recentTrips: recentTrips || [],
      totalTrips: totalTrips || 0,
      activeTrucks: activeTrucks || 0,
      totalRevenue,
      totalExpenses,
      totalBenefit,
      activeTrips: activeTripsCount || 0,
      chartData: months.map(({ label, revenue, expenses }) => ({ month: label, revenue, expenses })),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
