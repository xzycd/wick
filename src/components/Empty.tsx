interface EmptyProps {
  onAdd: () => void
  onSeed: () => void
}

export function Empty({ onAdd, onSeed }: EmptyProps) {
  return (
    <div className="empty">
      <svg className="empty-candle" width="120" height="170" viewBox="0 0 120 170" aria-hidden="true">
        {/* an unlit taper waiting on its holder */}
        <line className="empty-line" x1="60" y1="34" x2="60" y2="26" />
        <path className="empty-line" d="M60 26 q 5 -6 0 -10" fill="none" />
        <rect className="empty-wax" x="49" y="34" width="22" height="92" rx="8" />
        <path className="empty-holder" d="M34 126 h52 l-7 14 h-38 z" />
        <ellipse className="empty-holder" cx="60" cy="146" rx="34" ry="7" />
      </svg>
      <h2 className="empty-title">The mantel is clear.</h2>
      <p className="empty-copy">
        Nothing is due, and nothing is lurking. Add a trial or a subscription
        and Wick will watch the calendar so you don't have to.
      </p>
      <button className="pill pill--primary" onClick={onAdd}>
        Add your first charge
      </button>
      <button className="quiet-btn" onClick={onSeed}>
        Or see it with a few examples
      </button>
    </div>
  )
}
