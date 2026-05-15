import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit'
import { ALLOWED_DOCUMENT_TYPES, MAX_FILE_SIZE_BYTES } from '@/lib/constants'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { data: userData } = await supabase.from('users').select('company_id').eq('id', user.id).single()
    const companyId = userData?.company_id

    if (!companyId) {
      return NextResponse.json({ error: 'Compagnie introuvable' }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const bucket = formData.get('bucket') as string || 'receipts'

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    // Validation Serveur (MIME et Taille)
    if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Type de fichier non supporté' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: 'Fichier trop volumineux' }, { status: 400 })
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${companyId}/${crypto.randomUUID()}.${fileExt}`

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('[Upload Error]', error)
      return NextResponse.json({ error: "Erreur lors du stockage du fichier" }, { status: 500 })
    }

    // Récupérer le chemin complet pour pouvoir générer une URL signée plus tard
    // Note: Pour un bucket privé, on stocke le path, pas l'URL publique
    const filePath = data.path

    await logAudit({
      userId: user.id,
      companyId,
      action: 'UPLOAD_FILE',
      resource: 'storage',
      newData: { bucket, filePath, size: file.size }
    })

    return NextResponse.json({ url: filePath, size: file.size })
  } catch (error) {
    console.error('[Upload API Exception]', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
