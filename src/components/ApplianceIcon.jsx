import { AirVent, Coffee, Droplets, Fan, Laptop, Lightbulb, Microwave, Refrigerator, Router, SatelliteDish, Snowflake, Speaker, Tv, WashingMachine } from 'lucide-react'

// Lucide has no kettle or pressing iron, so these two are drawn in its style:
// 24 grid, 2px round strokes.
function Line({ size = 24, children, ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      {children}
    </svg>
  )
}
const Kettle = (p) => (
  <Line {...p}>
    <path d="M6 20h11l-1.2-10.5A2 2 0 0 0 13.8 8H9.2a2 2 0 0 0-2 1.5Z" />
    <path d="M16.3 11.5c2.2 0 3.7 1.3 3.7 3.2 0 1.6-1 2.6-2.4 3" />
    <path d="M7.4 11 4 9" />
    <path d="M10 8V5.5h3V8" />
  </Line>
)
const Iron = (p) => (
  <Line {...p}>
    <path d="M3 18h18l-1.6-6.2A3 3 0 0 0 16.5 9.5H9C5.7 9.5 3 13.6 3 18Z" />
    <path d="M10 9.5V7a1.5 1.5 0 0 1 1.5-1.5H18" />
    <path d="M7 15h1M11 15h1" />
  </Line>
)

const ICONS = {
  bulb: Lightbulb, fan: Fan, tv: Tv, decoder: SatelliteDish, router: Router, laptop: Laptop, speaker: Speaker,
  fridge: Refrigerator, freezer: Snowflake, microwave: Microwave, kettle: Kettle,
  washer: WashingMachine, iron: Iron, pump: Droplets,
  ac1: AirVent, ac15: AirVent, ac2: AirVent,
}

export default function ApplianceIcon({ id, size = 18, ...rest }) {
  const I = ICONS[id] || Coffee
  return <I size={size} strokeWidth={1.8} aria-hidden="true" {...rest} />
}
