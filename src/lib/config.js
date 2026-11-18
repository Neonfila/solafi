// ─────────────────────────────────────────────────────────────────────────────
// Solafi site config — every number the site shows lives here.
//
// Packages and loan terms are shown on the site as Solafi's published plans.
// Change them here and the whole site follows.
// ─────────────────────────────────────────────────────────────────────────────

export const termsAreFinal = true

export const brand = {
  name: 'Solafi',
  domain: 'solafi.ng',
  // PLACEHOLDER contact details — none confirmed yet.
  email: null,
  whatsapp: null,
}

// Where the waitlist form sends sign-ups: the Google Apps Script web app URL
// (see tools/waitlist-apps-script.gs). Empty = preview mode, nothing is sent.
export const waitlistEndpoint = 'https://script.google.com/macros/s/AKfycbyGS9V-yKAaqHk2tsIrJ7ucKlEup6rzB7lmqO08uYeCRrusEieAKAbfZUV3hGaSlqIO/exec'

// Where the signing page loads and saves agreements: the Google Apps Script web
// app URL (see tools/agreement-apps-script.gs). Empty = only /sign/#demo works.
export const agreementEndpoint = 'https://script.google.com/macros/s/AKfycbxQ2QXgf_7qW1BZjfb2TYg1puxPQN9zoT7xf8zrYyn1tcSXnUHV70V8sviBFK3axhyhHA/exec'

// Where the site reads its products and prices: the Google Apps Script web
// app URL (see tools/products-apps-script.gs). Empty = the built-in copy in
// src/lib/products.js.
export const productsEndpoint = 'https://script.google.com/macros/s/AKfycbxf_RPSu9GBNK28KDQUbN9d8YjLtESsgjyI86UjJPox6gfn4MFiQ-pCvyAtVw5nH-UB/exec'

// Public reference prices (looked up, not invented). Update when they move.
export const reference = {
  petrolPerLitre: 1360,
  petrolNote: 'NNPC and MRS pump price in Lagos, 4 Nov 2026',
  petrolSource: {
    label: 'Vanguard, 4 Nov 2026',
    url: 'https://www.vanguardngr.com/2026/11/petrol-hits-n1370-litre-as-depot-prices-rise/',
  },
  bandATariff: 209.5,
  bandANote: 'Band A, most DisCos, unchanged since July 2024',
  bandASource: {
    label: 'BillsGuide.ng DisCo tariff table',
    url: 'https://www.billsguide.ng/electricity-rates',
  },
  bandsSource: {
    label: 'AidaPay guide to Bands A–E',
    url: 'https://aidapay.ng/guides/electricity-tariff-bands',
  },
}

// Typical petrol generator fuel use at about half load. Rough rule-of-thumb
// figures, shown as an editable estimate.
export const generators = [
  { id: 'small', label: 'Small', size: '2.5 kVA', litresPerHour: 1.0 },
  { id: 'mid', label: 'Medium', size: '5 kVA', litresPerHour: 1.8 },
  { id: 'large', label: 'Large', size: '7.5 kVA', litresPerHour: 2.6 },
]

// Calculator starting values. Examples only; the visitor edits them.
export const calcDefaults = {
  gridBill: 60000,
  genHoursPerDay: 4,
  generatorId: 'small',
  genServicing: 10000,
  coveragePct: 85,
  escalationPct: 0,
  years: 10,
}
