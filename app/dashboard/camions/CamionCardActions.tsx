'use client'

import * as React from 'react'
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { deleteCamionAction } from './actions'
import Link from 'next/link'

interface CamionCardActionsProps {
  camionId: string
}

export function CamionCardActions({ camionId }: CamionCardActionsProps) {
  const router = useRouter()
  const [isDeleting, startTransition] = React.useTransition()

  const handleDelete = () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce camion ?')) {
      startTransition(async () => {
        const result = await deleteCamionAction(camionId)
        if (result.success) {
          toast.success('Camion supprimé avec succès')
        } else {
          toast.error(result.error || 'Erreur lors de la suppression')
        }
      })
    }
  }

  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="btn btn-ghost btn-xs btn-circle text-text-muted hover:text-text-primary">
        <MoreHorizontal className="w-4 h-4" />
      </div>
      <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-sm bg-bg-surface border border-border-base rounded-box w-40 mt-1">
        <li>
          <Link href={`/dashboard/camions/${camionId}/editer`} className="text-text-primary hover:bg-bg-raised flex items-center gap-2">
            <Edit className="w-4 h-4" />
            Modifier
          </Link>
        </li>
        <li>
          <button 
            onClick={handleDelete} 
            disabled={isDeleting}
            className="text-danger hover:bg-danger/10 hover:text-danger flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Supprimer
          </button>
        </li>
      </ul>
    </div>
  )
}
