import type { Cadence, Charge, CurrencyCode } from '../types'
import { daysUntil, nextOccurrence, parseISO } from './dates'

// The display currency is a single app-wide setting. A tiny module singleton
// (set once by App) keeps money() callable everywhere without threading a
// currency prop through every component — genuinely less code than a context.
let activeCurrency: CurrencyCode = 'USD'
export function setDisplayCurrency(code: CurrencyCode): void {
  activeCurrency = code
}

/** Currencies with no minor unit (¥100, not ¥1.00). */
const ZERO_DECIMAL = new Set<CurrencyCode>(['JPY'])

export function money(cents: number, currency: CurrencyCode = activeCurrency): string {
  const zero = ZERO_DECIMAL.has(currency)
  const value = zero ? cents : cents / 100
  const hasFraction = !zero && cents % 100 !== 0
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: zero ? 0 : 2,
  })
}

export const cadenceLabel: Record<Cadence, string> = {
  weekly: '/wk',
  monthly: '/mo',
  yearly: '/yr',
  once: '',
}

export const cadencePerYear: Record<Cadence, string> = {
  weekly: 'a week',
  monthly: 'a month',
  yearly: 'a year',
  once: '',
}

export function priceLine(c: Charge): string {
  const base = money(c.amountCents)
  if (c.isTrial) return `then ${base}${cadenceLabel[c.cadence] || '/mo'}`
  return `${base}${cadenceLabel[c.cadence]}`
}

export function longDate(iso: string): string {
  return parseISO(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

export function shortDate(iso: string): string {
  return parseISO(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** "Lands today" / "Tomorrow" / "Burning low · 3 days" / "in 12 days" */
export function countdownLabel(days: number, isTrial: boolean): string {
  const verb = isTrial ? 'Trial ends' : 'Lands'
  if (days < 0) return isTrial ? 'Trial ended' : 'Already landed'
  if (days === 0) return `${verb} today`
  if (days === 1) return isTrial ? 'Trial ends tomorrow' : 'Tomorrow'
  if (days <= 3) return `Burning low · ${days} days`
  return `in ${days} days`
}

export function nextFor(c: Charge, today: string): string {
  return nextOccurrence(c.anchor, c.cadence, today)
}

export function daysLeft(c: Charge, today: string): number {
  return daysUntil(nextFor(c, today), today)
}
