import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/data/bons
 */
export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('delivery_notes')
      .select('*, trips(reference, clients(name))')
      .order('created_at', { ascending: false }) as any

    if (error) throw error

    return NextResponse.json({ data: data || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
