import { useEffect, useState } from 'react'
import { Zap, ZapOff } from 'lucide-react'

// Hero visual: a flat street at night. When the grid drops, the neighbours'
// windows go out block by block and the house with solar stays lit.
const GROUND = 372
const WIN = { w: 16, h: 20, pitch: 34, top: 20 }
const blocks = [
  { x: 66, w: 110, h: 214, cols: 3, rows: 5 },
  { x: 178, w: 70, h: 118, cols: 2, rows: 2 },
  { x: 394, w: 76, h: 184, cols: 2, rows: 4 },
  { x: 500, w: 100, h: 132, cols: 3, rows: 3 },
]
// The Solafi house sits in the middle so it survives the phone crop.
const HOUSE = { x: 252, w: 136, top: 232, peak: 176 }
const houseWindows = [[270, 250], [310, 250], [350, 250], [270, 300], [350, 300]]

function windowsOf(b, bi) {
  const pad = 16
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
        <svg viewBox="0 0 640 400" preserveAspectRatio="xMidYMid slice" role="img" aria-label="A street at night. When the grid goes off, only the house with Solafi solar stays lit.">
          {/* drawn at 1x, then enlarged from the kerb so the street fills the frame */}
          <g transform={`translate(320 ${GROUND}) scale(1.32) translate(-320 ${-GROUND})`}>
          {blocks.map((b, bi) => (
            <g key={b.x} className="block" style={{ '--d': `${bi * 110}ms` }}>
              <rect x={b.x} y={GROUND - b.h} width={b.w} height={b.h} className="block-wall" />
              {windowsOf(b, bi).map((w, i) => (
                <rect key={i} x={w.x} y={w.y} width={WIN.w} height={WIN.h} rx="2" className={w.unlit ? 'win win--unlit' : 'win'} />
              ))}
            </g>
          ))}

          <g className="house">
            <path d={`M${HOUSE.x - 10} ${HOUSE.top} L${HOUSE.x + HOUSE.w / 2} ${HOUSE.peak} L${HOUSE.x + HOUSE.w + 10} ${HOUSE.top} Z`} className="house-roof" />
            {/* the panel, seen edge-on, lying on the right slope of the roof */}
            <path d="M338 184 L386 218.5" className="panel" />
            <rect x={HOUSE.x} y={HOUSE.top} width={HOUSE.w} height={GROUND - HOUSE.top} className="house-wall" />
            {houseWindows.map(([x, y]) => (
              <rect key={`${x}-${y}`} x={x} y={y} width="20" height="24" rx="2" className="win-solar" />
            ))}
            <rect x="308" y="316" width="24" height={GROUND - 316} rx="2" className="house-door" />
          </g>
          </g>

          <rect y={GROUND} width="640" height={400 - GROUND} className="ground" />
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
