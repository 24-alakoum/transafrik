import { z } from 'zod'

export const affectationSchema = z.object({
  driver_id: z.string().uuid('ID chauffeur invalide'),
  truck_id: z.string().uuid('ID camion invalide'),
  start_date: z.string().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
})

export type AffectationInput = z.infer<typeof affectationSchema>