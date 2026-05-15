import { describe, it, expect } from 'vitest'
import { registerSchema } from '../../lib/validations/auth'
import { voyageSchema } from '../../lib/validations/voyage'
import { camionSchema } from '../../lib/validations/camion'

describe('Validations', () => {
  describe('registerSchema', () => {
    it('validates a correct payload', () => {
      const payload = {
        company_name: 'Test Corp',
        full_name: 'John Doe',
        email: 'test@example.com',
        password: 'Password1234!', // Needs high zxcvbn score realistically
        terms: true
      }
      expect(registerSchema.safeParse(payload).success).toBe(true)
    })

    it('rejects missing terms', () => {
      const payload = {
        company_name: 'Test Corp',
        full_name: 'John Doe',
        email: 'test@example.com',
        password: 'Password1234!',
        terms: false
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
