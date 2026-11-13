import { useEffect, useRef, useState } from 'react'
import { Zap, ZapOff } from 'lucide-react'

// Hero visual: one long street running off both edges of the page.
// When NEPA takes light the story plays in beats, each one caused by the last:
//   1. the supply sags: every grid window dims for a moment
//   2. the transformer on the pole gives out, and windows go dark outward from it
//   3. a few neighbours pull-start their generators: dim, unsteady amber windows
//   4. the Solafi house has not changed at any point
// When light comes back, windows flicker on outward from the transformer and the
// generators cut out. On a phone the crop keeps the house, the pole and two neighbours.
const W = 1000
const H = 340
const GROUND = 320
const WIN = { w: 16, h: 20, pitch: 34, top: 20 }
const TRANSFORMER = { x: 664, y: 128 }

// [x, width, height, columns]; the gap in the middle belongs to the house
const blocks = [
  [-10, 90, 170, 2], [88, 70, 230, 2], [166, 96, 140, 3], [270, 64, 196, 2], [342, 82, 118, 2],
  [576, 84, 150, 2], [668, 66, 214, 2], [742, 100, 128, 3], [850, 72, 188, 2], [930, 90, 160, 2],
].map(([x, w, h, cols]) => ({ x, w, h, cols, rows: Math.floor((h - 24) / WIN.pitch) }))

// block index -> how long after the blackout that household gets its generator going
const generators = { 4: 900, 6: 1350, 1: 1900, 8: 1650 }

const HOUSE = { x: 432, w: 136, top: GROUND - 140, peak: GROUND - 196 }
const houseWindows = [[452, 196], [490, 196], [528, 196], [452, 240], [528, 240]]

// two poles and the sagging line between them
const POLES = [338, 664]
const POLE_TOP = 96
const wire = `M-20 ${POLE_TOP + 22} Q160 ${POLE_TOP + 40} ${POLES[0]} ${POLE_TOP + 4} Q${(POLES[0] + POLES[1]) / 2} ${POLE_TOP + 30} ${POLES[1]} ${POLE_TOP + 4} Q830 ${POLE_TOP + 40} 1020 ${POLE_TOP + 22}`

function windowsOf(b, bi) {
  const pad = 12
  const step = b.cols > 1 ? (b.w - pad * 2 - WIN.w) / (b.cols - 1) : 0
  const out = []
  for (let r = 0; r < b.rows; r++) {
    for (let c = 0; c < b.cols; c++) {
      const x = b.x + pad + c * step
      out.push({
        x,
        y: GROUND - b.h + WIN.top + r * WIN.pitch,
        // a few windows are simply not in use tonight
        unlit: (bi * 7 + r * 3 + c * 5) % 4 === 0,
        // generators only run a couple of bulbs on the lower floors
        gen: bi in generators && r >= b.rows - 2 && (r + c) % 2 === 0,
        // the blackout and the return travel outward from the transformer
        delay: Math.round(Math.abs(x + WIN.w / 2 - TRANSFORMER.x) * 0.85),
      })
    }
  }
  return out
}

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// phases: on -> dip -> out -> gen, and back to on
export default function StreetScene() {
  const reduced = useRef(reducedMotion()).current
  const [phase, setPhase] = useState(reduced ? 'gen' : 'on')
  const [returned, setReturned] = useState(false)
  const [touched, setTouched] = useState(reduced)
  const timers = useRef([])

  const clear = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }
  const later = (ms, fn) => timers.current.push(setTimeout(fn, ms))

  const takeLight = () => {
    clear()
    if (reduced) return setPhase('gen')
    setPhase('dip')
    later(320, () => setPhase('out'))
    later(320 + 700, () => setPhase('gen'))
  }
  const bringLight = () => {
    clear()
    setReturned(true)
    setPhase('on')
  }

  // until someone touches it, the street plays by itself
  useEffect(() => {
    if (touched) return
    if (phase === 'on') later(3400, takeLight)
    if (phase === 'gen') later(4800, bringLight)
  }, [phase, touched])

  useEffect(() => clear, [])

  const grid = phase === 'on'
  const toggle = () => {
    setTouched(true)
    grid ? takeLight() : bringLight()
  }

  return (
    <div className={`scene scene--${phase}${grid ? '' : ' scene--dark'}${returned ? ' scene--back' : ''}`}>
      <div className="scene-stage">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" role="img" aria-label="A street in the evening. When NEPA takes light the neighbours go dark and some start generators. Only the house with Solafi solar stays lit as it was.">
          {blocks.map((b, bi) => {
            const wins = windowsOf(b, bi)
            return (
              <g key={b.x} style={{ '--g': `${generators[bi] ?? 0}ms` }}>
                <rect x={b.x} y={GROUND - b.h} width={b.w} height={b.h} className="block-wall" />
                {wins.map((w, i) => (
                  <rect key={i} x={w.x} y={w.y} width={WIN.w} height={WIN.h} rx="2" style={{ '--d': `${w.delay}ms` }} className={w.unlit ? 'win win--unlit' : 'win'} />
                ))}
                {wins.filter((w) => w.gen).map((w, i) => (
                  <rect key={`g${i}`} x={w.x} y={w.y} width={WIN.w} height={WIN.h} rx="2" className="win-gen" />
                ))}
              </g>
            )
          })}

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

          {/* the street's power line, in front of everything */}
          <path d={wire} className="wire" />
          {POLES.map((x) => (
            <rect key={x} x={x - 3} y={POLE_TOP} width="6" height={GROUND - POLE_TOP} className="pole" />
          ))}
          <rect x={TRANSFORMER.x - 13} y={TRANSFORMER.y} width="26" height="34" rx="3" className="transformer" />
          <circle cx={TRANSFORMER.x} cy={TRANSFORMER.y + 6} r="3" className="transformer-lamp" />
          <circle cx={TRANSFORMER.x} cy={TRANSFORMER.y + 6} r="16" className="spark" />

          <rect y={GROUND} width={W} height={H - GROUND} className="ground" />
        </svg>
      </div>

      <div className="wrap scene-bar">
        <p className="scene-status" aria-live="polite">
          <span className="scene-dot" />
          <span>
            <strong>{grid ? 'NEPA is on' : 'NEPA has taken light'}</strong>
            {grid ? 'The Solafi house is running on stored sunshine.' : 'Next door, generators. The Solafi house is still on, quietly.'}
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
