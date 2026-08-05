import { z } from 'zod'

export const chauffeurSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100),
  phone: z.string().min(1, 'Téléphone requis').max(30).optional().or(z.literal('')).nullable(),
  email: z.string().email('Email invalide').optional().or(z.literal('')).nullable(),
  address: z.string().max(200).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  country: z.string().max(50).optional().nullable(),
  // Données sensibles — chiffrées côté serveur
  license_number: z.string().max(50).optional().nullable(),
  license_categories: z.array(z.string()).optional().nullable(),
  license_expiry: z.string().optional().nullable(),
  birth_date: z.string().optional().nullable(),
  national_id: z.string().max(50).optional().nullable(),
  monthly_salary: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? 0 : Number(v)),
    z.number().min(0).default(0)
  ),
  emergency_contact: z.string().max(200).optional().nullable(),
  status: z
    .enum(['available', 'on_trip', 'on_leave', 'inactive'])
    .default('available'),
})

export type ChauffeurInput = z.infer<typeof chauffeurSchema>
