import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  // Verify Cron secret to ensure only authorized caller (e.g. Vercel Cron) can trigger
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const supabaseAdmin = createAdminClient()
    const today = new Date().toISOString().split('T')[0]

    // Update all sent delivery notes that are past their due date to 'late'
    const { data, error } = await supabaseAdmin
      .from('delivery_notes')
      .update({ status: 'late' })
      .in('status', ['sent', 'viewed'])
      .lt('due_date', today)
      .select('id')

    if (error) throw error

    return NextResponse.json({ success: true, updatedCount: data?.length || 0 })
  } catch (error) {
    console.error('[CRON Update Bons]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
