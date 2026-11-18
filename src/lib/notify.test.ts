import { describe, it, expect } from 'vitest'
import { canNotify, dueReminders, notificationPermission, reminderBody } from './notify'
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

describe('dueReminders', () => {
  const today = '2026-07-07'

  it('includes a charge once its reminder window has opened', () => {
    const c = charge({ id: 'a', anchor: '2026-07-09', remindDaysBefore: 2 }) // 2 days out
    const due = dueReminders([c], {}, today)
    expect(due).toHaveLength(1)
    expect(due[0].days).toBe(2)
  })

  it('excludes a charge whose window has not opened yet', () => {
    const c = charge({ id: 'b', anchor: '2026-07-12', remindDaysBefore: 2 }) // 5 days out
    expect(dueReminders([c], {}, today)).toHaveLength(0)
  })

  it('excludes charges with no reminder and ones already past', () => {
    const none = charge({ id: 'c', anchor: '2026-07-08', remindDaysBefore: null })
    const past = charge({ id: 'd', anchor: '2026-07-01', cadence: 'once', remindDaysBefore: 2 })
    expect(dueReminders([none, past], {}, today)).toHaveLength(0)
  })

  it('does not repeat a reminder already fired for this occurrence', () => {
    const c = charge({ id: 'e', anchor: '2026-07-09', remindDaysBefore: 2 })
    expect(dueReminders([c], { e: '2026-07-09' }, today)).toHaveLength(0)
  })

  it('sorts the soonest first', () => {
    const near = charge({ id: 'near', anchor: '2026-07-07', remindDaysBefore: 3 })
    const far = charge({ id: 'far', anchor: '2026-07-10', remindDaysBefore: 3 })
    const due = dueReminders([far, near], {}, today)
    expect(due.map((r) => r.charge.id)).toEqual(['near', 'far'])
  })
})

describe('reminderBody', () => {
  it('phrases a renewal with when and amount', () => {
    const c = charge({ name: 'Netflix', amountCents: 1799 })
    expect(reminderBody({ charge: c, days: 3, occurrence: 'x' })).toBe(
      'Netflix renews in 3 days — $17.99.',
    )
  })

  it('says today and tomorrow', () => {
    const c = charge({ name: 'Spotify', amountCents: 1199 })
    expect(reminderBody({ charge: c, days: 0, occurrence: 'x' })).toBe('Spotify renews today — $11.99.')
    expect(reminderBody({ charge: c, days: 1, occurrence: 'x' })).toBe(
      'Spotify renews tomorrow — $11.99.',
    )
  })

  it('frames a trial by what lands after', () => {
    const c = charge({ name: 'Paramount+', amountCents: 1299, isTrial: true })
    expect(reminderBody({ charge: c, days: 2, occurrence: 'x' })).toBe(
      'Paramount+ trial ends in 2 days — $12.99 after that.',
    )
  })

  it('does not say "trial" twice when the name already ends with it', () => {
    const c = charge({ name: 'Hulu trial', amountCents: 999, isTrial: true })
    expect(reminderBody({ charge: c, days: 1, occurrence: 'x' })).toBe(
      'Hulu trial ends tomorrow — $9.99 after that.',
    )
  })
})

describe('notification support', () => {
  it('reports unsupported when the Notification API is absent', () => {
    expect(canNotify()).toBe(false)
    expect(notificationPermission()).toBe('unsupported')
  })
})
