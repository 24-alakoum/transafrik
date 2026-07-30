import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ExpenseDetailsClient } from './ExpenseDetailsClient'

export default async function ExpenseDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch expense with its lines
  const { data: expense } = (await supabase
    .from('expenses')
    .select(`
      *,
      trips (id, reference),
      trucks (id, plate),
      expense_lines (*)
    `)
    .eq('id', id)
    .single()) as any

  if (!expense) notFound()

  // Sort expense_lines if present
  const lines = expense.expense_lines ? [...expense.expense_lines].sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)) : []

  return <ExpenseDetailsClient expense={expense} initialLines={lines} />
}
