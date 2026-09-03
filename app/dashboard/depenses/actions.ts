'use server'

import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit'
import { depenseSchema } from '@/lib/validations/depense'
import { ligneDepenseSchema } from '@/lib/validations/ligne_depense'

export async function createDepenseAction(formData: unknown) {
  try {
    const parsed = depenseSchema.safeParse(formData)
    if (!parsed.success) return { success: false, error: parsed.error.flatten().fieldErrors }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: { _global: 'Non autorisé' } }

    const { data: userData } = (await supabase.from('users').select('company_id').eq('id', user.id).single()) as any

    const {
      category,
      amount_fcfa,
      date,
      description,
      trip_id,
      truck_id,
      receipt_url,
      receipt_size,
      is_reimbursed,
    } = parsed.data

    const payload: Record<string, any> = {
      company_id: userData?.company_id,
      category: category || 'autre',
      amount_fcfa,
      date,
      description: description || null,
      trip_id: trip_id || null,
      truck_id: truck_id || null,
      receipt_url: receipt_url || null,
      created_by: user.id,
    }

    if (receipt_size !== undefined && receipt_size !== null) {
      payload.receipt_size = receipt_size
    }
    if (is_reimbursed !== undefined && is_reimbursed !== null) {
      payload.is_reimbursed = is_reimbursed
    }

    let depenseData: any = null
    let error: any = null

    // Si une dépense de frais aller ou retour pour ce voyage existe déjà, la mettre à jour pour éviter tout doublon
    if (trip_id && (category === 'frais_aller' || category === 'frais_retour')) {
      const { data: existingExp } = await supabase
        .from('expenses')
        .select('id')
        .eq('company_id', userData?.company_id)
        .eq('trip_id', trip_id)
        .eq('category', category)
        .maybeSingle()

      if (existingExp) {
        const retry = await (supabase
          .from('expenses') as any)
          .update(payload)
          .eq('id', existingExp.id)
          .select('id')
          .single()
        depenseData = retry.data
        error = retry.error
      }
    }

    if (!depenseData && !error) {
      let retry = (await supabase
        .from('expenses')
        .insert(payload as any)
        .select('id')
        .single()) as any
      depenseData = retry.data
      error = retry.error
    }

    // Handle missing optional columns gracefully (if DB table schema doesn't have is_reimbursed/receipt_size)
    if (error && error.message && (error.message.includes('is_reimbursed') || error.message.includes('receipt_size'))) {
      delete payload.is_reimbursed
      delete payload.receipt_size
      const retry = (await supabase
        .from('expenses')
        .insert(payload as any)
        .select('id')
        .single()) as any
      depenseData = retry.data
      error = retry.error
    }

    // Handle category constraint check failure fallback
    if (error && error.message && error.message.includes('category')) {
      payload.category = 'autre'
      const retry = (await supabase
        .from('expenses')
        .insert(payload as any)
        .select('id')
        .single()) as any
      depenseData = retry.data
      error = retry.error
    }

    if (error) {
      console.error('[createDepenseAction DB Error]', error)
      return { success: false, error: { _global: error.message } }
    }

    if (trip_id) {
      await syncTripExpenses(supabase, trip_id)
    }

    await logAudit({
      userId: user.id,
      companyId: userData?.company_id ?? '',
      action: 'CREATE_EXPENSE',
      resource: 'expenses',
      resourceId: depenseData?.id,
    })

    // Notification automatique dépense
    const amountK = (Number(amount_fcfa) / 1000).toFixed(0)
    try {
      await supabase.from('notifications').insert({
        company_id: userData?.company_id,
        type: 'payment',
        title: `💰 Nouvelle Dépense — ${amountK}k FCFA`,
        body: `Dépense de ${Number(amount_fcfa).toLocaleString('fr-FR')} FCFA (${category || 'autre'}) enregistrée${description ? ` : ${description}` : ''}.`,
        read_at: null,
      })
    } catch (_) {}

    return { success: true }
  } catch (err: any) {
    console.error('[createDepenseAction Exception]', err)
    return { success: false, error: { _global: err?.message || 'Erreur inattendue lors de la création de la dépense' } }
  }
}

export async function updateDepenseAction(depenseId: string, formData: unknown) {
  try {
    const parsed = depenseSchema.safeParse(formData)
    if (!parsed.success) return { success: false, error: parsed.error.flatten().fieldErrors }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: { _global: 'Non autorisé' } }

    const { data: userData } = (await supabase.from('users').select('company_id').eq('id', user.id).single()) as any

    const {
      category,
      amount_fcfa,
      date,
      description,
      trip_id,
      truck_id,
      receipt_url,
      receipt_size,
      is_reimbursed,
    } = parsed.data

    const payload: Record<string, any> = {
      category: category || 'autre',
      amount_fcfa,
      date,
      description: description || null,
      trip_id: trip_id || null,
      truck_id: truck_id || null,
      receipt_url: receipt_url || null,
    }

    if (receipt_size !== undefined && receipt_size !== null) {
      payload.receipt_size = receipt_size
    }
    if (is_reimbursed !== undefined && is_reimbursed !== null) {
      payload.is_reimbursed = is_reimbursed
    }

    let { error } = await (supabase
      .from('expenses') as any)
      .update(payload)
      .eq('id', depenseId)
      .eq('company_id', userData?.company_id)

    if (error && error.message && (error.message.includes('is_reimbursed') || error.message.includes('receipt_size'))) {
      delete payload.is_reimbursed
      delete payload.receipt_size
      const retry = await (supabase
        .from('expenses') as any)
        .update(payload)
        .eq('id', depenseId)
        .eq('company_id', userData?.company_id)
      error = retry.error
    }

    if (error && error.message && error.message.includes('category')) {
      payload.category = 'autre'
      const retry = await (supabase
        .from('expenses') as any)
        .update(payload)
        .eq('id', depenseId)
        .eq('company_id', userData?.company_id)
      error = retry.error
    }

    if (error) {
      console.error('[updateDepenseAction DB Error]', error)
      return { success: false, error: { _global: error.message } }
    }

    if (trip_id) {
      await syncTripExpenses(supabase, trip_id)
    }

    await logAudit({
      userId: user.id,
      companyId: userData?.company_id ?? '',
      action: 'UPDATE_EXPENSE',
      resource: 'expenses',
      resourceId: depenseId,
    })

    return { success: true }
  } catch (err: any) {
    console.error('[updateDepenseAction Exception]', err)
    return { success: false, error: { _global: err?.message || 'Erreur inattendue lors de la modification de la dépense' } }
  }
}

export async function deleteDepenseAction(depenseId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Non autorisé' }

    const { data: userData } = (await supabase.from('users').select('company_id').eq('id', user.id).single()) as any

    const { data: existingExp } = await supabase
      .from('expenses')
      .select('trip_id')
      .eq('id', depenseId)
      .single()

    const { error } = await (supabase
      .from('expenses') as any)
      .delete()
      .eq('id', depenseId)
      .eq('company_id', userData?.company_id)

    if (error) return { success: false, error: error.message }

    if (existingExp?.trip_id) {
      await syncTripExpenses(supabase, existingExp.trip_id)
    }

    await logAudit({
      userId: user.id,
      companyId: userData?.company_id ?? '',
      action: 'DELETE_EXPENSE',
      resource: 'expenses',
      resourceId: depenseId,
    })

    return { success: true }
  } catch (err: any) {
    console.error('[deleteDepenseAction Exception]', err)
    return { success: false, error: err?.message || 'Erreur inattendue' }
  }
}

async function syncTripExpenses(supabase: any, tripId: string | null | undefined) {
  if (!tripId) return
  try {
    const { data: expList } = await supabase
      .from('expenses')
      .select('category, amount_fcfa')
      .eq('trip_id', tripId)

    const list = expList || []
    const fraisAllerExpenses = list.filter((e: any) => e.category === 'frais_aller')
    const fraisRetourExpenses = list.filter((e: any) => e.category === 'frais_retour')

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
      frais_aller_fcfa: fraisAllerExpenses.reduce((sum: number, e: any) => sum + Number(e.amount_fcfa || 0), 0),
      frais_retour_fcfa: fraisRetourExpenses.reduce((sum: number, e: any) => sum + Number(e.amount_fcfa || 0), 0),
    }

    await supabase
      .from('trips')
      .update(updatePayload)
      .eq('id', tripId)
  } catch (err) {
    console.error('[syncTripExpenses Error]', err)
  }
}

async function syncExpenseTotal(supabase: any, expenseId: string) {
  const { data: lines, error } = await supabase
    .from('expense_lines')
    .select('total_fcfa')
    .eq('expense_id', expenseId)

  if (error) return

  const total = Math.round((lines || []).reduce((sum: number, line: any) => sum + Number(line.total_fcfa || 0), 0))

  if (lines && lines.length > 0) {
    await (supabase.from('expenses') as any)
      .update({ amount_fcfa: total })
      .eq('id', expenseId)
  }
}

export async function createLigneDepenseAction(formData: unknown) {
  try {
    const parsed = ligneDepenseSchema.safeParse(formData)
    if (!parsed.success) return { success: false, error: parsed.error.flatten().fieldErrors }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: { _global: 'Non autorisé' } }

    const { data: userData } = (await supabase.from('users').select('company_id').eq('id', user.id).single()) as any

    const total_fcfa = parsed.data.quantity * parsed.data.unit_price_fcfa

    const { data: lineData, error } = (await supabase
      .from('expense_lines')
      .insert({ ...parsed.data, total_fcfa } as any)
      .select('id')
      .single()) as any

    if (error) return { success: false, error: { _global: error.message } }

    await syncExpenseTotal(supabase, parsed.data.expense_id)

    await logAudit({
      userId: user.id,
      companyId: userData?.company_id ?? '',
      action: 'CREATE_EXPENSE_LINE',
      resource: 'expense_lines',
      resourceId: lineData?.id,
    })

    return { success: true }
  } catch (err: any) {
    return { success: false, error: { _global: err?.message || 'Erreur inattendue' } }
  }
}

export async function updateLigneDepenseAction(lineId: string, formData: unknown) {
  try {
    const parsed = ligneDepenseSchema.safeParse(formData)
    if (!parsed.success) return { success: false, error: parsed.error.flatten().fieldErrors }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: { _global: 'Non autorisé' } }

    const { data: userData } = (await supabase.from('users').select('company_id').eq('id', user.id).single()) as any

    const total_fcfa = parsed.data.quantity * parsed.data.unit_price_fcfa

    const { error } = await (supabase
      .from('expense_lines') as any)
      .update({ ...parsed.data, total_fcfa })
      .eq('id', lineId)

    if (error) return { success: false, error: { _global: error.message } }

    await syncExpenseTotal(supabase, parsed.data.expense_id)

    await logAudit({
      userId: user.id,
      companyId: userData?.company_id ?? '',
      action: 'UPDATE_EXPENSE_LINE',
      resource: 'expense_lines',
      resourceId: lineId,
    })

    return { success: true }
  } catch (err: any) {
    return { success: false, error: { _global: err?.message || 'Erreur inattendue' } }
  }
}

export async function deleteLigneDepenseAction(lineId: string, expenseId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Non autorisé' }

    const { data: userData } = (await supabase.from('users').select('company_id').eq('id', user.id).single()) as any

    const { error } = await (supabase
      .from('expense_lines') as any)
      .delete()
      .eq('id', lineId)

    if (error) return { success: false, error: error.message }

    await syncExpenseTotal(supabase, expenseId)

    await logAudit({
      userId: user.id,
      companyId: userData?.company_id ?? '',
      action: 'DELETE_EXPENSE_LINE',
      resource: 'expenses',
      resourceId: lineId,
    })

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erreur inattendue' }
  }
}
