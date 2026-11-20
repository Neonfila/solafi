import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDown, ArrowRight, ArrowUp, ChevronUp, Minus, Plus } from 'lucide-react'
import { naira, nairaShort } from '../lib/calc.js'
import { useProducts } from '../lib/products.js'
import { APPLIANCES, ROOMS, describe, limitsOf, recommend } from '../lib/finder.js'

// Find my package: a list of what you might want to power, and the smallest
// Solafi package that runs it. The house is the one from the homepage street:
// each window is a room and lights up when you add something from it, panels
// go on the roof as the package grows, and the battery shows what your nights use.

export const BUILD_KEY = 'solafi.build'
const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// A number that glides to its new value instead of jumping.
function useGlide(value, ms = 600) {
  const [shown, setShown] = useState(value)
  const from = useRef(value)
  useEffect(() => {
    if (reducedMotion()) {
      from.current = value
      return setShown(value)
    }
    const start = performance.now()
    const a = from.current
    let raf
    const step = (now) => {
      const t = Math.min(1, (now - start) / ms)
      const v = a + (value - a) * (1 - Math.pow(1 - t, 3))
      from.current = v
      setShown(v)
      if (t < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value, ms])
  return shown
}

// Panel spots on the roof, lowest row first, from the middle out (16 = Independence).
const ROWS = [{ y: 118, n: 6 }, { y: 101, n: 5 }, { y: 84, n: 3 }, { y: 67, n: 2 }]
const SPOTS = ROWS.flatMap((row, r) =>
  Array.from({ length: row.n }, (_, i) => ({ x: 150 - (row.n * 22) / 2 + i * 22 + 1, y: row.y, r, d: Math.abs(i - (row.n - 1) / 2) }))
).sort((a, b) => a.r - b.r || a.d - b.d)

// one window per room, in the order of ROOMS
const WINDOWS = [[92, 150], [140, 150], [188, 150], [92, 196], [188, 196]]
const STARS = [[24, 20], [52, 52], [94, 26], [120, 12], [178, 14], [206, 40], [270, 18], [286, 62], [16, 92], [262, 96]]

// A day and a night in about 16 seconds. Sunrise is t = 0, sunset t = DUSK.
const LOOP = 16000
const DUSK = 0.55
const clamp01 = (x) => Math.min(1, Math.max(0, x))
const ease = (a, b, x) => { const u = clamp01((x - a) / (b - a)); return u * u * (3 - 2 * u) }

function hourAt(t) {
  return Math.floor(t < DUSK ? 6 + (13 * t) / DUSK : 19 + (11 * (t - DUSK)) / (1 - DUSK)) % 24
}
function clockOf(h) {
  return `${h % 12 || 12} ${h < 12 ? 'am' : 'pm'}`
}
// what the house is doing at that hour, in words
function lineAt(h, drain) {
  if (h >= 6 && h < 10) return 'The sun is up. The panels start filling the battery.'
  if (h >= 10 && h < 17) return 'The sun runs your home and fills the battery.'
  if (h >= 17 && h < 19) return 'The battery is full for the night.'
  if (h >= 19 || h < 3) return 'The sun is down. The battery runs your home.'
  return drain >= 1 ? 'The battery runs out before sunrise.' : `By sunrise, about ${Math.round((1 - drain) * 100)}% is still in the battery.`
}

function House({ lit, panels, drain, active }) {
  const svg = useRef(null)
  const sun = useRef(null)
  const clock = useRef(null)
  const line = useRef(null)
  const time = useRef(0.12) // start mid-morning
  const mask = 'moon' + useId().replace(/[^\w-]/g, '')

  // new panels drop in one after another, starting from the ones already there
  const last = useRef(panels)
  const from = useRef(0)
  if (last.current !== panels) {
    from.current = Math.min(last.current, panels)
    last.current = panels
  }

  useEffect(() => {
    const el = svg.current
    const low = clamp01(1 - drain)
    let said = ''
    const paint = (t) => {
      const night = ease(0.48, 0.6, t) * (1 - ease(0.92, 1, t))
      const d = clamp01(t / DUSK)
      const level = t < DUSK ? low + (1 - low) * ease(0.04, 0.42, t) : clamp01(1 - drain * ((t - DUSK) / (1 - DUSK)))
      el.style.setProperty('--night', night.toFixed(3))
      el.style.setProperty('--sunk', (t < DUSK ? Math.sin(Math.PI * d) : 0).toFixed(3))
      el.style.setProperty('--lvl', level.toFixed(3))
      el.toggleAttribute('data-low', active && level < 0.15)
      sun.current.setAttribute('transform', `translate(${(22 + 256 * d).toFixed(1)} ${(118 - 92 * Math.sin(Math.PI * d)).toFixed(1)})`)
      const h = hourAt(t)
      clock.current.textContent = active ? clockOf(h) : ''
      const words = active ? lineAt(h, drain) : 'Add something to see a day with your package.'
      if (words !== said) {
        line.current.textContent = words
        if (said && !reducedMotion()) line.current.animate([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'ease-out' })
        said = words
      }
    }
    if (reducedMotion()) {
      // no loop: an afternoon, and the night told in words
      paint(0.3)
      line.current.textContent = active ? `${lineAt(12, drain)} ${lineAt(4, drain)}` : line.current.textContent
      clock.current.textContent = ''
      return
    }
    let raf = 0
    let prev = 0
    const frame = (now) => {
      time.current = (time.current + (now - prev) / LOOP) % 1
      prev = now
      paint(time.current)
      raf = requestAnimationFrame(frame)
    }
    const play = () => { if (!raf) { prev = performance.now(); raf = requestAnimationFrame(frame) } }
    const pause = () => { cancelAnimationFrame(raf); raf = 0 }
    paint(time.current)
    // only plays while it can be seen
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? play() : pause()))
    io.observe(el)
    return () => { io.disconnect(); pause() }
  }, [drain, active])

  return (
    <div className="fh-scene">
      <svg ref={svg} viewBox="0 0 300 260" className="fh" style={{ '--has': active ? 1 : 0, '--from': from.current }} role="img" aria-label={`A house with ${panels} solar panels on the roof, through a day and a night.`}>
        <defs>
          <mask id={mask}>
            <circle cx="62" cy="40" r="10" fill="#fff" />
            <circle cx="67" cy="36" r="9" fill="#000" />
          </mask>
        </defs>
        <rect width="300" height="260" className="fh-night" />
        <g ref={sun} className="fh-sunwrap">
          <circle r="20" className="fh-glow" />
          <circle r="12" className="fh-sun" />
        </g>
        {STARS.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 3 ? 1 : 1.5} className="fh-star" style={{ '--i': i }} />)}
        <circle cx="62" cy="40" r="10" mask={`url(#${mask})`} className="fh-moon" />
        <path d="M58 128 L150 52 L242 128 Z" className="fh-roof" />
        {SPOTS.map((p, i) => (
          <rect key={i} x={p.x} y={p.y} width="20" height="13" rx="1.5" className={`fh-pv${i < panels ? ' on' : ''}`} style={{ '--i': i }} />
        ))}
        <rect x="72" y="128" width="156" height="112" className="fh-wall" />
        <rect x="138" y="196" width="24" height="44" rx="2" className="fh-door" />
        <path d="M236 124 L249 131 V194" className="fh-cable" />
        <path d="M240 216 H224" className="fh-cable" />
        <rect x="240" y="196" width="18" height="38" rx="3.5" className="fh-batt" />
        <rect x="245" y="193" width="8" height="4" rx="1" className="fh-batt" />
        <rect y="240" width="300" height="20" className="fh-ground" />
        <rect width="300" height="260" className="fh-shade" />
        {WINDOWS.map(([x, y], i) => (
          <g key={i}>
            {lit[i] && <rect x={x - 5} y={y - 5} width="30" height="34" rx="6" className="fh-halo" />}
            <rect x={x} y={y} width="20" height="24" rx="2" className={`fh-win${lit[i] ? ' on' : ''}`} />
          </g>
        ))}
        <rect x="243.5" y="199.5" width="11" height="31" rx="1.5" className="fh-slot" />
        <rect x="243.5" y="199.5" width="11" height="31" rx="1.5" className="fh-lvl" />
        <path d="M236 124 L249 131 V194" className="fh-flow fh-flow--sun" />
        <path d="M240 216 H224" className="fh-flow fh-flow--night" />
      </svg>
      <p className="fh-cap" aria-hidden="true"><b ref={clock} /><span ref={line} /></p>
    </div>
  )
}

export default function Build() {
  const products = useProducts()
  const navigate = useNavigate()
  const [sel, setSel] = useState({})
  const [open, setOpen] = useState(false)
  const [bump, setBump] = useState(null) // the row just added to, so it can flash
  const [move, setMove] = useState(null) // "Up from Prime", for a moment

  useEffect(() => {
    const t = document.title
    document.title = 'Find my package · Solafi'
    return () => { document.title = t }
  }, [])

  const rec = useMemo(() => recommend(products, sel), [products, sel])
  const { pkg, totals: t, beyond } = rec
  const lim = limitsOf(pkg)
  const index = products.indexOf(pkg)
  const monthly = useGlide(pkg.monthly)
  const empty = t.count === 0

  // say where the package moved from when it changes
  const was = useRef(pkg.id)
  useEffect(() => {
    const prev = products.find((p) => p.id === was.current)
    was.current = pkg.id
    if (!prev || prev.id === pkg.id) return
    setMove({ up: products.indexOf(prev) < index, from: prev.name, k: Date.now() })
  }, [pkg.id, products, index])
  useEffect(() => {
    if (!move) return
    const id = setTimeout(() => setMove(null), 3000)
    return () => clearTimeout(id)
  }, [move])

  const set = (id, n) => setSel((s) => {
    const next = { ...s }
    if (n > 0) next[id] = Math.min(n, 99)
    else delete next[id]
    return next
  })

  const goSavings = () => navigate(`/?pkg=${pkg.id}#calculator`)
  const goWaitlist = () => {
    try {
      sessionStorage.setItem(BUILD_KEY, JSON.stringify({ system: pkg.name, appliances: describe(sel) }))
    } catch {}
    navigate(`/?pkg=${pkg.id}#waitlist`)
  }

  const lit = ROOMS.map((r) => APPLIANCES.some((a) => a.room === r.id && sel[a.id] > 0))
  const panels = empty ? 0 : pkg.panels || 0
  const drain = empty ? 0 : t.nightKwh / (lim.batteryKwh || 1) // share of the battery one night uses
  const moved = move && (
    <span className="fa-move" key={move.k}>
      {move.up ? <ArrowUp size={13} /> : <ArrowDown size={13} />} {move.up ? 'Up' : 'Down'} from {move.from}
    </span>
  )
  const spec = [pkg.kva && `${pkg.kva} kVA inverter`, pkg.batteryKwh && `${pkg.batteryKwh} kWh battery`, pkg.panels && `${pkg.panels} panels`].filter(Boolean).join(' · ')

  const answer = (
    <>
      <p className="fa-label">{empty ? 'Our smallest package' : 'Your package'}{moved}</p>
      <h2 className="fa-name" key={pkg.id}>{pkg.name}</h2>
      <p className="fa-spec">{spec}</p>
      <p className="fa-price"><strong>{naira(Math.round(monthly))}</strong> a month · {nairaShort(pkg.deposit)} deposit · {pkg.months} months</p>
      <p className={`fa-why${beyond ? ' fa-why--beyond' : ''}`} aria-live="polite">
        {beyond ? 'Your home may need more than our standard packages. Join the waitlist and we will size a system for you.' : rec.reason}
      </p>
      {!empty && (
        <p className="fa-use">About {t.dailyKwh.toFixed(1)} kWh a day, {(t.peakW / 1000).toFixed(1)} kW at once.</p>
      )}
      <div className="fa-scale" style={{ '--i': index, '--n': products.length }} aria-hidden="true">
        <span className="fa-scale-dot" />
        {products.map((p, i) => (
          <span key={p.id} className={`fa-tick${i === index ? ' on' : ''}`}>{p.name}</span>
        ))}
      </div>
      <div className="fa-actions">
        <button type="button" className="btn btn--sun" onClick={goSavings}>See my savings <ArrowRight size={18} /></button>
        <button type="button" className="fa-link" onClick={goWaitlist}>Join the waitlist</button>
      </div>
      <p className="fa-note">A guide only. We confirm the right size when we check your home.</p>
    </>
  )

  return (
    <section className="find">
      <div className="wrap find-grid">
        <div className="find-list">
          <h1>What do you want to power?</h1>
          <p className="find-lede">Add what you use at home or in your shop. We show the smallest package that runs it.</p>

          {ROOMS.map((room) => (
            <div key={room.id} className="fl-room">
              <h3>{room.name}</h3>
              <ul>
                {APPLIANCES.filter((a) => a.room === room.id).map((a) => {
                  const n = sel[a.id] || 0
                  return (
                    <li key={a.id} className={n ? 'on' : ''}>
                      {bump?.id === a.id && <span className="fl-flash" key={bump.k} aria-hidden="true" />}
                      <span className="fl-name">{a.name}</span>
                      <span className="fl-w">{a.watts >= 1000 ? `${a.watts / 1000} kW` : `${a.watts} W`}</span>
                      <span className="fl-step">
                        <button type="button" aria-label={`One less ${a.name}`} disabled={!n} onClick={() => set(a.id, n - 1)}><Minus size={16} /></button>
                        <output aria-label={`${a.name}: ${n}`} key={n}>{n}</output>
                        <button type="button" aria-label={`Add a ${a.name}`} onClick={() => { set(a.id, n + 1); setBump({ id: a.id, k: Date.now() }) }}><Plus size={16} /></button>
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
          {!empty && <button type="button" className="fa-link fl-clear" onClick={() => setSel({})}>Clear the list</button>}
        </div>

        <aside className="find-answer">
          <House lit={lit} panels={panels} drain={drain} active={!empty} />
          <div className="fa-body">{answer}</div>
        </aside>
      </div>

      {/* phone: the answer stays at the bottom of the screen */}
      <div className={`find-dock${open ? ' open' : ''}`}>
        <button type="button" className="find-dock-bar" aria-expanded={open} onClick={() => setOpen(!open)}>
          <span><small>{empty ? 'Our smallest package' : 'Your package'}{moved}</small><b key={pkg.id}>{pkg.name}</b></span>
          <span className="find-dock-price">{naira(Math.round(monthly))}<small>/month</small></span>
          <ChevronUp size={20} className="find-dock-chev" />
        </button>
        <div className="find-dock-sheet">
          <div>
            <House lit={lit} panels={panels} drain={drain} active={!empty} />
            <div className="fa-body">{answer}</div>
          </div>
        </div>
      </div>
    </section>
  )
}
