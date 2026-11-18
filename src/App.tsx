import { useEffect, useMemo, useRef, useState } from 'react'
import type { Charge, CurrencyCode, Reclaimed, Settings, Stance } from './types'
import { todayISO } from './lib/dates'
import { cadencePerYear, money, setDisplayCurrency } from './lib/format'
import {
  dueReminders,
  fireSystemNotification,
  notificationPermission,
  requestPermission,
  type DueReminder,
} from './lib/notify'
import {
  clearAll,
  loadCharges,
  loadReclaimed,
  loadSettings,
  makeBackup,
  newId,
  parseBackup,
  saveCharges,
  saveReclaimed,
  saveSettings,
} from './lib/store'
import { buildCalendar, icsStamp } from './lib/ics'
import { downloadText, pickTextFile, slug } from './lib/files'
import { haptic } from './lib/haptic'
import { exampleCharges } from './data/examples'
import { Detail } from './components/Detail'
import { EditSheet } from './components/EditSheet'
import { Home } from './components/Home'
import { Settings as SettingsScreen } from './components/Settings'

type View = { name: 'home' } | { name: 'detail'; id: string } | { name: 'settings' }

export default function App() {
  const [today, setToday] = useState(todayISO)
  const [charges, setCharges] = useState<Charge[]>(loadCharges)
  const [reclaimed, setReclaimed] = useState<Reclaimed[]>(loadReclaimed)
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [view, setView] = useState<View>({ name: 'home' })
  const [editing, setEditing] = useState<Charge | null | 'new'>(null)
  const [toast, setToast] = useState<{ msg: string; undo?: () => void } | null>(null)
  const [banner, setBanner] = useState<DueReminder[]>([])
  const [permission, setPermission] = useState(notificationPermission())

  // Keep the display-currency singleton in sync before children paint. useMemo
  // runs during render (so money() is correct on the first paint), but only
  // re-runs when the currency actually changes — not on every render.
  useMemo(() => setDisplayCurrency(settings.currency), [settings.currency])

  useEffect(() => saveCharges(charges), [charges])
  useEffect(() => saveReclaimed(reclaimed), [reclaimed])
  useEffect(() => saveSettings(settings), [settings])

  // Resolve theme: 'auto' follows the system, otherwise the explicit choice.
  const resolvedTheme = useMemo(() => {
    if (settings.theme !== 'auto') return settings.theme
    return typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  }, [settings.theme])

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme
    // Match the browser chrome (status bar / address bar) to the active theme,
    // even when the in-app choice overrides the system preference.
    const meta = document.querySelector('meta[name="theme-color"]')
    meta?.setAttribute('content', resolvedTheme === 'dark' ? '#191410' : '#f5eee1')
  }, [resolvedTheme])

  // Refresh the day when the app regains focus, so a mantel left open past
  // midnight shows correct counts and the reminder window re-opens for the new day.
  useEffect(() => {
    const refresh = () => setToday((prev) => (prev === todayISO() ? prev : todayISO()))
    document.addEventListener('visibilitychange', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      document.removeEventListener('visibilitychange', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  // Local reminders: once per day, surface anything inside its reminder window,
  // fire a system notification per occurrence, and remember we did.
  const remindersCheckedFor = useRef<string | null>(null)
  useEffect(() => {
    if (remindersCheckedFor.current === today) return
    remindersCheckedFor.current = today
    const due = dueReminders(charges, settings.notified, today)
    if (due.length === 0) return
    setBanner(due)
    const notified = { ...settings.notified }
    for (const r of due) {
      fireSystemNotification(r)
      notified[r.charge.id] = r.occurrence
    }
    setSettings((s) => ({ ...s, notified }))
    // charges/settings are snapshotted per day-check by design
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today])

  const toastTimer = useRef<number | undefined>(undefined)
  function showToast(msg: string, undo?: () => void) {
    window.clearTimeout(toastTimer.current)
    setToast({ msg, undo })
    // Give undoable toasts longer to be caught.
    toastTimer.current = window.setTimeout(() => setToast(null), undo ? 7000 : 4000)
  }

  function upsert(charge: Charge) {
    setCharges((prev) => {
      const exists = prev.some((c) => c.id === charge.id)
      return exists ? prev.map((c) => (c.id === charge.id ? charge : c)) : [...prev, charge]
    })
    setEditing(null)
    haptic()
    showToast(
      charge.isTrial
        ? `On the mantel. Wick is watching the ${charge.name} trial.`
        : `On the mantel. Wick is watching ${charge.name}.`,
    )
  }

  function setStance(id: string, stance: Stance) {
    haptic()
    setCharges((prev) => prev.map((c) => (c.id === id ? { ...c, stance } : c)))
  }

  function snuff(id: string) {
    const gone = charges.find((c) => c.id === id)
    if (!gone) return
    haptic()
    const record: Reclaimed = {
      id: newId(),
      chargeId: gone.id,
      name: gone.name,
      amountCents: gone.amountCents,
      cadence: gone.cadence,
      isTrial: gone.isTrial,
      snuffedAt: today,
    }
    setCharges((prev) => prev.filter((c) => c.id !== id))
    setReclaimed((prev) => [...prev, record])
    setView({ name: 'home' })
    const per = gone.cadence === 'once' ? '' : ` ${cadencePerYear[gone.cadence]}`
    showToast(`Snuffed. That's ${money(gone.amountCents)}${per} back in your pocket.`, () => {
      setCharges((prev) => (prev.some((c) => c.id === gone.id) ? prev : [...prev, gone]))
      setReclaimed((prev) => prev.filter((r) => r.id !== record.id))
      setView({ name: 'detail', id: gone.id })
      setToast(null)
    })
  }

  async function allowReminders() {
    const result = await requestPermission()
    setPermission(result)
    if (result === 'granted') showToast('Reminders can reach you now.')
  }

  function addToCalendar(charge: Charge) {
    const ics = buildCalendar([charge], today, icsStamp(new Date()))
    downloadText(`${slug(charge.name)}.ics`, 'text/calendar;charset=utf-8', ics)
    haptic()
    showToast(`Opening ${charge.name} in your calendar…`)
  }

  function exportAllCalendar() {
    if (charges.length === 0) return
    const ics = buildCalendar(charges, today, icsStamp(new Date()))
    downloadText('wick-renewals.ics', 'text/calendar;charset=utf-8', ics)
    haptic()
    showToast(`${charges.length} ${charges.length === 1 ? 'renewal' : 'renewals'} sent to your calendar.`)
  }

  function backup() {
    const data = makeBackup(charges, reclaimed, settings)
    downloadText(`wick-backup-${today}.json`, 'application/json', JSON.stringify(data, null, 2))
    showToast('Backup saved. Keep it somewhere safe.')
  }

  async function restore() {
    const text = await pickTextFile('application/json,.json')
    if (!text) return
    try {
      const result = parseBackup(JSON.parse(text))
      setCharges(result.charges)
      setReclaimed(result.reclaimed)
      setSettings(result.settings)
      setView({ name: 'home' })
      showToast(`Restored ${result.charges.length} ${result.charges.length === 1 ? 'charge' : 'charges'}.`)
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'That file could not be read.')
    }
  }

  function eraseEverything() {
    clearAll()
    setCharges([])
    setReclaimed([])
    setSettings((s) => ({ ...s, notified: {} }))
    setView({ name: 'home' })
    showToast('Everything cleared. Fresh mantel.')
  }

  const detailCharge =
    view.name === 'detail' ? charges.find((c) => c.id === view.id) : undefined

  return (
    <div className="app">
      {view.name === 'settings' ? (
        <SettingsScreen
          settings={settings}
          reclaimed={reclaimed}
          charges={charges}
          permission={permission}
          onBack={() => setView({ name: 'home' })}
          onSetTheme={(theme) => setSettings((s) => ({ ...s, theme }))}
          onSetCurrency={(currency: CurrencyCode) => setSettings((s) => ({ ...s, currency }))}
          onAllowReminders={allowReminders}
          onExportAllCalendar={exportAllCalendar}
          onBackup={backup}
          onRestore={restore}
          onClearAll={eraseEverything}
        />
      ) : view.name === 'detail' && detailCharge ? (
        <Detail
          charge={detailCharge}
          today={today}
          onBack={() => setView({ name: 'home' })}
          onEdit={() => setEditing(detailCharge)}
          onSetStance={(stance) => setStance(detailCharge.id, stance)}
          onSnuff={() => snuff(detailCharge.id)}
          onAddToCalendar={() => addToCalendar(detailCharge)}
        />
      ) : (
        <Home
          charges={charges}
          reclaimed={reclaimed}
          today={today}
          reminders={banner}
          onOpen={(id) => {
            setBanner([])
            setView({ name: 'detail', id })
          }}
          onAdd={() => setEditing('new')}
          onSeed={() => setCharges(exampleCharges(today))}
          onOpenSettings={() => setView({ name: 'settings' })}
          themeLabel={resolvedTheme === 'dark' ? 'light' : 'dark'}
          onToggleTheme={() =>
            setSettings((s) => ({ ...s, theme: resolvedTheme === 'dark' ? 'light' : 'dark' }))
          }
          permissionNudge={
            permission === 'default' && charges.some((c) => c.remindDaysBefore !== null)
          }
          onAllowReminders={allowReminders}
        />
      )}

      {editing !== null && (
        <EditSheet
          charge={editing === 'new' ? null : editing}
          onSave={upsert}
          onClose={() => setEditing(null)}
        />
      )}

      {toast && (
        <div className="toast" role="status">
          <span className="toast-msg">{toast.msg}</span>
          {toast.undo && (
            <button
              className="toast-undo"
              onClick={() => {
                haptic()
                toast.undo!()
              }}
            >
              Undo
            </button>
          )}
        </div>
      )}
    </div>
  )
}
