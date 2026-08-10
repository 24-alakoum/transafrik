'use server'

import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit'

// Server Action for sequential invoice numbering and creation
export async function createBonLivraisonAction(tripId: string, isExternal: boolean = false) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Non autorisé' }

    const { data: userData } = (await supabase.from('users').select('company_id').eq('id', user.id).single()) as any
    const companyId = userData?.company_id
    if (!companyId) return { success: false, error: 'Compagnie introuvable' }

    const { data: company } = (await supabase
      .from('companies')
      .select('invoice_prefix, invoice_counter')
      .eq('id', companyId)
      .single()) as any
    
    const nextCounter = (company?.invoice_counter || 0) + 1
    const prefix = company?.invoice_prefix || 'FAC'
    const reference = `${prefix}-${new Date().getFullYear()}-${nextCounter.toString().padStart(4, '0')}`

    // Update counter
    await (supabase.from('companies') as any).update({ invoice_counter: nextCounter }).eq('id', companyId)

    // Calculate totals
    const { data: trip } = (await supabase.from('trips').select('trip_lines(total_fcfa)').eq('id', tripId).single()) as any
    const subtotal = trip?.trip_lines?.reduce((sum: number, line: any) => sum + Number(line.total_fcfa), 0) || 0
    const taxRate = 18 // Ex: 18% TVA
    const taxAmount = (subtotal * taxRate) / 100
    const total = subtotal + taxAmount

    const insertPayload: any = {
      company_id: companyId,
      trip_id: tripId,
      created_by: user.id,
      reference,
      issued_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      subtotal_fcfa: subtotal,
      tax_rate: taxRate,
      total_fcfa: total,
      status: 'draft',
      is_external: isExternal,
    }

    let { data: bon, error } = (await supabase
      .from('delivery_notes')
      .insert(insertPayload)
      .select('id')
      .single()) as any

    if (error && error.message?.includes('is_external')) {
      delete insertPayload.is_external
      const retry = (await supabase
        .from('delivery_notes')
        .insert(insertPayload)
        .select('id')
        .single()) as any
      bon = retry.data
      error = retry.error
    }

    if (error) return { success: false, error: error.message }

    await logAudit({
      userId: user.id,
      companyId,
      action: 'CREATE_INVOICE',
      resource: 'delivery_notes',
      resourceId: bon?.id,
    })

    return { success: true, bonId: bon.id }
  } catch (err) {
    return { success: false, error: 'Erreur inattendue' }
  }
}
