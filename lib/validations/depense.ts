import { z } from 'zod'

const ligneDepenseItemSchema = z.object({
  description: z.string().min(1, 'La description est requise'),
  quantity: z.coerce.number().min(0.01, 'La quantité doit être supérieure à 0').default(1),
  unit: z.string().default('unité'),
  unit_price_fcfa: z.coerce.number().min(0, 'Le prix unitaire doit être positif').default(0),
  sort_order: z.coerce.number().optional().default(0),
})

export const depenseSchema = z.object({
  category: z
    .enum(['carburant', 'maintenance', 'peage', 'salaire', 'assurance', 'amende', 'parking', 'frais_aller', 'frais_retour', 'frais_route', 'autre'])
    .default('autre'),
  amount_fcfa: z.coerce
    .number()
    .min(0, 'Le montant doit être supérieur ou égal à 0')
    .transform((val) => Math.round(val)),
  date: z.string().min(1, 'La date est requise'),
  description: z.string().max(500).optional().nullable().or(z.literal('')),
  trip_id: z.string().uuid('Voyage invalide').or(z.literal('')).optional().nullable().transform(val => !val ? null : val),
  truck_id: z.string().uuid('Camion invalide').or(z.literal('')).optional().nullable().transform(val => !val ? null : val),
  is_reimbursed: z.boolean().default(false).optional().nullable(),
  receipt_url: z.string().optional().nullable().or(z.literal('')).transform(val => !val ? null : val),
  receipt_size: z.coerce.number().int().positive().optional().nullable().or(z.literal('')).transform(val => !val ? null : val),
  lines: z.array(ligneDepenseItemSchema).optional().default([]),
})

export type DepenseInput = z.infer<typeof depenseSchema>


