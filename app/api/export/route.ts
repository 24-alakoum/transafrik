import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit'
import { headers } from 'next/headers'

// Simule la génération d'un export RGPD (généralement un processus asynchrone lourd)
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    // Normalement on vérifie le rate limit depuis Redis (max 2/24h)
    
    // Récupérer toutes les données liées à l'utilisateur
    const [
      { data: profile },
      { data: logs }
    ] = await Promise.all([
      supabase.from('users').select('*').eq('id', user.id).single(),
      supabase.from('audit_logs').select('*').eq('user_id', user.id).limit(100)
    ])

    const exportData = {
      generatedAt: new Date().toISOString(),
      user: profile,
      auditLogs: logs,
      // On ajouterait ici tout ce que l'utilisateur a créé
    }

    const jsonString = JSON.stringify(exportData, null, 2)

    await logAudit({
      userId: user.id,
      companyId: profile?.company_id ?? '',
      action: 'DOWNLOAD_RGPD_DATA',
      resource: 'users',
      ipAddress: (await headers()).get('x-forwarded-for') ?? '127.0.0.1'
    })

    return new NextResponse(jsonString, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="transafrik_export_${user.id}.json"`
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la génération' }, { status: 500 })
  }
}
