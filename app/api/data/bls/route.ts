import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { data: userData } = (await (supabase.from('users') as any)
      .select('company_id').eq('id', user.id).single()) as any
    if (!userData?.company_id) return NextResponse.json({ error: 'Compagnie non trouvée' }, { status: 404 })

    const { data, error } = await (supabase.from('bills_of_lading') as any)
      .select(`
        *,
        clients(id, name),
        containers(id, container_number, type, status, pickup_date, return_date)
      `)
      .eq('company_id', userData.company_id)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: data || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
