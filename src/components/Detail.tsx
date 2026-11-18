import { useState } from 'react'
import type { Charge, Stance } from '../types'
import { cycleFraction } from '../lib/dates'
import { cadenceLabel, countdownLabel, daysLeft, longDate, money, nextFor } from '../lib/format'
import { presetById } from '../data/presets'
import { categoryLabel } from '../data/categories'
import { Candle } from './Candle'
import { Seal } from './Seal'

interface DetailProps {
  charge: Charge
  today: string
  onBack: () => void
  onEdit: () => void
  onSetStance: (stance: Stance) => void
  onSnuff: () => void
  onAddToCalendar: () => void
}

const STANCES: { value: Stance; label: string }[] = [
  { value: 'keep', label: 'Keeping it' },
  { value: 'undecided', label: 'Undecided' },
  { value: 'cancel', label: 'Cancel it' },
]

export function Detail({
  charge,
  today,
  onBack,
  onEdit,
  onSetStance,
  onSnuff,
  onAddToCalendar,
}: DetailProps) {
  const days = daysLeft(charge, today)
  const fraction = cycleFraction(charge.anchor, charge.cadence, today, charge.createdAt)
  const next = nextFor(charge, today)
  const preset = presetById(charge.presetId)
  const helpUrl =
    charge.cancelUrl ||
    `https://www.google.com/search?q=${encodeURIComponent(`how to cancel ${charge.name}`)}`

  // Snuffing puts the candle out — a brief smoke wisp, then the deletion.
  const [snuffing, setSnuffing] = useState(false)
  function handleSnuff() {
    const reduced =
      typeof matchMedia !== 'undefined' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return onSnuff()
    setSnuffing(true)
    window.setTimeout(onSnuff, 720)
  }

  return (
    <div className="screen">
      <header className="topbar">
        <button className="icon-btn" onClick={onBack} aria-label="Back to the mantel">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M11.5 3.5 6 9l5.5 5.5" />
          </svg>
        </button>
        <button className="quiet-btn" onClick={onEdit}>
          Edit
        </button>
      </header>

      <div className="detail-head">
        <Seal
          initial={preset?.initial ?? charge.name.charAt(0).toUpperCase()}
          shape={preset?.shape}
          tint={preset?.tint}
          size={56}
        />
        <span className="detail-cat">{categoryLabel[charge.category]}</span>
        <h1 className="detail-name">{charge.name}</h1>
        <p className="detail-price">
          {money(charge.amountCents)}
          <span className="detail-cadence">
            {charge.cadence === 'once'
              ? charge.isTrial
                ? ' after the trial'
                : ' one-off'
              : cadenceLabel[charge.cadence]}
          </span>
        </p>
      </div>

      <div className="detail-burn">
        <Candle fraction={fraction} lit={days >= 0 && days <= 3} size="hero" snuffing={snuffing} />
        <div className="detail-burn-text">
          <span className={`row-status${days >= 0 && days <= 3 ? ' row-status--low' : ''}`}>
            {countdownLabel(days, charge.isTrial)}
          </span>
          <span className="detail-date">
            {charge.isTrial ? 'Trial ends ' : charge.cadence === 'once' ? 'Due ' : 'Renews '}
            {longDate(next)}
          </span>
          {charge.remindDaysBefore !== null && days >= 0 && (
            <span className="detail-remind">
              Reminder {charge.remindDaysBefore === 0 ? 'on the day' : `${charge.remindDaysBefore} ${charge.remindDaysBefore === 1 ? 'day' : 'days'} before`}
            </span>
          )}
        </div>
      </div>

      <div className="stance">
        <h2 className="label section-label">What's the plan?</h2>
        <div className="seg" role="radiogroup" aria-label="Plan for this charge">
          {STANCES.map((s) => (
            <button
              key={s.value}
              role="radio"
              aria-checked={charge.stance === s.value}
              className={`seg-btn${charge.stance === s.value ? ' seg-btn--on' : ''}`}
              onClick={() => onSetStance(s.value)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {charge.note && (
        <div className="detail-note">
          <h2 className="label section-label">Note to self</h2>
          <p>{charge.note}</p>
        </div>
      )}

      <div className="detail-actions">
        {charge.stance === 'cancel' && (
          <a className="pill pill--primary" href={helpUrl} target="_blank" rel="noreferrer">
            {charge.cancelUrl ? 'Open the cancel page' : 'Find out how to cancel'}
          </a>
        )}
        {days >= 0 && (
          <button
            className={charge.stance === 'cancel' ? 'pill pill--ghost' : 'pill pill--primary'}
            onClick={onAddToCalendar}
          >
            Add to calendar
          </button>
        )}
        {charge.stance !== 'cancel' && (
          <a className="quiet-btn" href={helpUrl} target="_blank" rel="noreferrer">
            How would I cancel this?
          </a>
        )}
        <button
          className="quiet-btn quiet-btn--danger"
          onClick={handleSnuff}
          disabled={snuffing}
        >
          Snuff it — canceled or no longer needed
        </button>
      </div>
    </div>
  )
}
