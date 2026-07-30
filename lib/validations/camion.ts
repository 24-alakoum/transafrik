import { z } from 'zod'

export const camionSchema = z.object({
  plate: z
    .string()
    .min(2, 'Immatriculation trop courte')
    .max(20, 'Immatriculation trop longue')
    .regex(/^[a-zA-Z0-9\s-]*$/, 'Format d\'immatriculation invalide'),
    // Accepts any format: AB-1234-C, 12 AB 345, etc.
  brand: z.string().max(50).optional().nullable(),
  model: z.string().max(50).optional().nullable(),
  year: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
    z.number().int().min(1960).max(2035).nullable().optional()
  ),
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
