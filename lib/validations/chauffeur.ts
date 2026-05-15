import { z } from 'zod'

export const chauffeurSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100),
  phone: z.string().min(8, 'Numéro de téléphone invalide'),
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
  monthly_salary: z.coerce.number().min(0).default(0),
  emergency_contact: z.string().max(200).optional().nullable(),
  status: z
    .enum(['available', 'on_trip', 'leave', 'inactive'])
    .default('available'),
  truck_id: z.string().uuid().optional().nullable(),
})

export type ChauffeurInput = z.infer<typeof chauffeurSchema>
