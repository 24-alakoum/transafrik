// ── Statuts voyages ──────────────────────────────────
export const TRIP_STATUSES = {
  draft: { label: 'Brouillon', color: 'badge-draft' },
  loading: { label: 'Chargement', color: 'badge-maintenance' },
  in_transit: { label: 'En transit', color: 'badge-transit' },
  delivered: { label: 'Livré', color: 'badge-delivered' },
  cancelled: { label: 'Annulé', color: 'badge-cancelled' },
  disputed: { label: 'Litigieux', color: 'badge-late' },
} as const

export type TripStatus = keyof typeof TRIP_STATUSES

// ── Statuts camions ──────────────────────────────────
export const TRUCK_STATUSES = {
  available: { label: 'Disponible', color: 'badge-delivered' },
  in_transit: { label: 'En transit', color: 'badge-transit' },
  loading: { label: 'Chargement', color: 'badge-maintenance' },
  maintenance: { label: 'Maintenance', color: 'badge-late' },
  inactive: { label: 'Inactif', color: 'badge-cancelled' },
} as const

export type TruckStatus = keyof typeof TRUCK_STATUSES

// ── Statuts chauffeurs ───────────────────────────────
export const DRIVER_STATUSES = {
  available: { label: 'Disponible', color: 'badge-delivered' },
  on_trip: { label: 'En voyage', color: 'badge-transit' },
  leave: { label: 'Congé', color: 'badge-maintenance' },
  inactive: { label: 'Parti(e)', color: 'badge-cancelled' },
} as const

export type DriverStatus = keyof typeof DRIVER_STATUSES

// ── Statuts bons de livraison ────────────────────────
export const BON_STATUSES = {
  draft: { label: 'Brouillon', color: 'badge-draft' },
  sent: { label: 'Envoyé', color: 'badge-transit' },
  viewed: { label: 'Vu', color: 'badge-maintenance' },
  paid: { label: 'Payé', color: 'badge-paid' },
  late: { label: 'En retard', color: 'badge-late' },
  cancelled: { label: 'Annulé', color: 'badge-cancelled' },
  disputed: { label: 'Litigieux', color: 'badge-late' },
} as const

export type BonStatus = keyof typeof BON_STATUSES

// ── Catégories dépenses ──────────────────────────────
export const EXPENSE_CATEGORIES = {
  carburant: { label: 'Carburant', icon: 'Fuel' },
  maintenance: { label: 'Maintenance', icon: 'Wrench' },
  peage: { label: 'Péage', icon: 'SquareMenu' },
  salaire: { label: 'Salaire', icon: 'Wallet' },
  assurance: { label: 'Assurance', icon: 'Shield' },
  amende: { label: 'Amende', icon: 'AlertTriangle' },
  parking: { label: 'Parking', icon: 'ParkingSquare' },
  frais_aller: { label: 'Frais Aller', icon: 'ArrowRight' },
  frais_retour: { label: 'Frais Retour', icon: 'ArrowLeft' },
  autre: { label: 'Autre', icon: 'MoreHorizontal' },
} as const

export type ExpenseCategory = keyof typeof EXPENSE_CATEGORIES

// ── Rôles utilisateurs ───────────────────────────────
export const USER_ROLES = {
  owner: { label: 'Propriétaire', level: 5 },
  admin: { label: 'Administrateur', level: 4 },
  manager: { label: 'Gestionnaire', level: 3.5 },
  secretary: { label: 'Secrétaire', level: 3 },
  driver: { label: 'Chauffeur', level: 2.5 },
  dispatcher: { label: 'Dispatcher', level: 2.25 },
  accountant: { label: 'Comptable', level: 2 },
  viewer: { label: 'Lecteur', level: 1 },
} as const

export type UserRole = keyof typeof USER_ROLES

export const PERMISSION_MAP = {
  canManageBilling: ['owner'],
  canManageUsers: ['owner', 'admin'],
  canDeleteCompany: ['owner'],
  canViewTracking: ['owner', 'admin', 'manager', 'secretary', 'driver'],
  canManageTrips: ['owner', 'admin', 'manager', 'secretary', 'dispatcher'],
  canManageExpenses: ['owner', 'admin', 'manager', 'secretary', 'accountant', 'dispatcher'],
  canManageInvoices: ['owner', 'admin', 'accountant'],
} as const

// ── Pays couverts ────────────────────────────────────
export const COUNTRIES = [
  { code: 'ML', name: 'Mali', flag: '🇲🇱' },
  { code: 'SN', name: 'Sénégal', flag: '🇸🇳' },
  { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮' },
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫' },
  { code: 'NE', name: 'Niger', flag: '🇳🇪' },
  { code: 'GN', name: 'Guinée', flag: '🇬🇳' },
  { code: 'TG', name: 'Togo', flag: '🇹🇬' },
  { code: 'BJ', name: 'Bénin', flag: '🇧🇯' },
  { code: 'CM', name: 'Cameroun', flag: '🇨🇲' },
  { code: 'GA', name: 'Gabon', flag: '🇬🇦' },
] as const

export type CountryCode = (typeof COUNTRIES)[number]['code']

// ── Types de camions ─────────────────────────────────
export const TRUCK_TYPES = [
  { value: 'camion', label: 'Camion' },
  { value: 'camionnette', label: 'Camionnette' },
  { value: 'remorque', label: 'Remorque' },
  { value: 'tracteur', label: 'Tracteur' },
  { value: 'pickup', label: 'Pick-up' },
] as const

// ── Types de carburant ───────────────────────────────
export const FUEL_TYPES = [
  { value: 'diesel', label: 'Diesel' },
  { value: 'essence', label: 'Essence' },
  { value: 'hybride', label: 'Hybride' },
  { value: 'electrique', label: 'Électrique' },
] as const

// ── Méthodes de paiement ─────────────────────────────
export const PAYMENT_METHODS = [
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'virement', label: 'Virement bancaire' },
  { value: 'especes', label: 'Espèces' },
  { value: 'cheque', label: 'Chèque' },
  { value: 'autre', label: 'Autre' },
] as const

// ── Délais de paiement ───────────────────────────────
export const PAYMENT_TERMS = [7, 15, 30, 45, 60, 90] as const

// ── Plans d'abonnement ───────────────────────────────
export const PLANS = {
  trial: { label: 'Essai gratuit', price: 0, duration: 14, maxTrucks: 2 },
  starter: { label: 'Starter', price: 15000, maxTrucks: 5 },
  pro: { label: 'Pro', price: 35000, maxTrucks: 20 },
  enterprise: { label: 'Enterprise', price: 75000, maxTrucks: 999 },
} as const

export type Plan = keyof typeof PLANS

// ── Catégories de cargo ──────────────────────────────
export const CARGO_TYPES = [
  'Marchandises générales',
  'Matériaux de construction',
  'Produits alimentaires',
  'Hydrocarbures',
  'Matériel agricole',
  'Bétail',
  'Produits industriels',
  'Équipements',
  'Conteneurs',
  'Autre',
]

// ── Constantes application ───────────────────────────
export const APP_NAME = 'TransAfrik'
export const APP_DESCRIPTION = 'Gestion de transport et logistique pour entrepreneurs africains'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
export const CURRENCY = 'FCFA'
export const DEFAULT_PAGE_SIZE = 20
export const MAX_FILE_SIZE_MB = 10
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf', ...ALLOWED_IMAGE_TYPES]
