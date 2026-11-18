import { describe, it, expect } from 'vitest'
import { yearlyCents, monthlyCents, totalMonthly, totalYearly, totalReclaimedYearly } from './money'
import { money } from './format'
import type { Charge, Reclaimed } from '../types'

describe('yearlyCents', () => {
  it('annualizes each cadence with exact multipliers', () => {
    expect(yearlyCents(1000, 'weekly')).toBe(52_000)
    expect(yearlyCents(1799, 'monthly')).toBe(21_588)
    expect(yearlyCents(26_388, 'yearly')).toBe(26_388)
    expect(yearlyCents(1299, 'once')).toBe(0)
  })
})

describe('monthlyCents', () => {
  it('normalizes to a per-month figure', () => {
    expect(monthlyCents(1200, 'yearly')).toBe(100)
    expect(monthlyCents(1799, 'monthly')).toBe(1799)
  })
})

describe('totalMonthly', () => {
  it('sums per-month burn and ignores one-offs', () => {
    const charges = [
      { amountCents: 1799, cadence: 'monthly' },
      { amountCents: 1200, cadence: 'yearly' },
      { amountCents: 999, cadence: 'once' },
    ] as Charge[]
    expect(totalMonthly(charges)).toBe(1799 + 100)
  })
})

describe('totalYearly', () => {
  it('sums per-year burn and ignores one-offs', () => {
    const charges = [
      { amountCents: 1799, cadence: 'monthly' },
      { amountCents: 1200, cadence: 'yearly' },
      { amountCents: 999, cadence: 'once' },
    ] as Charge[]
    expect(totalYearly(charges)).toBe(1799 * 12 + 1200)
  })
})

describe('totalReclaimedYearly', () => {
  it('annualizes recurring reclaims and counts one-offs at face value', () => {
    const reclaimed = [
      { amountCents: 1799, cadence: 'monthly', isTrial: false },
      { amountCents: 1299, cadence: 'once', isTrial: true },
    ] as Reclaimed[]
    // 1799*12 + 1299 face
    expect(totalReclaimedYearly(reclaimed)).toBe(21_588 + 1299)
  })

  it('is zero for an empty ledger', () => {
    expect(totalReclaimedYearly([])).toBe(0)
  })
})

describe('money formatting', () => {
  it('drops cents for whole amounts and keeps them otherwise', () => {
    expect(money(4500, 'USD')).toBe('$45')
    expect(money(1799, 'USD')).toBe('$17.99')
  })

  it('respects other currencies including zero-decimal yen', () => {
    expect(money(1200, 'EUR')).toBe('€12')
    expect(money(500, 'JPY')).toBe('¥500')
    expect(money(1999, 'GBP')).toBe('£19.99')
  })
})
