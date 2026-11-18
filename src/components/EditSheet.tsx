import { useEffect, useRef, useState } from 'react'
import type { Cadence, Category, Charge } from '../types'
import { todayISO } from '../lib/dates'
import { newId } from '../lib/store'
import { PRESETS, type Preset } from '../data/presets'
import { CATEGORIES } from '../data/categories'
import { Seal } from './Seal'

interface EditSheetProps {
  /** Existing charge when editing; null when adding. */
  charge: Charge | null
  onSave: (charge: Charge) => void
  onClose: () => void
}

const CADENCES: { value: Cadence; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'once', label: 'One-off' },
]

const REMIND_OPTIONS: { value: string; label: string }[] = [
  { value: 'none', label: 'No reminder' },
  { value: '0', label: 'On the day' },
  { value: '1', label: '1 day before' },
  { value: '2', label: '2 days before' },
  { value: '3', label: '3 days before' },
  { value: '7', label: 'A week before' },
]

export function EditSheet({ charge, onSave, onClose }: EditSheetProps) {
  const adding = charge === null
  const [name, setName] = useState(charge?.name ?? '')
  const [amount, setAmount] = useState(
    charge ? (charge.amountCents / 100).toFixed(2).replace(/\.00$/, '') : '',
  )
  const [cadence, setCadence] = useState<Cadence>(charge?.cadence ?? 'monthly')
  const [isTrial, setIsTrial] = useState(charge?.isTrial ?? false)
  const [anchor, setAnchor] = useState(charge?.anchor ?? '')
  const [remind, setRemind] = useState(
    charge ? (charge.remindDaysBefore === null ? 'none' : String(charge.remindDaysBefore)) : '2',
  )
  const [note, setNote] = useState(charge?.note ?? '')
  const [cancelUrl, setCancelUrl] = useState(charge?.cancelUrl ?? '')
  const [presetId, setPresetId] = useState(charge?.presetId ?? null)
  const [category, setCategory] = useState<Category>(charge?.category ?? 'other')
  const [error, setError] = useState('')

  // Modal a11y: move focus into the sheet on open (without popping the mobile
  // keyboard), trap Tab inside it, close on Escape, and hand focus back to the
  // trigger when it closes.
  const sheetRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    sheetRef.current?.focus({ preventScroll: true })
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab' || !sheetRef.current) return
      const items = sheetRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])',
      )
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      if (e.shiftKey && (active === first || active === sheetRef.current)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      opener?.focus?.()
    }
  }, [])

  function applyPreset(p: Preset) {
    setPresetId(p.id)
    setName(p.name)
    setAmount((p.amountCents / 100).toFixed(2))
    setCadence(p.cadence)
    setCategory(p.category)
    setCancelUrl(p.cancelUrl)
    setError('')
  }

  function parseAmount(raw: string): number | null {
    const n = Number(raw.replace(/[$,\s]/g, ''))
    if (!Number.isFinite(n) || n < 0) return null
    return Math.round(n * 100)
  }

  function submit() {
    const cents = parseAmount(amount)
    if (!name.trim()) return setError('Give it a name — even "that meditation app".')
    if (cents === null) return setError('The amount needs to be a number, like 11.99.')
    if (!anchor) return setError(isTrial ? 'When does the trial end?' : 'When does it renew next?')
    onSave({
      id: charge?.id ?? newId(),
      name: name.trim(),
      presetId,
      amountCents: cents,
      cadence: isTrial ? 'once' : cadence,
      category,
      anchor,
      isTrial,
      stance: charge?.stance ?? (isTrial ? 'undecided' : 'keep'),
      note: note.trim(),
      cancelUrl: cancelUrl.trim(),
      remindDaysBefore: remind === 'none' ? null : Number(remind),
      createdAt: charge?.createdAt ?? todayISO(),
    })
  }

  return (
    <div className="backdrop" onClick={onClose}>
      <div
        className="sheet"
        ref={sheetRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={adding ? 'Add a charge' : 'Edit charge'}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-handle" aria-hidden="true" />
        <h2 className="sheet-title">{adding ? 'Add a charge' : `Edit ${charge.name}`}</h2>

        {adding && (
          <div className="presets">
            <span className="label">Quick picks</span>
            <div className="preset-grid">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  className={`preset${presetId === p.id ? ' preset--on' : ''}`}
                  onClick={() => applyPreset(p)}
                  title={p.name}
                >
                  <Seal initial={p.initial} shape={p.shape} tint={p.tint} size={40} />
                  <span className="preset-name">{p.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <label className="field">
          <span className="label">Name</span>
          <input
            type="text"
            value={name}
            placeholder="Spotify, gym, that meditation app…"
            onChange={(e) => {
              setName(e.target.value)
              setPresetId(null)
            }}
          />
        </label>

        <div className="field-row">
          <label className="field field--amount">
            <span className="label">Amount</span>
            <div className="amount-wrap">
              <span className="amount-sign" aria-hidden="true">$</span>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                placeholder="11.99"
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </label>
          <label className="field">
            <span className="label">{isTrial ? 'Trial ends' : cadence === 'once' ? 'Due on' : 'Next renewal'}</span>
            <input type="date" value={anchor} onChange={(e) => setAnchor(e.target.value)} />
          </label>
        </div>

        {!isTrial && (
          <div className="field">
            <span className="label">How often</span>
            <div className="seg">
              {CADENCES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={`seg-btn${cadence === c.value ? ' seg-btn--on' : ''}`}
                  onClick={() => setCadence(c.value)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <label className="check">
          <input type="checkbox" checked={isTrial} onChange={(e) => setIsTrial(e.target.checked)} />
          <span>
            This is a free trial <em>— the amount is what lands if I forget</em>
          </span>
        </label>

        <div className="field">
          <span className="label">Category</span>
          <div className="chips">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                className={`chip${category === c.value ? ' chip--on' : ''}`}
                onClick={() => setCategory(c.value)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <label className="field">
          <span className="label">Remind me</span>
          <select value={remind} onChange={(e) => setRemind(e.target.value)}>
            {REMIND_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="label">Note to self (optional)</span>
          <textarea
            rows={2}
            value={note}
            placeholder="Why did I sign up for this?"
            onChange={(e) => setNote(e.target.value)}
          />
        </label>

        <label className="field">
          <span className="label">Cancel link (optional)</span>
          <input
            type="url"
            value={cancelUrl}
            placeholder="https://…/account/subscription"
            onChange={(e) => setCancelUrl(e.target.value)}
          />
        </label>

        {error && <p className="form-error" role="alert">{error}</p>}

        <div className="sheet-actions">
          <button className="quiet-btn" onClick={onClose}>
            Never mind
          </button>
          <button className="pill pill--primary" onClick={submit}>
            {adding ? 'Put it on the mantel' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
