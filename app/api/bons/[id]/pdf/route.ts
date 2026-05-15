import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToStream } from '@react-pdf/renderer'
import { BonPDF } from '@/components/bons/BonPDF'
import { logAudit } from '@/lib/audit'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { id } = await params

    const { data: bon, error } = await supabase
      .from('delivery_notes')
      .select(`
        *,
        trips (
          reference, origin, destination, cargo_type, cargo_weight_kg,
          clients (name, address, phone, email),
          trip_lines (*)
        )
      `)
      .eq('id', id)
      .single()

    if (error || !bon) return NextResponse.json({ error: 'Bon introuvable' }, { status: 404 })

    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('id', bon.company_id)
      .single()

    const stream = await renderToStream(<BonPDF bon={bon} company={company} />)
    
    // We can directly stream the PDF to the client
    const headers = new Headers({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="Bon_${bon.reference}.pdf"`
    })

    await logAudit({
      userId: user.id,
      companyId: bon.company_id,
      action: 'GENERATE_PDF',
      resource: 'delivery_notes',
      resource_id: bon.id,
    })

    return new NextResponse(stream as any, { headers })
  } catch (error) {
    console.error('[PDF Generation Error]', error)
    return NextResponse.json({ error: 'Erreur génération PDF' }, { status: 500 })
  }
}
