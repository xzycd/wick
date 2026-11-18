import type { Cadence, Charge } from '../types'
import { money, priceLine } from './format'
import { nextOccurrence } from './dates'

// A small, correct RFC 5545 writer. Design choices, per the spec:
//  - CRLF line endings (some clients reject bare \n).
//  - Content lines folded at 75 octets with CRLF + single space.
//  - TEXT values escape \\ , ; and newlines.
//  - Every VEVENT carries a stable UID (addr-spec form) and a DTSTAMP.
//  - Renewals are all-day events (VALUE=DATE) with a relative VALARM.

const RRULE: Record<Cadence, string | null> = {
  weekly: 'FREQ=WEEKLY',
  monthly: 'FREQ=MONTHLY',
  yearly: 'FREQ=YEARLY',
  once: null,
}

export function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

/** Fold a single content line to <=75 octets using CRLF + space continuation. */
export function foldLine(line: string): string {
  const bytes = new TextEncoder().encode(line)
  if (bytes.length <= 75) return line

  const out: string[] = []
  let current = ''
  let currentBytes = 0
  // First line may use 75 octets; continuation lines lose one to the space.
  for (const ch of line) {
    const chBytes = new TextEncoder().encode(ch).length
    const limit = out.length === 0 ? 75 : 74
    if (currentBytes + chBytes > limit) {
      out.push(current)
      current = ''
      currentBytes = 0
    }
    current += ch
    currentBytes += chBytes
  }
  if (current) out.push(current)
  return out.join('\r\n ')
}

/** yyyymmdd for a VALUE=DATE property, from an ISO yyyy-mm-dd string. */
function icsDate(iso: string): string {
  return iso.replace(/-/g, '')
}

/** A relative alarm trigger, e.g. -P2D (2 days before) or PT0S (at start). */
function trigger(daysBefore: number): string {
  return daysBefore <= 0 ? 'PT0S' : `-P${daysBefore}D`
}

interface EventInput {
  charge: Charge
  today: string
  stamp: string // UTC yyyymmddThhmmssZ — passed in so this stays testable
}

function buildEvent({ charge, today, stamp }: EventInput): string[] {
  const start = nextOccurrence(charge.anchor, charge.cadence, today)
  const price = money(charge.amountCents)
  // Avoid "Netflix trial trial ends" when the name already says "trial".
  const bare = charge.name.replace(/\s*trial\s*$/i, '').trim() || charge.name
  const summary = charge.isTrial
    ? `${bare} free trial ends — ${price} after`
    : `${charge.name} renews — ${priceLine(charge)}`
  const descParts = [
    charge.isTrial
      ? `Your ${bare} free trial ends. You'll be charged ${price} unless you cancel.`
      : `${charge.name} renews for ${priceLine(charge)}.`,
  ]
  if (charge.note) descParts.push(charge.note)
  if (charge.cancelUrl) descParts.push(`Cancel: ${charge.cancelUrl}`)
  descParts.push('Tracked by Wick.')

  const lines = [
    'BEGIN:VEVENT',
    `UID:${charge.id}@wick.app`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${icsDate(start)}`,
    `SUMMARY:${escapeText(summary)}`,
    `DESCRIPTION:${escapeText(descParts.join('\n\n'))}`,
  ]
  if (charge.cancelUrl) lines.push(`URL:${escapeText(charge.cancelUrl)}`)
  const rule = RRULE[charge.cadence]
  if (rule) lines.push(`RRULE:${rule}`)
  lines.push('TRANSP:TRANSPARENT')

  if (charge.remindDaysBefore !== null) {
    lines.push(
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeText(summary)}`,
      `TRIGGER:${trigger(charge.remindDaysBefore)}`,
      'END:VALARM',
    )
  }
  lines.push('END:VEVENT')
  return lines
}

/** A full VCALENDAR string for one or more charges. */
export function buildCalendar(charges: Charge[], today: string, stamp: string): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Wick//Renewal Tracker//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...charges.flatMap((c) => buildEvent({ charge: c, today, stamp })),
    'END:VCALENDAR',
  ]
  return lines.map(foldLine).join('\r\n') + '\r\n'
}

/** UTC timestamp in iCalendar form, e.g. 20260708T140501Z. */
export function icsStamp(now: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return (
    `${now.getUTCFullYear()}${p(now.getUTCMonth() + 1)}${p(now.getUTCDate())}` +
    `T${p(now.getUTCHours())}${p(now.getUTCMinutes())}${p(now.getUTCSeconds())}Z`
  )
}
