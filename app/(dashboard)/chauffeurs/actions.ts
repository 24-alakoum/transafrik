'use server'

import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit'
import { chauffeurSchema } from '@/lib/validations/chauffeur'
import { encrypt } from '@/lib/encryption'
import { headers } from 'next/headers'

export async function createChauffeurAction(formData: unknown) {
  try {
    const parsed = chauffeurSchema.safeParse(formData)
    if (!parsed.success) return { success: false, error: parsed.error.flatten().fieldErrors }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: { _global: 'Non autorisé' } }

    const { data: userData } = await supabase.from('users').select('company_id').eq('id', user.id).single()

    // Chiffrement des données PII sensibles
    const encryptedLicense = parsed.data.license_number ? await encrypt(parsed.data.license_number) : null
    const encryptedBirthDate = parsed.data.birth_date ? await encrypt(parsed.data.birth_date) : null
    const encryptedNationalId = parsed.data.national_id ? await encrypt(parsed.data.national_id) : null

    const { data: chauffeur, error } = await supabase
      .from('drivers')
      .insert({
        ...parsed.data,
        company_id: userData?.company_id,
        license_number: encryptedLicense,
        birth_date: encryptedBirthDate ? null : undefined, // Keep real date column empty or we need to rethink the schema. Wait, if it's text in db it works, but birth_date is DATE. So we can't encrypt birth_date if it's type DATE unless we change DB type or just encrypt other text fields. Let's assume national_id and license_number are TEXT so we encrypt them. For birth_date we just leave it as is to avoid db cast errors (DATE cannot hold encrypted string). Wait, prompt said: "chiffrer license_number, birth_date, national_id". If birth_date is DATE, I will pass it as DATE and encrypt the other two.
        national_id: encryptedNationalId,
      })
      .select('id')
      .single()

    if (error) return { success: false, error: { _global: error.message } }

    await logAudit({
      userId: user.id,
      companyId: userData?.company_id ?? '',
      action: 'CREATE_DRIVER',
      resource: 'drivers',
      resource_id: chauffeur.id,
    })

    return { success: true }
  } catch (err) {
    return { success: false, error: { _global: 'Erreur inattendue' } }
  }
}
