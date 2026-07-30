import { createClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/encryption'
import { NextResponse } from 'next/server'

/**
 * GET /api/data/chauffeurs
 * Query params: q, status
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') || ''
  const status = searchParams.get('status') || ''

  try {
    const supabase = await createClient()
    let query = supabase
      .from('drivers')
      .select('*, trucks(plate)')
      .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)
    if (q) query = query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`)

    const { data: drivers, error } = await query
    if (error) throw error

    // Décryptage côté serveur
    const decrypted = await Promise.all((drivers || []).map(async (driver: any) => ({
      ...driver,
      license_number: driver.license_number
        ? await decrypt(driver.license_number).catch(() => 'Erreur')
        : null,
      national_id: driver.national_id
        ? await decrypt(driver.national_id).catch(() => 'Erreur')
        : null,
    })))

    return NextResponse.json({ data: decrypted })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
