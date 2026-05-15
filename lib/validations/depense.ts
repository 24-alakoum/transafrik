import { z } from 'zod'

export const depenseSchema = z.object({
  category: z
    .enum(['carburant', 'maintenance', 'peage', 'salaire', 'assurance', 'amende', 'parking', 'autre'])
    .default('autre'),
  amount_fcfa: z.coerce
    .number()
    .positive('Le montant doit être supérieur à 0'),
  date: z.string().min(1, 'La date est requise'),
  description: z.string().max(500).optional().nullable(),
  trip_id: z.string().uuid().optional().nullable(),
  truck_id: z.string().uuid().optional().nullable(),
  is_reimbursed: z.boolean().default(false),
  receipt_url: z.string().url().optional().nullable(),
  receipt_size: z.number().int().positive().optional().nullable(),
})

export type DepenseInput = z.infer<typeof depenseSchema>
