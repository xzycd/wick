import { useId } from 'react'

/**
 * The signature: time as wax. `fraction` is how much of the current billing
 * cycle remains; the candle burns down as the charge approaches.
 *
 * `heat` decides the flame: 'out' is unlit, 'low' is a calm small flame,
 * 'high' (landing within 3 days) burns taller and brighter.
 */

export type Heat = 'out' | 'low' | 'high'

interface CandleProps {
  fraction: number
  heat: Heat
  size?: 'row' | 'hero' | 'stage'
  /** When true, the flame goes out and a wisp of smoke rises — used on snuff. */
  snuffing?: boolean
}

const DIMENSIONS = {
  row: { w: 12, h: 46, waxW: 7, flameH: 15, wick: 3.5 },
  hero: { w: 30, h: 150, waxW: 18, flameH: 34, wick: 7 },
  stage: { w: 56, h: 250, waxW: 30, flameH: 56, wick: 10 },
}

export function Candle({ fraction, heat, size = 'row', snuffing = false }: CandleProps) {
  const id = useId().replace(/:/g, '')
  const { w, h, waxW, flameH: fullFlame, wick } = DIMENSIONS[size]
  const lit = heat !== 'out'
  const flameH = heat === 'low' ? fullFlame * 0.78 : fullFlame
  const pad = fullFlame + wick + 2
  const detailed = size !== 'row'

  const waxH = Math.max(h * 0.06, h * Math.min(1, Math.max(0, fraction)))
  const waxX = (w - waxW) / 2
  const waxTop = pad + (h - waxH)
  const cx = w / 2
  const wickTop = waxTop - wick
  const flameBase = wickTop + wick * 0.35
  const poolRy = waxW * 0.13

  return (
    <svg
      className={`candle candle--${size} candle--${heat}${snuffing ? ' candle--snuffing' : ''}`}
      width={w}
      height={h + pad}
      viewBox={`0 0 ${w} ${h + pad}`}
      aria-hidden="true"
    >
      {detailed && (
        <defs>
          <linearGradient id={`fire-${id}`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" className="fire-stop-base" />
            <stop offset="0.5" className="fire-stop-mid" />
            <stop offset="1" className="fire-stop-tip" />
          </linearGradient>
          <radialGradient id={`halo-${id}`}>
            <stop offset="0" className="halo-stop-in" />
            <stop offset="1" className="halo-stop-out" />
          </radialGradient>
        </defs>
      )}

      {lit && detailed && (
        <ellipse
          className="candle-halo"
          cx={cx}
          cy={flameBase - flameH * 0.45}
          rx={flameH * 2.4}
          ry={flameH * 2.4}
          fill={`url(#halo-${id})`}
        />
      )}

      {/* ghost of the full taper — what has already burned away */}
      <rect className="candle-ghost" x={waxX} y={pad} width={waxW} height={h} rx={waxW / 2.6} />
      {/* remaining wax */}
      <rect className="candle-wax" x={waxX} y={waxTop} width={waxW} height={waxH} rx={waxW / 2.6} />
      <rect
        className="candle-sheen"
        x={waxX + waxW * 0.18}
        y={waxTop + waxW * 0.35}
        width={waxW * 0.2}
        height={Math.max(waxH - waxW * 0.8, 2)}
        rx={waxW * 0.1}
      />

      {lit && detailed && (
        <>
          {/* the melt pool, lit from above */}
          <ellipse
            className="candle-pool"
            cx={cx}
            cy={waxTop + poolRy * 1.1}
            rx={waxW * 0.36}
            ry={poolRy}
          />
          {/* a run of wax down the side, and a bead that slides along it */}
          <path
            className="candle-drip"
            d={`M ${waxX + waxW * 0.86} ${waxTop + poolRy} q ${waxW * 0.1} ${waxH * 0.12} ${waxW * 0.02} ${Math.min(waxH * 0.26, 40)}`}
          />
          <circle
            className="candle-bead"
            cx={waxX + waxW * 0.9}
            cy={waxTop + poolRy * 2}
            r={Math.max(waxW * 0.06, 1)}
          />
        </>
      )}

      {/* wick — curls slightly, as burnt wicks do */}
      <path
        className="candle-wick"
        d={`M ${cx} ${waxTop} q ${wick * 0.08} ${-wick * 0.5} ${wick * 0.16} ${-wick}`}
        fill="none"
      />

      {lit && (
        <g className="candle-flame" style={{ transformOrigin: `${cx}px ${flameBase}px` }}>
          {!detailed && (
            <ellipse
              className="flame-glow"
              cx={cx}
              cy={flameBase - flameH * 0.55}
              rx={flameH * 0.55}
              ry={flameH * 0.7}
            />
          )}
          <g className="flame-sway" style={{ transformOrigin: `${cx}px ${flameBase}px` }}>
            <path
              className="flame-outer"
              d={flamePath(cx, flameBase, flameH)}
              fill={detailed ? `url(#fire-${id})` : undefined}
            />
            {detailed && (
              <ellipse
                className="flame-root"
                cx={cx}
                cy={flameBase - flameH * 0.1}
                rx={flameH * 0.11}
                ry={flameH * 0.13}
              />
            )}
            <path
              className="flame-core"
              style={{ transformOrigin: `${cx}px ${flameBase}px` }}
              d={flamePath(cx, flameBase - flameH * 0.04, flameH * 0.45)}
            />
          </g>
          {detailed && (
            <circle className="wick-ember" cx={cx + wick * 0.16} cy={wickTop} r={Math.max(wick * 0.16, 1)} />
          )}
        </g>
      )}

      {snuffing && (
        <path
          className="candle-smoke"
          style={{ transformOrigin: `${cx}px ${waxTop}px` }}
          d={smokePath(cx, wickTop - 1, flameH * (detailed ? 1.4 : 1.2))}
          fill="none"
        />
      )}
    </svg>
  )
}

/** A curling wisp rising from (cx, baseY). */
function smokePath(cx: number, baseY: number, h: number): string {
  const s = h * 0.42
  return [
    `M ${cx} ${baseY}`,
    `C ${cx - s} ${baseY - h * 0.3}, ${cx + s} ${baseY - h * 0.55}, ${cx} ${baseY - h * 0.8}`,
    `C ${cx - s * 0.7} ${baseY - h}, ${cx + s * 0.5} ${baseY - h * 1.2}, ${cx} ${baseY - h * 1.4}`,
  ].join(' ')
}

/** A teardrop flame sitting on baseline (cx, baseY), reaching `h` up. */
function flamePath(cx: number, baseY: number, h: number): string {
  const w = h * 0.62
  const tipY = baseY - h
  return [
    `M ${cx} ${tipY}`,
    `C ${cx + w * 0.5} ${baseY - h * 0.55}, ${cx + w * 0.5} ${baseY - h * 0.18}, ${cx} ${baseY}`,
    `C ${cx - w * 0.5} ${baseY - h * 0.18}, ${cx - w * 0.5} ${baseY - h * 0.55}, ${cx} ${tipY}`,
    'Z',
  ].join(' ')
}

/** The flame state for a charge `days` away. Rows light only when close. */
export function heatFor(days: number, alwaysBurn: boolean): Heat {
  if (days < 0) return 'out'
  if (days <= 3) return 'high'
  return alwaysBurn ? 'low' : 'out'
}
