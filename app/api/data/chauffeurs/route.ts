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

    // Vérification de l'utilisateur connecté
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Récupérer le company_id de l'utilisateur
    const { data: userData, error: userError } = (await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()) as any

    if (userError || !userData?.company_id) {
      return NextResponse.json({ error: 'Entreprise introuvable' }, { status: 403 })
    }

    // Select sans la jointure trucks pour éviter l'erreur si la FK n'existe pas
    let query = (supabase as any)
      .from('drivers')
      .select('*')
      .eq('company_id', userData.company_id)
      .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)
    if (q) query = query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`)

    const { data: drivers, error } = await query
    if (error) throw error

    // Décryptage côté serveur — on gère les cas où la valeur n'est pas chiffrée
    const safeDecrypt = async (value: string | null): Promise<string | null> => {
      if (!value) return null
      try {
        return await decrypt(value)
      } catch {
        // La valeur n'est pas chiffrée (ancienne donnée) — on la retourne masquée
        return '••••••'
      }
    }

    const decrypted = await Promise.all((drivers || []).map(async (driver: any) => ({
      ...driver,
      license_number: await safeDecrypt(driver.license_number),
      national_id: await safeDecrypt(driver.national_id),
    })))

    return NextResponse.json({ data: decrypted })
  } catch (err: any) {
    console.error('[GET /api/data/chauffeurs]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
