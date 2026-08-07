import { z } from 'zod'

export const depenseSchema = z.object({
  category: z
    .enum(['carburant', 'maintenance', 'peage', 'salaire', 'assurance', 'amende', 'parking', 'frais_aller', 'frais_retour', 'frais_route', 'autre'])
    .default('autre'),
  amount_fcfa: z.coerce
    .number()
    .positive('Le montant doit être supérieur à 0')
    .transform((val) => Math.round(val)),
  date: z.string().min(1, 'La date est requise'),
  description: z.string().max(500).optional().nullable().or(z.literal('')),
  trip_id: z.string().uuid('Voyage invalide').or(z.literal('')).optional().nullable().transform(val => !val ? null : val),
  truck_id: z.string().uuid('Camion invalide').or(z.literal('')).optional().nullable().transform(val => !val ? null : val),
  is_reimbursed: z.boolean().default(false).optional().nullable(),
  receipt_url: z.string().optional().nullable().or(z.literal('')).transform(val => !val ? null : val),
  receipt_size: z.coerce.number().int().positive().optional().nullable().or(z.literal('')).transform(val => !val ? null : val),
})

export type DepenseInput = z.infer<typeof depenseSchema>


