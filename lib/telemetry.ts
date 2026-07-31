import { createAdminClient } from '@/lib/supabase/admin'

type AlertInput = {
  companyId: string
  truckId: string
  type: string
  severity: 'info' | 'warning' | 'critical'
  title: string
  description: string
}

const numberValue = (value: unknown) => Number(value ?? 0)

/**
 * Analyse les données effectivement saisies dans Supabase. Cette fonction ne
 * génère aucune position GPS, pneu, consommation ou trajet de démonstration.
 */
export async function runAIPredictiveAnalysis(companyId: string) {
  const supabase = createAdminClient()
  const { data: trucksData, error } = await supabase
    .from('trucks')
    .select('id, plate, brand, model, truck_tires(*), fuel_logs(*), gps_locations(*), trips(*)')
    .eq('company_id', companyId)

  if (error) throw error

  const trucks = (trucksData ?? []) as any[]
  const maintenanceSuggestions: any[] = []
  const tireAlerts: any[] = []
  const fuelEfficiency: any[] = []
  const routeStats = new Map<string, { from: string; to: string; trips: any[] }>()
  let savingsEstimate = 0

  for (const truck of trucks) {
    const tires = truck.truck_tires ?? []
    for (const tire of tires) {
      const wear = numberValue(tire.wear_percentage)
      if (wear < 60) continue

      const severity = wear >= 80 ? 'critical' : 'warning'
      const position = String(tire.position).replace(/_/g, ' ')
      const description = severity === 'critical'
        ? `Usure excessive (${wear.toFixed(0)} %) détectée sur le pneu ${position}. Remplacement urgent requis.`
        : `Usure à surveiller (${wear.toFixed(0)} %) détectée sur le pneu ${position}. Planifiez un contrôle.`

      tireAlerts.push({ truck_id: truck.id, plate: truck.plate, brand: truck.brand, position: tire.position, wear, severity, description })
      if (severity === 'critical') {
        await triggerMaintenanceAlert(supabase, {
          companyId, truckId: truck.id, type: 'tire_rotation', severity,
          title: `Remplacer pneu ${position} — ${truck.plate}`,
          description,
        })
      }
    }

    const logs = [...(truck.fuel_logs ?? [])]
      .filter((log: any) => log.mileage_at_fill !== null && log.mileage_at_fill !== undefined)
      .sort((a: any, b: any) => numberValue(a.mileage_at_fill) - numberValue(b.mileage_at_fill))

    if (logs.length >= 2) {
      const distance = numberValue(logs.at(-1).mileage_at_fill) - numberValue(logs[0].mileage_at_fill)
      const liters = logs.slice(1).reduce((sum: number, log: any) => sum + numberValue(log.liters), 0)
      const cost = logs.slice(1).reduce((sum: number, log: any) => sum + numberValue(log.total_cost_fcfa), 0)

      if (distance > 0 && liters > 0) {
        const per100km = (liters / distance) * 100
        const efficiency = per100km > 30 ? 'poor' : per100km > 26 ? 'average' : per100km > 22 ? 'good' : 'excellent'
        fuelEfficiency.push({
          truck_id: truck.id, plate: truck.plate, brand: truck.brand, model: truck.model,
          liters, cost, per100km: Number(per100km.toFixed(1)), efficiency,
        })

        if (efficiency === 'poor') {
          const estimatedMonthlyCost = cost / Math.max(1, logs.length - 1) * 4
          const estimatedSaving = estimatedMonthlyCost * 0.1
          savingsEstimate += estimatedSaving
          await triggerMaintenanceAlert(supabase, {
            companyId, truckId: truck.id, type: 'filter_change', severity: 'warning',
            title: `Contrôle consommation — ${truck.plate}`,
            description: `Consommation calculée à ${per100km.toFixed(1)} L/100 km à partir des relevés de carburant et d'odomètre. Vérifiez pneus, filtres et injecteurs.`,
          })
        }
      }
    }

    const highSpeedEvents = (truck.gps_locations ?? []).filter((location: any) => numberValue(location.speed_kmh) > 95)
    if (highSpeedEvents.length) {
      const confidence = Math.min(99, 70 + highSpeedEvents.length * 5)
      maintenanceSuggestions.push({
        truck_id: truck.id, plate: truck.plate, alert: 'Contrôle système de freinage', severity: 'warning',
        dueIn: 'Dès que possible', confidence,
        desc: `${highSpeedEvents.length} relevé(s) GPS supérieur(s) à 95 km/h ont été détectés. Contrôlez le freinage et rappelez les consignes de sécurité.`,
      })
      await triggerMaintenanceAlert(supabase, {
        companyId, truckId: truck.id, type: 'brake_check', severity: 'warning',
        title: `Vérification freins — ${truck.plate}`,
        description: `${highSpeedEvents.length} excès de vitesse détecté(s) dans les données GPS.`,
      })
    }

    const latestMileage = logs.at(-1)?.mileage_at_fill
    if (latestMileage !== undefined && numberValue(latestMileage) > 0 && numberValue(latestMileage) % 15000 >= 14000) {
      maintenanceSuggestions.push({
        truck_id: truck.id, plate: truck.plate, alert: 'Vidange moteur & révision', severity: 'critical',
        dueIn: `${15000 - (numberValue(latestMileage) % 15000)} km`, confidence: 90,
        desc: `L'odomètre enregistré (${numberValue(latestMileage).toFixed(0)} km) approche l'échéance de révision de 15 000 km.`,
      })
    }

    for (const trip of truck.trips ?? []) {
      if (!trip.origin || !trip.destination) continue
      const key = `${trip.origin}::${trip.destination}`
      const route: { from: string; to: string; trips: any[] } = routeStats.get(key) ?? {
        from: trip.origin,
        to: trip.destination,
        trips: [],
      }
      route.trips.push(trip)
      routeStats.set(key, route)
    }
  }

  const optimizedRoutes = [...routeStats.values()]
    .filter(({ trips }) => trips.length >= 2)
    .map(({ from, to, trips }) => ({
      from, to,
      current: `${trips.length} voyage(s) enregistré(s) sur cet itinéraire`,
      optimized: 'Regrouper les départs et planifier les retours avec chargement',
      saving: 'Optimisation proposée à partir de vos trajets récurrents',
      gain: trips.length >= 4 ? 'high' : 'medium',
    }))

  return { maintenanceSuggestions, tireAlerts, fuelEfficiency, optimizedRoutes, savingsEstimate: Math.round(savingsEstimate) }
}

async function triggerMaintenanceAlert(supabase: any, alert: AlertInput) {
  const { data: existing } = await supabase
    .from('maintenance_alerts').select('id')
    .eq('truck_id', alert.truckId).eq('type', alert.type).eq('status', 'open').maybeSingle()
  if (existing) return

  const { error } = await supabase.from('maintenance_alerts').insert({
    company_id: alert.companyId, truck_id: alert.truckId, type: alert.type, severity: alert.severity,
    title: alert.title, description: alert.description, status: 'open', ai_generated: true,
  })
  if (error) throw error

  const { error: notificationError } = await supabase.from('notifications').insert({
    company_id: alert.companyId, type: 'maintenance', title: alert.title, body: alert.description, read_at: null,
  })
  if (notificationError) throw notificationError
}
