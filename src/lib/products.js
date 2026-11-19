import { useEffect, useState } from 'react'
import { productsEndpoint } from './config.js'

// Solafi's products. The live list comes from the products Google Sheet
// through tools/products-apps-script.gs, which sends only what a customer
// should see. This copy is shown first and whenever the sheet can't be
// reached. It matches the sheet on 18 Nov 2026.
export const FALLBACK = [
  { name: 'PocketGrid', summary: '3kVA Inverter + 2.56kWh Battery + 3 Panels', runs: 'LED bulbs, fans, TV set, laptops, socket point, fridge/freezer(day use)', cashPrice: 2299320, deposit: 689796, monthly: 163269, total: 2649025 },
  { name: 'Prime', summary: '5kVA Inverter + 5kWh Battery + 5 Panels', runs: 'Everything in PocketGrid + Microwave/Pumping Machine (day use). (NO AC)', cashPrice: 3252960, deposit: 975888, monthly: 232523, total: 3766164 },
  { name: 'GridMax', summary: '5kVA Inverter + 10kWh Battery + 8 Panels', runs: 'Everything in Prime + One (1) 1 HP Inverter AC(day and few hours of night use)', cashPrice: 4484960, deposit: 1345488, monthly: 317412, total: 5154428 },
  { name: 'SuperNova', summary: '5kva Inverter + 15kWh Battery + 12 Panels', runs: 'Everything in gridMax(1hp  or 1.5hp AC) + extended AC use', cashPrice: 6548000, deposit: 1964400, monthly: 468808, total: 7590092 },
  { name: 'Independence', summary: '10kva Inverter + 32kwh battery + 16panels', runs: 'PocketGrid + Up to 4hp AC total + ability to use all heavy home appliances in daytime', cashPrice: 11246052, deposit: 3373816, monthly: 805650, total: 13041619 },
]

// The plan the "how it works" timeline uses, and the calculator starts on.
export const FEATURED = 'GridMax'

const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '')
const figure = (text, re) => {
  const m = String(text).match(re)
  return m ? Number(m[1]) : null
}

// Tidy a sheet row for the page: sizes pulled out of the summary, spacing and
// product names in the "runs" text made consistent, months worked out from
// the plan total.
export function prepareProducts(rows) {
  const names = rows.map((r) => String(r.name).trim())
  return rows.map((r) => {
    let runs = String(r.runs || '')
      .replace(/\s*\(\s*/g, ' (').replace(/\s*\)/g, ')')
      .replace(/\s*\+\s*/g, ' + ').replace(/\s+/g, ' ').replace(/\s+\./g, '.').trim()
    for (const n of names) runs = runs.replace(new RegExp(`\\b${n}\\b`, 'gi'), n)
    const months = r.monthly > 0 ? Math.round((r.total - r.deposit) / r.monthly) : 0
    return {
      id: slug(r.name),
      name: String(r.name).trim(),
      kva: figure(r.summary, /([\d.]+)\s*kva/i),
      batteryKwh: figure(r.summary, /([\d.]+)\s*kwh/i),
      panels: figure(r.summary, /([\d.]+)\s*panels?/i),
      runs,
      cashPrice: r.cashPrice,
      deposit: r.deposit,
      monthly: r.monthly,
      total: r.total,
      months,
      featured: slug(r.name) === slug(FEATURED),
    }
  })
}

const valid = (rows) =>
  Array.isArray(rows) && rows.length > 0 &&
  rows.every((r) => r.name && r.cashPrice > 0 && r.deposit > 0 && r.monthly > 0 && r.total > r.deposit)

let live = null
let request = null
function load() {
  if (!productsEndpoint) return Promise.resolve(null)
  request ||= fetch(productsEndpoint)
    .then((r) => r.json())
    // only rows that also have a Product Specification row are real products;
    // working rows in the overview tab (e.g. one customer's special terms) are skipped
    .then((out) => (out.ok ? out.products.filter((r) => String(r.summary || '').trim()) : []))
    .then((rows) => (valid(rows) ? (live = prepareProducts(rows)) : null))
    .catch(() => null)
  return request
}

const fallback = prepareProducts(FALLBACK)

/** The product list: the built-in copy first, the sheet's once it arrives. */
export function useProducts() {
  const [list, setList] = useState(live || fallback)
  useEffect(() => {
    let on = true
    load().then((l) => { if (on && l) setList(l) })
    return () => { on = false }
  }, [])
  return list
}

export const featuredOf = (list) => list.find((p) => p.featured) || list[Math.floor(list.length / 2)]
