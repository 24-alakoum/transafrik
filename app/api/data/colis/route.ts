import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/data/colis
 * Query params: q, status
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') || ''
  const status = searchParams.get('status') || ''

  try {
    const supabase = await createClient()
    let query = supabase.from('packages').select('*').order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)
    if (q) query = query.or(`reference.ilike.%${q}%,recipient_name.ilike.%${q}%,recipient_phone.ilike.%${q}%`)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
