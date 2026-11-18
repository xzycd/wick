import type { Cadence } from '../types'

// All dates are ISO `yyyy-mm-dd` strings interpreted as local calendar days.
// Date objects are pinned to local noon so DST shifts never move the day.

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d, 12)
}

export function toISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayISO(): string {
  return toISO(new Date())
}

/** Whole calendar days from `today` to `target`. Negative if past. */
export function daysUntil(target: string, today: string): number {
  const ms = parseISO(target).getTime() - parseISO(today).getTime()
  return Math.round(ms / 86_400_000)
}

function daysInMonth(year: number, month0: number): number {
  return new Date(year, month0 + 1, 0).getDate()
}

/** Anchor + k months, keeping the anchor's day-of-month, clamped to month length. */
function addMonthsClamped(anchor: string, k: number): string {
  const a = parseISO(anchor)
  const y = a.getFullYear()
  const m0 = a.getMonth() + k
  const year = y + Math.floor(m0 / 12)
  const month = ((m0 % 12) + 12) % 12
  const day = Math.min(a.getDate(), daysInMonth(year, month))
  return toISO(new Date(year, month, day, 12))
}

/**
 * The first occurrence of the charge on or after `today`, derived from the
 * anchor date. Deriving from the anchor (not the previous occurrence) means
 * a Jan 31 monthly charge lands Feb 28 and returns to Mar 31 — no drift.
 * `once` charges never advance: past means expired.
 */
export function nextOccurrence(anchor: string, cadence: Cadence, today: string): string {
  if (cadence === 'once') return anchor
  if (daysUntil(anchor, today) >= 0) return anchor

  if (cadence === 'weekly') {
    const behind = -daysUntil(anchor, today)
    const weeks = Math.ceil(behind / 7)
    return toISO(new Date(parseISO(anchor).getTime() + weeks * 7 * 86_400_000))
  }

  const step = cadence === 'monthly' ? 1 : 12
  for (let k = step; k <= 1200 * step; k += step) {
    const candidate = addMonthsClamped(anchor, k)
    if (daysUntil(candidate, today) >= 0) return candidate
  }
  return anchor
}

/** The occurrence immediately before `next` (the start of the current cycle). */
export function previousOccurrence(anchor: string, cadence: Cadence, next: string): string {
  if (cadence === 'once') return anchor
  if (cadence === 'weekly') {
    return toISO(new Date(parseISO(next).getTime() - 7 * 86_400_000))
  }
  const step = cadence === 'monthly' ? 1 : 12
  for (let k = 0; k <= 1200 * step; k += step) {
    if (addMonthsClamped(anchor, k) === next) {
      return k === 0 ? addMonthsClamped(anchor, -step) : addMonthsClamped(anchor, k - step)
    }
  }
  return anchor
}

/**
 * Fraction of the current cycle still remaining, 0..1 — the candle's wax.
 * For `once` (trials), the cycle runs from `createdAt` to the end date.
 */
export function cycleFraction(
  anchor: string,
  cadence: Cadence,
  today: string,
  createdAt: string,
): number {
  const next = nextOccurrence(anchor, cadence, today)
  const left = daysUntil(next, today)
  if (left < 0) return 0
  const start = cadence === 'once' ? createdAt : previousOccurrence(anchor, cadence, next)
  const total = Math.max(daysUntil(next, start), 1)
  return Math.min(1, Math.max(0, left / total))
}
