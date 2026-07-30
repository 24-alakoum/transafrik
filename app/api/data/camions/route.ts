import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/data/camions
 * Query params: q, status, type
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') || ''
  const status = searchParams.get('status') || ''
  const type = searchParams.get('type') || ''

  try {
    const supabase = await createClient()
    let query = supabase.from('trucks').select('*').order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)
    if (type) query = query.eq('type', type)
    if (q) query = query.or(`plate.ilike.%${q}%,brand.ilike.%${q}%,model.ilike.%${q}%`)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
