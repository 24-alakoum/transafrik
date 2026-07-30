import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/data/maintenance
 * Query params: status, severity, truckId
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || ''
  const severity = searchParams.get('severity') || ''
  const truckId = searchParams.get('truckId') || ''

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

    let query = (supabase as any)
      .from('maintenance_alerts')
      .select('*, trucks(id, plate, brand)')
      .eq('company_id', userData.company_id)
      .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)
    if (severity) query = query.eq('severity', severity)
    if (truckId) query = query.eq('truck_id', truckId)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ data: data || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * PATCH /api/data/maintenance — Update status of a maintenance alert
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'id et status requis' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { data: userData } = (await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()) as any

    const updatePayload: any = {
      status,
      updated_at: new Date().toISOString(),
    }
    if (status === 'resolved') {
      updatePayload.resolved_at = new Date().toISOString()
    }

    const { error } = await (supabase as any)
      .from('maintenance_alerts')
      .update(updatePayload)
      .eq('id', id)
      .eq('company_id', userData?.company_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
