'use client'

import * as React from 'react'
import { MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { deleteChauffeurAction } from './actions'
import Link from 'next/link'

interface ChauffeurCardActionsProps {
  chauffeurId: string
}

export function ChauffeurCardActions({ chauffeurId }: ChauffeurCardActionsProps) {
  const router = useRouter()
  const [isDeleting, startTransition] = React.useTransition()

  const handleDelete = () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce chauffeur ?')) {
      startTransition(async () => {
        const result = await deleteChauffeurAction(chauffeurId)
        if (result.success) {
          toast.success('Chauffeur supprimé avec succès')
          router.refresh()
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
          <Link href={`/dashboard/chauffeurs/${chauffeurId}`} className="text-text-primary hover:bg-bg-raised flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Voir
          </Link>
        </li>
        <li>
          <Link href={`/dashboard/chauffeurs/${chauffeurId}/editer`} className="text-text-primary hover:bg-bg-raised flex items-center gap-2">
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
