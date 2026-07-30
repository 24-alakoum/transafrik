import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/data/depenses
 */
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: expenses, error } = await supabase
      .from('expenses')
      .select('*, trips(reference), trucks(plate)')
      .order('date', { ascending: false }) as any

    if (error) throw error

    return NextResponse.json({ data: expenses || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
