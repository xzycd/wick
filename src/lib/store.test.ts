import { describe, it, expect } from 'vitest'
import { makeBackup, parseBackup } from './store'
import type { Charge, Reclaimed, Settings } from '../types'

const settings: Settings = { theme: 'dark', currency: 'GBP', notified: {} }

function charge(over: Partial<Charge> = {}): Charge {
  return {
    id: 'c1',
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

describe('backup round-trip', () => {
  it('restores exactly what was exported', () => {
    const reclaimed: Reclaimed[] = [
      { id: 'r1', chargeId: 'x', name: 'Hulu', amountCents: 999, cadence: 'monthly', isTrial: false, snuffedAt: '2026-07-05' },
    ]
    const backup = makeBackup([charge()], reclaimed, settings)
    const json = JSON.stringify(backup)
    const result = parseBackup(JSON.parse(json))
    expect(result.charges).toHaveLength(1)
    expect(result.charges[0].name).toBe('Netflix')
    expect(result.reclaimed).toHaveLength(1)
    expect(result.settings.currency).toBe('GBP')
  })

  it('backfills a missing category on older charges', () => {
    const legacy = { ...charge() } as Partial<Charge>
    delete legacy.category
    const backup = { app: 'wick', version: 1, exportedAt: '', charges: [legacy], reclaimed: [], settings }
    const result = parseBackup(backup)
    expect(result.charges[0].category).toBe('other')
  })

  it('rejects files that are not Wick backups', () => {
    expect(() => parseBackup({ app: 'something-else', charges: [] })).toThrow()
    expect(() => parseBackup(null)).toThrow()
    expect(() => parseBackup({ app: 'wick' })).toThrow()
  })

  it('tolerates a backup with no reclaimed array', () => {
    const result = parseBackup({ app: 'wick', charges: [charge()], settings })
    expect(result.reclaimed).toEqual([])
  })
})
