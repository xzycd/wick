import { useState } from 'react'
import type { Charge, CurrencyCode, Reclaimed, Settings as SettingsT } from '../types'
import { money } from '../lib/format'
import { reclaimedValue, totalMonthly, totalReclaimedYearly, totalYearly } from '../lib/money'
import { CountUp } from './CountUp'

const THEMES: { value: SettingsT['theme']; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

const CURRENCIES: { value: CurrencyCode; label: string }[] = [
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'GBP', label: 'British Pound (£)' },
  { value: 'CAD', label: 'Canadian Dollar (C$)' },
  { value: 'AUD', label: 'Australian Dollar (A$)' },
  { value: 'JPY', label: 'Japanese Yen (¥)' },
  { value: 'INR', label: 'Indian Rupee (₹)' },
  { value: 'BRL', label: 'Brazilian Real (R$)' },
  { value: 'MXN', label: 'Mexican Peso (MX$)' },
]

interface SettingsProps {
  settings: SettingsT
  reclaimed: Reclaimed[]
  charges: Charge[]
  permission: NotificationPermission | 'unsupported'
  onBack: () => void
  onSetTheme: (t: SettingsT['theme']) => void
  onSetCurrency: (c: CurrencyCode) => void
  onAllowReminders: () => void
  onExportAllCalendar: () => void
  onBackup: () => void
  onRestore: () => void
  onClearAll: () => void
}

export function Settings(props: SettingsProps) {
  const { settings, reclaimed, charges } = props
  const [confirmClear, setConfirmClear] = useState(false)
  const total = totalReclaimedYearly(reclaimed)
  const history = [...reclaimed].reverse()
  const chargeCount = charges.length
  const recurringCount = charges.filter((c) => c.cadence !== 'once').length
  const monthlyBurn = totalMonthly(charges)
  const yearlyBurn = totalYearly(charges)

  return (
    <div className="screen">
      <header className="topbar">
        <button className="icon-btn" onClick={props.onBack} aria-label="Back to the mantel">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M11.5 3.5 6 9l5.5 5.5" />
          </svg>
        </button>
        <span className="topbar-title">Settings</span>
        <span className="icon-btn" aria-hidden="true" />
      </header>

      {/* Reclaimed — the payoff, shown first */}
      <section className="set-block set-reclaimed">
        <span className="label">Reclaimed so far</span>
        <CountUp className="reclaim-figure" cents={total} currency={settings.currency} />
        <span className="reclaim-sub">
          {reclaimed.length === 0
            ? 'Snuff something you no longer need and watch this grow.'
            : `across ${reclaimed.length} ${reclaimed.length === 1 ? 'thing' : 'things'} you let go — money that stays with you each year`}
        </span>
        {history.length > 0 && (
          <ul className="reclaim-list">
            {history.map((r) => (
              <li key={r.id} className="reclaim-row">
                <span className="reclaim-name">{r.name}</span>
                <span className="reclaim-amt">
                  {money(reclaimedValue(r), settings.currency)}
                  <em>
                    {r.cadence === 'once'
                      ? r.isTrial
                        ? ' dodged'
                        : ' once'
                      : ` a year`}
                  </em>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {recurringCount > 0 && (
        <section className="set-block">
          <span className="label">What you're carrying</span>
          <p className="set-copy">
            You're carrying <strong>{money(monthlyBurn)}</strong> a month across{' '}
            {recurringCount} recurring {recurringCount === 1 ? 'charge' : 'charges'} — about{' '}
            <strong>{money(yearlyBurn)}</strong> a year.
          </p>
        </section>
      )}

      <section className="set-block">
        <span className="label">Appearance</span>
        <div className="seg">
          {THEMES.map((t) => (
            <button
              key={t.value}
              className={`seg-btn${settings.theme === t.value ? ' seg-btn--on' : ''}`}
              onClick={() => props.onSetTheme(t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      <section className="set-block">
        <label className="label" htmlFor="currency-select">
          Currency
        </label>
        <select
          id="currency-select"
          value={settings.currency}
          onChange={(e) => props.onSetCurrency(e.target.value as CurrencyCode)}
        >
          {CURRENCIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </section>

      <section className="set-block">
        <span className="label">Reminders</span>
        <p className="set-copy">
          Wick nudges you when you open it. For a reminder that reaches you even
          when the app is closed, add your renewals to your phone's calendar —
          it alarms on its own, no account needed.
        </p>
        <button
          className="pill pill--primary set-full"
          onClick={props.onExportAllCalendar}
          disabled={chargeCount === 0}
        >
          Add all renewals to calendar
        </button>
        {props.permission === 'default' && (
          <button className="quiet-btn" onClick={props.onAllowReminders}>
            Also allow in-app notifications
          </button>
        )}
        {props.permission === 'granted' && (
          <p className="set-note">In-app notifications are on.</p>
        )}
        {props.permission === 'denied' && (
          <p className="set-note">
            In-app notifications are blocked in your browser — the calendar
            route above still works.
          </p>
        )}
      </section>

      <section className="set-block">
        <span className="label">Your data</span>
        <p className="set-copy">
          Everything lives only on this device. Back up before clearing your
          browser, switching phones, or reinstalling.
        </p>
        <div className="set-buttons">
          <button className="pill pill--ghost" onClick={props.onBackup} disabled={chargeCount === 0 && reclaimed.length === 0}>
            Back up to a file
          </button>
          <button className="pill pill--ghost" onClick={props.onRestore}>
            Restore from a file
          </button>
        </div>
      </section>

      <section className="set-block">
        <span className="label set-danger-label">Danger zone</span>
        {!confirmClear ? (
          <button className="quiet-btn quiet-btn--danger" onClick={() => setConfirmClear(true)}>
            Clear everything
          </button>
        ) : (
          <div className="set-confirm">
            <p className="set-copy">
              This erases every charge, your reclaimed history, and settings on
              this device. It can't be undone. Back up first if you're unsure.
            </p>
            <div className="set-buttons">
              <button className="quiet-btn" onClick={() => setConfirmClear(false)}>
                Keep it
              </button>
              <button
                className="pill pill--danger"
                onClick={() => {
                  setConfirmClear(false)
                  props.onClearAll()
                }}
              >
                Erase everything
              </button>
            </div>
          </div>
        )}
      </section>

      <p className="set-about">
        Wick · private, local, offline. No account, no cloud, no tracking.
      </p>
    </div>
  )
}
