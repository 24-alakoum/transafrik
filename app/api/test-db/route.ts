import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Wait, anon key can't read information_schema usually, or maybe it can via RPC.
  // Instead, let's try inserting the 4 possible status values and see which ones fail!
  const testIds = []
  const results = {}

  const statusesToTest = [
    'en_cours', 'livre', 'vide', 'retourne',
    'En cours', 'Livré', 'Vide', 'Retourné',
    'en_attente', 'termine'
  ]

  for (const st of statusesToTest) {
    const { error } = await supabase.from('containers').insert({
      bl_id: '00000000-0000-0000-0000-000000000000', // invalid uuid but might hit check constraint first
      company_id: '00000000-0000-0000-0000-000000000000',
      container_number: 'TEST',
      status: st
    })
    results[st] = error ? error.message : 'Success?'
  }

  return NextResponse.json(results)
}
