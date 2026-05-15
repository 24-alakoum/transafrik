'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit'
import { sendEmail } from '@/lib/email'

export async function inviteUserAction(email: string, role: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Non autorisé' }

    const { data: currentUser } = await supabase.from('users').select('company_id, role').eq('id', user.id).single()
    if (currentUser?.role !== 'owner' && currentUser?.role !== 'admin') {
      return { success: false, error: 'Droits insuffisants' }
    }

    const supabaseAdmin = createAdminClient()

    // Generate Supabase invite link
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email: email,
      options: {
        data: {
          company_id: currentUser.company_id,
          role: role
        }
      }
    })

    if (inviteError) throw inviteError

    // L'URL générée redirige vers notre callback qui redirigera vers un formulaire pour le mot de passe
    // Mais on envoie notre propre email via Resend
    const html = `
      <div style="font-family: sans-serif; color: #333;">
        <h2 style="color: #4361EE;">Invitation à rejoindre TransAfrik</h2>
        <p>Vous avez été invité à rejoindre votre entreprise sur TransAfrik.</p>
        <p>Cliquez sur le lien ci-dessous pour accepter l'invitation et définir votre mot de passe (le lien est valide 24h) :</p>
        <a href="${inviteData.properties?.action_link}" style="display: inline-block; padding: 10px 20px; background-color: #4361EE; color: #fff; text-decoration: none; border-radius: 5px; margin: 10px 0;">Accepter l'invitation</a>
      </div>
    `

    await sendEmail({
      to: email,
      subject: 'Invitation - TransAfrik',
      html
    })

    await logAudit({
      userId: user.id,
      companyId: currentUser.company_id,
      action: 'INVITE_USER',
      resource: 'users',
      newData: { email, role }
    })

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Erreur inattendue' }
  }
}

export async function updateUserRoleAction(userId: string, newRole: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Non autorisé' }

    const { data: currentUser } = await supabase.from('users').select('company_id, role').eq('id', user.id).single()
    if (currentUser?.role !== 'owner') {
      return { success: false, error: 'Seul le propriétaire peut changer les rôles' }
    }

    const { error } = await supabase.from('users').update({ role: newRole }).eq('id', userId)
    if (error) throw error

    await logAudit({
      userId: user.id,
      companyId: currentUser.company_id,
      action: 'CHANGE_ROLE',
      resource: 'users',
      resource_id: userId,
      newData: { role: newRole }
    })

    return { success: true }
  } catch (err) {
    return { success: false, error: 'Erreur inattendue' }
  }
}

export async function deactivateUserAction(userId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Non autorisé' }

    const { data: currentUser } = await supabase.from('users').select('company_id, role').eq('id', user.id).single()
    if (currentUser?.role !== 'owner' && currentUser?.role !== 'admin') {
      return { success: false, error: 'Droits insuffisants' }
    }

    // Soft delete
    const { error } = await supabase.from('users').update({ is_active: false }).eq('id', userId)
    if (error) throw error

    await logAudit({
      userId: user.id,
      companyId: currentUser.company_id,
      action: 'DEACTIVATE_USER',
      resource: 'users',
      resource_id: userId,
    })

    return { success: true }
  } catch (err) {
    return { success: false, error: 'Erreur inattendue' }
  }
}
