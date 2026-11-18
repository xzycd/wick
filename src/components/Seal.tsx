import type { SealShape, SealTint } from '../data/presets'

/**
 * An original wax-seal monogram — Wick's service mark. Never an official
 * logo: a warm-tinted seal shape stamped with an initial.
 */

function scallopPath(cx: number, cy: number, r: number, n = 11): string {
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
  })
  const arc = (r * 0.34).toFixed(2)
  let d = `M ${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`
  for (let i = 1; i <= n; i++) {
    const [x, y] = pts[i % n]
    d += ` A ${arc} ${arc} 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)}`
  }
  return d + ' Z'
}

interface SealProps {
  initial: string
  shape?: SealShape
  tint?: SealTint
  size?: number
}

export function Seal({ initial, shape = 'round', tint = 'bone', size = 44 }: SealProps) {
  return (
    <svg
      className={`seal seal--${tint}`}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden="true"
    >
      {shape === 'round' && <circle cx="24" cy="24" r="21" className="seal-wax" />}
      {shape === 'scalloped' && <path d={scallopPath(24, 24, 20.5)} className="seal-wax" />}
      {shape === 'squircle' && (
        <rect x="4" y="4" width="40" height="40" rx="14" className="seal-wax" />
      )}
      <circle cx="24" cy="24" r="15.5" className="seal-ring" />
      <text x="24" y="25" className="seal-letter" textAnchor="middle" dominantBaseline="central">
        {initial}
      </text>
    </svg>
  )
}
