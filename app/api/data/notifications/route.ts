import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/data/notifications
 * Récupère les notifications et synchronise automatiquement les alertes réelles de la flotte.
 */
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single() as any

    if (!userData?.company_id) {
      return NextResponse.json({ data: [] })
    }

    const companyId = userData.company_id

    // Synchronisation intelligente des alertes métier réelles de la flotte
    await syncFleetNotifications(supabase, companyId)

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ data: data || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

async function syncFleetNotifications(supabase: any, companyId: string) {
  try {
    // Récupérer les titres de notifications déjà enregistrés pour éviter les doublons
    const { data: existing } = await supabase
      .from('notifications')
      .select('title')
      .eq('company_id', companyId)

    const existingTitles = new Set((existing || []).map((n: any) => n.title))
    const toInsert: any[] = []

    const todayMs = Date.now()
    const in30DaysStr = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]

    // 1. Alertes Camions : Visite technique & Assurance
    const { data: trucks } = await supabase
      .from('trucks')
      .select('id, plate, brand, tech_visit_expiry, insurance_expiry')
      .eq('company_id', companyId)

    if (trucks) {
      for (const t of trucks) {
        if (t.tech_visit_expiry && t.tech_visit_expiry <= in30DaysStr) {
          const title = `🛠️ Visite Technique — Camion ${t.plate}`
          if (!existingTitles.has(title)) {
            toInsert.push({
              company_id: companyId,
              type: 'maintenance',
              title,
              body: `La visite technique du camion ${t.plate} (${t.brand || 'Flotte'}) arrive à échéance le ${t.tech_visit_expiry}.`,
              read_at: null,
            })
            existingTitles.add(title)
          }
        }
        if (t.insurance_expiry && t.insurance_expiry <= in30DaysStr) {
          const title = `🛡️ Assurance — Camion ${t.plate}`
          if (!existingTitles.has(title)) {
            toInsert.push({
              company_id: companyId,
              type: 'maintenance',
              title,
              body: `L'assurance du camion ${t.plate} arrive à échéance le ${t.insurance_expiry}. Renouvellement recommandé.`,
              read_at: null,
            })
            existingTitles.add(title)
          }
        }
      }
    }

    // 2. Alertes Chauffeurs : Expiration Permis
    const { data: drivers } = await supabase
      .from('drivers')
      .select('id, full_name, license_expiry')
      .eq('company_id', companyId)

    if (drivers) {
      for (const d of drivers) {
        if (d.license_expiry && d.license_expiry <= in30DaysStr) {
          const title = `🪪 Expiration Permis — ${d.full_name}`
          if (!existingTitles.has(title)) {
            toInsert.push({
              company_id: companyId,
              type: 'alert',
              title,
              body: `Le permis de conduire du chauffeur ${d.full_name} expire le ${d.license_expiry}. Vérifiez la validité des documents.`,
              read_at: null,
            })
            existingTitles.add(title)
          }
        }
      }
    }

    // 3. Alertes Connaissements (BL) : Surestarie & Détention
    const { data: bls } = await supabase
      .from('bills_of_lading')
      .select('id, reference, vessel_name, status, arrival_date, free_time_demurrage_days, free_time_detention_days, containers(id, container_number, status, pickup_date, return_date)')
      .eq('company_id', companyId)

    if (bls) {
      for (const bl of bls) {
        if (bl.status === 'termine' || bl.status === 'livre') continue
        const containers = bl.containers || []
        if (containers.length > 0 && containers.every((c: any) => c.status === 'retourne')) continue

        // Surestarie port (demurrage)
        if (bl.arrival_date) {
          const activeDemurrage = containers.filter((c: any) => c.status === 'en_cours' && !c.pickup_date)
          if (!containers.length || activeDemurrage.length > 0) {
            const deadline = new Date(bl.arrival_date)
            deadline.setDate(deadline.getDate() + (bl.free_time_demurrage_days || 3))
            const diffDays = Math.ceil((deadline.getTime() - todayMs) / 86400000)
            if (diffDays <= 3) {
              const title = `🚨 Alerte Surestarie Port — BL ${bl.reference}`
              if (!existingTitles.has(title)) {
                toInsert.push({
                  company_id: companyId,
                  type: 'alert',
                  title,
                  body: `Le BL ${bl.reference} (${bl.vessel_name || 'Navire'}) a ${diffDays <= 0 ? 'dépassé son délai' : `seulement ${diffDays} jour(s) restant(s)`} de surestarie port.`,
                  read_at: null,
                })
                existingTitles.add(title)
              }
            }
          }
        }

        // Détention conteneurs (detention)
        for (const c of containers) {
          if (c.status !== 'retourne' && (c.pickup_date || c.status === 'livre' || c.status === 'vide')) {
            const startDate = c.pickup_date || bl.arrival_date
            if (startDate) {
              const deadline = new Date(startDate)
              deadline.setDate(deadline.getDate() + (bl.free_time_detention_days || 7))
              const diffDays = Math.ceil((deadline.getTime() - todayMs) / 86400000)
              if (diffDays <= 3) {
                const title = `📦 Alerte Détention Conteneur ${c.container_number || 'N/A'}`
                if (!existingTitles.has(title)) {
                  toInsert.push({
                    company_id: companyId,
                    type: 'alert',
                    title,
                    body: `Le conteneur ${c.container_number || 'N/A'} (BL ${bl.reference}) doit être retourné sous ${diffDays} jour(s).`,
                    read_at: null,
                  })
                  existingTitles.add(title)
                }
              }
            }
          }
        }
      }
    }

    // 4. Notification pour Voyages en transit
    const { data: activeTrips } = await supabase
      .from('trips')
      .select('id, reference, origin, destination')
      .eq('company_id', companyId)
      .in('status', ['in_transit', 'loading'])
      .limit(3)

    if (activeTrips) {
      for (const trip of activeTrips) {
        const title = `🚚 Voyage Actif — ${trip.reference}`
        if (!existingTitles.has(title)) {
          toInsert.push({
            company_id: companyId,
            type: 'trip',
            title,
            body: `Expédition ${trip.reference} (${trip.origin} ➔ ${trip.destination}) est actuellement en transit.`,
            read_at: null,
          })
          existingTitles.add(title)
        }
      }
    }

    // 5. Notification Système par défaut si le tableau est vide
    if (existingTitles.size === 0 && toInsert.length === 0) {
      toInsert.push({
        company_id: companyId,
        type: 'system',
        title: '👋 Bienvenue sur votre centre de notifications',
        body: 'Le système de notifications est actif. Vous recevrez ici les alertes de votre flotte, les entretiens, les alertes de surestaries et le suivi de vos missions.',
        read_at: null,
      })
    }

    if (toInsert.length > 0) {
      await supabase.from('notifications').insert(toInsert)
    }
  } catch (err) {
    console.error('[syncFleetNotifications Error]', err)
  }
}
