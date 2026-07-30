import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { EditCamionForm } from './EditCamionForm'

export default async function EditerCamionPage({ params }: { params: { id: string } }) {
  // In Next.js 15, params is a Promise, so we must await it to get the id
  const { id } = await params
  
  const supabase = await createClient()
  const { data: camion } = await supabase
    .from('trucks')
    .select('*')
    .eq('id', id)
    .single()

  if (!camion) {
    notFound()
  }

  return <EditCamionForm initialData={camion} camionId={id} />
}
