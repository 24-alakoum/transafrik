import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isAfter, addDays } from 'date-fns'
import { fr } from 'date-fns/locale'

// ── Tailwind class merge ─────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Formatage FCFA ───────────────────────────────────
/**
 * Formate un montant en FCFA avec séparateurs de milliers.
 * Ex: 1500000 → "1 500 000 FCFA"
 */
export function formatFCFA(
  amount: number | null | undefined,
  options?: { compact?: boolean; showCurrency?: boolean }
): string {
  if (amount === null || amount === undefined) return '0 FCFA'

  const { compact = false, showCurrency = true } = options ?? {}

  if (compact && Math.abs(amount) >= 1_000_000) {
    const millions = amount / 1_000_000
    return `${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M${showCurrency ? ' FCFA' : ''}`
  }

  if (compact && Math.abs(amount) >= 1_000) {
    const thousands = amount / 1_000
    return `${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)}k${showCurrency ? ' FCFA' : ''}`
  }

  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)

  return showCurrency ? `${formatted} FCFA` : formatted
}

// ── Formatage dates ──────────────────────────────────
/**
 * Formate une date en format lisible français.
 * Ex: "15 mai 2025"
 */
export function formatDate(
  date: string | Date | null | undefined,
  fmt: string = 'd MMM yyyy'
): string {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' ? new Date(date) : date
    return format(d, fmt, { locale: fr })
  } catch {
    return '—'
  }
}

/**
 * Formate une date en relatif.
 * Ex: "il y a 3 jours"
 */
export function formatDateRelative(date: string | Date | null | undefined): string {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' ? new Date(date) : date
    return formatDistanceToNow(d, { locale: fr, addSuffix: true })
  } catch {
    return '—'
  }
}

/**
 * Formate pour les inputs de type date (YYYY-MM-DD).
 */
export function formatDateInput(date: string | Date | null | undefined): string {
  if (!date) return ''
  try {
    const d = typeof date === 'string' ? new Date(date) : date
    return format(d, 'yyyy-MM-dd')
  } catch {
    return ''
  }
}

// ── Vérification expiration ──────────────────────────
/**
 * Vérifie si une date est dans les N jours à venir.
 * Utilisé pour alertes permis/assurance.
 */
export function isExpiringSoon(
  date: string | Date | null | undefined,
  withinDays: number = 30
): boolean {
  if (!date) return false
  try {
    const d = typeof date === 'string' ? new Date(date) : date
    const threshold = addDays(new Date(), withinDays)
    return isAfter(threshold, d) && isAfter(d, new Date())
  } catch {
    return false
  }
}

export function isExpired(date: string | Date | null | undefined): boolean {
  if (!date) return false
  try {
    const d = typeof date === 'string' ? new Date(date) : date
    return isAfter(new Date(), d)
  } catch {
    return false
  }
}

// ── Génération de référence ──────────────────────────
/**
 * Génère une référence unique pour voyages/bons.
 * Format : {PREFIX}-{YYYY}-{counter padded 4}
 * Ex: "BL-2025-0042"
 */
export function generateReference(
  prefix: string = 'REF',
  counter: number = 1,
  year?: number
): string {
  const y = year ?? new Date().getFullYear()
  const c = String(counter).padStart(4, '0')
  return `${prefix}-${y}-${c}`
}

// ── Utilitaires divers ───────────────────────────────

/** Extrait les initiales d'un nom complet. Ex: "Modibo Keïta" → "MK" */
export function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('')
}

/** Tronque un texte avec ellipsis. */
export function truncate(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}

/** Génère une couleur HSL déterministe à partir d'une chaîne (pour avatars). */
export function stringToColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const h = Math.abs(hash) % 360
  return `hsl(${h}, 65%, 45%)`
}

/** Délai utilitaire. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Vérifie si une chaîne est un UUID valide. */
export function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
}

/** Calcule le pourcentage avec protection division par zéro. */
export function percentage(value: number, total: number): number {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

/** Sanitise un nom de fichier pour l'upload. */
export function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 100)
}
