import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendEmailParams {
  to: string | string[]
  subject: string
  react?: React.ReactElement | React.ReactNode | null
  html?: string
  text?: string
}

/**
 * Service centralisé d'envoi d'emails via Resend.
 * Supporte le rendu de composants React, HTML brut ou texte.
 */
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
