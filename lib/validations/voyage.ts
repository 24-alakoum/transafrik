import { z } from 'zod'

// ── Schéma voyage ────────────────────────────────────
export const voyageSchema = z.object({
  origin: z.string().min(2, 'Origine requise (min 2 caractères)'),
  destination: z.string().min(2, 'Destination requise (min 2 caractères)'),
  client_id: z.string().uuid('Client invalide').or(z.literal('')).optional().nullable().transform(val => val === '' ? null : val),
  truck_id: z.string().uuid('Camion invalide').or(z.literal('')).optional().nullable().transform(val => val === '' ? null : val),
  driver_id: z.string().uuid('Chauffeur invalide').or(z.literal('')).optional().nullable().transform(val => val === '' ? null : val),
  cargo_type: z.string().optional().nullable(),
  cargo_weight_kg: z.coerce
    .number()
    .min(0, 'Poids invalide')
    .optional()
    .nullable(),
  cargo_desc: z.string().max(500).optional().nullable(),
  departure_date: z.string().optional().nullable().transform(val => val === '' ? null : val),
  port_arrival_date: z.string().optional().nullable().transform(val => val === '' ? null : val),
  port_departure_date: z.string().optional().nullable().transform(val => val === '' ? null : val),
  arrival_date: z.string().optional().nullable().transform(val => val === '' ? null : val),
  aller_days: z.coerce.number().min(0).optional().nullable(),
  retour_days: z.coerce.number().min(0).optional().nullable(),
  revenue_fcfa: z.coerce
    .number()
    .min(0, 'Montant invalide')
    .default(0),
  frais_aller_fcfa: z.coerce
    .number()
    .min(0, 'Montant invalide')
    .default(0)
    .optional(),
  frais_retour_fcfa: z.coerce
    .number()
    .min(0, 'Montant invalide')
    .default(0)
    .optional(),
  status: z
    .enum(['draft', 'loading', 'in_transit', 'delivered', 'cancelled', 'disputed'])
    .default('draft'),
  notes: z.string().max(1000).optional().nullable(),
})

export type VoyageInput = z.infer<typeof voyageSchema>

// ── Schéma ligne de voyage ───────────────────────────
export const tripLineSchema = z.object({
  description: z.string().min(1, 'Description requise'),
  quantity: z.coerce.number().positive('Quantité doit être positive').default(1),
  unit: z.string().default('unité'),
  unit_price_fcfa: z.coerce.number().min(0, 'Prix invalide').default(0),
  sort_order: z.number().default(0),
})

export type TripLineInput = z.infer<typeof tripLineSchema>
