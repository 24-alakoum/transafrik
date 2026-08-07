'use server'

import { createClient } from '@/lib/supabase/server'
import { voyageSchema } from '@/lib/validations/voyage'
import { logAudit } from '@/lib/audit'
import { generateReference } from '@/lib/utils'

export async function createVoyageAction(formData: unknown) {
  try {
    const parsed = voyageSchema.safeParse(formData)
    if (!parsed.success) {
      return { success: false, error: parsed.error.flatten().fieldErrors }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: { _global: 'Non autorisé' } }
    }

    const { data: userData } = (await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()) as any

    if (!userData?.company_id) {
      return { success: false, error: { _global: 'Compagnie introuvable' } }
    }

    // Generate unique reference (e.g. TRP-20260515-XXXX)
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '')
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase()
    const reference = `TRP-${dateStr}-${randomStr}`

    const { data: trip, error } = (await supabase
      .from('trips')
      .insert({
        ...parsed.data,
        reference,
        company_id: userData.company_id,
        created_by: user.id,
      } as any)
      .select('id')
      .single()) as any

    if (error) {
      return { success: false, error: { _global: error.message } }
    }

    // Synchronisation automatique dans la table `revenues` si un revenu est spécifié
    if (parsed.data.revenue_fcfa && Number(parsed.data.revenue_fcfa) > 0) {
      try {
        await supabase.from('revenues').insert({
          company_id: userData.company_id,
          trip_id: trip.id,
          client_id: parsed.data.client_id || null,
          description: `Recette voyage ${reference} (${parsed.data.origin} -> ${parsed.data.destination})`,
          amount_fcfa: Number(parsed.data.revenue_fcfa),
          date: parsed.data.departure_date || new Date().toISOString().split('T')[0],
          source: 'transport',
          status: 'encaisse',
          reference: reference,
        })
      } catch (revErr) {
        console.error('[createVoyageAction Sync Revenue Error]', revErr)
      }
    }

    await logAudit({
      userId: user.id,
      companyId: userData.company_id,
      action: 'CREATE_TRIP',
      resource: 'trips',
      resourceId: trip?.id,
    })

    return { success: true, tripId: trip?.id }
  } catch (err) {
    console.error('[createVoyageAction]', err)
    return { success: false, error: { _global: 'Une erreur inattendue est survenue' } }
  }
}

export async function updateVoyageAction(id: string, formData: unknown) {
  try {
    const parsed = voyageSchema.safeParse(formData)
    if (!parsed.success) {
      return { success: false, error: parsed.error.flatten().fieldErrors }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: { _global: 'Non autorisé' } }
    }

    const { data: userData } = (await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()) as any

    if (!userData?.company_id) {
      return { success: false, error: { _global: 'Compagnie introuvable' } }
    }

    const { error } = await (supabase
      .from('trips') as any)
      .update({
        ...parsed.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('company_id', userData.company_id)

    if (error) {
      return { success: false, error: { _global: error.message } }
    }

    // Mettre à jour ou ajouter la recette associée
    if (parsed.data.revenue_fcfa !== undefined) {
      try {
        const revAmount = Number(parsed.data.revenue_fcfa || 0)
        const { data: existingRev } = await supabase
          .from('revenues')
          .select('id')
          .eq('trip_id', id)
          .maybeSingle()

        if (existingRev) {
          if (revAmount > 0) {
            await supabase
              .from('revenues')
              .update({
                amount_fcfa: revAmount,
                client_id: parsed.data.client_id || null,
                date: parsed.data.departure_date || new Date().toISOString().split('T')[0],
                description: `Recette voyage (${parsed.data.origin} -> ${parsed.data.destination})`,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingRev.id)
          } else {
            await supabase.from('revenues').delete().eq('id', existingRev.id)
          }
        } else if (revAmount > 0) {
          const { data: currentTrip } = await supabase.from('trips').select('reference').eq('id', id).single()
          await supabase.from('revenues').insert({
            company_id: userData.company_id,
            trip_id: id,
            client_id: parsed.data.client_id || null,
            description: `Recette voyage ${currentTrip?.reference || ''} (${parsed.data.origin} -> ${parsed.data.destination})`,
            amount_fcfa: revAmount,
            date: parsed.data.departure_date || new Date().toISOString().split('T')[0],
            source: 'transport',
            status: 'encaisse',
            reference: currentTrip?.reference || null,
          })
        }
      } catch (revErr) {
        console.error('[updateVoyageAction Sync Revenue Error]', revErr)
      }
    }

    await logAudit({
      userId: user.id,
      companyId: userData.company_id,
      action: 'UPDATE_TRIP',
      resource: 'trips',
      resourceId: id,
    })

    return { success: true, tripId: id }
  } catch (err) {
    console.error('[updateVoyageAction]', err)
    return { success: false, error: { _global: 'Une erreur inattendue est survenue' } }
  }
}

export async function updateVoyageStatusAction(id: string, status: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Non autorisé' }

    const { data: userData } = (await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()) as any

    if (!userData?.company_id) return { success: false, error: 'Compagnie introuvable' }

    const { error } = await (supabase
      .from('trips') as any)
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('company_id', userData.company_id)

    if (error) return { success: false, error: error.message }

    await logAudit({
      userId: user.id,
      companyId: userData.company_id,
      action: 'UPDATE_TRIP_STATUS',
      resource: 'trips',
      resourceId: id,
    })

    return { success: true }
  } catch (err) {
    console.error('[updateVoyageStatusAction]', err)
    return { success: false, error: 'Erreur inattendue' }
  }
}

export async function deleteVoyageAction(id: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Non autorisé' }

    const { data: userData } = (await supabase.from('users').select('company_id').eq('id', user.id).single()) as any

    const { error } = (await supabase
      .from('trips')
      .delete()
      .eq('id', id)
      .eq('company_id', userData?.company_id)) as any

    if (error) return { success: false, error: error.message }

    // Nettoyer la recette liée
    try {
      await supabase.from('revenues').delete().eq('trip_id', id)
    } catch {}

    await logAudit({
      userId: user.id,
      companyId: userData?.company_id ?? '',
      action: 'DELETE_TRIP',
      resource: 'trips',
      resourceId: id,
    })

    return { success: true }
  } catch (err) {
    console.error(err)
    return { success: false, error: 'Erreur inattendue' }
  }
}

