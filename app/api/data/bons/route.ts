import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/data/bons
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

    const { data, error } = await supabase
      .from('delivery_notes')
      .select('*, trips(reference, clients(name))')
      .eq('company_id', userData.company_id)
      .order('created_at', { ascending: false }) as any

    if (error) throw error

    return NextResponse.json({ data: data || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
