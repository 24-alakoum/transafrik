import { z } from 'zod'

export const ligneDepenseSchema = z.object({
  expense_id: z.string().uuid('ID de dépense invalide'),
  description: z.string().min(1, 'La description est requise').max(200),
  quantity: z.coerce.number().positive('La quantité doit être positive').default(1),
  unit: z.string().default('unité'),
  unit_price_fcfa: z.coerce.number().min(0, 'Le prix unitaire doit être positif'),
  total_fcfa: z.coerce.number().optional().nullable(),
  sort_order: z.coerce.number().int().optional().nullable(),
})

export type LigneDepenseInput = z.infer<typeof ligneDepenseSchema>
