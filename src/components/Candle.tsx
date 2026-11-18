/**
 * The signature: time as wax. `fraction` is how much of the current billing
 * cycle remains; the candle burns down as the charge approaches. Anything
 * landing within 3 days is lit.
 */

interface CandleProps {
  fraction: number
  lit: boolean
  size?: 'row' | 'hero'
  /** When true, the flame goes out and a wisp of smoke rises — used on snuff. */
  snuffing?: boolean
}

export function Candle({ fraction, lit, size = 'row', snuffing = false }: CandleProps) {
  const hero = size === 'hero'
  const w = hero ? 30 : 12
  const h = hero ? 150 : 46
  const waxW = hero ? 18 : 7
  const flameH = hero ? 34 : 15
  const pad = flameH + 4

  const waxH = Math.max(h * 0.06, h * Math.min(1, Math.max(0, fraction)))
  const waxX = (w - waxW) / 2
  const waxTop = pad + (h - waxH)
  const cx = w / 2

  return (
    <svg
      className={`candle candle--${size}${lit ? ' candle--lit' : ''}${snuffing ? ' candle--snuffing' : ''}`}
      width={w}
      height={h + pad}
      viewBox={`0 0 ${w} ${h + pad}`}
      aria-hidden="true"
    >
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
      {/* wick */}
      <line className="candle-wick" x1={cx} y1={waxTop} x2={cx} y2={waxTop - (hero ? 7 : 3.5)} />
      {lit && (
        <g
          className="candle-flame"
          style={{ transformOrigin: `${cx}px ${waxTop - (hero ? 6 : 3)}px` }}
        >
          <ellipse
            className="flame-glow"
            cx={cx}
            cy={waxTop - flameH * 0.55}
            rx={flameH * 0.55}
            ry={flameH * 0.7}
          />
          <path
            className="flame-outer"
            d={flamePath(cx, waxTop - (hero ? 6 : 3), flameH)}
          />
          <path
            className="flame-core"
            d={flamePath(cx, waxTop - (hero ? 6 : 3), flameH * 0.45)}
          />
        </g>
      )}
      {snuffing && (
        <path
          className="candle-smoke"
          style={{ transformOrigin: `${cx}px ${waxTop}px` }}
          d={smokePath(cx, waxTop - (hero ? 8 : 4), flameH * (hero ? 1.4 : 1.2))}
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
