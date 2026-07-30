import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { decrypt } from '@/lib/encryption'
import { EditChauffeurForm } from './EditChauffeurForm'

export default async function EditChauffeurPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const supabase = await createClient()

  const { data: driver, error } = (await supabase
    .from('drivers')
    .select('*')
    .eq('id', resolvedParams.id)
    .single()) as any

  if (error || !driver) {
    notFound()
  }

  // Décryptage côté serveur
  const decryptedDriver = {
    ...driver,
    license_number: driver.license_number ? await decrypt(driver.license_number).catch(() => '') : '',
    national_id: driver.national_id ? await decrypt(driver.national_id).catch(() => '') : '',
  }

  return <EditChauffeurForm initialData={decryptedDriver} chauffeurId={resolvedParams.id} />
}
