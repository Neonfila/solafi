import { useEffect, useId, useRef } from 'react'

// The house on Find my package: a bungalow seen with its front wall off, so
// what you add shows up in its room. Living room, kitchen, then laundry and
// store, where the inverter and battery live. A long-span roof takes the
// panels and a black water tank stands outside on its stand.
//
// It plays a day and a night in about 16 seconds: the sun crosses, power runs
// from the roof to the battery and along the ceiling, then the sky goes dark,
// rooms with bulbs glow and the battery runs the house until morning.

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// ── Where things go ───────────────────────────────────────────────────────────
// Each appliance has its own spots; a second fan goes in the next room. More
// than the spots shows as a "+2" tag on the last one.
export const SLOTS = {
  bulb: [[56, 132], [160, 132], [252, 132], [108, 132], [206, 132], [296, 132]],
  fan: [[81, 132], [181, 132], [274, 132]],
  ac: [[63, 152], [163, 152], [256, 152]],
  tv: [[60, 180]],
  decoder: [[50, 215]],
  laptop: [[72, 212]],
  router: [[98, 214]],
  speaker: [[34, 206], [120, 206]],
  fridge: [[139, 180]],
  microwave: [[167, 200]],
  kettle: [[191, 203]],
  freezer: [[206, 208]],
  washer: [[234, 210]],
  iron: [[264, 206]],
  pump: [[346, 228]],
}
const AC_ORDER = ['ac1', 'ac15', 'ac2']
const kindOf = (id) => (AC_ORDER.includes(id) ? 'ac' : id)
const roomAt = (x) => (x < 134 ? 0 : x < 228 ? 1 : 2)

/** The spot the latest unit of `id` sits in, given the selection after adding it. */
export function slotKey(id, sel) {
  const kind = kindOf(id)
  let i = (sel[id] || 1) - 1
  if (kind === 'ac') for (const a of AC_ORDER) { if (a === id) break; i += sel[a] || 0 }
  return `${kind}-${Math.min(i, SLOTS[kind].length - 1)}`
}

// how many of each kind, ACs together
function countsOf(sel) {
  const c = {}
  for (const [id, n] of Object.entries(sel)) if (n > 0) c[kindOf(id)] = (c[kindOf(id)] || 0) + n
  return c
}

// ── The appliances, drawn at their spot's top-left (bulbs and fans hang from it) ──
const Bulb = () => (
  <>
    <line x1="0" y1="0" x2="0" y2="8" className="fx-cord" />
    <rect x="-1.6" y="7.5" width="3.2" height="2.4" rx="0.6" className="fx-metal" />
    <circle cx="0" cy="12.6" r="3.6" className="fx-bulb" />
  </>
)
const CeilingFan = () => (
  <>
    <line x1="0" y1="0" x2="0" y2="6" className="fx-cord" />
    <rect x="-15" y="6.2" width="30" height="2" rx="1" className="fx-blade" />
    <rect x="-15" y="6.2" width="30" height="2" rx="1" className="fx-blade fx-blade--b" />
    <ellipse cx="0" cy="7.4" rx="3.4" ry="2.2" className="fx-dark" />
  </>
)
const AcUnit = () => (
  <>
    <rect width="36" height="11" rx="3" className="fx-white" />
    <rect x="3" y="7.6" width="30" height="1.4" rx="0.7" className="fx-line" />
    <circle cx="31" cy="3.4" r="0.9" className="fx-led" />
    <g className="fx-air">
      <path d="M8 13 q2 3 0 6 q-2 3 0 6" />
      <path d="M18 13 q2 3 0 6 q-2 3 0 6" />
      <path d="M28 13 q2 3 0 6 q-2 3 0 6" />
    </g>
  </>
)
const TV = () => (
  <>
    <rect width="42" height="26" rx="2" className="fx-screen" />
    <rect x="2" y="2" width="38" height="22" rx="1" className="fx-picture" />
  </>
)
const Decoder = () => (
  <>
    <rect y="1" width="16" height="6" rx="1" className="fx-screen" />
    <circle cx="13" cy="4" r="0.9" className="fx-led" />
  </>
)
const LaptopDraw = () => (
  <>
    <rect x="2" y="0" width="14" height="8.5" rx="1" className="fx-screen" />
    <rect x="3.4" y="1.3" width="11.2" height="6" rx="0.5" className="fx-glow" />
    <rect x="0" y="8.4" width="18" height="1.8" rx="0.9" className="fx-metal" />
  </>
)
const RouterDraw = () => (
  <>
    <line x1="3" y1="3" x2="1.5" y2="-4" className="fx-cord" />
    <line x1="11" y1="3" x2="12.5" y2="-4" className="fx-cord" />
    <rect y="2.5" width="14" height="5.5" rx="1.4" className="fx-white" />
    <circle cx="4" cy="5.3" r="0.8" className="fx-led fx-blink" />
    <circle cx="7" cy="5.3" r="0.8" className="fx-led fx-blink fx-blink--b" />
    <circle cx="10" cy="5.3" r="0.8" className="fx-led fx-blink fx-blink--c" />
  </>
)
const SpeakerDraw = () => (
  <>
    <rect width="10" height="34" rx="1.5" className="fx-screen" />
    <circle cx="5" cy="9" r="2.6" className="fx-metal fx-cone" />
    <circle cx="5" cy="23" r="3.6" className="fx-metal fx-cone fx-cone--b" />
  </>
)
const Fridge = () => (
  <>
    <rect width="24" height="60" rx="2.5" className="fx-white" />
    <rect x="1" y="20" width="22" height="1" className="fx-line" />
    <rect x="19" y="9" width="1.8" height="7" rx="0.9" className="fx-dark" />
    <rect x="19" y="25" width="1.8" height="11" rx="0.9" className="fx-dark" />
  </>
)
const Freezer = () => (
  <>
    <rect width="18" height="32" rx="2" className="fx-white" />
    <rect x="1" y="6" width="16" height="1" className="fx-line" />
    <rect x="13.5" y="10" width="1.6" height="8" rx="0.8" className="fx-dark" />
    <path d="M6 20.5 h6 M9 17.5 v6 M7 18.5 l4 4 M11 18.5 l-4 4" className="fx-frost" />
  </>
)
const MicrowaveDraw = () => (
  <>
    <rect width="21" height="13" rx="1.5" className="fx-white" />
    <rect x="2" y="2" width="12" height="9" rx="1" className="fx-screen" />
    <rect x="16" y="3" width="3" height="1.2" rx="0.5" className="fx-dark" />
    <rect x="16" y="6" width="3" height="1.2" rx="0.5" className="fx-dark" />
  </>
)
const KettleDraw = () => (
  <>
    <path d="M2 11 h8 l-1-7 h-6 Z" className="fx-metal" />
    <path d="M9.4 5.5 q3 0.5 1.6 4.5" className="fx-handle" />
    <path d="M2.6 6.5 l-2.4-1.6" className="fx-handle" />
    <path d="M4 1 q-1.5-2 0-4 q1.5-2 0-4" className="fx-steam" />
  </>
)
const Washer = () => (
  <>
    <rect width="28" height="30" rx="2" className="fx-white" />
    <rect x="1" y="6" width="26" height="1" className="fx-line" />
    <circle cx="5" cy="3.3" r="1" className="fx-dark" />
    <circle cx="14" cy="18" r="8" className="fx-screen" />
    <circle cx="14" cy="18" r="5.6" className="fx-drum" />
  </>
)
const IronBoard = () => (
  <>
    <path d="M5 11 L25 34 M25 11 L5 34" className="fx-legs" />
    <rect x="0" y="8" width="31" height="3" rx="1.5" className="fx-furn" />
    <path d="M11 8 h12 l-1.6-4.6 q-4-1.6-8.4 0 Z" className="fx-metal" />
    <path d="M14 3 v-2 h6" className="fx-handle" />
    <path d="M24 2 q-1.5-2 0-4 q1.5-2 0-4" className="fx-steam" />
  </>
)
const Pump = () => (
  <>
    <rect width="20" height="12" rx="2" className="fx-pump" />
    <circle cx="6" cy="6" r="3.4" className="fx-dark" />
    <rect x="13" y="-3" width="3" height="4" className="fx-dark" />
  </>
)
const DRAW = {
  bulb: Bulb, fan: CeilingFan, ac: AcUnit, tv: TV, decoder: Decoder, laptop: LaptopDraw, router: RouterDraw,
  speaker: SpeakerDraw, fridge: Fridge, microwave: MicrowaveDraw, kettle: KettleDraw, freezer: Freezer,
  washer: Washer, iron: IronBoard, pump: Pump,
}
// where the "+2" tag sits on each kind, from the spot's top-left
const TAG = { bulb: [-22, 10], fan: [14, 2], ac: [36, -2], tv: [40, -2], speaker: [9, -2], fridge: [22, -2], washer: [26, -2] }

// ── Roof and panels ───────────────────────────────────────────────────────────
// Hip roof: eaves at y 124 from x 12 to 336, ridge at y 66 from 78 to 270.
const ROOF_X = (y) => 12 + ((124 - y) * 66) / 58 // left edge of the roof at height y
const PANEL_ROWS = [{ y: 106, n: 7 }, { y: 90, n: 6 }, { y: 74, n: 3 }]
const SPOTS = PANEL_ROWS.flatMap((row, r) =>
  Array.from({ length: row.n }, (_, i) => ({ x: 174 - (row.n * 24) / 2 + i * 24 + 1, y: row.y, r, d: Math.abs(i - (row.n - 1) / 2) }))
).sort((a, b) => a.r - b.r || a.d - b.d)
const RIBS = Array.from({ length: 40 }, (_, i) => 16 + i * 8).filter((x) => x < 334).map((x) => {
  const top = x < 78 ? 124 - ((x - 12) * 58) / 66 : x > 270 ? 124 - ((336 - x) * 58) / 66 : 66
  return [x, top]
})
const STARS = [[24, 20], [52, 48], [104, 26], [140, 12], [214, 16], [250, 40], [300, 22], [372, 30], [396, 70], [338, 56], [18, 92]]

// ── A day and a night ─────────────────────────────────────────────────────────
const LOOP = 16000
const DUSK = 0.55
const clamp01 = (x) => Math.min(1, Math.max(0, x))
const ease = (a, b, x) => { const u = clamp01((x - a) / (b - a)); return u * u * (3 - 2 * u) }
const hourAt = (t) => Math.floor(t < DUSK ? 6 + (13 * t) / DUSK : 19 + (11 * (t - DUSK)) / (1 - DUSK)) % 24
const clockOf = (h) => `${h % 12 || 12} ${h < 12 ? 'am' : 'pm'}`
function lineAt(h, drain, bulbs) {
  if (h >= 6 && h < 10) return 'The sun is up. The panels start filling the battery.'
  if (h >= 10 && h < 17) return 'The sun runs your home and fills the battery.'
  if (h >= 17 && h < 19) return 'The battery is full for the night.'
  if (h >= 19 || h < 3) return bulbs ? 'The sun is down. The battery keeps the lights on.' : 'The sun is down. The battery runs your home.'
  return drain >= 1 ? 'The battery runs out before sunrise.' : `By sunrise, about ${Math.round((1 - drain) * 100)}% is still in the battery.`
}

export default function FindHouse({ sel, panels, drain, mini = false }) {
  const svg = useRef(null)
  const sun = useRef(null)
  const clock = useRef(null)
  const line = useRef(null)
  const time = useRef(0.12) // start mid-morning
  const uid = useId().replace(/[^\w-]/g, '')

  const counts = countsOf(sel)
  const active = Object.keys(counts).length > 0
  const bulbs = counts.bulb || 0
  // a room glows at night when it has a bulb
  const litRooms = [0, 1, 2].map((r) => SLOTS.bulb.slice(0, bulbs).some(([x]) => roomAt(x) === r))

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
      sun.current.style.opacity = night > 0.99 ? '0' : (1 - night).toFixed(3)
      sun.current.style.visibility = night > 0.99 ? 'hidden' : 'visible'
      sun.current.setAttribute('transform', `translate(${(16 + 368 * d).toFixed(1)} ${(104 - 82 * Math.sin(Math.PI * d)).toFixed(1)})`)
      if (!line.current) return // the small house has no caption
      const h = hourAt(t)
      clock.current.textContent = active ? clockOf(h) : ''
      const words = active ? lineAt(h, drain, bulbs) : 'Add something and watch it arrive in its room.'
      if (words !== said) {
        line.current.textContent = words
        if (said && !reducedMotion()) line.current.animate([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'ease-out' })
        said = words
      }
    }
    if (reducedMotion()) {
      paint(0.3) // an afternoon, and the night told in words
      if (line.current && active) line.current.textContent = `${lineAt(12, drain, bulbs)} ${lineAt(4, drain, bulbs)}`
      if (clock.current) clock.current.textContent = ''
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
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? play() : pause()))
    io.observe(el)
    return () => { io.disconnect(); pause() }
  }, [drain, active, bulbs])

  // every appliance in its spot
  const items = []
  const tags = []
  for (const [kind, n] of Object.entries(counts)) {
    const spots = SLOTS[kind]
    const Draw = DRAW[kind]
    spots.slice(0, n).forEach(([x, y], i) => {
      items.push(
        <g key={`${kind}-${i}`} data-slot={`${kind}-${i}`} transform={`translate(${x} ${y})`} className={`fx-item fx-item--${kind}`}>
          <g className="fx-in"><Draw /></g>
        </g>
      )
    })
    if (n > spots.length) {
      const [x, y] = spots[spots.length - 1]
      const [dx, dy] = TAG[kind] || [16, -2]
      const text = `+${n - spots.length}`
      tags.push(
        <g key={kind} transform={`translate(${x + dx} ${y + dy})`} className="fx-tag">
          <g className="fx-in" key={n}>
            <rect x="-2" y="-8" width={text.length * 5.4 + 5} height="10" rx="5" />
            <text x={text.length * 2.7 + 0.5} y="-0.6" textAnchor="middle">{text}</text>
          </g>
        </g>
      )
    }
  }
  const bulbSpots = SLOTS.bulb.slice(0, bulbs)
  const rooms = [[30, 102], [136, 90], [230, 88]]

  return (
    <div className={mini ? 'fh-scene fh-scene--mini' : 'fh-scene'}>
      <svg
        ref={svg}
        viewBox="0 0 400 272"
        className="fh fx"
        style={{ '--has': active ? 1 : 0, '--from': from.current }}
        {...(mini ? { 'aria-hidden': true } : { role: 'img', 'aria-label': `A house seen from the front with the wall off: ${panels} solar panels on the roof and what you added in its rooms, through a day and a night.` })}
      >
        <defs>
          <mask id={`moon${uid}`}>
            <circle cx="62" cy="38" r="10" fill="#fff" />
            <circle cx="67" cy="34" r="9" fill="#000" />
          </mask>
          <radialGradient id={`glow${uid}`}>
            <stop offset="0" stopColor="var(--sc-win)" stopOpacity="0.55" />
            <stop offset="1" stopColor="var(--sc-win)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* sky */}
        <rect width="400" height="272" className="fh-night" />
        <g ref={sun} className="fh-sunwrap">
          <circle r="20" className="fh-glow" />
          <circle r="12" className="fh-sun" />
        </g>
        {STARS.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 3 ? 1 : 1.5} className="fh-star" style={{ '--i': i }} />)}
        <circle cx="62" cy="38" r="10" mask={`url(#moon${uid})`} className="fh-moon" />

        {/* roof */}
        <path d="M12 124 L78 66 L270 66 L336 124 Z" className="fx-roof" />
        {RIBS.map(([x, top]) => <line key={x} x1={x} y1={top + 1} x2={x} y2="123" className="fx-rib" />)}
        <rect x="8" y="122" width="332" height="5" rx="1" className="fx-fascia" />
        {SPOTS.map((p, i) => (
          <g key={i} transform={`translate(${p.x} ${p.y})`}>
            <rect width="22" height="13" rx="1.2" className={`fx-pv${i < panels ? ' on' : ''}`} style={{ '--i': i }} />
            {i < panels && <path d="M11 0.6 V12.4 M0.6 6.5 H21.4" className="fx-pv-grid" style={{ '--i': i }} />}
          </g>
        ))}

        {/* ground, tank on its stand */}
        <rect y="240" width="400" height="32" className="fh-ground" />
        <path d="M344 186 L340 240 M386 186 L390 240 M342 212 H388" className="fx-stand" />
        <rect x="338" y="146" width="54" height="42" rx="9" className="fx-tank" />
        <rect x="358" y="141" width="14" height="6" rx="2" className="fx-tank" />
        <path d="M341 158 H389 M341 176 H389" className="fx-tank-rib" />

        {/* the house: back walls, floor, walls, ceiling */}
        {rooms.map(([x, w], i) => <rect key={i} x={x} y="132" width={w} height="108" className={`fx-room fx-room--${i}`} />)}
        {rooms.map(([x, w], i) => <rect key={i} x={x} y="236" width={w} height="4" className="fx-floor" />)}
        <path d="M24 132 h6 v108 h-6 Z M132 132 h4 v108 h-4 Z M226 132 h4 v108 h-4 Z M318 132 h6 v108 h-6 Z" className="fx-wall" />
        <rect x="24" y="127" width="300" height="5" className="fx-wall" />
        <rect x="20" y="240" width="308" height="5" className="fx-plinth" />
        {/* furniture that is always there: TV cabinet, kitchen counter, inverter and battery */}
        <rect x="46" y="222" width="72" height="16" rx="1.5" className="fx-furn" />
        <path d="M48 230 h68" className="fx-furn-line" />
        <rect x="165" y="213" width="40" height="25" rx="1" className="fx-furn" />
        <rect x="163" y="212" width="44" height="2.4" rx="1" className="fx-top" />
        <rect x="299" y="174" width="15" height="20" rx="2" className="fx-white" />
        <rect x="302" y="178" width="9" height="5" rx="1" className="fx-screen" />
        <rect x="298" y="203" width="17" height="35" rx="2.5" className="fx-batt" />
        <path d="M322 118 V140 L306 140 V174" className="fh-cable" />
        <path d="M306 194 V203" className="fh-cable" />

        {/* night outside */}
        <rect width="400" height="272" className="fh-shade" />

        {/* what was added */}
        {counts.pump && <path d="M359 228 V194 Q359 188 352 188" className="fx-pipe" />}
        {items}

        {/* rooms at night: dark, unless a bulb is on */}
        {rooms.map(([x, w], i) => (
          <rect key={i} x={x} y="132" width={w} height="108" className="fx-dark-room" style={{ '--k': litRooms[i] ? 0.12 : 0.55 }} />
        ))}
        {bulbSpots.map(([x], i) => <ellipse key={i} cx={x} cy="168" rx="30" ry="40" fill={`url(#glow${uid})`} className="fx-light" />)}
        {bulbSpots.map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y})`} className="fx-bulb-top"><circle cx="0" cy="12.6" r="3.6" className="fx-bulb" /></g>
        ))}

        {/* battery level, and power moving: roof to battery by day, along the ceiling to the rooms */}
        <rect x="301" y="207.5" width="11" height="28" rx="1.5" className="fh-slot" />
        <rect x="301" y="207.5" width="11" height="28" rx="1.5" className="fh-lvl" />
        <path d="M322 118 V140 L306 140 V174" className="fh-flow fh-flow--sun" />
        <path d="M306 194 V203" className="fh-flow fh-flow--sun" />
        <path d="M306 203 V194" className="fh-flow fh-flow--night" />
        <path d="M296 134.5 H34" className="fh-flow fh-flow--sun" />
        <path d="M296 134.5 H34" className="fh-flow fh-flow--night" />
        {counts.pump && <path d="M359 228 V194 Q359 188 352 188" className="fx-water" />}
        {tags}
      </svg>
      {!mini && <p className="fh-cap" aria-hidden="true"><b ref={clock} /><span ref={line} /></p>}
    </div>
  )
}
