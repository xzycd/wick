import type { Charge } from '../types'
import { daysLeft, money, nextFor } from './format'

export interface DueReminder {
  charge: Charge
  days: number
  occurrence: string
}

/**
 * Reminders whose window has opened (days left ≤ remindDaysBefore) and whose
 * occurrence hasn't been notified yet. Pure — the caller fires and records.
 */
export function dueReminders(
  charges: Charge[],
  notified: Record<string, string>,
  today: string,
): DueReminder[] {
  const due: DueReminder[] = []
  for (const c of charges) {
    if (c.remindDaysBefore === null) continue
    const days = daysLeft(c, today)
    if (days < 0 || days > c.remindDaysBefore) continue
    const occurrence = nextFor(c, today)
    if (notified[c.id] === occurrence) continue
    due.push({ charge: c, days, occurrence })
  }
  return due.sort((a, b) => a.days - b.days)
}

export function reminderBody(r: DueReminder): string {
  const amount = money(r.charge.amountCents)
  const when = r.days === 0 ? 'today' : r.days === 1 ? 'tomorrow' : `in ${r.days} days`
  if (r.charge.isTrial) {
    // Don't say "trial" twice when the name already ends with it.
    const trialWord = /trial\s*$/i.test(r.charge.name) ? '' : ' trial'
    return `${r.charge.name}${trialWord} ends ${when} — ${amount} after that.`
  }
  return `${r.charge.name} renews ${when} — ${amount}.`
}

export function canNotify(): boolean {
  return typeof Notification !== 'undefined'
}

export function notificationPermission(): NotificationPermission | 'unsupported' {
  return canNotify() ? Notification.permission : 'unsupported'
}

export async function requestPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!canNotify()) return 'unsupported'
  return Notification.requestPermission()
}

/** Fire a system notification if permitted. Returns whether it was shown. */
export function fireSystemNotification(r: DueReminder): boolean {
  if (!canNotify() || Notification.permission !== 'granted') return false
  try {
    new Notification('Wick', { body: reminderBody(r), icon: `${import.meta.env.BASE_URL}flame.svg`, tag: r.charge.id })
    return true
  } catch {
    return false
  }
}
