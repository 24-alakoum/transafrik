import { describe, it, expect } from 'vitest'
import { registerSchema } from '../../lib/validations/auth'
import { voyageSchema } from '../../lib/validations/voyage'
import { camionSchema } from '../../lib/validations/camion'

describe('Validations', () => {
  describe('registerSchema', () => {
    it('validates a correct payload', () => {
      const payload = {
        companyName: 'Test Corp',
        fullName: 'John Doe',
        email: 'test@example.com',
        password: 'Password1234!',
        confirmPassword: 'Password1234!',
        rgpdConsent: true,
        country: 'ML'
      }
      expect(registerSchema.safeParse(payload).success).toBe(true)
    })

    it('rejects missing terms', () => {
      const payload = {
        companyName: 'Test Corp',
        fullName: 'John Doe',
        email: 'test@example.com',
        password: 'Password1234!',
        confirmPassword: 'Password1234!',
        rgpdConsent: false,
        country: 'ML'
      }
      expect(registerSchema.safeParse(payload).success).toBe(false)
    })
  })

  describe('voyageSchema', () => {
    it('validates a minimum valid voyage', () => {
      const payload = {
        origin: 'Bamako',
        destination: 'Dakar',
        status: 'draft'
      }
      expect(voyageSchema.safeParse(payload).success).toBe(true)
    })

    it('rejects without origin', () => {
      const payload = {
        destination: 'Dakar',
        status: 'draft'
      }
      expect(voyageSchema.safeParse(payload).success).toBe(false)
    })
  })
  
  describe('camionSchema', () => {
    it('validates a valid truck', () => {
      const payload = {
        plate: 'AB-1234-MD',
        brand: 'Mercedes',
        status: 'available',
        fuel_type: 'diesel'
      }
      expect(camionSchema.safeParse(payload).success).toBe(true)
    })
  })
})
