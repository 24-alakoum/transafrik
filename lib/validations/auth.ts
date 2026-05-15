import { z } from 'zod'

// ── Schéma d'inscription ─────────────────────────────
export const registerSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom est trop long'),
  email: z
    .string()
    .email('Adresse email invalide')
    .toLowerCase(),
  phone: z
    .string()
    .min(8, 'Numéro de téléphone invalide')
    .optional()
    .or(z.literal('')),
  companyName: z
    .string()
    .min(2, 'Le nom de l\'entreprise doit contenir au moins 2 caractères')
    .max(100, 'Le nom est trop long'),
  country: z
    .enum(['ML','SN','CI','BF','NE','GN','TG','BJ','CM','GA'], {
      errorMap: () => ({ message: 'Pays non supporté' }),
    })
    .default('ML'),
  password: z
    .string()
    .min(12, 'Le mot de passe doit contenir au moins 12 caractères')
    .regex(/[A-Z]/, 'Doit contenir au moins une majuscule')
    .regex(/[0-9]/, 'Doit contenir au moins un chiffre'),
  confirmPassword: z.string(),
  rgpdConsent: z
    .boolean()
    .refine((v) => v === true, 'Vous devez accepter la politique de confidentialité'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
})

export type RegisterInput = z.infer<typeof registerSchema>

// ── Schéma de connexion ──────────────────────────────
export const loginSchema = z.object({
  email: z.string().email('Adresse email invalide').toLowerCase(),
  password: z.string().min(1, 'Le mot de passe est requis'),
})

export type LoginInput = z.infer<typeof loginSchema>

// ── Schéma mot de passe oublié ───────────────────────
export const forgotPasswordSchema = z.object({
  email: z.string().email('Adresse email invalide').toLowerCase(),
})

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

// ── Schéma réinitialisation mot de passe ─────────────
export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(12, 'Le mot de passe doit contenir au moins 12 caractères')
    .regex(/[A-Z]/, 'Doit contenir au moins une majuscule')
    .regex(/[0-9]/, 'Doit contenir au moins un chiffre'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
})

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
