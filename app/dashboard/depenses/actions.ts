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

    const { data: depenseData, error } = (await supabase
      .from('expenses')
      .insert({ ...parsed.data, company_id: userData?.company_id } as any)
      .select('id')
      .single()) as any

    if (error) {
      return { success: false, error: { _global: error.message } }
    }

    await logAudit({
      userId: user.id,
      companyId: userData?.company_id ?? '',
      action: 'CREATE_EXPENSE',
      resource: 'expenses',
      resourceId: depenseData?.id,
    })

    return { success: true }
  } catch (err) {
    return { success: false, error: { _global: 'Erreur inattendue' } }
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

    const { error } = await (supabase
      .from('expenses') as any)
      .update(parsed.data)
      .eq('id', depenseId)
      .eq('company_id', userData?.company_id)

    if (error) return { success: false, error: { _global: error.message } }

    await logAudit({
      userId: user.id,
      companyId: userData?.company_id ?? '',
      action: 'UPDATE_EXPENSE',
      resource: 'expenses',
      resourceId: depenseId,
    })

    return { success: true }
  } catch (err) {
    return { success: false, error: { _global: 'Erreur inattendue' } }
  }
}

export async function deleteDepenseAction(depenseId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Non autorisé' }

    const { data: userData } = (await supabase.from('users').select('company_id').eq('id', user.id).single()) as any

    const { error } = await (supabase
      .from('expenses') as any)
      .delete()
      .eq('id', depenseId)
      .eq('company_id', userData?.company_id)

    if (error) return { success: false, error: error.message }

    await logAudit({
      userId: user.id,
      companyId: userData?.company_id ?? '',
      action: 'DELETE_EXPENSE',
      resource: 'expenses',
      resourceId: depenseId,
    })

    return { success: true }
  } catch (err) {
    return { success: false, error: 'Erreur inattendue' }
  }
}

async function syncExpenseTotal(supabase: any, expenseId: string) {
  const { data: lines, error } = await supabase
    .from('expense_lines')
    .select('total_fcfa')
    .eq('expense_id', expenseId)

  if (error) return

  const total = (lines || []).reduce((sum: number, line: any) => sum + Number(line.total_fcfa || 0), 0)

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
  } catch (err) {
    return { success: false, error: { _global: 'Erreur inattendue' } }
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
  } catch (err) {
    return { success: false, error: { _global: 'Erreur inattendue' } }
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
      resource: 'expense_lines',
      resourceId: lineId,
    })

    return { success: true }
  } catch (err) {
    return { success: false, error: 'Erreur inattendue' }
  }
}
