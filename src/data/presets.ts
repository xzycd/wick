import type { Cadence, Category } from '../types'

/**
 * Quick-pick presets for common services. Marks are original wax-seal
 * monograms (shape + warm tint + initial) — deliberately not official logos.
 */
export type SealShape = 'round' | 'scalloped' | 'squircle'
export type SealTint = 'sand' | 'clay' | 'umber' | 'bone'

export interface Preset {
  id: string
  name: string
  initial: string
  shape: SealShape
  tint: SealTint
  amountCents: number
  cadence: Cadence
  category: Category
  cancelUrl: string
}

export const PRESETS: Preset[] = [
  { id: 'netflix', name: 'Netflix', initial: 'N', shape: 'scalloped', tint: 'clay', amountCents: 1799, cadence: 'monthly', category: 'streaming', cancelUrl: 'https://www.netflix.com/cancelplan' },
  { id: 'spotify', name: 'Spotify', initial: 'S', shape: 'round', tint: 'sand', amountCents: 1199, cadence: 'monthly', category: 'music', cancelUrl: 'https://www.spotify.com/account/subscription/' },
  { id: 'youtube', name: 'YouTube Premium', initial: 'Y', shape: 'squircle', tint: 'umber', amountCents: 1399, cadence: 'monthly', category: 'streaming', cancelUrl: 'https://www.youtube.com/paid_memberships' },
  { id: 'icloud', name: 'iCloud+', initial: 'C', shape: 'round', tint: 'bone', amountCents: 299, cadence: 'monthly', category: 'storage', cancelUrl: 'https://support.apple.com/en-us/118428' },
  { id: 'prime', name: 'Amazon Prime', initial: 'P', shape: 'scalloped', tint: 'sand', amountCents: 1499, cadence: 'monthly', category: 'streaming', cancelUrl: 'https://www.amazon.com/mc' },
  { id: 'disney', name: 'Disney+', initial: 'D', shape: 'squircle', tint: 'clay', amountCents: 1099, cadence: 'monthly', category: 'streaming', cancelUrl: 'https://www.disneyplus.com/account' },
  { id: 'adobe', name: 'Adobe Creative Cloud', initial: 'A', shape: 'round', tint: 'umber', amountCents: 5999, cadence: 'monthly', category: 'software', cancelUrl: 'https://account.adobe.com/plans' },
  { id: 'audible', name: 'Audible', initial: 'A', shape: 'scalloped', tint: 'bone', amountCents: 1495, cadence: 'monthly', category: 'music', cancelUrl: 'https://www.audible.com/account/overview' },
  { id: 'gamepass', name: 'Xbox Game Pass', initial: 'X', shape: 'squircle', tint: 'sand', amountCents: 1999, cadence: 'monthly', category: 'gaming', cancelUrl: 'https://account.microsoft.com/services' },
  { id: 'nyt', name: 'NYT All Access', initial: 'T', shape: 'round', tint: 'clay', amountCents: 2500, cadence: 'monthly', category: 'news', cancelUrl: 'https://myaccount.nytimes.com/seg/subscription' },
  { id: 'dropbox', name: 'Dropbox', initial: 'D', shape: 'scalloped', tint: 'umber', amountCents: 1199, cadence: 'monthly', category: 'storage', cancelUrl: 'https://www.dropbox.com/account/plan' },
  { id: 'gym', name: 'Gym membership', initial: 'G', shape: 'squircle', tint: 'bone', amountCents: 4500, cadence: 'monthly', category: 'fitness', cancelUrl: '' },
]

export function presetById(id: string | null): Preset | undefined {
  return PRESETS.find((p) => p.id === id)
}
