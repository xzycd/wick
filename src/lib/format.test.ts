import { describe, it, expect } from 'vitest'
import { countdownLabel, daysLeft, longDate, nextFor, priceLine, shortDate } from './format'
import type { Charge } from '../types'

function charge(over: Partial<Charge> = {}): Charge {
  return {
    id: 'c1',
    name: 'Netflix',
    presetId: null,
    amountCents: 1799,
    cadence: 'monthly',
    category: 'streaming',
    anchor: '2026-07-20',
    isTrial: false,
    stance: 'keep',
    note: '',
    cancelUrl: '',
    remindDaysBefore: 2,
    createdAt: '2026-07-01',
    ...over,
  }
}

describe('countdownLabel', () => {
  it('labels the near term for a subscription', () => {
    expect(countdownLabel(0, false)).toBe('Lands today')
    expect(countdownLabel(1, false)).toBe('Tomorrow')
    expect(countdownLabel(2, false)).toBe('Burning low · 2 days')
    expect(countdownLabel(3, false)).toBe('Burning low · 3 days')
    expect(countdownLabel(12, false)).toBe('in 12 days')
  })

  it('uses trial wording and a past tense', () => {
    expect(countdownLabel(0, true)).toBe('Trial ends today')
    expect(countdownLabel(1, true)).toBe('Trial ends tomorrow')
    expect(countdownLabel(-3, true)).toBe('Trial ended')
    expect(countdownLabel(-3, false)).toBe('Already landed')
  })
})

describe('priceLine', () => {
  it('suffixes recurring charges with their cadence', () => {
    expect(priceLine(charge({ amountCents: 1799, cadence: 'monthly' }))).toBe('$17.99/mo')
    expect(priceLine(charge({ amountCents: 4500, cadence: 'weekly' }))).toBe('$45/wk')
    expect(priceLine(charge({ amountCents: 9900, cadence: 'yearly' }))).toBe('$99/yr')
  })

  it('frames a trial as the price that lands after', () => {
    expect(priceLine(charge({ amountCents: 1299, cadence: 'once', isTrial: true }))).toBe(
      'then $12.99/mo',
    )
  })
})

describe('date formatting', () => {
  it('renders the long and short forms', () => {
    expect(longDate('2026-07-20')).toBe('Monday, July 20')
    expect(shortDate('2026-07-20')).toBe('Jul 20')
  })
})

describe('nextFor / daysLeft', () => {
  it('derive the next occurrence and its distance in days', () => {
    const c = charge({ anchor: '2026-05-15', cadence: 'monthly' })
    expect(nextFor(c, '2026-07-07')).toBe('2026-07-15')
    expect(daysLeft(c, '2026-07-07')).toBe(8)
  })
})
