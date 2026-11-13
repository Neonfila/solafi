// Solafi mark: a sun rising over a single green line (the power that stays on).
export function SolafiMark({ size = 28 }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" className="solafi-mark">
      <g style={{ stroke: 'var(--sun)' }} strokeWidth="5" strokeLinecap="round">
        <path d="M32 5v8M10 18l6 6M54 18l-6 6" />
      </g>
      <path d="M15 44a17 17 0 0 1 34 0z" style={{ fill: 'var(--sun)' }} />
      <path d="M8 54h48" style={{ stroke: 'var(--leaf)' }} strokeWidth="5" strokeLinecap="round" />
    </svg>
  )
}

export default function Logo({ size = 28 }) {
  return (
    <span className="logo">
      <SolafiMark size={size} />
      <span className="logo-word">solafi</span>
    </span>
  )
}
