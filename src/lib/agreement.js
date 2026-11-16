// The Solafi lease-to-own agreement, as shown on the signing page.
//
// The wording is the owner's v3 agreement. Only the client's own details
// (name, address, date, package, prices, bank account) come from the
// agreement row in the private Google Sheet, so nothing about a client is
// ever in this public repo. Change the wording here and bump TERMS_VERSION:
// every signature records the version and the exact text that was shown.

export const TERMS_VERSION = 'v3.1'

export const PROVIDER = {
  name: 'SOLAFI TECHNOLOGY LIMITED',
  address: '24, Ibadan Close, Opebi, Ikeja, Lagos State',
  site: 'solafi.ng',
}

// What each package installs and allows. `id` matches the Package column in the sheet.
export const PACKAGES = {
  '5kva-10kwh': {
    label: '5kVA SRNE + 10kWh Oliter Lithium',
    system: '5kVA Solar Inverter System',
    capacity: '5kVA / 10kWh',
    components: [
      ['Hybrid Solar Inverter', '5kVA SRNE Hybrid Solar Inverter', '1 Unit', '2 Years'],
      ['Lithium Battery Storage', '10kWh Oliter Lithium-Ion Battery Pack', '1 Unit', '5 Years'],
      ['Solar PV Array', '620W Monocrystalline Solar Panels', '8 Pieces', '5 Years'],
      ['Electrical Protection', 'AC Protective Breakers & DC Protective Breakers', '1 Complete Set', 'Standard Install'],
      ['Balance of System', 'Roof Mounts, Solar/AC Cabling & Earthing Kit', '1 Complete Lot', 'Standard Install'],
      ['Smart Telemetry Module', 'Remote Monitoring & Digital Control Unit', '1 Unit', 'Active During Plan'],
    ],
    warranties: 'Inverter: 2 Years; Battery: 5 Years; Panels: 5 Years',
    permittedTitle: 'PERMITTED APPLIANCES (Approved for 5kVA + 10kWh Setup)',
    permitted: [
      'LED bulbs, ceiling fans, standing & rechargeable fans',
      'Televisions, soundbars, decoders, laptops & Wi-Fi routers',
      'Energy-efficient refrigerator / chest freezer',
    ],
    exception: 'APPROVED 10kWh EXCEPTION: One (1) energy-efficient 1 HP Inverter AC (operated judiciously within battery reserves)',
    prohibitedTitle: 'PROHIBITED APPLIANCES (Strictly Barred Without Upgrade)',
    prohibited: [
      'Electric cookers, hot plates, ovens & microwave ovens',
      'Electric kettles, water heaters & pressing irons',
      'Welding machines & heavy industrial motors (>1 HP)',
      'Multiple air conditioners or simultaneous loads exceeding 5kVA rated inverter capacity',
    ],
  },
}

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
  'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty']
const TENS = { 2: 'twenty', 3: 'thirty', 4: 'forty', 5: 'fifty', 6: 'sixty' }
// 12 -> "twelve (12)", 24 -> "twenty-four (24)"
export function inWords(n) {
  const w = n <= 20 ? WORDS[n] : TENS[Math.floor(n / 10)] + (n % 10 ? '-' + WORDS[n % 10] : '')
  return `${w} (${n})`
}

export const money = (n) => '₦' + Number(n).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// Everything the page needs, worked out once from the sheet row.
export function prepare(row) {
  const pkg = PACKAGES[row.package]
  if (!pkg) throw new Error(`Unknown package "${row.package}"`)
  const months = Number(row.months)
  const instalments = months * Number(row.monthly)
  return {
    ...row,
    pkg,
    months,
    // the site address without "State", as v3 writes it in the table and clause 5.3
    addressShort: String(row.address).replace(/\s+State$/i, ''),
    instalments,
    total: Number(row.deposit) + instalments,
  }
}

// Clauses as [number, title, text]. Tables sit between clauses in the page component.
export function clauses(d) {
  const months = inWords(d.months)
  return {
    s1: [
      ['1.1', 'Supply & Installation:', `SOLAFI agrees to supply, deliver, install, and commission the ${d.pkg.system} ("the System") at the Customer's premises at ${d.address} strictly in accordance with the System Specification Table below:`],
      ['1.2', 'Site Readiness & Handover:', 'SOLAFI shall install and test the System upon confirmation of the Initial Deposit and KYC details. The Customer shall provide safe access to the premises and confirm completion by signing this Agreement and the handover date above.'],
    ],
    s2a: [['2.1', 'Repayment Structure:', `The Customer shall pay the Initial Deposit prior to installation and pay the remaining balance in ${months} equal monthly instalments every thirty (30) calendar days from the handover date into the designated bank account below:`]],
    s2b: [
      ['2.2', 'Strict Payment Rules:', "All payments must be made via electronic bank transfer to the account above. Cash payments to engineers or staff are strictly prohibited and shall not discharge the Customer's obligations. Payments may not be withheld or set off."],
      ['2.3', 'Default & Enforcement Triggers:', 'Time is of the essence. Where any monthly instalment is not paid on its due date, the following automated enforcement timeline shall apply:'],
    ],
    s3: [['3.1', 'Approved Usage:', `The Customer shall operate the System strictly within its ${d.pkg.capacity} capacity and comply with the appliance rules below. Any damage caused by overloading or unauthorized wiring modifications shall be the Customer's sole responsibility and shall void the warranty.`]],
    s4: [
      ['4.1', '100% Title Retention:', `SOLAFI retains full legal ownership and title to the System until the Customer has paid the Initial Deposit, all ${months} monthly instalments, and any accrued late-payment fees in full. Upon final payment, SOLAFI shall transfer full legal ownership to the Customer.`],
      ['4.2', 'No Third-Party Disposal:', 'Until full payment is completed, the Customer shall not sell, pledge, mortgage, sublease, tamper with, or relocate the System. Any attempt to sell, conceal, or tamper with the System or its remote monitoring unit constitutes a material breach leading to immediate termination and asset recovery.'],
      ['4.3', 'Lawful Recovery & Non-Refund Policy:', "Where an instalment remains unpaid for 30 calendar days past its due date, the Customer shall grant SOLAFI's authorized representatives prompt daylight access to safely disconnect and remove the System. Upon repossession, the Initial Deposit and all prior instalments paid are strictly non-refundable and retained by SOLAFI as agreed liquidated damages for depreciation, usage, installation, and removal costs."],
    ],
    s5: [
      ['5.1', 'Warranty Coverage & Exclusions:', `Warranties (${d.pkg.warranties}) cover manufacturing defects only while the Customer is not in payment default. Warranties are immediately voided if the Customer overloads the System, tampers with wiring, or allows third-party roadside electricians to alter the setup.`],
      ['5.2', 'Routine & Post-Warranty Maintenance:', 'The Customer is responsible for keeping solar panels clean of dust and debris. After warranty expiration, SOLAFI shall offer discounted maintenance and servicing to the Customer.'],
      ['5.3', 'Strict Relocation Ban & Site Access:', `The Customer shall not uninstall or move the System from ${d.addressShort} without SOLAFI's prior written consent; approved relocations must be performed solely by SOLAFI engineers at the Customer's expense. The Customer grants SOLAFI daylight access for inspections (with 24 hours' notice) or immediate lawful repossession upon a 30-day default.`],
      ['5.4', 'Risk of Loss & Home Insurance Advisory:', "Upon installation, the Customer bears full risk of loss or damage from theft, fire, vandalism, or power surges (except caused by SOLAFI's defective installation), and such loss shall not excuse remaining monthly payments. The Customer is strongly advised to include the System under a comprehensive home or property insurance policy."],
    ],
    s6: [
      ['6.1', 'Limitation of Liability & Force Majeure:', 'SOLAFI shall not be liable for power interruptions due to inclement weather, battery depletion from excess loads, or lawful remote lockout during default. Force majeure events shall not excuse payment obligations already due.'],
      ['6.2', 'Notices, Entire Agreement & Governing Law:', "Notices and payment reminders may be delivered via WhatsApp, SMS, email, or physical delivery. This Agreement constitutes the entire contract between the Parties and is governed by the laws of the Federal Republic of Nigeria. Unresolved disputes after 14 days of negotiation shall be referred to mediation or the courts of Lagos State, without prejudice to SOLAFI's right to seek urgent interim relief to protect its System."],
    ],
    s7: [['7.1', 'KYC & Tenancy Verification:', 'To complete onboarding without a separate form, the Customer provides the following verified details and uploads a clear copy of their Government ID and Utility Bill / Tenancy Proof on this signing page:']],
  }
}

export const DEFAULT_STAGES = [
  ['1. Grace Period', 'Days 1 – 3 Past Due Date', '3 calendar days allowed to clear overdue instalment with zero penalty.'],
  ['2. Late-Payment Fee', 'Day 4 Onwards Past Due', 'Flat penalty of ₦5,000.00 per day accrues from Day 4 until overdue sum is paid.'],
  ['3. Remote Lockout', 'Day 7 Past Due Date', 'System is remotely deactivated via telemetry unit until arrears + fees are settled.'],
  ['4. Asset Repossession', 'Day 30 Past Due Date', 'Agreement terminated; System disconnected & recovered. Deposit & past payments forfeited.'],
]

// A sample used locally (#demo) so the page can be seen without the sheet.
// Not a real client.
export const DEMO_ROW = {
  token: 'demo',
  customerName: 'Sample Customer',
  phone: '08000000000',
  address: '1, Example Street, Yaba, Lagos State',
  agreementDate: '17 November, 2026',
  package: '5kva-10kwh',
  months: 12,
  cashPrice: 4484256,
  deposit: 1499000,
  monthly: 318395.24,
  bankName: 'Sample Bank',
  accountNumber: '0000000000',
  accountName: 'Sample Account',
  status: 'Ready',
}
