import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendEmailParams {
  to: string | string[]
  subject: string
  react?: React.ReactElement | React.ReactNode | null
  html?: string
  text?: string
}

export async function sendEmail({ to, subject, react, html, text }: SendEmailParams) {
  try {
    const data = await resend.emails.send({
      from: 'TransAfrik <ne-pas-repondre@transafrik.app>',
      to,
      subject,
      react,
      html,
      text,
    })
    return { success: true, data }
  } catch (error) {
    console.error('[sendEmail]', error)
    return { success: false, error }
  }
}

// ── TEMPLATES ────────────────────────────────────────

export const emailTemplates = {
  // Relance de paiement (Client)
  paymentReminder: (clientName: string, bonRef: string, amount: number, pdfUrl: string) => `
    <div style="font-family: sans-serif; color: #333;">
      <h2 style="color: #4361EE;">Rappel de paiement</h2>
      <p>Bonjour ${clientName},</p>
      <p>Sauf erreur ou omission de notre part, la facture <strong>${bonRef}</strong> d'un montant de <strong>${amount.toLocaleString()} FCFA</strong> est arrivée à échéance.</p>
      <p>Vous pouvez consulter et télécharger votre facture via le lien suivant :</p>
      <a href="${pdfUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4361EE; color: #fff; text-decoration: none; border-radius: 5px; margin: 10px 0;">Voir la facture</a>
      <p>Si vous avez déjà procédé au règlement, veuillez ignorer ce message.</p>
      <p>Cordialement,<br>L'équipe TransAfrik</p>
    </div>
  `,

  // Envoi de bon / facture (Client)
  sendInvoice: (clientName: string, bonRef: string, amount: number, pdfUrl: string) => `
    <div style="font-family: sans-serif; color: #333;">
      <h2 style="color: #4361EE;">Votre facture TransAfrik</h2>
      <p>Bonjour ${clientName},</p>
      <p>Veuillez trouver ci-joint votre facture <strong>${bonRef}</strong> d'un montant de <strong>${amount.toLocaleString()} FCFA</strong>.</p>
      <a href="${pdfUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4361EE; color: #fff; text-decoration: none; border-radius: 5px; margin: 10px 0;">Télécharger la facture (PDF)</a>
      <p>Cordialement,<br>L'équipe TransAfrik</p>
    </div>
  `,

  // Bienvenue (Nouveau User)
  welcomeUser: (name: string, loginUrl: string) => `
    <div style="font-family: sans-serif; color: #333;">
      <h2 style="color: #4361EE;">Bienvenue sur TransAfrik !</h2>
      <p>Bonjour ${name},</p>
      <p>Votre compte a été créé avec succès. Vous pouvez dès maintenant gérer votre flotte et vos expéditions.</p>
      <a href="${loginUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4361EE; color: #fff; text-decoration: none; border-radius: 5px; margin: 10px 0;">Accéder au Dashboard</a>
      <p>L'équipe TransAfrik</p>
    </div>
  `,
}
