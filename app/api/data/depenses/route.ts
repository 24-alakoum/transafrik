import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/data/depenses
 */
export async function GET(request: Request) {
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

    const expenseId = new URL(request.url).searchParams.get('id')
    let query = supabase
      .from('expenses')
      .select('*, trips(reference), trucks(plate)')
      .eq('company_id', userData.company_id)
      .order('date', { ascending: false }) as any

    if (expenseId) query = query.eq('id', expenseId)

    const [{ data: expenses, error }, { data: company, error: companyError }] = await Promise.all([
      query,
      supabase.from('companies').select('name, address, email, phone, nif').eq('id', userData.company_id).single(),
    ])

    if (error) throw error
    if (companyError) throw companyError

    return NextResponse.json({ data: expenses || [], company })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
