import { useQuery } from '@tanstack/react-query'
import { queryKeys } from './keys'

// ─── Helpers fetch ───────────────────────────────────────────────────────────

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include' })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Erreur ${res.status}`)
  }
  return res.json()
}

function buildUrl(base: string, params: Record<string, string | number | undefined>) {
  const url = new URL(base, window.location.origin)
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') url.searchParams.set(k, String(v))
  })
  return url.toString()
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard(),
    queryFn: () => fetchJSON<{
      recentTrips: any[]
      totalTrips: number
      activeTrucks: number
      totalRevenue: number
      activeTrips: number
      chartData: { month: string; revenue: number; expenses: number }[]
    }>('/api/data/dashboard'),
    staleTime: 30 * 1000, // Dashboard : données fraîches 30 secondes
  })
}

// ─── Voyages ─────────────────────────────────────────────────────────────────

interface VoyagesFilters {
  [key: string]: any
  page?: number
  pageSize?: number
  status?: string
  q?: string
  search?: string
  sortField?: string
  sortOrder?: 'asc' | 'desc'
  clientId?: string
  truckId?: string
  driverId?: string
}

export function useVoyages(filters: VoyagesFilters = {}) {
  return useQuery({
    queryKey: queryKeys.voyages.list(filters),
    queryFn: () =>
      fetchJSON<{ data: any[]; count: number; totalPages: number }>(
        buildUrl('/api/data/voyages', filters)
      ),
    placeholderData: (prev) => prev,
  })
}

export function useVoyage(id: string) {
  return useQuery({
    queryKey: queryKeys.voyages.detail(id),
    queryFn: () => fetchJSON<{ data: any }>(`/api/data/voyages/${id}`),
    enabled: !!id,
  })
}


// ─── Camions ─────────────────────────────────────────────────────────────────

interface CamionsFilters {
  [key: string]: any
  q?: string
  status?: string
  type?: string
}

export function useCamions(filters: CamionsFilters = {}) {
  return useQuery({
    queryKey: queryKeys.camions.list(filters),
    queryFn: () =>
      fetchJSON<{ data: any[] }>(
        buildUrl('/api/data/camions', filters)
      ),
    placeholderData: (prev) => prev,
  })
}

// ─── Chauffeurs ──────────────────────────────────────────────────────────────

interface ChauffeursFilters {
  [key: string]: any
  q?: string
  status?: string
}

export function useChauffeurs(filters: ChauffeursFilters = {}) {
  return useQuery({
    queryKey: queryKeys.chauffeurs.list(filters),
    queryFn: () =>
      fetchJSON<{ data: any[] }>(
        buildUrl('/api/data/chauffeurs', filters)
      ),
    placeholderData: (prev) => prev,
  })
}

// ─── Clients ─────────────────────────────────────────────────────────────────

export function useClients() {
  return useQuery({
    queryKey: queryKeys.clients.list(),
    queryFn: () => fetchJSON<{ data: any[] }>('/api/data/clients'),
  })
}

// ─── Dépenses ────────────────────────────────────────────────────────────────

export function useDepenses() {
  return useQuery({
    queryKey: queryKeys.depenses.list(),
    queryFn: () => fetchJSON<{ data: any[] }>('/api/data/depenses'),
  })
}

// ─── Bons de livraison ───────────────────────────────────────────────────────

export function useBons() {
  return useQuery({
    queryKey: queryKeys.bons.list(),
    queryFn: () => fetchJSON<{ data: any[] }>('/api/data/bons'),
  })
}

// ─── Recettes ────────────────────────────────────────────────────────────────

export function useRecettes() {
  return useQuery({
    queryKey: queryKeys.recettes.list(),
    queryFn: () => fetchJSON<{ data: any[] }>('/api/data/recettes'),
  })
}

// ─── Notifications ───────────────────────────────────────────────────────────

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications.list(),
    queryFn: () => fetchJSON<{ data: any[] }>('/api/data/notifications'),
    // Rafraîchissement automatique toutes les 2 minutes
    refetchInterval: 2 * 60 * 1000,
    staleTime: 30 * 1000,
  })
}

// ─── Colis ───────────────────────────────────────────────────────────────────

interface ColisFilters {
  [key: string]: any
  q?: string
  status?: string
}

export function useColis(filters: ColisFilters = {}) {
  return useQuery({
    queryKey: queryKeys.colis.list(filters),
    queryFn: () =>
      fetchJSON<{ data: any[] }>(
        buildUrl('/api/data/colis', filters)
      ),
    placeholderData: (prev) => prev,
  })
}
