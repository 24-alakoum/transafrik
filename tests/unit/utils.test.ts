import { describe, it, expect } from 'vitest'
import { formatFCFA, formatDate, generateReference, isExpiringSoon, calculateTripFinancials } from '../../lib/utils'

describe('formatFCFA', () => {
  it('formats positive numbers correctly', () => {
    expect(formatFCFA(1500000)).toMatch(/1\s500\s000\s(FCFA|CFA)/)
  })
  it('handles zero correctly', () => {
    expect(formatFCFA(0)).toMatch(/0\s(FCFA|CFA)/)
  })
  it('handles negative numbers correctly', () => {
    expect(formatFCFA(-5000)).toMatch(/-5\s000\s(FCFA|CFA)/)
  })
})

describe('formatDate', () => {
  it('formats dates to french locale', () => {
    const date = new Date('2026-05-15T12:00:00Z')
    expect(formatDate(date.toISOString())).toContain('mai 2026')
  })
})

describe('generateReference', () => {
  it('generates a reference with prefix and counter', () => {
    expect(generateReference('FAC', 42)).toBe('FAC-2026-0042') // Assuming year 2026
  })
})

describe('isExpiringSoon', () => {
  it('returns true if date is within threshold', () => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    expect(isExpiringSoon(tomorrow.toISOString(), 7)).toBe(true)
  })

  it('returns false if date is far in future', () => {
    const future = new Date()
    future.setDate(future.getDate() + 30)
    expect(isExpiringSoon(future.toISOString(), 7)).toBe(false)
  })

  it('returns false if date is already passed', () => {
    const past = new Date()
    past.setDate(past.getDate() - 1)
    expect(isExpiringSoon(past.toISOString(), 7)).toBe(false)
  })
})

describe('calculateTripFinancials', () => {
  it('prevents revenue double counting when revenue is synced in revenues table', () => {
    const trip = {
      revenue_fcfa: 500000,
      frais_aller_fcfa: 100000,
      frais_retour_fcfa: 50000,
      revenues: [{ id: '1', amount_fcfa: 500000, description: 'Recette voyage' }],
      expenses: [],
    }
    const result = calculateTripFinancials(trip)
    expect(result.totalRevenue).toBe(500000)
    expect(result.totalExpenses).toBe(150000)
    expect(result.netProfit).toBe(350000)
  })

  it('handles additional revenues without duplicating base revenue', () => {
    const trip = {
      revenue_fcfa: 500000,
      frais_aller_fcfa: 100000,
      frais_retour_fcfa: 50000,
      revenues: [
        { id: '1', amount_fcfa: 500000, description: 'Recette voyage' },
        { id: '2', amount_fcfa: 50000, description: 'Frais supplémentaires' },
      ],
      expenses: [],
    }
    const result = calculateTripFinancials(trip)
    expect(result.totalRevenue).toBe(550000)
    expect(result.totalExpenses).toBe(150000)
    expect(result.netProfit).toBe(400000)
  })

  it('prevents expense double counting when frais_aller and frais_retour are in expenses table', () => {
    const trip = {
      revenue_fcfa: 500000,
      frais_aller_fcfa: 100000,
      frais_retour_fcfa: 50000,
      expenses: [
        { id: 'e1', category: 'frais_aller', amount_fcfa: 100000 },
        { id: 'e2', category: 'frais_retour', amount_fcfa: 50000 },
        { id: 'e3', category: 'maintenance', amount_fcfa: 20000 },
      ],
    }
    const result = calculateTripFinancials(trip)
    expect(result.totalRevenue).toBe(500000)
    expect(result.effectiveFraisAller).toBe(100000)
    expect(result.effectiveFraisRetour).toBe(50000)
    expect(result.otherExpensesSum).toBe(20000)
    expect(result.totalExpenses).toBe(170000)
    expect(result.netProfit).toBe(330000)
  })
})

