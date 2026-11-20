import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AirVent, ArrowRight, ChevronUp, Coffee, Droplets, Fan, Laptop, Lightbulb, Microwave, Minus, Plug, Plus,
  Refrigerator, RotateCcw, Router, SatelliteDish, Shirt, Snowflake, Speaker, Tv, WashingMachine, X,
} from 'lucide-react'
import { naira, nairaShort } from '../lib/calc.js'
import { useProducts } from '../lib/products.js'
import { APPLIANCES, byId, describe, limitsOf, recommend } from '../lib/finder.js'

// "Build your home": put appliances in a house, get the smallest Solafi
// package that runs them. Tap a tile to add one, or drag it into the house.
// Everything updates as you go; there is no submit button.

export const BUILD_KEY = 'solafi.build'
const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
const GROUPS = [
  { id: 'everyday', label: 'Everyday' },
  { id: 'kitchen', label: 'Kitchen & cooling' },
]
const Icons = { AirVent, Coffee, Droplets, Fan, Laptop, Lightbulb, Microwave, Refrigerator, Router, SatelliteDish, Shirt, Snowflake, Speaker, Tv, WashingMachine }
const Icon = ({ name, size = 22 }) => {
  const C = Icons[name] || Plug
  return <C size={size} strokeWidth={1.75} aria-hidden="true" />
}

// Panel slots on the roof, filled bottom row first, from the middle out.
const ROOF_ROWS = [{ y: 120, n: 7 }, { y: 100, n: 5 }, { y: 80, n: 3 }, { y: 60, n: 1 }]
const PANELS = ROOF_ROWS.flatMap((row, r) =>
  Array.from({ length: row.n }, (_, i) => ({ x: 200 - (row.n * 28) / 2 + i * 28 + 1, y: row.y, r, order: Math.abs(i - (row.n - 1) / 2) }))
).sort((a, b) => a.r - b.r || a.order - b.order)

// A number that glides to its new value instead of jumping.
function useGlide(value, ms = 650) {
  const [shown, setShown] = useState(value)
  const from = useRef(value)
  useEffect(() => {
    if (reducedMotion()) return setShown(value)
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

// Fly a copy of an icon from one place on screen to another, in an arc.
function fly(iconEl, from, to) {
  if (!iconEl || reducedMotion()) return Promise.resolve()
  const ghost = document.createElement('div')
  ghost.className = 'fly'
  ghost.appendChild(iconEl.cloneNode(true))
  Object.assign(ghost.style, { left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px` })
  document.body.appendChild(ghost)
  const dx = to.left + to.width / 2 - (from.left + from.width / 2)
  const dy = to.top + to.height / 2 - (from.top + from.height / 2)
  const lift = Math.min(140, 50 + Math.abs(dx) * 0.25)
  const s = to.width / from.width
  const anim = ghost.animate(
    [
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - lift}px) scale(1.3) rotate(${dx > 0 ? 8 : -8}deg)`, opacity: 1, offset: 0.45 },
      { transform: `translate(${dx}px, ${dy}px) scale(${s})`, opacity: 1 },
    ],
    { duration: 560, easing: 'cubic-bezier(0.3, 0.7, 0.2, 1)' }
  )
  return anim.finished.then(() => ghost.remove(), () => ghost.remove())
}

const pop = (el) => el && !reducedMotion() && el.animate(
  [{ transform: 'scale(0.6)' }, { transform: 'scale(1.12)', offset: 0.55 }, { transform: 'scale(1)' }],
  { duration: 420, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }
)

export default function Build() {
  const products = useProducts()
  const navigate = useNavigate()
  const [sel, setSel] = useState({})
  const [drag, setDrag] = useState(null) // { id, x, y, over }
  const [sheetOpen, setSheetOpen] = useState(false)
  const houseRef = useRef(null)
  const rootRef = useRef(null)
  const dropRef = useRef(null)
  const tileIcons = useRef({})
  const pending = useRef(null) // a flight waiting for its chip to exist

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

  const add = (id, from) => {
    pending.current = { id, from: from || tileIcons.current[id]?.getBoundingClientRect() }
    setSel((s) => ({ ...s, [id]: (s[id] || 0) + 1 }))
  }
  const set = (id, n) => setSel((s) => {
    const next = { ...s }
    if (n > 0) next[id] = n
    else delete next[id]
    return next
  })
  // the house shows chips on a wide screen and small icons on a phone;
  // only the copies on screen take part in the motion
  const shown = (sel) => [...(rootRef.current?.querySelectorAll(sel) || [])].filter((el) => el.getClientRects().length > 0)
  const remove = (id) => {
    const els = shown(`[data-chip="${id}"], [data-land="${id}"]`)
    if (!els.length || reducedMotion()) return set(id, 0)
    Promise.all(els.map((el) => el.animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(0.6)', opacity: 0 }], { duration: 180, easing: 'ease-in', fill: 'forwards' }).finished))
      .then(() => set(id, 0))
  }

  // after a chip appears (or its count goes up), fly the icon into it
  useLayoutEffect(() => {
    const p = pending.current
    pending.current = null
    if (!p) return
    const land = shown(`[data-land="${p.id}"]`)[0]
    const target = land?.querySelector('.chip-icon') || land
    const iconEl = tileIcons.current[p.id]?.querySelector('svg')
    if (!land || !p.from || reducedMotion()) return
    land.style.visibility = 'hidden'
    fly(iconEl, p.from, target.getBoundingClientRect()).then(() => {
      land.style.visibility = ''
      pop(land)
    })
  }, [sel])

  // drag a tile into the house: mouse after a small move, touch after a short hold
  const startDrag = (id, e) => {
    if (e.button > 0) return
    const x0 = e.clientX
    const y0 = e.clientY
    const touch = e.pointerType === 'touch'
    let live = false
    let hold = touch ? setTimeout(() => { live = true; begin(x0, y0) }, 280) : null
    const begin = (x, y) => {
      navigator.vibrate?.(8)
      setDrag({ id, x, y, over: false })
    }
    const overHouse = (x, y) => {
      const r = dropRef.current?.getBoundingClientRect()
      return !!r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom
    }
    const move = (ev) => {
      if (!live) {
        const far = Math.hypot(ev.clientX - x0, ev.clientY - y0) > 6
        if (touch && far) return cleanup() // a scroll, not a drag
        if (!touch && far) { live = true; begin(ev.clientX, ev.clientY) }
        return
      }
      ev.preventDefault()
      setDrag({ id, x: ev.clientX, y: ev.clientY, over: overHouse(ev.clientX, ev.clientY) })
    }
    const blockScroll = (ev) => { if (live) ev.preventDefault() }
    const up = (ev) => {
      if (live) {
        if (overHouse(ev.clientX, ev.clientY)) add(id, { left: ev.clientX - 22, top: ev.clientY - 22, width: 44, height: 44 })
        setDrag(null)
        // the click that follows a drag must not add a second one
        window.addEventListener('click', swallow, { capture: true, once: true })
        setTimeout(() => window.removeEventListener('click', swallow, { capture: true }), 0)
      }
      cleanup()
    }
    const swallow = (ev) => { ev.stopPropagation(); ev.preventDefault() }
    const cleanup = () => {
      clearTimeout(hold)
      hold = null
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', cancel)
      window.removeEventListener('touchmove', blockScroll)
    }
    const cancel = () => { setDrag(null); cleanup() }
    window.addEventListener('pointermove', move, { passive: false })
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', cancel)
    window.addEventListener('touchmove', blockScroll, { passive: false })
  }

  const goSavings = () => navigate(`/?pkg=${pkg.id}#calculator`)
  const goWaitlist = () => {
    try {
      sessionStorage.setItem(BUILD_KEY, JSON.stringify({ system: pkg.name, appliances: describe(sel) }))
    } catch {}
    navigate(`/?pkg=${pkg.id}#waitlist`)
  }

  const added = APPLIANCES.filter((a) => sel[a.id] > 0)
  const panelsOn = empty ? 0 : pkg.panels || 0
  const charge = empty ? 0 : Math.min(1, t.nightKwh / (lim.batteryKwh || 1))
  const glow = Math.min(1, t.count / 12)
  const loadPct = Math.min(100, (t.peakW / lim.maxW) * 100)
  const dayPct = Math.min(100, (t.dailyKwh / lim.solarKwh) * 100)

  const chip = (a, land) => (
    <div key={a.id} className="chip" data-chip={a.id} data-land={land ? a.id : undefined}>
      <span className="chip-icon"><Icon name={a.icon} size={16} /></span>
      <span className="chip-name">{a.short || a.name}</span>
      <span className="chip-qty">
        <button type="button" aria-label={`One less ${a.name}`} onClick={() => (sel[a.id] > 1 ? set(a.id, sel[a.id] - 1) : remove(a.id))}><Minus size={13} /></button>
        <b key={sel[a.id]}>{sel[a.id]}</b>
        <button type="button" aria-label={`One more ${a.name}`} onClick={() => add(a.id)}><Plus size={13} /></button>
      </span>
      <button type="button" className="chip-x" aria-label={`Remove ${a.name}`} onClick={() => remove(a.id)}><X size={13} /></button>
    </div>
  )

  const palette = (g) => (
    <div className={`bp bp--${g.id}`} role="group" aria-label={g.label}>
      <p className="bp-label">{g.label}</p>
      <div className="bp-grid">
        {APPLIANCES.filter((a) => a.group === g.id).map((a) => (
          <button
            key={a.id}
            type="button"
            className={`bp-tile${sel[a.id] ? ' on' : ''}${drag?.id === a.id ? ' lifted' : ''}`}
            onClick={() => add(a.id)}
            onPointerDown={(e) => startDrag(a.id, e)}
            aria-label={`Add ${a.name}`}
          >
            <span className="bp-icon" ref={(el) => { tileIcons.current[a.id] = el }}><Icon name={a.icon} /></span>
            <span className="bp-name">{a.short || a.name}</span>
            {sel[a.id] > 0 && <span className="bp-count" key={sel[a.id]}>{sel[a.id]}</span>}
          </button>
        ))}
      </div>
    </div>
  )

  const result = (
    <div className={`br${beyond ? ' br--beyond' : ''}`}>
      <div className="br-top">
        <div>
          <p className="br-eyebrow">{empty ? 'Start with what you use most' : 'Recommended for you'}</p>
          <h2 className="br-name" key={pkg.id}>{pkg.name}</h2>
          <p className="br-spec">{[pkg.kva && `${pkg.kva} kVA inverter`, pkg.batteryKwh && `${pkg.batteryKwh} kWh battery`, pkg.panels && `${pkg.panels} panels`].filter(Boolean).join(' · ')}</p>
        </div>
        <div className="br-price">
          <strong>{naira(Math.round(monthly))}<small>/month</small></strong>
          <span>{nairaShort(pkg.deposit)} deposit · {pkg.months} months</span>
        </div>
      </div>
      <p className="br-reason" aria-live="polite">
        {beyond ? 'Your home may need more than our standard packages. Join the waitlist and we will size a system for you.' : rec.reason}
      </p>
      <ol className="br-ladder" style={{ '--i': index, '--n': products.length }} aria-label="Packages, smallest to biggest">
        <span className="br-ladder-pill" aria-hidden="true" />
        {rec.checks.map((c, i) => (
          <li key={c.pkg.id} className={i < index ? 'small' : i === index ? 'pick' : ''}>
            <b>{c.pkg.name}</b>
            <span>{i < index ? 'too small' : i === index ? (beyond ? 'closest' : 'fits') : 'fits'}</span>
          </li>
        ))}
      </ol>
      <div className="br-actions">
        <button type="button" className="btn btn--sun" onClick={goSavings}>See my savings <ArrowRight size={18} /></button>
        <button type="button" className="btn btn--ghost" onClick={goWaitlist}>Join the waitlist</button>
      </div>
      <p className="br-note">A guide only. We confirm the right size when we check your home.</p>
    </div>
  )

  return (
    <section ref={rootRef} className={`build${drag ? ' build--dragging' : ''}`}>
      <div className="wrap">
        <p className="build-eyebrow">Find my package</p>
        <h1 className="build-title">Build your home. <span className="sun-text">We'll find your package.</span></h1>
        <p className="build-step"><b>Drag in the appliances you want to power.</b> Or tap them. Use − and + to set how many.</p>

        <div className="build-stage">
          {palette(GROUPS[0])}

          <div className="bh-wrap">
            <div ref={dropRef} className={`bh${drag?.over ? ' bh--over' : ''}${empty ? ' bh--empty' : ''}`} style={{ '--glow': glow }}>
              <div className="bh-frame">
              <svg viewBox="0 0 400 330" className="bh-art" aria-hidden="true">
                <g className="bh-sun">
                  <circle cx="352" cy="40" r="15" />
                  {Array.from({ length: 8 }, (_, i) => (
                    <path key={i} d="M352 15v-7" transform={`rotate(${i * 45} 352 40)`} />
                  ))}
                </g>
                <path d="M30 150 L200 34 L370 150 Z" className="bh-roof" />
                {PANELS.map((p, i) => (
                  <g key={i} className={`bh-pv${i < panelsOn ? ' on' : ''}`} style={{ '--i': i }}>
                    <rect x={p.x} y={p.y} width="26" height="16" rx="1.5" />
                    <path d={`M${p.x + 13} ${p.y}v16M${p.x} ${p.y + 8}h26`} />
                  </g>
                ))}
                <rect x="52" y="150" width="296" height="160" className="bh-wall" />
                <rect x="52" y="150" width="296" height="160" className="bh-light" />
                <rect y="310" width="400" height="20" className="bh-ground" />
                {/* the battery beside the house: how much of it your nights use */}
                <g className="bh-batt">
                  <rect x="362" y="248" width="22" height="58" rx="4" className="bh-batt-case" />
                  <rect x="366" y="254" width="14" height="48" rx="2" className="bh-batt-cell" style={{ transform: `scaleY(${charge})` }} />
                  <rect x="369" y="243" width="8" height="5" rx="1.5" className="bh-batt-case" />
                </g>
                <path d="M340 150 V200 H373 V243" className={`bh-cable${panelsOn ? ' live' : ''}`} />
              </svg>

              <div className="bh-room" ref={houseRef}>
                {empty && <p className="bh-hint">{drag ? 'Drop it here' : 'Your appliances go here'}</p>}
                {added.map((a) => chip(a, true))}
              </div>
              {/* phone: the house holds small icons; the controls sit in a strip below */}
              <div className="bh-icons" aria-hidden="true">
                {empty && <span className="bh-icons-hint">{drag ? 'Drop it here' : 'Tap below to add'}</span>}
                {added.map((a) => (
                  <span key={a.id} className="bh-ico" data-land={a.id}>
                    <Icon name={a.icon} size={14} />
                    {sel[a.id] > 1 && <sup key={sel[a.id]}>{sel[a.id]}</sup>}
                  </span>
                ))}
              </div>
              </div>

              {!empty && (
                <button type="button" className="bh-reset" onClick={() => setSel({})}><RotateCcw size={14} /> Start again</button>
              )}
            </div>

            {!empty && <div className="bh-strip">{added.map((a) => chip(a, false))}</div>}

            <dl className="bh-meters">
              <div className={loadPct >= 100 ? 'over' : ''}>
                <dt><span className="long">At the same time</span><span className="short">At once</span></dt>
                <dd><b>{(t.peakW / 1000).toFixed(1)} kW</b> of {(lim.maxW / 1000).toFixed(1)} kW</dd>
                <i style={{ '--v': `${loadPct}%` }} />
              </div>
              <div className={dayPct >= 100 ? 'over' : ''}>
                <dt><span className="long">In a day</span><span className="short">Per day</span></dt>
                <dd><b>{t.dailyKwh.toFixed(1)} kWh</b> of {lim.solarKwh.toFixed(1)} kWh</dd>
                <i style={{ '--v': `${dayPct}%` }} />
              </div>
              <div className={charge >= 1 && !empty ? 'over' : ''}>
                <dt><span className="long">At night, from the battery</span><span className="short">At night</span></dt>
                <dd><b>{t.nightKwh.toFixed(1)} kWh</b> of {lim.batteryKwh.toFixed(1)} kWh</dd>
                <i style={{ '--v': `${charge * 100}%` }} />
              </div>
            </dl>
          </div>

          {palette(GROUPS[1])}
        </div>

        <div className="build-result">{result}</div>
      </div>

      {/* phone: the answer stays at the bottom of the screen */}
      <div className={`build-dock${sheetOpen ? ' open' : ''}`}>
        <button type="button" className="build-dock-bar" aria-expanded={sheetOpen} onClick={() => setSheetOpen(!sheetOpen)}>
          <span>
            <small>{empty ? 'Smallest package' : 'Your package'}</small>
            <b key={pkg.id}>{pkg.name}</b>
          </span>
          <span className="build-dock-price">{naira(Math.round(monthly))}<small>/month</small></span>
          <ChevronUp size={20} className="build-dock-chev" />
        </button>
        <div className="build-dock-sheet">{result}</div>
      </div>

      {drag && (
        <div className={`drag-ghost${drag.over ? ' over' : ''}`} style={{ transform: `translate(${drag.x - 26}px, ${drag.y - 26}px)` }} aria-hidden="true">
          <Icon name={byId[drag.id].icon} size={24} />
        </div>
      )}

      <p className="wrap build-back"><Link to="/#packages">See all packages</Link></p>
    </section>
  )
}
