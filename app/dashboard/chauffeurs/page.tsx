'use client'

import * as React from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useChauffeurs } from '@/lib/queries/hooks'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { CardGridSkeleton } from '@/components/ui/Skeleton'
import { DRIVER_STATUSES } from '@/lib/constants'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queries/keys'
import { updateStatusChauffeurAction } from './actions'
import { toast } from 'sonner'

function DriverStatusSelect({ driverId, currentStatus }: { driverId: string; currentStatus: string }) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const [updating, setUpdating] = React.useState(false)

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value
    if (!newStatus || newStatus === currentStatus) return
    setUpdating(true)
    try {
      const res = await updateStatusChauffeurAction(driverId, newStatus)
      if (res.success) {
        toast.success('Statut chauffeur mis à jour')
        await queryClient.invalidateQueries({ queryKey: queryKeys.chauffeurs.all() })
        await queryClient.invalidateQueries({ queryKey: ['chauffeurs'] })
        router.refresh()
      } else {
        toast.error((res.error as any)?._global || 'Erreur de mise à jour')
      }
    } catch {
      toast.error('Erreur inattendue')
    } finally {
      setUpdating(false)
    }
  }

  const statusInfo = DRIVER_STATUSES[currentStatus as keyof typeof DRIVER_STATUSES] || { label: currentStatus || 'Inconnu', color: 'default' }

  return (
    <div className="relative inline-flex items-center">
      <select
        value={currentStatus}
        disabled={updating}
        onChange={handleStatusChange}
        className="bg-transparent text-[10px] font-semibold font-mono border border-border-base rounded px-1.5 py-0.5 text-text-primary cursor-pointer hover:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      >
        {Object.entries(DRIVER_STATUSES).map(([key, info]) => (
          <option key={key} value={key} className="bg-bg-card text-text-primary font-sans text-xs">
            {info.label}
          </option>
        ))}
      </select>
    </div>
  )
}
import { Plus, Phone, Mail, Search } from 'lucide-react'
import { ChauffeurCardActions } from './ChauffeurCardActions'

export default function ChauffeursPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const q = searchParams.get('q') || ''
  const statusFilter = searchParams.get('status') || ''

  const [localSearch, setLocalSearch] = React.useState(q)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data, isLoading, isFetching } = useChauffeurs({ q, status: statusFilter })
  const drivers = data?.data || []

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const handleSearch = (val: string) => {
    setLocalSearch(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setParam('q', val), 300)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-syne font-bold text-text-primary">Chauffeurs</h1>
          <p className="text-text-secondary mt-1">
            Gérez votre équipe de conducteurs.
            {isFetching && !isLoading && (
              <span className="ml-2 text-accent text-xs">Actualisation...</span>
            )}
          </p>
        </div>
        <Link href="/dashboard/chauffeurs/nouveau">
          <Button>
            <Plus className="w-4 h-4 mr-2" /> Ajouter un chauffeur
          </Button>
        </Link>
      </div>

      {/* Filtres inline */}
      <div className="bg-bg-card border border-border-base rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Nom, téléphone..."
            value={localSearch}
            onChange={e => handleSearch(e.target.value)}
            className="w-full bg-bg-surface border border-border-base rounded-lg pl-10 pr-4 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setParam('status', e.target.value)}
          className="select select-sm bg-bg-surface border-border-base text-sm rounded-lg"
        >
          <option value="">Tous les statuts</option>
          {Object.entries(DRIVER_STATUSES).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Cards */}
      {isLoading ? (
        <CardGridSkeleton count={8} />
      ) : drivers.length === 0 ? (
        <div className="col-span-full py-12 text-center text-text-muted bg-bg-card rounded-2xl border border-border-base">
          Aucun chauffeur trouvé.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {drivers.map((driver: any) => {
            const statusInfo = DRIVER_STATUSES[driver.status as keyof typeof DRIVER_STATUSES] || { label: driver.status || 'Inconnu', color: 'default' }
            return (
              <div key={driver.id} className="bg-bg-card rounded-2xl border border-border-base shadow-sm p-5 hover:border-border-active transition-colors group relative">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold text-lg shrink-0">
                      {driver.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-syne font-bold text-text-primary leading-tight">{driver.full_name}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <DriverStatusSelect driverId={driver.id} currentStatus={driver.status} />
                        {driver.trucks && (
                          <span className="text-[10px] text-text-secondary font-medium px-1.5 py-0.5 bg-bg-raised rounded">
                            {driver.trucks.plate}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="pl-2">
                    <ChauffeurCardActions chauffeurId={driver.id} />
                  </div>
                </div>

                <div className="space-y-3 mt-6">
                  <div className="flex items-center gap-3 text-sm text-text-secondary">
                    <Phone className="w-4 h-4 shrink-0" />
                    <span className="truncate">{driver.phone}</span>
                  </div>
                  {driver.email && (
                    <div className="flex items-center gap-3 text-sm text-text-secondary">
                      <Mail className="w-4 h-4 shrink-0" />
                      <span className="truncate">{driver.email}</span>
                    </div>
                  )}
                  {driver.emergency_contact && (
                    <div className="flex items-center gap-3 text-sm text-text-secondary">
                      <div className="w-4 h-4 shrink-0 bg-danger/10 text-danger rounded flex items-center justify-center font-bold text-[8px]">SOS</div>
                      <span className="truncate text-xs">{driver.emergency_contact}</span>
                    </div>
                  )}
                  <div className="pt-3 mt-3 border-t border-border-base flex justify-between text-sm">
                    <span className="text-text-secondary">Permis</span>
                    <span className="font-mono text-text-primary">{driver.license_number ? '••••' + driver.license_number.slice(-4) : '-'}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
