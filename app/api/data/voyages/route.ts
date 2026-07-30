import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/data/voyages
 * Query params: page, pageSize, status
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = Number(searchParams.get('page')) || 1
  const pageSize = Number(searchParams.get('pageSize')) || 10
  const status = searchParams.get('status') || ''

  try {
    const supabase = await createClient()
    let query = supabase
      .from('trips')
      .select('*, clients(name), trucks(plate), drivers(full_name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1)

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, count, error } = await query

    if (error) throw error

    return NextResponse.json({ data, count, totalPages: Math.ceil((count || 0) / pageSize) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
