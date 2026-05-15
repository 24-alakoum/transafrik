import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'
import { logAudit } from '@/lib/audit'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { id } = await params
    const { emailTemplate } = await request.json()

    const { data: bon } = await supabase
      .from('delivery_notes')
      .select('*, trips(clients(name, email))')
      .eq('id', id)
      .single()

    if (!bon || !bon.trips?.clients?.email) {
      return NextResponse.json({ error: "Client sans email ou bon introuvable" }, { status: 400 })
    }

    // L'envoi se fait via le composant lib/email (qui utilise Resend)
    // Ici nous simulons la template via text pour rester simple
    const subject = `Facture ${bon.reference} - TransAfrik`
    const html = `
      <h2>Bonjour ${bon.trips.clients.name},</h2>
      <p>Veuillez trouver ci-joint votre facture d'un montant de ${Number(bon.total_fcfa).toLocaleString()} FCFA.</p>
      <p>Vous pouvez la télécharger directement depuis votre espace ou via ce lien : <a href="${process.env.NEXT_PUBLIC_APP_URL}/api/bons/${bon.id}/pdf">Télécharger le PDF</a></p>
      <br>
      <p>Cordialement,<br>L'équipe TransAfrik</p>
    `

    const result = await sendEmail({
      to: bon.trips.clients.email,
      subject,
      html
    })

    if (!result.success) throw new Error("Erreur Resend")

    // Update status to 'sent'
    await supabase.from('delivery_notes').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', id)

    await logAudit({
      userId: user.id,
      companyId: bon.company_id,
      action: 'SEND_EMAIL',
      resource: 'delivery_notes',
      resource_id: bon.id,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de l'envoi" }, { status: 500 })
  }
}
