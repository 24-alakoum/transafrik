import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') // 'morning' or 'evening'

  // Verify Cron secret to ensure only authorized callers can trigger
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  if (type !== 'morning' && type !== 'evening') {
    return NextResponse.json({ error: 'Type invalide. Doit être morning ou evening' }, { status: 400 })
  }

  try {
    const supabaseAdmin = createAdminClient()

    // 1. Get all companies to process separately
    const { data: companiesData } = await supabaseAdmin.from('companies').select('id, name')
    const companies = companiesData as any[] | null
    if (!companies) {
      return NextResponse.json({ success: true, message: 'Aucune entreprise à traiter' })
    }

    const processedCompanies = []

    for (const company of companies) {
      const companyId = company.id

      if (type === 'morning') {
        // --- MORNING ALERTS ---
        // 1. Scan critical tires (wear_percentage > 75)
        const { data: wornTires } = await supabaseAdmin
          .from('truck_tires')
          .select('id, position, wear_percentage, truck_id, trucks(plate)')
          .eq('company_id', companyId)
          .gt('wear_percentage', 75) as any

        let tireAlertCount = 0
        if (wornTires && wornTires.length > 0) {
          for (const tire of wornTires) {
            const plate = tire.trucks?.plate || 'Camion'
            const msg = `Sécurité Pneu Matin : Le pneu ${tire.position.replace(/_/g, ' ')} du camion ${plate} a un taux d'usure critique de ${tire.wear_percentage}%. Remplacement requis.`
            
            // Log notification
            await insertNotification(supabaseAdmin, companyId, 'alert', `Alerte Pneu Critique — ${plate}`, msg)
            tireAlertCount++
          }
        }

        // 2. Scan critical maintenance due today
        const todayStr = new Date().toISOString().split('T')[0]
        const { data: maintDue } = await supabaseAdmin
          .from('maintenance_alerts')
          .select('id, title, truck_id, trucks(plate)')
          .eq('company_id', companyId)
          .eq('status', 'open')
          .lte('due_date', todayStr) as any

        let maintAlertCount = 0
        if (maintDue && maintDue.length > 0) {
          for (const item of maintDue) {
            const plate = item.trucks?.plate || 'Camion'
            const msg = `Maintenance requise aujourd'hui : "${item.title}" pour le camion ${plate}.`
            await insertNotification(supabaseAdmin, companyId, 'maintenance', `Rappel Entretien — ${plate}`, msg)
            maintAlertCount++
          }
        }

        // Log overall morning report
        await insertNotification(
          supabaseAdmin,
          companyId,
          'system',
          'Rapport de Flotte Matinal',
          `Bonjour ! ${tireAlertCount} alerte(s) pneu(s) critique(s) et ${maintAlertCount} maintenance(s) prévue(s) aujourd'hui.`
        )

        processedCompanies.push({ companyId, tires: tireAlertCount, maintenance: maintAlertCount })

      } else {
        // --- EVENING ALERTS ---
        // 1. Compute total fuel logs created today
        const todayStr = new Date().toISOString().split('T')[0]
        const { data: fuelLogsData } = await supabaseAdmin
          .from('fuel_logs')
          .select('liters, total_cost_fcfa')
          .eq('company_id', companyId)
          .eq('date', todayStr)

        const fuelLogs = fuelLogsData as any[] | null
        const totalLiters = fuelLogs?.reduce((sum, log) => sum + Number(log.liters), 0) || 0
        const totalCost = fuelLogs?.reduce((sum, log) => sum + Number(log.total_cost_fcfa), 0) || 0

        // 2. Scan speeding incidents today (>90 km/h)
        const { data: speeds } = await supabaseAdmin
          .from('gps_locations')
          .select('id, speed_kmh, truck_id, trucks(plate)')
          .eq('company_id', companyId)
          .gt('speed_kmh', 90)
          .gte('recorded_at', new Date(new Date().setHours(0,0,0,0)).toISOString()) as any

        const uniqueSpeedingTrucks = Array.from(new Set((speeds || []).map((s: any) => s.trucks?.plate))).filter(Boolean)

        let speedingMsg = ''
        if (uniqueSpeedingTrucks.length > 0) {
          speedingMsg = ` Signalement de vitesse : ${uniqueSpeedingTrucks.length} véhicule(s) (${uniqueSpeedingTrucks.join(', ')}) ont dépassé 90 km/h aujourd'hui.`
          
          for (const plate of uniqueSpeedingTrucks) {
            await insertNotification(
              supabaseAdmin,
              companyId,
              'alert',
              `Excès de Vitesse — ${plate}`,
              `Le camion ${plate} a été localisé à plus de 90 km/h aujourd'hui.`
            )
          }
        }

        // Log evening summary
        const msg = `Bilan de la journée : Consommation de carburant : ${totalLiters.toFixed(1)}L (${(totalCost / 1000).toFixed(0)}k FCFA).${speedingMsg}`
        await insertNotification(supabaseAdmin, companyId, 'system', 'Rapport de Flotte du Soir', msg)

        processedCompanies.push({ companyId, fuelLiters: totalLiters, speedingTrucksCount: uniqueSpeedingTrucks.length })
      }
    }

    return NextResponse.json({ success: true, type, processed: processedCompanies })
  } catch (error: any) {
    console.error('[CRON Alertes Quotidiennes]', error)
    return NextResponse.json({ error: error.message || 'Erreur interne' }, { status: 500 })
  }
}

async function insertNotification(supabase: any, companyId: string, type: string, title: string, body: string) {
  const { data: preferences } = await supabase
    .from('notification_preferences')
    .select('maintenance_enabled, alerts_enabled, reports_enabled')
    .eq('company_id', companyId)
    .maybeSingle()

  const isEnabled =
    (type === 'maintenance' && preferences?.maintenance_enabled !== false) ||
    (type === 'alert' && preferences?.alerts_enabled !== false) ||
    (type === 'system' && preferences?.reports_enabled !== false) ||
    !['maintenance', 'alert', 'system'].includes(type)

  if (!isEnabled) return

  await supabase.from('notifications').insert({
    company_id: companyId,
    type,
    title,
    body,
    read_at: null,
  })
}
