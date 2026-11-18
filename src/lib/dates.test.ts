import { describe, it, expect } from 'vitest'
import { daysUntil, nextOccurrence, previousOccurrence, cycleFraction } from './dates'

describe('daysUntil', () => {
  it('counts whole calendar days', () => {
    expect(daysUntil('2026-07-10', '2026-07-07')).toBe(3)
    expect(daysUntil('2026-07-07', '2026-07-07')).toBe(0)
    expect(daysUntil('2026-07-01', '2026-07-07')).toBe(-6)
  })

  it('crosses month and year boundaries', () => {
    expect(daysUntil('2026-08-01', '2026-07-31')).toBe(1)
    expect(daysUntil('2027-01-01', '2026-12-31')).toBe(1)
  })

  it('is stable across the US DST changeover', () => {
    expect(daysUntil('2026-03-09', '2026-03-07')).toBe(2)
    expect(daysUntil('2026-11-02', '2026-10-31')).toBe(2)
  })
})

describe('nextOccurrence', () => {
  it('returns the anchor when it is today or in the future', () => {
    expect(nextOccurrence('2026-07-07', 'monthly', '2026-07-07')).toBe('2026-07-07')
    expect(nextOccurrence('2026-07-20', 'monthly', '2026-07-07')).toBe('2026-07-20')
  })

  it('steps weekly charges forward by whole weeks', () => {
    expect(nextOccurrence('2026-06-01', 'weekly', '2026-07-07')).toBe('2026-07-13')
    expect(nextOccurrence('2026-06-30', 'weekly', '2026-07-07')).toBe('2026-07-07')
  })

  it('advances monthly charges keeping the day-of-month', () => {
    expect(nextOccurrence('2026-05-15', 'monthly', '2026-07-07')).toBe('2026-07-15')
    expect(nextOccurrence('2026-05-15', 'monthly', '2026-07-16')).toBe('2026-08-15')
  })

  it('clamps a Jan 31 anchor to short months without drifting', () => {
    expect(nextOccurrence('2026-01-31', 'monthly', '2026-02-01')).toBe('2026-02-28')
    // After February, the anchor day comes back — no permanent drift to the 28th.
    expect(nextOccurrence('2026-01-31', 'monthly', '2026-03-01')).toBe('2026-03-31')
    expect(nextOccurrence('2026-01-31', 'monthly', '2026-04-01')).toBe('2026-04-30')
  })

  it('handles Feb 29 yearly anchors', () => {
    expect(nextOccurrence('2024-02-29', 'yearly', '2026-07-07')).toBe('2027-02-28')
    expect(nextOccurrence('2024-02-29', 'yearly', '2028-01-01')).toBe('2028-02-29')
  })

  it('never advances one-off charges', () => {
    expect(nextOccurrence('2026-06-01', 'once', '2026-07-07')).toBe('2026-06-01')
  })
})

describe('previousOccurrence', () => {
  it('finds the start of the current cycle', () => {
    expect(previousOccurrence('2026-05-15', 'monthly', '2026-07-15')).toBe('2026-06-15')
    expect(previousOccurrence('2026-06-30', 'weekly', '2026-07-07')).toBe('2026-06-30')
  })

  it('steps back from the anchor itself', () => {
    expect(previousOccurrence('2026-07-15', 'monthly', '2026-07-15')).toBe('2026-06-15')
  })
})

describe('cycleFraction', () => {
  it('is 1 on the day the cycle starts and 0 on renewal day', () => {
    // Renewed today → next occurrence is today → 0 days left.
    expect(cycleFraction('2026-07-07', 'monthly', '2026-07-07', '2026-01-01')).toBe(0)
    // A month out → full candle.
    expect(cycleFraction('2026-08-07', 'monthly', '2026-07-08', '2026-01-01')).toBeGreaterThan(0.9)
  })

  it('burns down linearly mid-cycle', () => {
    const f = cycleFraction('2026-07-22', 'monthly', '2026-07-07', '2026-01-01')
    expect(f).toBeGreaterThan(0.4)
    expect(f).toBeLessThan(0.6)
  })

  it('measures trials from the day they were added', () => {
    const f = cycleFraction('2026-07-14', 'once', '2026-07-07', '2026-07-01')
    expect(f).toBeCloseTo(7 / 13, 2)
  })

  it('is 0 for expired one-offs', () => {
    expect(cycleFraction('2026-06-01', 'once', '2026-07-07', '2026-05-01')).toBe(0)
  })
})
