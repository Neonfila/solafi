import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ChevronUp, Minus, Plus } from 'lucide-react'
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

function House({ lit, panels, cells }) {
  return (
    <svg viewBox="0 0 300 260" className="fh" role="img" aria-label={`A house with ${panels} solar panels on the roof.`}>
      <circle cx="252" cy="44" r="14" className="fh-sun" />
      <path d="M58 128 L150 52 L242 128 Z" className="fh-roof" />
      {SPOTS.map((p, i) => (
        <rect key={i} x={p.x} y={p.y} width="20" height="13" rx="1.5" className={`fh-pv${i < panels ? ' on' : ''}`} style={{ '--i': i }} />
      ))}
      <rect x="72" y="128" width="156" height="112" className="fh-wall" />
      {WINDOWS.map(([x, y], i) => (
        <rect key={i} x={x} y={y} width="20" height="24" rx="2" className={`fh-win${lit[i] ? ' on' : ''}`} style={{ '--i': i }} />
      ))}
      <rect x="138" y="196" width="24" height="44" rx="2" className="fh-door" />
      <rect x="240" y="196" width="18" height="38" rx="3.5" className="fh-batt" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x="243.5" y={225 - i * 8.5} width="11" height="6" rx="1.2" className={`fh-cell${i < cells ? ' on' : ''}`} />
      ))}
      <rect y="240" width="300" height="20" className="fh-ground" />
    </svg>
  )
}

export default function Build() {
  const products = useProducts()
  const navigate = useNavigate()
  const [sel, setSel] = useState({})
  const [open, setOpen] = useState(false)

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
  const cells = empty ? 0 : Math.max(1, Math.ceil(Math.min(1, t.nightKwh / (lim.batteryKwh || 1)) * 4))
  const spec = [pkg.kva && `${pkg.kva} kVA inverter`, pkg.batteryKwh && `${pkg.batteryKwh} kWh battery`, pkg.panels && `${pkg.panels} panels`].filter(Boolean).join(' · ')

  const answer = (
    <>
      <p className="fa-label">{empty ? 'Our smallest package' : 'Your package'}</p>
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
                      <span className="fl-name">{a.name}</span>
                      <span className="fl-w">{a.watts >= 1000 ? `${a.watts / 1000} kW` : `${a.watts} W`}</span>
                      <span className="fl-step">
                        <button type="button" aria-label={`One less ${a.name}`} disabled={!n} onClick={() => set(a.id, n - 1)}><Minus size={16} /></button>
                        <output aria-label={`${a.name}: ${n}`} key={n}>{n}</output>
                        <button type="button" aria-label={`Add a ${a.name}`} onClick={() => set(a.id, n + 1)}><Plus size={16} /></button>
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
          <House lit={lit} panels={panels} cells={cells} />
          <div className="fa-body">{answer}</div>
        </aside>
      </div>

      {/* phone: the answer stays at the bottom of the screen */}
      <div className={`find-dock${open ? ' open' : ''}`}>
        <button type="button" className="find-dock-bar" aria-expanded={open} onClick={() => setOpen(!open)}>
          <span><small>{empty ? 'Our smallest package' : 'Your package'}</small><b key={pkg.id}>{pkg.name}</b></span>
          <span className="find-dock-price">{naira(Math.round(monthly))}<small>/month</small></span>
          <ChevronUp size={20} className="find-dock-chev" />
        </button>
        <div className="find-dock-sheet">
          <div>
            <House lit={lit} panels={panels} cells={cells} />
            <div className="fa-body">{answer}</div>
          </div>
        </div>
      </div>
    </section>
  )
}
