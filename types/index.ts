// ── Re-exports centralisés ───────────────────────────
export type { Database, Tables, TablesInsert, TablesUpdate } from './database'

// ── Types applicatifs ────────────────────────────────
import type { Tables } from './database'

export type Company = Tables<'companies'>
export type User = Tables<'users'>
export type Truck = Tables<'trucks'>
export type Driver = Tables<'drivers'>
export type Client = Tables<'clients'>
export type Trip = Tables<'trips'>
export type TripLine = Tables<'trip_lines'>
export type Expense = Tables<'expenses'>
export type DeliveryNote = Tables<'delivery_notes'>
export type Payment = Tables<'payments'>
export type AuditLog = Tables<'audit_logs'>
export type Notification = Tables<'notifications'>
export type ConsentRecord = Tables<'consent_records'>
export type DataRequest = Tables<'data_requests'>
export type Subscription = Tables<'subscriptions'>

// ── Types enrichis (avec jointures) ─────────────────
export type TripWithRelations = Trip & {
  client: Pick<Client, 'id' | 'name'> | null
  truck: Pick<Truck, 'id' | 'plate' | 'brand'> | null
  driver: Pick<Driver, 'id' | 'full_name'> | null
  trip_lines: TripLine[]
}

export type DriverWithTruck = Driver & {
  truck: Pick<Truck, 'id' | 'plate' | 'brand'> | null
}

export type DeliveryNoteWithTrip = DeliveryNote & {
  trip: Pick<Trip, 'id' | 'reference' | 'origin' | 'destination'> | null
}

// ── Types API response ───────────────────────────────
export type ApiSuccess<T = unknown> = {
  success: true
  data: T
  message?: string
}

export type ApiError = {
  success: false
  error: string | Record<string, string[]>
  code?: string
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError

// ── Types pour les Server Actions ───────────────────
export type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string | Record<string, string[]> }

// ── KPI Dashboard ───────────────────────────────────
export type DashboardKPIs = {
  activeTrucks: number
  totalTrucks: number
  monthlyRevenue: number
  monthlyExpenses: number
  netProfit: number
  activeTrips: number
  pendingBons: number
  overdueAmount: number
}

// ── Pagination ──────────────────────────────────────
export type PaginationParams = {
  page: number
  pageSize: number
}

export type PaginatedResult<T> = {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
