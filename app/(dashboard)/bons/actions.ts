'use server'

import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit'

// Server Action for sequential invoice numbering and creation
export async function createBonLivraisonAction(tripId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Non autorisé' }

    const { data: userData } = await supabase.from('users').select('company_id').eq('id', user.id).single()
    const companyId = userData?.company_id
    if (!companyId) return { success: false, error: 'Compagnie introuvable' }

    // 1. Transaction atomique via Supabase RPC pour incrémenter et récupérer le compteur
    // Note: Pour une implémentation sans RPC custom, on le fait séquentiellement mais avec risque de race condition
    // La méthode recommandée avec Supabase est une fonction RPC `increment_invoice_counter(company_id)`
    
    // Fallback sans RPC:
    const { data: company } = await supabase
      .from('companies')
      .select('invoice_prefix, invoice_counter')
      .eq('id', companyId)
      .single()
    
    const nextCounter = (company?.invoice_counter || 0) + 1
    const prefix = company?.invoice_prefix || 'FAC'
    const reference = `${prefix}-${new Date().getFullYear()}-${nextCounter.toString().padStart(4, '0')}`

    // Update counter
    await supabase.from('companies').update({ invoice_counter: nextCounter }).eq('id', companyId)

    // Calculate totals
    const { data: trip } = await supabase.from('trips').select('trip_lines(total_fcfa)').eq('id', tripId).single()
    const subtotal = trip?.trip_lines?.reduce((sum: number, line: any) => sum + Number(line.total_fcfa), 0) || 0
    const taxRate = 18 // Ex: 18% TVA
    const taxAmount = (subtotal * taxRate) / 100
    const total = subtotal + taxAmount

    // Create delivery note / invoice
    const { data: bon, error } = await supabase
      .from('delivery_notes')
      .insert({
        company_id: companyId,
        trip_id: tripId,
        created_by: user.id,
        reference,
        issued_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +30 jours
        subtotal_fcfa: subtotal,
        tax_rate: taxRate,
        total_fcfa: total,
        status: 'draft'
      })
      .select('id')
      .single()

    if (error) return { success: false, error: error.message }

    await logAudit({
      userId: user.id,
      companyId,
      action: 'CREATE_INVOICE',
      resource: 'delivery_notes',
      resource_id: bon.id,
    })

    return { success: true, bonId: bon.id }
  } catch (err) {
    return { success: false, error: 'Erreur inattendue' }
  }
}
