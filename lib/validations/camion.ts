import { z } from 'zod'

export const camionSchema = z.object({
  plate: z
    .string()
    .min(3, 'Immatriculation trop courte')
    .max(15, 'Immatriculation trop longue')
    .regex(/^[A-Z0-9\-]{3,15}$/, 'Format invalide (ex: AB-1234-C)'),
  brand: z.string().max(50).optional().nullable(),
  model: z.string().max(50).optional().nullable(),
  year: z.coerce
    .number()
    .int()
    .min(1980, 'Année trop ancienne')
    .max(2030, 'Année invalide')
    .optional()
    .nullable(),
  type: z
    .enum(['camion', 'camionnette', 'remorque', 'tracteur', 'pickup'])
    .optional()
    .nullable(),
  capacity_kg: z.coerce.number().min(0).optional().nullable(),
  mileage: z.coerce.number().int().min(0).optional().nullable(),
  fuel_type: z
    .enum(['diesel', 'essence', 'hybride', 'electrique'])
    .default('diesel'),
  chassis_number: z.string().max(50).optional().nullable(),
  insurance_number: z.string().max(100).optional().nullable(),
  insurance_expiry: z.string().optional().nullable(),
  tech_visit_expiry: z.string().optional().nullable(),
  status: z
    .enum(['available', 'in_transit', 'loading', 'maintenance', 'inactive'])
    .default('available'),
  notes: z.string().max(500).optional().nullable(),
})

export type CamionInput = z.infer<typeof camionSchema>
