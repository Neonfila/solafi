import { useEffect, useRef, useState } from 'react'
import { nairaShort } from '../lib/calc.js'

// Money spent over five years: staying as you are vs going solar.
// Drawn at the container's real pixel width so labels stay readable on phones.
export default function SavingsChart({ series, tenorMonths }) {
  const ref = useRef(null)
  const [w, setW] = useState(560)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(Math.max(260, Math.round(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const narrow = w < 420
  const h = narrow ? 190 : 220
  const pad = { l: 8, r: 8, t: 12, b: 26 }
  const months = series.length - 1
  const last = series[months]
  const max = Math.max(last.current, last.solar, 1)
  const x = (m) => pad.l + (m / months) * (w - pad.l - pad.r)
  const y = (v) => h - pad.b - (v / max) * (h - pad.t - pad.b)
  const line = (key) => series.map((p, i) => `${i ? 'L' : 'M'}${x(p.month).toFixed(1)} ${y(p[key]).toFixed(1)}`).join(' ')
  const gap = `${line('current')} ${[...series].reverse().map((p) => `L${x(p.month).toFixed(1)} ${y(Math.min(p.solar, p.current)).toFixed(1)}`).join(' ')} Z`
  const years = Array.from({ length: Math.round(months / 12) + 1 }, (_, i) => i)

  return (
    <div className="chart" ref={ref}>
      <svg width={w} height={h} role="img" aria-label={`Money spent over ${years.length - 1} years. Staying as you are: ${nairaShort(last.current)}. With Solafi: ${nairaShort(last.solar)}.`}>
        <line x1={pad.l} x2={w - pad.r} y1={h - pad.b} y2={h - pad.b} className="chart-grid" />
        {years.map((yr) => (
          <text key={yr} x={x(yr * 12)} y={h - 6} textAnchor={yr === 0 ? 'start' : yr === years.length - 1 ? 'end' : 'middle'} className="chart-tick">
            {yr === 0 ? (narrow ? 'Now' : 'Today') : narrow ? `Yr ${yr}` : `Year ${yr}`}
          </text>
        ))}
        {tenorMonths > 0 && tenorMonths < months && (
          <g>
            <line x1={x(tenorMonths)} x2={x(tenorMonths)} y1={pad.t} y2={h - pad.b} className="chart-marker" />
            <text x={x(tenorMonths) + 6} y={pad.t + 10} className="chart-note">Paid off</text>
          </g>
        )}
        <path d={gap} className="chart-gap" />
        <path d={line('current')} className="chart-line chart-line--current" />
        <path d={line('solar')} className="chart-line chart-line--solar" />
      </svg>
      <div className="chart-legend">
        <span><i className="sw sw--current" />Staying as you are</span>
        <span><i className="sw sw--solar" />With Solafi</span>
      </div>
    </div>
  )
}
