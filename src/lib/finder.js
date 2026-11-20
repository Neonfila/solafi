// "Build your home" package finder: the two reference tables and the rules.
//
// DRAFT FIGURES. Both tables are for Agbet to check and correct before the
// page goes live. They come from typical published values (Nigerian solar
// sizing guides and appliance spec ranges), not from Solafi's own installs.
// Change a number here and the whole page follows.

// ── Table 1: appliances ──────────────────────────────────────────────────────
// watts: running draw of one unit.
// hours: typical hours a day it draws that power (a fridge's compressor cycles,
//        so its hours are the equivalent full-power hours, not 24).
// night: share of those hours after sunset, which the battery has to carry.
// burst: a heavy appliance used for minutes at a time (kettle, iron, microwave).
//        People rarely run two at once, so only the biggest one counts toward
//        the load at any one moment (see peakLoad below).
// hp:    air conditioners only, their size in horsepower.
export const APPLIANCES = [
  { id: 'bulb', name: 'LED bulbs', group: 'everyday', icon: 'Lightbulb', watts: 10, hours: 6, night: 0.8 },
  { id: 'fan', name: 'Fan', group: 'everyday', icon: 'Fan', watts: 70, hours: 8, night: 0.5 },
  { id: 'tv', name: 'TV', group: 'everyday', icon: 'Tv', watts: 100, hours: 6, night: 0.5 },
  { id: 'decoder', name: 'Decoder', group: 'everyday', icon: 'SatelliteDish', watts: 25, hours: 6, night: 0.5 },
  { id: 'router', name: 'Wi-Fi router', group: 'everyday', icon: 'Router', watts: 15, hours: 24, night: 0.5 },
  { id: 'laptop', name: 'Laptop', group: 'everyday', icon: 'Laptop', watts: 60, hours: 6, night: 0.3 },
  { id: 'speaker', name: 'Speaker or sound system', short: 'Speaker', group: 'everyday', icon: 'Speaker', watts: 100, hours: 3, night: 0.5 },
  { id: 'washer', name: 'Washing machine', group: 'everyday', icon: 'WashingMachine', watts: 500, hours: 1, night: 0 },
  { id: 'iron', name: 'Pressing iron', group: 'everyday', icon: 'Shirt', watts: 1000, hours: 0.5, night: 0, burst: true },
  { id: 'fridge', name: 'Fridge', group: 'kitchen', icon: 'Refrigerator', watts: 150, hours: 8, night: 0.5 },
  { id: 'freezer', name: 'Freezer', group: 'kitchen', icon: 'Snowflake', watts: 200, hours: 10, night: 0.5 },
  { id: 'microwave', name: 'Microwave', group: 'kitchen', icon: 'Microwave', watts: 1200, hours: 0.3, night: 0, burst: true },
  { id: 'kettle', name: 'Electric kettle', group: 'kitchen', icon: 'Coffee', watts: 1500, hours: 0.25, night: 0, burst: true },
  { id: 'pump', name: 'Pumping machine', group: 'kitchen', icon: 'Droplets', watts: 750, hours: 0.5, night: 0 },
  { id: 'ac1', name: 'AC 1HP', group: 'kitchen', icon: 'AirVent', watts: 900, hours: 6, night: 0.3, hp: 1 },
  { id: 'ac15', name: 'AC 1.5HP', group: 'kitchen', icon: 'AirVent', watts: 1300, hours: 6, night: 0.3, hp: 1.5 },
  { id: 'ac2', name: 'AC 2HP', group: 'kitchen', icon: 'AirVent', watts: 1800, hours: 6, night: 0.3, hp: 2 },
]

// ── Table 2: package limits ──────────────────────────────────────────────────
// Sizes (kVA, kWh, panels) come from the live product list. These are the
// figures that turn a size into a limit.
export const SIZING = {
  powerFactor: 0.8,      // usable watts = kVA × 1000 × this
  batteryUsable: 0.9,    // lithium batteries: share of the kWh you can use
  panelWatts: 450,       // one panel
  sunHours: 4.5,         // peak sun hours a day, southern Nigeria average
  systemEfficiency: 0.75, // wiring, inverter and heat losses
}

// What air conditioning each package allows (doc: Solafi Website Changes II).
// maxUnits: how many AC units; maxUnitHp: biggest single unit; maxTotalHp: all units together.
export const AC_RULES = {
  pocketgrid: { maxUnits: 0 },
  prime: { maxUnits: 0 },
  gridmax: { maxUnits: 1, maxUnitHp: 1 },
  supernova: { maxUnits: 1, maxUnitHp: 1.5 },
  independence: { maxUnits: Infinity, maxTotalHp: 4 },
}

export const byId = Object.fromEntries(APPLIANCES.map((a) => [a.id, a]))

/** Totals for a selection like { fan: 2, ac1: 1 }. */
export function totals(selection) {
  let steady = 0
  let biggestBurst = 0
  let dailyWh = 0
  let nightWh = 0
  let acUnits = 0
  let acHp = 0
  let biggestAcHp = 0
  for (const [id, n] of Object.entries(selection)) {
    const a = byId[id]
    if (!a || !(n > 0)) continue
    if (a.burst) biggestBurst = Math.max(biggestBurst, a.watts)
    else steady += a.watts * n
    dailyWh += a.watts * a.hours * n
    nightWh += a.watts * a.hours * a.night * n
    if (a.hp) {
      acUnits += n
      acHp += a.hp * n
      biggestAcHp = Math.max(biggestAcHp, a.hp)
    }
  }
  return {
    peakW: steady + biggestBurst,
    dailyKwh: dailyWh / 1000,
    nightKwh: nightWh / 1000,
    acUnits,
    acHp,
    biggestAcHp,
    count: Object.values(selection).reduce((s, n) => s + (n > 0 ? n : 0), 0),
  }
}

/** What one package can carry. */
export function limitsOf(pkg, s = SIZING) {
  return {
    maxW: (pkg.kva || 0) * 1000 * s.powerFactor,
    solarKwh: ((pkg.panels || 0) * s.panelWatts * s.sunHours * s.systemEfficiency) / 1000,
    batteryKwh: (pkg.batteryKwh || 0) * s.batteryUsable,
    ac: AC_RULES[pkg.id] || { maxUnits: 0 },
  }
}

function acFits(t, ac) {
  if (t.acUnits === 0) return true
  if (t.acUnits > ac.maxUnits) return false
  if (ac.maxUnitHp != null && t.biggestAcHp > ac.maxUnitHp) return false
  if (ac.maxTotalHp != null && t.acHp > ac.maxTotalHp) return false
  return true
}

/**
 * Check one package against a selection, in the order the brief sets:
 * 1. load at one time, 2. energy over the day, 3. air conditioning.
 * Returns the first check it fails, or null if it passes all three.
 */
export function failsOn(pkg, t) {
  return failures(pkg, t)[0] || null
}

/** Every check a package fails, in order. */
export function failures(pkg, t) {
  const l = limitsOf(pkg)
  const out = []
  if (t.peakW >= l.maxW) out.push('load')
  if (t.dailyKwh > l.solarKwh || t.nightKwh > l.batteryKwh) out.push('energy')
  if (!acFits(t, l.ac)) out.push('ac')
  return out
}

/**
 * The smallest package that passes every check. If none does, Independence
 * with a note that the home needs a system sized by the team.
 * `products` must be in size order (as the product list is).
 */
export function recommend(products, selection) {
  const t = totals(selection)
  const checks = products.map((p) => {
    const all = failures(p, t)
    return { pkg: p, fails: all[0] || null, all }
  })
  const fit = checks.find((c) => !c.fails)
  const pkg = fit ? fit.pkg : products[products.length - 1]
  return { pkg, beyond: !fit, checks, totals: t, reason: reasonFor(pkg, checks, selection, t) }
}

const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

// One short line on why this package and not the one below it.
function reasonFor(pkg, checks, selection, t) {
  if (t.count === 0) return 'Add what you want to power.'
  const i = checks.findIndex((c) => c.pkg === pkg)
  if (i === 0) return 'Everything you added fits the smallest package.'
  const below = checks[i - 1]
  const has = (...ids) => ids.filter((id) => selection[id] > 0)
  // an AC is the easiest reason to understand, so it wins when it applies
  if (below.all.includes('ac')) {
    if (t.acUnits === 1) return `Because you added a ${t.biggestAcHp}HP AC.`
    return `Because you added ${plural(t.acUnits, 'AC')}, ${t.acHp}HP in all.`
  }
  if (below.all.includes('load')) {
    const heavy = has('microwave', 'kettle', 'iron', 'pump', 'washer').map((id) => byId[id].name.toLowerCase())
    return heavy.length
      ? `Because of what runs at the same time, like the ${heavy.slice(0, 2).join(' and ')}.`
      : 'Because of how much runs at the same time.'
  }
  const cold = has('freezer', 'fridge').map((id) => byId[id].name.toLowerCase())
  return cold.length
    ? `Because of how much power you use in a day, with the ${cold.join(' and ')} running.`
    : 'Because of how much power you use in a day.'
}

/** "2× Fan, 1× AC 1HP" for the waitlist. */
export function describe(selection) {
  return APPLIANCES.filter((a) => selection[a.id] > 0).map((a) => `${selection[a.id]}× ${a.short || a.name}`).join(', ')
}
