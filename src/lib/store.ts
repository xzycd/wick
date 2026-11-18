import type { Category, Charge, Reclaimed, Settings } from '../types'

const CHARGES_KEY = 'wick.charges.v1'
const SETTINGS_KEY = 'wick.settings.v1'
const RECLAIMED_KEY = 'wick.reclaimed.v1'

const DEFAULT_SETTINGS: Settings = { theme: 'auto', currency: 'USD', notified: {} }

/** Fill in fields added after a charge was first written (forward-compatible). */
function migrateCharge(c: Partial<Charge>): Charge {
  return { category: 'other' as Category, ...c } as Charge
}

export function loadCharges(): Charge[] {
  try {
    const raw = localStorage.getItem(CHARGES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.map(migrateCharge) : []
  } catch {
    return []
  }
}

export function saveCharges(charges: Charge[]): void {
  localStorage.setItem(CHARGES_KEY, JSON.stringify(charges))
}

export function loadReclaimed(): Reclaimed[] {
  try {
    const raw = localStorage.getItem(RECLAIMED_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveReclaimed(reclaimed: Reclaimed[]): void {
  localStorage.setItem(RECLAIMED_KEY, JSON.stringify(reclaimed))
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    /* fall through to defaults */
  }
  return { ...DEFAULT_SETTINGS }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function clearAll(): void {
  localStorage.removeItem(CHARGES_KEY)
  localStorage.removeItem(RECLAIMED_KEY)
  localStorage.removeItem(SETTINGS_KEY)
}

export function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Math.random().toString(36).slice(2)}`
}

// ——— Backup / restore ———————————————————————————————————————————————

export interface Backup {
  app: 'wick'
  version: 1
  exportedAt: string
  charges: Charge[]
  reclaimed: Reclaimed[]
  settings: Settings
}

export function makeBackup(charges: Charge[], reclaimed: Reclaimed[], settings: Settings): Backup {
  return {
    app: 'wick',
    version: 1,
    exportedAt: new Date().toISOString(),
    charges,
    reclaimed,
    settings,
  }
}

export interface RestoreResult {
  charges: Charge[]
  reclaimed: Reclaimed[]
  settings: Settings
}

/** Validate and normalize a parsed backup object. Throws on anything unusable. */
export function parseBackup(raw: unknown): RestoreResult {
  if (!raw || typeof raw !== 'object') throw new Error('That file is not a Wick backup.')
  const data = raw as Partial<Backup>
  if (data.app !== 'wick' || !Array.isArray(data.charges)) {
    throw new Error('That file is not a Wick backup.')
  }
  return {
    charges: data.charges.map(migrateCharge),
    reclaimed: Array.isArray(data.reclaimed) ? data.reclaimed : [],
    settings: { ...DEFAULT_SETTINGS, ...(data.settings ?? {}) },
  }
}
