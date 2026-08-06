'use server'

import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit'
import { chauffeurSchema } from '@/lib/validations/chauffeur'
import { encrypt } from '@/lib/encryption'

export async function createChauffeurAction(formData: unknown) {
  try {
    const parsed = chauffeurSchema.safeParse(formData)
    if (!parsed.success) return { success: false, error: parsed.error.flatten().fieldErrors }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: { _global: 'Non autorisé' } }

    const { data: userData } = (await supabase.from('users').select('company_id').eq('id', user.id).single()) as any

    const {
      full_name,
      phone,
      email,
      address,
      city,
      country,
      license_number,
      license_categories,
      license_expiry,
      birth_date,
      national_id,
      monthly_salary,
      emergency_contact,
      status,
    } = parsed.data

    const encryptedLicense = license_number ? await encrypt(license_number) : null
    const encryptedNationalId = national_id ? await encrypt(national_id) : null

    const driverPayload: any = {
      company_id: userData?.company_id,
      full_name,
      phone: phone || null,
      email: email || null,
      address: address || null,
      city: city || null,
      country: country || null,
      license_number: encryptedLicense || null,
      license_categories: license_categories || null,
      license_expiry: license_expiry || null,
      birth_date: birth_date || null,
      national_id: encryptedNationalId || null,
      monthly_salary: monthly_salary || 0,
      emergency_contact: emergency_contact || null,
      status: status || 'available',
    }

    let { data: chauffeur, error } = (await supabase
      .from('drivers')
      .insert(driverPayload as any)
      .select('id')
      .single()) as any

    if (error && error.message?.includes('status')) {
      driverPayload.status = status === 'on_leave' ? 'leave' : 'available'
      const retry = (await supabase
        .from('drivers')
        .insert(driverPayload as any)
        .select('id')
        .single()) as any
      chauffeur = retry.data
      error = retry.error
    }

    if (error) {
      console.error('[createChauffeurAction error]', error)
      return { success: false, error: { _global: error.message } }
    }

    await logAudit({
      userId: user.id,
      companyId: userData?.company_id ?? '',
      action: 'CREATE_DRIVER',
      resource: 'drivers',
      resourceId: chauffeur?.id,
    })

    return { success: true }
  } catch (err: any) {
    console.error('[createChauffeurAction Exception]', err)
    return { success: false, error: { _global: err?.message || 'Erreur inattendue lors de la création du chauffeur' } }
  }
}

export async function deleteChauffeurAction(chauffeurId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Non autorisé' }

    const { data: userData } = (await supabase.from('users').select('company_id').eq('id', user.id).single()) as any

    const { error } = (await supabase
      .from('drivers')
      .delete()
      .eq('id', chauffeurId)
      .eq('company_id', userData?.company_id)) as any

    if (error) return { success: false, error: error.message }

    await logAudit({
      userId: user.id,
      companyId: userData?.company_id ?? '',
      action: 'DELETE_DRIVER',
      resource: 'drivers',
      resourceId: chauffeurId,
    })

    return { success: true }
  } catch (err: any) {
    console.error('[deleteChauffeurAction Exception]', err)
    return { success: false, error: err?.message || 'Erreur inattendue' }
  }
}

export async function updateChauffeurAction(chauffeurId: string, formData: unknown) {
  try {
    const parsed = chauffeurSchema.safeParse(formData)
    if (!parsed.success) return { success: false, error: parsed.error.flatten().fieldErrors }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: { _global: 'Non autorisé' } }

    const { data: userData } = (await supabase.from('users').select('company_id').eq('id', user.id).single()) as any

    const {
      full_name,
      phone,
      email,
      address,
      city,
      country,
      license_number,
      license_categories,
      license_expiry,
      birth_date,
      national_id,
      monthly_salary,
      emergency_contact,
      status,
    } = parsed.data

    const encryptedLicense = license_number ? await encrypt(license_number) : null
    const encryptedNationalId = national_id ? await encrypt(national_id) : null

    const updateData: any = {
      full_name,
      phone: phone || null,
      email: email || null,
      address: address || null,
      city: city || null,
      country: country || null,
      license_number: encryptedLicense || null,
      license_categories: license_categories || null,
      license_expiry: license_expiry || null,
      birth_date: birth_date || null,
      national_id: encryptedNationalId || null,
      monthly_salary: monthly_salary || 0,
      emergency_contact: emergency_contact || null,
      status: status || 'available',
    }

    let { error } = await (supabase
      .from('drivers') as any)
      .update(updateData)
      .eq('id', chauffeurId)
      .eq('company_id', userData?.company_id)

    if (error && error.message?.includes('status')) {
      updateData.status = status === 'on_leave' ? 'leave' : 'available'
      const retry = await (supabase
        .from('drivers') as any)
        .update(updateData)
        .eq('id', chauffeurId)
        .eq('company_id', userData?.company_id)
      error = retry.error
    }

    if (error) {
      console.error('[updateChauffeurAction error]', error)
      return { success: false, error: { _global: error.message } }
    }

    await logAudit({
      userId: user.id,
      companyId: userData?.company_id ?? '',
      action: 'UPDATE_DRIVER',
      resource: 'drivers',
      resourceId: chauffeurId,
    })

    return { success: true }
  } catch (err: any) {
    console.error('[updateChauffeurAction Exception]', err)
    return { success: false, error: { _global: err?.message || 'Erreur inattendue lors de la modification du chauffeur' } }
  }
}
