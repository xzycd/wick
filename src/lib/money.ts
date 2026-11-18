import type { Cadence, Charge, Reclaimed } from '../types'

// Annualization uses exact multipliers: 52 weeks, 12 months. Amounts are in
// integer cents throughout — no floating money until the final format step.

/** What a recurring charge costs per year, in cents. One-offs are 0 (not annual). */
export function yearlyCents(amountCents: number, cadence: Cadence): number {
  switch (cadence) {
    case 'weekly':
      return amountCents * 52
    case 'monthly':
      return amountCents * 12
    case 'yearly':
      return amountCents
    case 'once':
      return 0
  }
}

/** What a recurring charge costs per month, in cents (rounded). */
export function monthlyCents(amountCents: number, cadence: Cadence): number {
  return Math.round(yearlyCents(amountCents, cadence) / 12)
}

/** Total per-month burn across active charges (one-offs excluded). */
export function totalMonthly(charges: Charge[]): number {
  return charges.reduce((sum, c) => sum + monthlyCents(c.amountCents, c.cadence), 0)
}

/** Total per-year burn across active charges (one-offs excluded). */
export function totalYearly(charges: Charge[]): number {
  return charges.reduce((sum, c) => sum + yearlyCents(c.amountCents, c.cadence), 0)
}

/**
 * Money reclaimed by snuffing, in cents per year. Recurring items count their
 * annual value; canceled trials/one-offs count their face value once (a real,
 * if one-time, amount dodged). Honest by construction — no inflation.
 */
export function totalReclaimedYearly(reclaimed: Reclaimed[]): number {
  return reclaimed.reduce((sum, r) => {
    const yearly = yearlyCents(r.amountCents, r.cadence)
    return sum + (yearly > 0 ? yearly : r.amountCents)
  }, 0)
}

export function reclaimedValue(r: Reclaimed): number {
  const yearly = yearlyCents(r.amountCents, r.cadence)
  return yearly > 0 ? yearly : r.amountCents
}
