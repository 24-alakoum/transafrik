/**
 * Clés de cache centralisées pour TanStack Query.
 * Utiliser ces constantes partout pour garantir la cohérence des invalidations.
 */
export const queryKeys = {
  dashboard: () => ['dashboard'] as const,

  voyages: {
    all: () => ['voyages'] as const,
    list: (filters: { page?: number; pageSize?: number; status?: string }) =>
      ['voyages', 'list', filters] as const,
    detail: (id: string) => ['voyages', 'detail', id] as const,
  },

  camions: {
    all: () => ['camions'] as const,
    list: (filters: { q?: string; status?: string; type?: string }) =>
      ['camions', 'list', filters] as const,
    detail: (id: string) => ['camions', 'detail', id] as const,
  },

  chauffeurs: {
    all: () => ['chauffeurs'] as const,
    list: (filters: { q?: string; status?: string }) =>
      ['chauffeurs', 'list', filters] as const,
    detail: (id: string) => ['chauffeurs', 'detail', id] as const,
  },

  clients: {
    all: () => ['clients'] as const,
    list: () => ['clients', 'list'] as const,
    detail: (id: string) => ['clients', 'detail', id] as const,
  },

  depenses: {
    all: () => ['depenses'] as const,
    list: () => ['depenses', 'list'] as const,
    detail: (id: string) => ['depenses', 'detail', id] as const,
  },

  bons: {
    all: () => ['bons'] as const,
    list: () => ['bons', 'list'] as const,
    detail: (id: string) => ['bons', 'detail', id] as const,
  },

  recettes: {
    all: () => ['recettes'] as const,
    list: () => ['recettes', 'list'] as const,
  },

  notifications: {
    all: () => ['notifications'] as const,
    list: () => ['notifications', 'list'] as const,
  },

  colis: {
    all: () => ['colis'] as const,
    list: (filters: { q?: string; status?: string }) => 
      ['colis', 'list', filters] as const,
    detail: (id: string) => ['colis', 'detail', id] as const,
  },
} as const
