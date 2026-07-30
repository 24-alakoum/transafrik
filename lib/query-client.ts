'use client'

import { QueryClient } from '@tanstack/react-query'

// Singleton pour éviter la recréation du client entre les renders
let browserQueryClient: QueryClient | undefined = undefined

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Données fraîches pendant 60 secondes → pas de refetch inutile pendant la navigation
        staleTime: 60 * 1000,
        // Cache conservé 5 minutes après unmount
        gcTime: 5 * 60 * 1000,
        // Retry limité pour éviter les cascades d'erreurs
        retry: 1,
        // Refetch en arrière-plan quand la fenêtre reprend le focus
        refetchOnWindowFocus: true,
        // Refetch lors de la reconnexion réseau
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 0,
      },
    },
  })
}

export function getQueryClient() {
  if (typeof window === 'undefined') {
    // Côté serveur → toujours un nouveau client
    return makeQueryClient()
  }
  // Côté client → réutiliser le singleton
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient()
  }
  return browserQueryClient
}
