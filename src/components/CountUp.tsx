import { useEffect, useRef, useState } from 'react'
import type { CurrencyCode } from '../types'
import { money } from '../lib/format'

interface CountUpProps {
  /** Target amount in cents. */
  cents: number
  currency?: CurrencyCode
  className?: string
}

/**
 * Eases a money value up to its target — the reward beat when reclaimed
 * savings grow. Counts only from a previous lower value (so it celebrates
 * gains, not loads), and respects reduced-motion by snapping.
 */
export function CountUp({ cents, currency, className }: CountUpProps) {
  // Start at zero and tally up on mount — the reveal when you open the screen.
  const reducedInit =
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
  const [shown, setShown] = useState(reducedInit ? cents : 0)
  const prev = useRef(reducedInit ? cents : 0)
  const raf = useRef<number | undefined>(undefined)

  useEffect(() => {
    const from = prev.current
    prev.current = cents
    const reduced =
      typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
    // Only animate a genuine increase; otherwise snap.
    if (reduced || cents <= from) {
      setShown(cents)
      return
    }
    const dur = 720
    const start = performance.now()
    const tick = (now: number) => {
      const k = Math.min((now - start) / dur, 1)
      const eased = 1 - Math.pow(1 - k, 3) // ease-out cubic
      setShown(Math.round(from + (cents - from) * eased))
      if (k < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current)
    }
  }, [cents])

  return (
    <span className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {money(shown, currency)}
    </span>
  )
}
