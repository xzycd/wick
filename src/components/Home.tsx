import { useMemo, useState } from 'react'
import type { Category, Charge, Reclaimed } from '../types'
import { cycleFraction } from '../lib/dates'
import { countdownLabel, daysLeft, longDate, money, nextFor, priceLine, shortDate } from '../lib/format'
import { totalReclaimedYearly } from '../lib/money'
import type { DueReminder } from '../lib/notify'
import { reminderBody } from '../lib/notify'
import { categoryLabel } from '../data/categories'
import { Candle, heatFor } from './Candle'
import { Empty } from './Empty'

interface HomeProps {
  charges: Charge[]
  reclaimed: Reclaimed[]
  today: string
  reminders: DueReminder[]
  onOpen: (id: string) => void
  onAdd: () => void
  onSeed: () => void
  onOpenSettings: () => void
  themeLabel: string
  onToggleTheme: () => void
  permissionNudge: boolean
  onAllowReminders: () => void
  /** Desktop: the hero lives on the stage, and the list marks what's open there. */
  wide?: boolean
  selectedId?: string
}

type Sort = 'soonest' | 'priciest' | 'name'

export function Home(props: HomeProps) {
  const { charges, today, onOpen, wide = false, selectedId } = props
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<Category | 'all'>('all')
  const [sort, setSort] = useState<Sort>('soonest')

  const showControls = charges.length > 4
  const filtering = showControls && (query.trim() !== '' || category !== 'all' || sort !== 'soonest')

  const bySoonest = (a: Charge, b: Charge) => daysLeft(a, today) - daysLeft(b, today)

  // Categories actually present, so the chip row never offers empty filters.
  const presentCategories = useMemo(() => {
    const set = new Set(charges.map((c) => c.category))
    return (['all', ...set] as (Category | 'all')[]).filter((c) => c === 'all' || set.has(c))
  }, [charges])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = charges.filter(
      (c) =>
        (category === 'all' || c.category === category) &&
        (q === '' || c.name.toLowerCase().includes(q)),
    )
    const sorters: Record<Sort, (a: Charge, b: Charge) => number> = {
      soonest: bySoonest,
      priciest: (a, b) => b.amountCents - a.amountCents,
      name: (a, b) => a.name.localeCompare(b.name),
    }
    return [...list].sort(sorters[sort])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [charges, query, category, sort, today])

  const sorted = [...charges].sort(bySoonest)
  const upcoming = sorted.filter((c) => daysLeft(c, today) >= 0)
  const ended = sorted.filter((c) => daysLeft(c, today) < 0)
  const hero = wide ? undefined : upcoming[0]
  const rest = wide ? upcoming : upcoming.slice(1)
  const undecided = rest.filter((c) => c.stance === 'undecided' && daysLeft(c, today) <= 14)
  const comingUp = rest.filter((c) => !undecided.includes(c))

  const soon = upcoming.filter((c) => daysLeft(c, today) <= 30)
  const monthTotal = soon.reduce((sum, c) => sum + c.amountCents, 0)
  const reclaimedYearly = totalReclaimedYearly(props.reclaimed)

  return (
    <div className="screen">
      <header className="topbar">
        <h1 className="wordmark">
          wick<span className="wordmark-ember">.</span>
        </h1>
        <div className="topbar-actions">
          <button
            className="icon-btn"
            onClick={props.onToggleTheme}
            aria-label={`Switch to ${props.themeLabel} mode`}
          >
            {props.themeLabel === 'dark' ? <MoonGlyph /> : <SunGlyph />}
          </button>
          <button className="icon-btn" onClick={props.onOpenSettings} aria-label="Settings">
            <GearGlyph />
          </button>
        </div>
      </header>

      {charges.length === 0 ? (
        <Empty onAdd={props.onAdd} onSeed={props.onSeed} />
      ) : (
        <>
          {props.reminders.length > 0 && (
            <aside className="banner" role="status">
              {props.reminders.map((r) => (
                <button key={r.charge.id} className="banner-row" onClick={() => onOpen(r.charge.id)}>
                  {reminderBody(r)}
                </button>
              ))}
            </aside>
          )}

          {showControls && (
            <div className="controls">
              <div className="search">
                <SearchGlyph />
                <input
                  type="search"
                  value={query}
                  placeholder="Search your charges"
                  aria-label="Search charges"
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="chips chips--scroll">
                {presentCategories.map((c) => (
                  <button
                    key={c}
                    className={`chip${category === c ? ' chip--on' : ''}`}
                    onClick={() => setCategory(c)}
                  >
                    {c === 'all' ? 'All' : categoryLabel[c]}
                  </button>
                ))}
                <span className="chips-sep" aria-hidden="true" />
                {(['soonest', 'priciest', 'name'] as Sort[]).map((s) => (
                  <button
                    key={s}
                    className={`chip chip--sort${sort === s ? ' chip--on' : ''}`}
                    onClick={() => setSort(s)}
                  >
                    {s === 'soonest' ? 'Soonest' : s === 'priciest' ? 'Priciest' : 'A–Z'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {filtering ? (
            filtered.length === 0 ? (
              <p className="no-results">Nothing matches that. Try another word or category.</p>
            ) : (
              <section className="rows rows--flat">
                <h2 className="label section-label">
                  {filtered.length} {filtered.length === 1 ? 'charge' : 'charges'}
                </h2>
                {filtered.map((c, i) => (
                  <Row key={c.id} charge={c} today={today} onOpen={onOpen} index={i} selected={c.id === selectedId} />
                ))}
              </section>
            )
          ) : (
            <>
              {hero && <Hero charge={hero} today={today} onOpen={onOpen} />}

              {soon.length > 0 && (
                <p className="month-line">
                  {money(monthTotal)} across{' '}
                  {soon.length === 1 ? 'one charge' : `${soon.length} charges`} in the next 30 days
                </p>
              )}

              {undecided.length > 0 && (
                <Section label="Needs a decision" charges={undecided} today={today} onOpen={onOpen} selectedId={selectedId} />
              )}
              {comingUp.length > 0 && (
                <Section label="On the mantel" charges={comingUp} today={today} onOpen={onOpen} selectedId={selectedId} />
              )}
              {ended.length > 0 && (
                <Section label="Already ended" charges={ended} today={today} onOpen={onOpen} selectedId={selectedId} dim />
              )}

              {reclaimedYearly > 0 && (
                <button className="reclaim-nudge" onClick={props.onOpenSettings}>
                  <span>
                    You've reclaimed <strong>{money(reclaimedYearly)}</strong> a year so far
                  </span>
                  <ChevronGlyph />
                </button>
              )}

              {props.permissionNudge && (
                <button className="quiet-btn nudge" onClick={props.onAllowReminders}>
                  Allow notifications so reminders can reach you
                </button>
              )}
            </>
          )}
        </>
      )}

      {charges.length > 0 && (
        <div className="dock">
          <button className="pill pill--primary" onClick={props.onAdd}>
            Add a charge
          </button>
        </div>
      )}
    </div>
  )
}

function Hero({ charge, today, onOpen }: { charge: Charge; today: string; onOpen: (id: string) => void }) {
  const days = daysLeft(charge, today)
  const fraction = cycleFraction(charge.anchor, charge.cadence, today, charge.createdAt)
  const nextDate = longDate(nextFor(charge, today))
  return (
    <button className="hero" onClick={() => onOpen(charge.id)}>
      <div className="hero-text">
        <span className="label">{charge.isTrial ? 'Trial ends next' : 'Next to land'}</span>
        <span className="numeral">
          {days === 0 ? (
            'Today'
          ) : (
            <>
              {days}
              <em className="numeral-unit">{days === 1 ? 'day' : 'days'}</em>
            </>
          )}
        </span>
        <span className="hero-name">{charge.name}</span>
        <span className="hero-meta">
          {priceLine(charge)} · {nextDate}
        </span>
        {charge.stance === 'undecided' && (
          <span className="hero-undecided">You haven't decided on this one yet</span>
        )}
      </div>
      <Candle fraction={fraction} heat={heatFor(days, true)} size="hero" />
    </button>
  )
}

function Section({
  label,
  charges,
  today,
  onOpen,
  selectedId,
  dim,
}: {
  label: string
  charges: Charge[]
  today: string
  onOpen: (id: string) => void
  selectedId?: string
  dim?: boolean
}) {
  return (
    <section className={dim ? 'rows rows--dim' : 'rows'}>
      <h2 className="label section-label">{label}</h2>
      {charges.map((c, i) => (
        <Row key={c.id} charge={c} today={today} onOpen={onOpen} index={i} selected={c.id === selectedId} />
      ))}
    </section>
  )
}

function Row({
  charge,
  today,
  onOpen,
  index,
  selected = false,
}: {
  charge: Charge
  today: string
  onOpen: (id: string) => void
  index: number
  selected?: boolean
}) {
  const days = daysLeft(charge, today)
  const fraction = cycleFraction(charge.anchor, charge.cadence, today, charge.createdAt)
  return (
    <button
      className={selected ? 'row row--on' : 'row'}
      data-id={charge.id}
      aria-current={selected ? 'true' : undefined}
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
      onClick={() => onOpen(charge.id)}
    >
      <Candle fraction={fraction} heat={heatFor(days, false)} size="row" />
      <span className="row-main">
        <span className="row-name">{charge.name}</span>
        <span className={`row-status${days >= 0 && days <= 3 ? ' row-status--low' : ''}`}>
          {countdownLabel(days, charge.isTrial)}
          {charge.stance === 'cancel' && days >= 0 && ' · plan: cancel'}
        </span>
      </span>
      <span className="row-side">
        <span className="row-price">{priceLine(charge)}</span>
        <span className="row-date">{shortDate(nextFor(charge, today))}</span>
      </span>
    </button>
  )
}

function SunGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <circle cx="9" cy="9" r="3.6" />
      <path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.7 3.7l1.4 1.4M12.9 12.9l1.4 1.4M14.3 3.7l-1.4 1.4M5.1 12.9l-1.4 1.4" />
    </svg>
  )
}

function MoonGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14.5 11.2A6.5 6.5 0 0 1 6.8 3.5a6.5 6.5 0 1 0 7.7 7.7z" />
    </svg>
  )
}

function GearGlyph() {
  // Sliders/tune — distinct from the sun so the two topbar icons don't clash.
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M3 5.5h7M13 5.5h2M3 12.5h2M8 12.5h7" />
      <circle cx="11.5" cy="5.5" r="1.7" fill="var(--base)" />
      <circle cx="5.5" cy="12.5" r="1.7" fill="var(--base)" />
    </svg>
  )
}

function SearchGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5 14 14" />
    </svg>
  )
}

function ChevronGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 3.5 10.5 8 6 12.5" />
    </svg>
  )
}
