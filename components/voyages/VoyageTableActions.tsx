'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Eye, Edit, Trash2, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { deleteVoyageAction, updateVoyageStatusAction } from '@/app/dashboard/voyages/actions'
import { queryKeys } from '@/lib/queries/keys'
import { EditVoyageModal } from './EditVoyageModal'
import { TRIP_STATUSES } from '@/lib/constants'

interface VoyageTableActionsProps {
  trip: any
}

export function VoyageTableActions({ trip }: VoyageTableActionsProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [showEditModal, setShowEditModal] = React.useState(false)
  const [showDeleteModal, setShowDeleteModal] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [isChangingStatus, startStatusTransition] = React.useTransition()

  const handleDelete = async () => {
    setIsDeleting(true)
    const result = await deleteVoyageAction(trip.id)
    setIsDeleting(false)

    if (result.success) {
      toast.success('Voyage supprimé avec succès')
      setShowDeleteModal(false)
      queryClient.invalidateQueries({ queryKey: queryKeys.voyages.all() })
      router.refresh()
    } else {
      toast.error(result.error || 'Erreur lors de la suppression')
    }
  }

  const handleStatusChange = (newStatus: string) => {
    startStatusTransition(async () => {
      const res = await updateVoyageStatusAction(trip.id, newStatus)
      if (res.success) {
        toast.success(`Statut mis à jour : ${TRIP_STATUSES[newStatus as keyof typeof TRIP_STATUSES]?.label || newStatus}`)
        queryClient.invalidateQueries({ queryKey: queryKeys.voyages.all() })
        router.refresh()
      } else {
        toast.error(res.error || 'Erreur lors du changement de statut')
      }
    })
  }

  return (
    <div className="flex items-center justify-end gap-1">
      {/* Quick Status Selector */}
      <select
        value={trip.status}
        disabled={isChangingStatus}
        onChange={(e) => handleStatusChange(e.target.value)}
        className="select select-xs select-bordered bg-bg-surface border-border-base text-xs font-medium rounded-lg opacity-80 hover:opacity-100 transition-opacity"
        title="Changer le statut"
      >
        {Object.entries(TRIP_STATUSES).map(([key, val]) => (
          <option key={key} value={key}>
            {val.label}
          </option>
        ))}
      </select>

      {/* Voir details */}
      <Link href={`/dashboard/voyages/${trip.id}`}>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-text-secondary hover:text-accent" title="Consulter">
          <Eye className="w-4 h-4" />
        </Button>
      </Link>

      {/* Quick Edit modal */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-text-secondary hover:text-text-primary"
        title="Modifier"
        onClick={() => setShowEditModal(true)}
      >
        <Edit className="w-4 h-4" />
      </Button>

      {/* Supprimer */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-text-muted hover:text-danger hover:bg-danger/10"
        title="Supprimer"
        onClick={() => setShowDeleteModal(true)}
      >
        <Trash2 className="w-4 h-4" />
      </Button>

      {/* Modal d'édition */}
      <EditVoyageModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        trip={trip}
      />

      {/* Modal de confirmation de suppression */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Supprimer le voyage"
        footer={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
              Annuler
            </Button>
            <Button
              variant="outline"
              className="bg-danger/10 text-danger border-danger/30 hover:bg-danger/20"
              isLoading={isDeleting}
              onClick={handleDelete}
            >
              Confirmer la suppression
            </Button>
          </div>
        }
      >
        <p className="text-text-secondary text-sm">
          Êtes-vous sûr de vouloir supprimer le voyage <strong className="text-text-primary">{trip.reference}</strong> ({trip.origin} → {trip.destination}) ?
          Cette action est irréversible.
        </p>
      </Modal>
    </div>
  )
}
