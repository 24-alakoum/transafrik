import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { EditClientForm } from './EditClientForm'

export default async function EditerClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const supabase = await createClient()
  const { data: client } = (await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()) as any

  if (!client) {
    notFound()
  }

  return <EditClientForm initialData={client} clientId={id} />
}
