'use server'

import { createClient } from '@/lib/supabase/server'
import { PERMISSION_MAP } from '@/lib/constants'

export async function getTrackingDataAction() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Non autorisé' }

    const { data: userData } = (await supabase.from('users').select('company_id, role').eq('id', user.id).single()) as any
    const companyId = userData?.company_id
    const userRole = userData?.role

    if (!companyId) return { success: false, error: 'Compagnie introuvable' }
    if (!PERMISSION_MAP.canViewTracking.includes(userRole)) {
      return { success: false, error: 'Accès au tracking non autorisé' }
    }

    // Les positions sont fournies par les appareils GPS et lues sans simulation.
    const { data: trucksData } = await supabase
      .from('trucks')
      .select('id, plate, brand, model, status')
      .eq('company_id', companyId)
    
    const trucks = trucksData as any[] | null

    // 3. For each truck, fetch latest GPS location & active trip
    const trucksWithGPS = await Promise.all(
      (trucks || []).map(async (truck) => {
        // Fetch latest location
        const { data: lastPositionData } = await supabase
          .from('gps_locations')
          .select('latitude, longitude, speed_kmh, recorded_at')
          .eq('truck_id', truck.id)
          .order('recorded_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        const lastPosition = lastPositionData as any

        // Fetch active trip if in_transit
        let activeTrip = null
        if (truck.status === 'in_transit') {
          const { data: tripData } = await supabase
            .from('trips')
            .select('reference, destination')
            .eq('truck_id', truck.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
          
          const trip = tripData as any
          
          if (trip) {
            activeTrip = {
              reference: trip.reference,
              destination: trip.destination,
            }
          }
        }

        return {
          id: truck.id,
          plate: truck.plate,
          brand: truck.brand,
          model: truck.model,
          status: truck.status,
          lastPosition: lastPosition
            ? {
                latitude: Number(lastPosition.latitude),
                longitude: Number(lastPosition.longitude),
                speed_kmh: lastPosition.speed_kmh ? Number(lastPosition.speed_kmh) : null,
                recorded_at: lastPosition.recorded_at,
              }
            : null,
          activeTrip,
        }
      })
    )

    return { success: true, trucks: trucksWithGPS }
  } catch (err: any) {
    return { success: false, error: err.message || 'Erreur inattendue' }
  }
}
