'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Edit, Trash2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { updateVoyageStatusAction, deleteVoyageAction } from '@/app/dashboard/voyages/actions'
import { queryKeys } from '@/lib/queries/keys'
import { TRIP_STATUSES } from '@/lib/constants'

interface VoyageHeaderActionsProps {
  tripId: string
  reference: string
  currentStatus: string
}

export function VoyageHeaderActions({ tripId, reference, currentStatus }: VoyageHeaderActionsProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isUpdatingStatus, startStatusTransition] = React.useTransition()
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [showDeleteModal, setShowDeleteModal] = React.useState(false)

  const handleStatusChange = (newStatus: string) => {
    startStatusTransition(async () => {
      const res = await updateVoyageStatusAction(tripId, newStatus)
      if (res.success) {
        toast.success(`Statut mis à jour : ${TRIP_STATUSES[newStatus as keyof typeof TRIP_STATUSES]?.label || newStatus}`)
        queryClient.invalidateQueries({ queryKey: queryKeys.voyages.all() })
        router.refresh()
      } else {
        toast.error(res.error || 'Erreur lors du changement de statut')
      }
    })
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    const res = await deleteVoyageAction(tripId)
    setIsDeleting(false)

    if (res.success) {
      toast.success('Voyage supprimé avec succès')
      queryClient.invalidateQueries({ queryKey: queryKeys.voyages.all() })
      router.push('/dashboard/voyages')
    } else {
      toast.error(res.error || 'Erreur lors de la suppression')
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link href="/dashboard/voyages">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Retour
        </Button>
      </Link>

      <div className="form-control">
        <select
          value={currentStatus}
          disabled={isUpdatingStatus}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="select select-sm select-bordered bg-bg-card border-border-base font-medium text-xs text-text-primary rounded-xl"
        >
          {Object.entries(TRIP_STATUSES).map(([key, val]) => (
            <option key={key} value={key}>
              {val.label}
            </option>
          ))}
        </select>
      </div>

      <Link href={`/dashboard/voyages/${tripId}/modifier`}>
        <Button variant="outline" size="sm">
          <Edit className="w-4 h-4 mr-1.5" />
          Modifier
        </Button>
      </Link>

      <Button
        variant="ghost"
        size="sm"
        className="text-danger hover:bg-danger/10 hover:text-danger"
        onClick={() => setShowDeleteModal(true)}
      >
        <Trash2 className="w-4 h-4" />
      </Button>

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
          Êtes-vous sûr de vouloir supprimer le voyage <strong className="text-text-primary">{reference}</strong> ?
          Cette action est irréversible.
        </p>
      </Modal>
    </div>
  )
}
