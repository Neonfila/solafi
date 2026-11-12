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
export const waitlistEndpoint = ''

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

// Packages, price installed.
export const packages = [
  {
    id: 'p3',
    name: 'Starter',
    kw: 3,
    batteryKwh: 5,
    price: 2500000,
    fits: 'Flat or small home',
    runs: ['Lights and fans', 'TV and decoder', 'Fridge', 'Laptops and Wi-Fi'],
  },
  {
    id: 'p5',
    name: 'Family',
    kw: 5,
    batteryKwh: 10,
    price: 4500000,
    fits: 'Family home or small office',
    featured: true,
    runs: ['Everything in Starter', 'Freezer', 'One 1 hp inverter AC', 'Pumping machine'],
  },
  {
    id: 'p10',
    name: 'Business',
    kw: 10,
    batteryKwh: 20,
    price: 8500000,
    fits: 'Large home or business',
    runs: ['Everything in Family', 'Several ACs', 'Shop or office equipment', 'Longer backup'],
  },
]

// Loan terms.
export const loanDefaults = {
  depositPct: 30,
  tenorMonths: 24,
  monthlyRatePct: 2.5,
}

// Calculator starting values. Examples only; the visitor edits them.
export const calcDefaults = {
  gridBill: 60000,
  genHoursPerDay: 4,
  generatorId: 'small',
  genServicing: 10000,
  coveragePct: 85,
  escalationPct: 0,
  years: 10,
  packageId: 'p5',
}
