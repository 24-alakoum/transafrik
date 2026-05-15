import { describe, it, expect } from 'vitest'
import { formatFCFA, formatDate, generateReference, isExpiringSoon } from '../../lib/utils'

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

  it('returns true if date is already passed', () => {
    const past = new Date()
    past.setDate(past.getDate() - 1)
    expect(isExpiringSoon(past.toISOString(), 7)).toBe(true)
  })
})
