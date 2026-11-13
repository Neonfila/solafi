import { useEffect, useState } from 'react'
import { Zap, ZapOff } from 'lucide-react'

// Hero visual: a street at night. When the grid drops, the street flickers out,
// the generators cough into life, and the house with solar simply stays on.
const houses = [
  { x: 14, w: 104, h: 118, roof: 34, win: [[18, 34], [62, 34], [18, 76]] },
  { x: 132, w: 92, h: 150, roof: 0, win: [[14, 24], [54, 24], [14, 66], [54, 66], [14, 108]], gen: true },
  { x: 418, w: 96, h: 136, roof: 30, win: [[16, 30], [58, 30], [58, 78]], gen: true },
  { x: 528, w: 100, h: 166, roof: 0, win: [[16, 24], [60, 24], [16, 68], [60, 68], [60, 112]] },
]
const GROUND = 330
const stars = [[40, 40], [150, 70], [210, 30], [300, 58], [372, 26], [440, 84], [560, 34], [610, 90], [86, 120], [262, 96], [500, 30], [340, 92]]

export default function StreetScene() {
  const [grid, setGrid] = useState(true)
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (touched) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setTimeout(() => setGrid((g) => !g), grid ? 3200 : 5200)
    return () => clearTimeout(t)
  }, [touched, grid])

  const toggle = () => {
    setTouched(true)
    setGrid((g) => !g)
  }

  return (
    <div className={`scene ${grid ? 'scene--on' : 'scene--off'}`}>
      <div className="scene-stage">
        <svg viewBox="0 0 640 400" preserveAspectRatio="xMidYMid slice" role="img" aria-label="A street at night. When the grid goes off, only the house with Solafi solar stays lit.">
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#040A12" />
              <stop offset="1" stopColor="#0E2A22" />
            </linearGradient>
            <radialGradient id="halo" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#FFB800" stopOpacity="0.6" />
              <stop offset="1" stopColor="#FFB800" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="pool" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#FFCB45" stopOpacity="0.5" />
              <stop offset="1" stopColor="#FFCB45" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="panel" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#3B6CF0" />
              <stop offset="1" stopColor="#0E2A6B" />
            </linearGradient>
          </defs>

          <rect width="640" height="400" fill="url(#sky)" />
          <g fill="#F4F1E8" className="stars">
            {stars.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.7 : 1.1} className="star" style={{ animationDelay: `${i * 0.37}s` }} />
            ))}
          </g>
          <circle cx="468" cy="62" r="18" fill="#F4F1E8" opacity="0.92" />
          <circle cx="460" cy="56" r="18" fill="#07101A" />

          {/* grid: poles, wire, and the current running through it */}
          <g>
            {[125, 521].map((x) => (
              <g key={x} fill="#0A1712">
                <rect x={x - 2.5} y="92" width="5" height={GROUND - 92} />
                <rect x={x - 16} y="98" width="32" height="4" />
              </g>
            ))}
            <path d="M0 110 Q62 126 125 100 Q323 136 521 100 Q580 124 640 108" className="wire" />
            <path d="M0 110 Q62 126 125 100 Q323 136 521 100 Q580 124 640 108" className="wire-current" />
            <g className="spark" transform="translate(125 99)">
              <path d="M0 -13 L3 -3 L13 0 L3 3 L0 13 L-3 3 L-13 0 L-3 -3 Z" fill="#FFE9A8" />
            </g>
          </g>

          {/* the neighbours */}
          {houses.map((h, i) => {
            const top = GROUND - h.h
            return (
              <g key={i}>
                {h.roof > 0 && <path d={`M${h.x - 6} ${top} L${h.x + h.w / 2} ${top - h.roof} L${h.x + h.w + 6} ${top} Z`} fill="#0B1A15" />}
                <rect x={h.x} y={top} width={h.w} height={h.h} fill="#0F211B" />
                {h.win.map(([wx, wy], j) => (
                  <rect
                    key={j}
                    x={h.x + wx} y={top + wy} width="26" height="28" rx="2"
                    className={`win ${h.gen && j === 0 ? 'win--gen' : ''}`}
                    style={{ animationDelay: `${((i * 5 + j * 3) % 7) * 70}ms` }}
                  />
                ))}
              </g>
            )
          })}

          {/* the street loses its light */}
          <rect width="640" height="400" className="dim" />

          {houses.filter((h) => h.gen).map((h) => (
            <g key={h.x} className="gen" transform={`translate(${h.x + h.w - 36} ${GROUND - 21})`}>
              <text x="14" y="-22" textAnchor="middle" className="vrr">vrrrr</text>
              <circle className="smoke" cx="30" cy="-2" r="5" />
              <circle className="smoke smoke--2" cx="34" cy="-6" r="7" />
              <circle className="smoke smoke--3" cx="30" cy="-10" r="9" />
              <g className="gen-body">
                <rect width="28" height="18" rx="3" fill="#E5484D" />
                <rect x="4" y="4" width="10" height="6" rx="1" fill="#06100C" opacity="0.5" />
                <rect x="2" y="18" width="4" height="3" fill="#06100C" />
                <rect x="22" y="18" width="4" height="3" fill="#06100C" />
              </g>
            </g>
          ))}

          <rect y={GROUND} width="640" height="70" fill="#06120E" />
          <path d={`M0 ${GROUND + 36}h640`} stroke="#F4F1E8" strokeOpacity="0.1" strokeWidth="2" strokeDasharray="26 22" />
          <ellipse cx="320" cy={GROUND + 14} rx="170" ry="24" fill="url(#pool)" className="pool" />

          {/* the Solafi house */}
          <g className="solafi-house">
            <ellipse cx="320" cy="248" rx="170" ry="130" fill="url(#halo)" className="halo" />
            <path d="M236 196 L320 138 L404 196 Z" fill="#14342A" />
            <g transform="translate(330 150) skewY(34.6)">
              <rect width="58" height="26" fill="url(#panel)" stroke="#9DBEFF" strokeWidth="1" />
              <path d="M14.5 0v26M29 0v26M43.5 0v26M0 13h58" stroke="#9DBEFF" strokeWidth="0.7" opacity="0.7" />
            </g>
            <rect x="246" y="196" width="148" height={GROUND - 196} fill="#18392E" />
            {[[262, 214], [304, 214], [346, 214], [262, 262], [346, 262]].map(([x, y], i) => (
              <rect key={i} x={x} y={y} width="30" height="32" rx="2" fill="#FFCB45" className="win-solar" />
            ))}
            <rect x="304" y="270" width="32" height="60" rx="2" fill="#0A1712" />
            <circle cx="330" cy="302" r="2" fill="#FFB800" />
            {/* battery feeding the house */}
            <path d="M408 286 V246 H394" className="feed" />
            <g transform="translate(398 286)">
              <rect width="20" height="44" rx="4" fill="#0A1712" stroke="#7CF29A" strokeWidth="1.5" />
              <rect x="4" y="6" width="12" height="7" rx="1.5" fill="#7CF29A" className="cell" />
              <rect x="4" y="16" width="12" height="7" rx="1.5" fill="#7CF29A" />
              <rect x="4" y="26" width="12" height="7" rx="1.5" fill="#7CF29A" />
              <rect x="4" y="36" width="12" height="4" rx="1.5" fill="#7CF29A" />
            </g>
          </g>

          <rect width="640" height="400" className="flash" />
        </svg>

        <div className="scene-status" aria-live="polite">
          <span className="scene-dot" />
          {grid ? 'NEPA is on' : 'NEPA has taken light'}
        </div>
      </div>

      <div className="scene-bar">
        <div className="scene-tag">
          <strong>The Solafi house</strong>
          <span>{grid ? 'Running on stored sunshine' : 'Still on. No generator.'}</span>
        </div>
        <button type="button" className="scene-switch" onClick={toggle} aria-pressed={!grid}>
          {grid ? <ZapOff size={16} /> : <Zap size={16} />}
          {grid ? 'Take light' : 'Bring light back'}
        </button>
      </div>
    </div>
  )
}
