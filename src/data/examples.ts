import type { Charge } from '../types'
import { parseISO, toISO } from '../lib/dates'
import { newId } from '../lib/store'

function inDays(today: string, days: number): string {
  return toISO(new Date(parseISO(today).getTime() + days * 86_400_000))
}

/** A small believable mantel, dated relative to today, for trying the app. */
export function exampleCharges(today: string): Charge[] {
  const base = {
    note: '',
    cancelUrl: '',
    createdAt: inDays(today, -12),
  }
  return [
    {
      ...base,
      id: newId(),
      name: 'Paramount+ trial',
      presetId: null,
      amountCents: 1299,
      cadence: 'once',
      category: 'streaming',
      anchor: inDays(today, 2),
      isTrial: true,
      stance: 'undecided',
      remindDaysBefore: 2,
      note: 'Signed up for the Champions League match.',
      createdAt: inDays(today, -5),
    },
    {
      ...base,
      id: newId(),
      name: 'Gym membership',
      presetId: 'gym',
      amountCents: 4500,
      cadence: 'monthly',
      category: 'fitness',
      anchor: inDays(today, 5),
      isTrial: false,
      stance: 'undecided',
      remindDaysBefore: 3,
      note: 'Went twice last month. Be honest.',
    },
    {
      ...base,
      id: newId(),
      name: 'Netflix',
      presetId: 'netflix',
      amountCents: 1799,
      cadence: 'monthly',
      category: 'streaming',
      anchor: inDays(today, 11),
      isTrial: false,
      stance: 'keep',
      remindDaysBefore: null,
    },
    {
      ...base,
      id: newId(),
      name: 'Adobe Creative Cloud',
      presetId: 'adobe',
      amountCents: 26388,
      cadence: 'yearly',
      category: 'software',
      anchor: inDays(today, 26),
      isTrial: false,
      stance: 'cancel',
      remindDaysBefore: 7,
      note: 'Only used it for the wedding album. Cancel before the annual hit.',
      cancelUrl: 'https://account.adobe.com/plans',
    },
  ]
}
