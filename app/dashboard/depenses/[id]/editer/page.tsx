import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { EditDepenseForm } from './EditDepenseForm'

export default async function EditerDepensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const supabase = await createClient()
  const { data: depense } = (await supabase
    .from('expenses')
    .select('*')
    .eq('id', id)
    .single()) as any

  if (!depense) {
    notFound()
  }

  return <EditDepenseForm initialData={depense} depenseId={id} />
}
