import { useId } from 'react'

// The NeonFila mark: one neon tube bent into an N whose last stroke ends in a
// lit dot (N + i — neon filament). Same geometry as assets/brand/neonfila-mark.svg.
// `ignite` plays the sign-switching-on sequence (draw → flicker → steady glow).
export const MARK_PATH = 'M26 83 V39 Q26 24 35.5 35.5 L64.5 70.5 Q74 82 74 67 V33'

export default function NeonMark({ size = 28, ignite = false, glow = true, className = '', title }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg
      viewBox="14 6 72 90"
      width={size * 0.8}
      height={size}
      className={`neon-mark${ignite ? ' neon-mark--ignite' : ''} ${className}`}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {glow && (
        <defs>
          <filter id={`g${id}`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>
      )}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {glow && <path className="nm-glow" d={MARK_PATH} pathLength="1" stroke="#FF4500" strokeWidth="14" filter={`url(#g${id})`} />}
        <path className="nm-tube" d={MARK_PATH} pathLength="1" stroke="#FF4500" strokeWidth="12" />
        {glow && <path className="nm-core" d={MARK_PATH} pathLength="1" stroke="#FFB08F" strokeWidth="3" />}
      </g>
      <circle className="nm-spark" cx="74" cy="18" r="6.5" fill="#F8F9FA" />
    </svg>
  )
}
