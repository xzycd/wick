export type Cadence = 'weekly' | 'monthly' | 'yearly' | 'once'

export type Stance = 'keep' | 'undecided' | 'cancel'

export type Category =
  | 'streaming'
  | 'music'
  | 'software'
  | 'fitness'
  | 'news'
  | 'gaming'
  | 'storage'
  | 'utilities'
  | 'other'

export interface Charge {
  id: string
  name: string
  /** Preset id for the wax-seal mark, or null for a plain monogram. */
  presetId: string | null
  /** Amount in cents. For trials, the price that lands when the trial ends. */
  amountCents: number
  cadence: Cadence
  category: Category
  /** Anchor date (ISO yyyy-mm-dd). The next occurrence is derived from this. */
  anchor: string
  /** Free trials end on `anchor` and then start charging. */
  isTrial: boolean
  stance: Stance
  note: string
  cancelUrl: string
  /** Days before the charge to remind, or null for no reminder. */
  remindDaysBefore: number | null
  createdAt: string
}

/** A charge the user snuffed — the ledger of money reclaimed. */
export interface Reclaimed {
  id: string
  chargeId: string
  name: string
  amountCents: number
  cadence: Cadence
  isTrial: boolean
  snuffedAt: string
}

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY' | 'INR' | 'BRL' | 'MXN'

export interface Settings {
  theme: 'auto' | 'light' | 'dark'
  currency: CurrencyCode
  /** Per-charge id → the occurrence date already notified, to avoid repeats. */
  notified: Record<string, string>
}
