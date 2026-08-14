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
      { data: allTripsRaw },
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
      supabase
        .from('trips')
        .select('id, revenue_fcfa, frais_aller_fcfa, frais_retour_fcfa, departure_date')
        .eq('company_id', companyId) as any,
      supabase
        .from('revenues')
        .select('trip_id, amount_fcfa, date')
        .eq('company_id', companyId) as any,
      supabase
        .from('expenses')
        .select('trip_id, amount_fcfa, category, date')
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

    const tripsWithRevenues = new Set((revenueRaw || []).filter((r: any) => r.trip_id).map((r: any) => r.trip_id))
    const tripsWithAllerExp = new Set((expensesRaw || []).filter((e: any) => e.trip_id && e.category === 'frais_aller').map((e: any) => e.trip_id))
    const tripsWithRetourExp = new Set((expensesRaw || []).filter((e: any) => e.trip_id && e.category === 'frais_retour').map((e: any) => e.trip_id))

    let totalRevenue = 0
    ;(revenueRaw || []).forEach((r: any) => {
      const amt = Number(r.amount_fcfa || 0)
      totalRevenue += amt
      if (r.date) {
        const month = months.find((m) => m.key === r.date.substring(0, 7))
        if (month) month.revenue += amt
      }
    })

    ;(allTripsRaw || []).forEach((t: any) => {
      if (!tripsWithRevenues.has(t.id)) {
        const amt = Number(t.revenue_fcfa || 0)
        totalRevenue += amt
        if (t.departure_date && amt > 0) {
          const month = months.find((m) => m.key === t.departure_date.substring(0, 7))
          if (month) month.revenue += amt
        }
      }
    })

    let totalExpenses = 0
    ;(expensesRaw || []).forEach((e: any) => {
      const amt = Number(e.amount_fcfa || 0)
      totalExpenses += amt
      if (e.date) {
        const month = months.find((m) => m.key === e.date.substring(0, 7))
        if (month) month.expenses += amt
      }
    })

    ;(allTripsRaw || []).forEach((t: any) => {
      if (!tripsWithAllerExp.has(t.id)) {
        const amt = Number(t.frais_aller_fcfa || 0)
        totalExpenses += amt
        if (t.departure_date && amt > 0) {
          const month = months.find((m) => m.key === t.departure_date.substring(0, 7))
          if (month) month.expenses += amt
        }
      }
      if (!tripsWithRetourExp.has(t.id)) {
        const amt = Number(t.frais_retour_fcfa || 0)
        totalExpenses += amt
        if (t.departure_date && amt > 0) {
          const month = months.find((m) => m.key === t.departure_date.substring(0, 7))
          if (month) month.expenses += amt
        }
      }
    })

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
