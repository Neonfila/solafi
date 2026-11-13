import { useEffect, useRef, useState } from 'react'
import { nairaShort } from '../lib/calc.js'

// Cumulative spend over time: staying as you are vs going solar.
// Drawn at the container's real pixel width so labels stay readable on phones.
export default function SavingsChart({ series, tenorMonths, breakEvenMonth }) {
  const ref = useRef(null)
  const [w, setW] = useState(560)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(Math.max(260, Math.round(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const h = w < 420 ? 220 : 260
  const pad = { l: 46, r: 22, t: 14, b: 28 }
  const months = series.length - 1
  const last = series[months]
  const max = Math.max(last.current, last.solar, 1)
  const x = (m) => pad.l + (m / months) * (w - pad.l - pad.r)
  const y = (v) => h - pad.b - (v / max) * (h - pad.t - pad.b)
  const line = (key) => series.map((p, i) => `${i ? 'L' : 'M'}${x(p.month).toFixed(1)} ${y(p[key]).toFixed(1)}`).join(' ')
  const gap = `${line('current')} ${[...series].reverse().map((p) => `L${x(p.month).toFixed(1)} ${y(p.solar).toFixed(1)}`).join(' ')} Z`

  const years = months / 12
  const step = years <= 6 ? 1 : years <= 12 ? 2 : 5
  const ticks = []
  for (let yr = 0; yr <= years; yr += step) ticks.push(yr)
  const be = breakEvenMonth && breakEvenMonth <= months ? series[breakEvenMonth] : null

  return (
    <div className="chart" ref={ref}>
      <svg width={w} height={h} role="img" aria-label={`Cumulative spend over ${years} years. Staying as you are: ${nairaShort(last.current)}. With Solafi: ${nairaShort(last.solar)}.`}>
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={pad.l} x2={w - pad.r} y1={y(max * f)} y2={y(max * f)} className="chart-grid" />
            <text x={pad.l - 8} y={y(max * f) + 4} textAnchor="end" className="chart-tick">{nairaShort(max * f)}</text>
          </g>
        ))}
        {ticks.map((yr) => (
          <text key={yr} x={x(yr * 12)} y={h - 8} textAnchor="middle" className="chart-tick">{yr === 0 ? 'Now' : `Yr ${yr}`}</text>
        ))}
        {tenorMonths > 0 && tenorMonths < months && (
          <g>
            <line x1={x(tenorMonths)} x2={x(tenorMonths)} y1={pad.t} y2={h - pad.b} className="chart-marker" />
            <text x={x(tenorMonths) + 6} y={pad.t + 10} className="chart-note">Loan paid off</text>
          </g>
        )}
        <path d={gap} className="chart-gap" />
        <path d={line('current')} className="chart-line chart-line--current" />
        <path d={line('solar')} className="chart-line chart-line--solar" />
        {be && <circle cx={x(be.month)} cy={y(be.solar)} r="5" className="chart-be" />}
      </svg>
      <div className="chart-legend">
        <span><i className="sw sw--current" />NEPA + generator</span>
        <span><i className="sw sw--solar" />With Solafi</span>
        {be && <span><i className="sw sw--be" />Break-even</span>}
      </div>
    </div>
  )
}
