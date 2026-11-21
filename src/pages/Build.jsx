import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDown, ArrowRight, ArrowUp, ChevronUp, Minus, Plus } from 'lucide-react'
import { naira, nairaShort } from '../lib/calc.js'
import { useProducts } from '../lib/products.js'
import { APPLIANCES, ROOMS, describe, limitsOf, recommend } from '../lib/finder.js'
import FindHouse, { slotKey } from '../components/FindHouse.jsx'
import ApplianceIcon from '../components/ApplianceIcon.jsx'

// Find my package: a list of what you might want to power, and the smallest
// Solafi package that runs it. The house beside it has its front wall off:
// what you add flies into its room and runs there, panels go on the roof as the
// package grows, and a day and a night show what the battery carries.

export const BUILD_KEY = 'solafi.build'
const watts = (w) => (w >= 1000 ? `${+(w / 1000).toFixed(2)} kW` : `${w} W`)
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

// When + is pressed, the appliance's icon flies from its row into its room in
// whichever house is on screen, and lands as the drawing there appears.
const FLY_MS = 620
function flyIn(from, slot) {
  if (reducedMotion() || !from) return
  const houses = [...document.querySelectorAll('.find .fx')].filter((h) => {
    const r = h.getBoundingClientRect()
    return r.width > 0 && r.bottom > 0 && r.top < innerHeight
  })
  const house = houses.sort((p, q) => q.getBoundingClientRect().width - p.getBoundingClientRect().width)[0]
  const to = house?.querySelector(`[data-slot="${slot}"]`)
  if (!to) return
  const a = from.getBoundingClientRect()
  const b = to.getBoundingClientRect()
  const dx = b.left + b.width / 2 - (a.left + a.width / 2)
  const dy = b.top + b.height / 2 - (a.top + a.height / 2)
  const small = Math.max(0.35, Math.min(1, Math.max(b.width, b.height) / a.width))
  // outer moves across, inner rises and falls: together they make an arc
  const outer = document.createElement('div')
  const inner = from.cloneNode(true)
  outer.className = 'fl-flyer'
  Object.assign(outer.style, { left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px`, height: `${a.height}px` })
  inner.classList.add('fl-flyer-icon')
  outer.appendChild(inner)
  document.body.appendChild(outer)
  const lift = -Math.min(90, 30 + Math.abs(dx) * 0.15)
  outer.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${dx}px)` }], { duration: FLY_MS, easing: 'cubic-bezier(0.45, 0, 0.1, 1)' })
  inner.animate([
    { transform: 'translateY(0) scale(1)' },
    { transform: `translateY(${lift}px) scale(1.1)`, offset: 0.35, easing: 'cubic-bezier(0.3, 0, 0.6, 1)' },
    { transform: `translateY(${dy}px) scale(${small})` },
  ], { duration: FLY_MS, easing: 'cubic-bezier(0.2, 0.6, 0.4, 1)' })
  outer.animate([{ opacity: 1 }, { opacity: 1, offset: 0.82 }, { opacity: 0 }], { duration: FLY_MS }).finished.then(() => outer.remove(), () => outer.remove())
}

export default function Build() {
  const products = useProducts()
  const navigate = useNavigate()
  const [sel, setSel] = useState({})
  const [open, setOpen] = useState(false)
  const [bump, setBump] = useState(null) // the row just added to, so it can flash
  const [move, setMove] = useState(null) // "Up from Prime", for a moment
  const [stuck, setStuck] = useState(false) // phone: the house has reached the header and stays there
  const mark = useRef(null)
  useEffect(() => {
    const el = mark.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting && e.boundingClientRect.top < 80), { rootMargin: '-69px 0px 0px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

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

  const add = (id, n, button) => {
    if (n >= 99) return
    set(id, n + 1)
    setBump({ id, k: Date.now() })
    const icon = button.closest('li')?.querySelector('.fl-icon')
    const key = slotKey(id, { ...sel, [id]: n + 1 })
    // wait for the new drawing to be in the house before aiming at it
    requestAnimationFrame(() => requestAnimationFrame(() => flyIn(icon, key)))
  }

  const goSavings = () => navigate(`/?pkg=${pkg.id}#calculator`)
  const goWaitlist = () => {
    try {
      sessionStorage.setItem(BUILD_KEY, JSON.stringify({ system: pkg.name, appliances: describe(sel) }))
    } catch {}
    navigate(`/?pkg=${pkg.id}#waitlist`)
  }

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
          {/* phone: the house sits here, at the top of the list */}
          <div className="find-top-mark" ref={mark} aria-hidden="true" />
          <div className={`find-top${stuck ? ' stuck' : ''}`}>
            <FindHouse sel={sel} panels={panels} drain={drain} />
          </div>

          {ROOMS.map((room) => (
            <div key={room.id} className="fl-room">
              <h3>{room.name}</h3>
              <ul>
                {APPLIANCES.filter((a) => a.room === room.id).map((a) => {
                  const n = sel[a.id] || 0
                  return (
                    <li key={a.id} className={n ? 'on' : ''}>
                      {bump?.id === a.id && <span className="fl-flash" key={bump.k} aria-hidden="true" />}
                      <span className="fl-icon"><ApplianceIcon id={a.id} /></span>
                      <span className="fl-name">
                        {a.name}
                        {n > 1 && <small className="fl-times" key={n}>{n} × {watts(a.watts)} = {watts(a.watts * n)}</small>}
                      </span>
                      <span className="fl-w">{watts(a.watts)}</span>
                      <span className="fl-step">
                        <button type="button" aria-label={`One less ${a.name}`} disabled={!n} onClick={() => set(a.id, n - 1)}><Minus size={16} /></button>
                        <output aria-label={`${a.name}: ${n}`} key={n}>{n}</output>
                        <button type="button" aria-label={`Add a ${a.name}`} onClick={(e) => add(a.id, n, e.currentTarget)}><Plus size={16} /></button>
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
          <FindHouse sel={sel} panels={panels} drain={drain} />
          <div className="fa-body">{answer}</div>
        </aside>
      </div>

      {/* phone: the answer stays at the bottom of the screen */}
      <div className={`find-dock${open ? ' open' : ''}`}>
        <button type="button" className="find-dock-bar" aria-expanded={open} onClick={() => setOpen(!open)}>
          <FindHouse sel={sel} panels={panels} drain={drain} mini />
          <span className="find-dock-name"><small>{moved || (empty ? 'Our smallest package' : 'Your package')}</small><b key={pkg.id}>{pkg.name}</b></span>
          <span className="find-dock-price">{nairaShort(Math.round(monthly))}<small>/mo</small></span>
          <ChevronUp size={20} className="find-dock-chev" />
        </button>
        <div className="find-dock-sheet">
          <div>
            <FindHouse sel={sel} panels={panels} drain={drain} />
            <div className="fa-body">{answer}</div>
          </div>
        </div>
      </div>
    </section>
  )
}
