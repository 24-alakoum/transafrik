import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/data/voyages
 * Query params: page, pageSize, status, q/search, sortField, sortOrder, clientId, truckId, driverId
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = Number(searchParams.get('page')) || 1
  const pageSize = Number(searchParams.get('pageSize')) || 10
  const status = searchParams.get('status') || ''
  const search = (searchParams.get('q') || searchParams.get('search') || '').trim()
  const sortField = searchParams.get('sortField') || 'created_at'
  const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc'
  const clientId = searchParams.get('clientId') || ''
  const truckId = searchParams.get('truckId') || ''
  const driverId = searchParams.get('driverId') || ''

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

    let query = supabase
      .from('trips')
      .select('*, clients(name), trucks(plate), drivers(full_name), expenses(amount_fcfa, category), revenues(amount_fcfa)', { count: 'exact' })
      .eq('company_id', userData.company_id)

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (clientId) {
      query = query.eq('client_id', clientId)
    }

    if (truckId) {
      query = query.eq('truck_id', truckId)
    }

    if (driverId) {
      query = query.eq('driver_id', driverId)
    }

    if (search) {
      // Search in trip fields (reference, origin, destination, cargo_type)
      const pattern = `%${search}%`
      query = query.or(`reference.ilike.${pattern},origin.ilike.${pattern},destination.ilike.${pattern},cargo_type.ilike.${pattern}`)
    }

    // Allowed sort fields to prevent SQL injection / invalid column errors
    const validSortFields = ['created_at', 'reference', 'origin', 'destination', 'departure_date', 'revenue_fcfa', 'status']
    const effectiveSortField = validSortFields.includes(sortField) ? sortField : 'created_at'

    query = query
      .order(effectiveSortField, { ascending: sortOrder === 'asc' })
      .range((page - 1) * pageSize, page * pageSize - 1)

    const { data, count, error } = await query

    if (error) throw error

    return NextResponse.json({ data, count, totalPages: Math.ceil((count || 0) / pageSize) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

