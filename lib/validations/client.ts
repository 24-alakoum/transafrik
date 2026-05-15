import { z } from 'zod'

export const clientSchema = z.object({
  name: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(150),
  contact_person: z.string().max(100).optional().nullable(),
  email: z
    .string()
    .email('Email invalide')
    .optional()
    .or(z.literal(''))
    .nullable(),
  phone: z.string().max(20).optional().nullable(),
  address: z.string().max(200).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  country: z.string().max(50).optional().nullable(),
  sector: z.string().max(100).optional().nullable(),
  payment_terms_days: z
    .union([
      z.literal(7),
      z.literal(15),
      z.literal(30),
      z.literal(45),
      z.literal(60),
      z.literal(90),
    ])
    .default(30),
  credit_limit_fcfa: z.coerce.number().min(0).optional().nullable(),
  is_active: z.boolean().default(true),
  notes: z.string().max(500).optional().nullable(),
})

export type ClientInput = z.infer<typeof clientSchema>
