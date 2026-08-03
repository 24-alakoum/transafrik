export const CONTAINER_STATUSES = {
  en_cours: { label: 'En cours', color: 'warning' },
  livre: { label: 'Livré', color: 'info' },
  vide: { label: 'Vide', color: 'success' },
  retourne: { label: 'Retourné', color: 'default' },
} as const

export type ContainerStatus = keyof typeof CONTAINER_STATUSES

export const CONTAINER_STATUS_FLOW: Record<ContainerStatus, ContainerStatus | null> = {
  en_cours: 'livre',
  livre: 'vide',
  vide: 'retourne',
  retourne: null,
}
