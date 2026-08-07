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

    const { data, error } = await (supabase.from('revenues') as any)
      .select(`
        *,
        clients(id, name),
        trips(id, reference)
      `)
      .eq('company_id', userData.company_id)
      .order('date', { ascending: false })

    // Si la table revenues n'existe pas, on renvoie une liste vide au lieu de planter l'API
    if (error) {
      console.error('[API Recettes] error:', error)
      return NextResponse.json({ data: [] })
    }
    return NextResponse.json({ data: data || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
