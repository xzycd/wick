import { describe, it, expect } from 'vitest'
import { buildCalendar, escapeText, foldLine, icsStamp } from './ics'
import type { Charge } from '../types'

const STAMP = '20260708T120000Z'

function charge(over: Partial<Charge> = {}): Charge {
  return {
    id: 'abc-123',
    name: 'Netflix',
    presetId: 'netflix',
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

describe('escapeText', () => {
  it('escapes backslash, comma, semicolon, and newline per RFC 5545', () => {
    expect(escapeText('a, b; c\\d\ne')).toBe('a\\, b\\; c\\\\d\\ne')
  })
})

describe('foldLine', () => {
  it('leaves short lines untouched', () => {
    expect(foldLine('SUMMARY:hi')).toBe('SUMMARY:hi')
  })

  it('folds long lines with CRLF + single space and preserves content', () => {
    const long = 'DESCRIPTION:' + 'x'.repeat(200)
    const folded = foldLine(long)
    expect(folded).toContain('\r\n ')
    // Unfolding (remove CRLF+space) must reproduce the original exactly.
    expect(folded.replace(/\r\n /g, '')).toBe(long)
    // No physical line exceeds 75 octets.
    for (const seg of folded.split('\r\n')) {
      expect(new TextEncoder().encode(seg).length).toBeLessThanOrEqual(75)
    }
  })
})

describe('buildCalendar', () => {
  it('wraps events in a valid VCALENDAR envelope with CRLF', () => {
    const ics = buildCalendar([charge()], '2026-07-08', STAMP)
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true)
    expect(ics.trimEnd().endsWith('END:VCALENDAR')).toBe(true)
    expect(ics).toContain('VERSION:2.0')
    expect(ics).toContain('BEGIN:VEVENT')
    expect(ics).toContain('END:VEVENT')
  })

  it('emits a stable addr-spec UID and a DTSTAMP', () => {
    const ics = buildCalendar([charge()], '2026-07-08', STAMP)
    expect(ics).toContain('UID:abc-123@wick.app')
    expect(ics).toContain(`DTSTAMP:${STAMP}`)
  })

  it('uses the next occurrence as an all-day DTSTART', () => {
    const ics = buildCalendar([charge({ anchor: '2026-05-20' })], '2026-07-08', STAMP)
    expect(ics).toContain('DTSTART;VALUE=DATE:20260720')
  })

  it('adds a recurrence rule for recurring cadences only', () => {
    expect(buildCalendar([charge({ cadence: 'monthly' })], '2026-07-08', STAMP)).toContain(
      'RRULE:FREQ=MONTHLY',
    )
    expect(buildCalendar([charge({ cadence: 'yearly' })], '2026-07-08', STAMP)).toContain(
      'RRULE:FREQ=YEARLY',
    )
    expect(buildCalendar([charge({ cadence: 'once', isTrial: true })], '2026-07-08', STAMP)).not.toContain(
      'RRULE:',
    )
  })

  it('includes a VALARM with a relative trigger when a reminder is set', () => {
    const ics = buildCalendar([charge({ remindDaysBefore: 2 })], '2026-07-08', STAMP)
    expect(ics).toContain('BEGIN:VALARM')
    expect(ics).toContain('TRIGGER:-P2D')
    expect(ics).toContain('ACTION:DISPLAY')
  })

  it('triggers at start for a same-day reminder and omits the alarm when none set', () => {
    expect(buildCalendar([charge({ remindDaysBefore: 0 })], '2026-07-08', STAMP)).toContain(
      'TRIGGER:PT0S',
    )
    expect(buildCalendar([charge({ remindDaysBefore: null })], '2026-07-08', STAMP)).not.toContain(
      'BEGIN:VALARM',
    )
  })

  it('escapes commas in the summary so the value is not split', () => {
    const ics = buildCalendar([charge({ name: 'Milk, Eggs & Co' })], '2026-07-08', STAMP)
    expect(ics).toContain('Milk\\, Eggs')
  })
})

describe('icsStamp', () => {
  it('formats a UTC timestamp', () => {
    expect(icsStamp(new Date(Date.UTC(2026, 6, 8, 14, 5, 1)))).toBe('20260708T140501Z')
  })
})
