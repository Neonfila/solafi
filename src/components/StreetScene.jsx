import { useEffect, useState } from 'react'
import { Zap, ZapOff } from 'lucide-react'

// Hero visual: one long street at night, running off both edges of the page.
// When the grid drops, the neighbours' windows go out from left to right and
// the Solafi house in the middle stays lit. On a phone the crop keeps the house
// and its nearest neighbours.
const W = 1000
const H = 340
const GROUND = 320
const WIN = { w: 16, h: 20, pitch: 34, top: 20 }

// [x, width, height, columns]; the gap in the middle belongs to the house
const blocks = [
  [-10, 90, 170, 2], [88, 70, 230, 2], [166, 96, 140, 3], [270, 64, 196, 2], [342, 82, 118, 2],
  [576, 84, 150, 2], [668, 66, 214, 2], [742, 100, 128, 3], [850, 72, 188, 2], [930, 90, 160, 2],
].map(([x, w, h, cols]) => ({ x, w, h, cols, rows: Math.floor((h - 24) / WIN.pitch) }))

const HOUSE = { x: 432, w: 136, top: GROUND - 140, peak: GROUND - 196 }
const houseWindows = [[452, 196], [490, 196], [528, 196], [452, 240], [528, 240]]

function windowsOf(b, bi) {
  const pad = 12
  const step = b.cols > 1 ? (b.w - pad * 2 - WIN.w) / (b.cols - 1) : 0
  const out = []
  for (let r = 0; r < b.rows; r++) {
    for (let c = 0; c < b.cols; c++) {
      out.push({
        x: b.x + pad + c * step,
        y: GROUND - b.h + WIN.top + r * WIN.pitch,
        // a few windows are simply not in use tonight
        unlit: (bi * 7 + r * 3 + c * 5) % 4 === 0,
      })
    }
  }
  return out
}

export default function StreetScene() {
  const [grid, setGrid] = useState(true)
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (touched) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setTimeout(() => setGrid((g) => !g), grid ? 3200 : 4600)
    return () => clearTimeout(t)
  }, [touched, grid])

  const toggle = () => {
    setTouched(true)
    setGrid((g) => !g)
  }

  return (
    <div className={`scene ${grid ? 'scene--on' : 'scene--off'}`}>
      <div className="scene-stage">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" role="img" aria-label="A street at night. When the grid goes off, only the house with Solafi solar stays lit.">
          {blocks.map((b, bi) => (
            <g key={b.x} style={{ '--d': `${bi * 70}ms` }}>
              <rect x={b.x} y={GROUND - b.h} width={b.w} height={b.h} className="block-wall" />
              {windowsOf(b, bi).map((w, i) => (
                <rect key={i} x={w.x} y={w.y} width={WIN.w} height={WIN.h} rx="2" className={w.unlit ? 'win win--unlit' : 'win'} />
              ))}
            </g>
          ))}

          <g className="house">
            <path d={`M${HOUSE.x - 10} ${HOUSE.top} L${HOUSE.x + HOUSE.w / 2} ${HOUSE.peak} L${HOUSE.x + HOUSE.w + 10} ${HOUSE.top} Z`} className="house-roof" />
            {/* the panel, seen edge-on, lying on the right slope of the roof */}
            <path d={`M516 ${HOUSE.peak + 15} L556 ${HOUSE.peak + 44}`} className="panel" />
            <rect x={HOUSE.x} y={HOUSE.top} width={HOUSE.w} height={GROUND - HOUSE.top} className="house-wall" />
            {houseWindows.map(([x, y]) => (
              <rect key={`${x}-${y}`} x={x} y={y} width="20" height="24" rx="2" className="win-solar" />
            ))}
            <rect x="488" y={GROUND - 60} width="24" height="60" rx="2" className="house-door" />
          </g>

          <rect y={GROUND} width={W} height={H - GROUND} className="ground" />
        </svg>
      </div>

      <div className="wrap scene-bar">
        <p className="scene-status" aria-live="polite">
          <span className="scene-dot" />
          <span>
            <strong>{grid ? 'NEPA is on' : 'NEPA has taken light'}</strong>
            {grid ? 'The Solafi house is running on stored sunshine.' : 'The Solafi house is still on. No generator.'}
          </span>
        </p>
        <button type="button" className="scene-switch" onClick={toggle} aria-pressed={!grid}>
          {grid ? <ZapOff size={16} /> : <Zap size={16} />}
          {grid ? 'Take light' : 'Bring light back'}
        </button>
      </div>
    </div>
  )
}
