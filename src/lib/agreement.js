// The Solafi lease-to-own agreement, as shown on the signing page.
//
// The wording is the owner's v3 agreement. Only the client's own details
// (name, address, date, package, prices, bank account) come from the
// agreement row in the private Google Sheet, so nothing about a client is
// ever in this public repo. Change the wording here and bump TERMS_VERSION:
// every signature records the version and the exact text that was shown.

export const TERMS_VERSION = 'v4.0'

export const PROVIDER = {
  name: 'SOLAFI TECHNOLOGY LIMITED',
  address: '24, Ibadan Close, Opebi, Ikeja, Lagos State',
  site: 'solafi.ng',
}

// What each package installs and allows. `id` matches the Package column in the sheet.
const GRIDMAX = {
    label: 'GridMax: 5kVA Inverter · 10kWh Lithium Battery · 8 Solar Panels',
    system: 'GridMax 5kVA Solar Inverter System (5kVA inverter, 10kWh lithium battery and 8 solar panels, plus breakers, cabling, mounting and remote monitoring)',
    capacity: '5kVA / 10kWh',
    components: [
      ['Hybrid Solar Inverter', '5kVA SRNE Hybrid Solar Inverter', '1 Unit', '2 Years'],
      ['Lithium Battery Storage', '10kWh Oliter Lithium-Ion Battery Pack', '1 Unit', '5 Years'],
      ['Solar PV Array', '620W Monocrystalline Solar Panels', '8 Pieces', '5-Year Service Life'],
      ['Electrical Protection', 'AC Protective Breakers & DC Protective Breakers', '1 Complete Set', 'Standard Install'],
      ['Balance of System', 'Roof Mounts, Solar/AC Cabling & Earthing Kit', '1 Complete Lot', 'Standard Install'],
      ['Smart Telemetry Module', 'Remote Monitoring & Digital Control Unit', '1 Unit', 'Active During Plan'],
    ],
    warranties: 'Inverter: 2 Years; Battery: 5 Years; Panels: 5-Year Service Life',
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
}
export const PACKAGES = {
  gridmax: GRIDMAX,
  '5kva-10kwh': GRIDMAX, // the v3 pilot rows
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
  const cashPrice = Number(row.cashPrice)
  const deposit = Number(row.deposit)
  // The Monthly cell can hold the exact share (e.g. =3660170/12). Payments are
  // then rounded up to the naira and the last one takes the remainder, so
  // they add up to the plan total exactly.
  const instalments = Math.round(months * Number(row.monthly) * 100) / 100
  const regular = Number.isInteger(Number(row.monthly)) ? Number(row.monthly) : Math.ceil(Number(row.monthly))
  const last = Math.round((instalments - regular * (months - 1)) * 100) / 100
  const total = deposit + instalments
  return {
    ...row,
    pkg,
    months,
    cashPrice,
    deposit,
    // the site address without "State", as the table and clause 5.3 write it
    addressShort: String(row.address || '').replace(/\s+State$/i, ''),
    instalments,
    regular,
    last,
    total,
    planCharge: Math.round((total - cashPrice) * 100) / 100,
    depositPct: Math.round((deposit / cashPrice) * 100),
    schedule: Array.from({ length: months }, (_, i) => ({ n: i + 1, amount: i === months - 1 ? last : regular, due: dueDate(row.handoverDate, i + 1) })),
  }
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
// Payment n is due n months after the handover date, on the same day of the
// month (or the month's last day when it is shorter). Before handover the
// date is not known yet, so the due date is described instead.
export function dueDate(handover, n) {
  // the sheet sends dates as "17 November, 2026"
  const p = String(handover || '').match(/^(\d{1,2})\s+([A-Za-z]+),?\s+(\d{4})$/)
  const month = p ? MONTH_NAMES.findIndex((x) => x.toLowerCase() === p[2].toLowerCase()) : -1
  if (month < 0) return `${n} month${n === 1 ? '' : 's'} after the handover date`
  const y = Number(p[3])
  const m = month + n
  const lastDay = new Date(y, m + 1, 0).getDate()
  const d = new Date(y, m, Math.min(Number(p[1]), lastDay))
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}, ${d.getFullYear()}`
}

// Clauses as [number, title, text]. Tables sit between clauses in the page component.
export function clauses(d) {
  const months = inWords(d.months)
  return {
    s1: [
      ['1.1', 'Supply & Installation:', `SOLAFI agrees to supply, deliver, install, and commission the ${d.pkg.system} ("the System") at the Customer's premises at ${d.address || 'your address'} strictly in accordance with the System Specification Table below:`],
      ['1.2', 'Site Readiness & Handover:', 'SOLAFI shall install and test the System upon confirmation of the Deposit and KYC details. The Customer shall provide safe access to the premises and confirm completion by signing this Agreement and the handover date.'],
    ],
    s2a: [['2.1', 'Repayment Plan:', `The Customer shall pay the Deposit before installation and pay the rest of the Total Payable in ${months} monthly payments, as set out in the Payment Summary above. Payment 1 is due one month after the handover date and each later payment on the same day of each following month, into the designated bank account below:`]],
    s2b: [
      ['2.2', 'Strict Payment Rules:', "All payments must be made via electronic bank transfer to the account above. Cash payments to engineers or staff are strictly prohibited and shall not discharge the Customer's obligations. Payments may not be withheld or set off."],
      ['2.3', 'Early Payoff:', 'The Customer may pay off the remaining balance early at any time. The plan charge still to come is then reduced pro rata for the months not yet due.'],
      ['2.4', 'Cancellation Before Installation:', 'If the Customer cancels before installation, SOLAFI shall refund the full Deposit.'],
      ['2.5', 'Missed Payments:', 'Where any monthly payment is not made on its due date, the following steps shall apply:'],
    ],
    s3: [
      ['3.1', 'Approved Usage:', `The Customer shall operate the System strictly within its ${d.pkg.capacity} capacity and comply with the appliance rules below. Any damage caused by overloading or unauthorized wiring modifications shall be the Customer's sole responsibility and shall void the warranty.`],
      ['3.2', 'Run-Times:', 'Run-times depend on actual appliance load and sunlight. The appliance list is a guide, not a guarantee.'],
    ],
    s4: [
      ['4.1', 'Ownership:', `SolaFi owns the system until the final payment is made. Ownership then passes to the customer. The final payment means the Deposit, all ${months} monthly payments and any late fees due have been paid in full.`],
      ['4.2', 'No Third-Party Disposal:', 'Until full payment is completed, the Customer shall not sell, pledge, mortgage, sublease, tamper with, or relocate the System. Any attempt to sell, conceal, or tamper with the System or its remote monitoring unit constitutes a material breach leading to immediate termination and asset recovery.'],
      ['4.3', 'Lawful Recovery & Non-Refund Policy:', "Where a monthly payment remains unpaid for 30 calendar days past its due date, SOLAFI shall give the Customer a final written notice of seven (7) days. If the arrears are still unpaid when that notice ends, the Customer shall give SOLAFI's authorized representatives access during working hours to safely disconnect and remove the System. Upon recovery, the Deposit and all monthly payments made are non-refundable and retained by SOLAFI as agreed liquidated damages for depreciation, usage, installation, and removal costs."],
    ],
    s5: [
      ['5.1', 'Warranty Coverage & Exclusions:', `Warranties (${d.pkg.warranties}) cover manufacturing defects only while the Customer is not in payment default. Misuse voids the warranty, including overloading the System, tampering with wiring, or allowing third-party roadside electricians to alter the setup.`],
      ['5.2', 'Routine & Post-Warranty Maintenance:', 'The Customer is responsible for keeping solar panels clean of dust and debris. After warranty expiration, SOLAFI shall offer discounted maintenance and servicing to the Customer.'],
      ['5.3', 'Strict Relocation Ban & Site Access:', `The Customer shall not uninstall or move the System from ${d.addressShort || 'your address'} without SOLAFI's prior written consent; approved relocations must be performed solely by SOLAFI engineers at the Customer's expense. The Customer grants SOLAFI daylight access for inspections (with 24 hours' notice), and access for recovery as set out in clause 4.3.`],
      ['5.4', 'Care of the System:', 'The Customer shall not move or open the System, or let anyone other than SOLAFI service it.'],
      ['5.5', 'Risk of Loss & Home Insurance Advisory:', "Upon installation, the Customer bears full risk of loss or damage from theft, fire, vandalism, or power surges (except caused by SOLAFI's defective installation), and such loss shall not excuse remaining monthly payments. The Customer is strongly advised to include the System under a comprehensive home or property insurance policy."],
    ],
    s6: [
      ['6.1', 'Limitation of Liability & Force Majeure:', 'SOLAFI shall not be liable for power interruptions due to inclement weather, battery depletion from excess loads, or lawful remote switch-off during default. Force majeure events shall not excuse payment obligations already due.'],
      ['6.2', 'Notices, Entire Agreement & Governing Law:', "Notices and payment reminders may be delivered via WhatsApp, SMS, email, or physical delivery. This Agreement constitutes the entire contract between the Parties and is governed by the laws of the Federal Republic of Nigeria. Unresolved disputes after 14 days of negotiation shall be referred to mediation or the courts of Lagos State, without prejudice to SOLAFI's right to seek urgent interim relief to protect its System."],
    ],
    s7: [['7.1', 'KYC & Tenancy Verification:', 'To complete onboarding without a separate form, the Customer provides the following verified details and uploads a clear copy of their Government ID and Utility Bill / Tenancy Proof on this signing page:']],
  }
}

export const DEFAULT_STAGES = [
  ['1. Grace Period', 'Days 1 – 3 Past Due Date', '3 calendar days allowed to clear the overdue payment with zero penalty.'],
  ['2. Late-Payment Fee', 'Day 4 Onwards Past Due', 'Late fee of ₦5,000.00 per day from Day 4 until the overdue payment is made, capped at ₦50,000.00 per missed payment.'],
  ['3. Remote Switch-Off', 'Day 7 Past Due Date', 'After a written notice, the System may be switched off remotely via the monitoring unit until the arrears and fees are paid.'],
  ['4. Recovery', 'Day 30 Past Due Date', 'After a final 7-day written notice, the agreement ends and the System is disconnected and recovered during working hours. Deposit & past payments are not refunded (clause 4.3).'],
]

// A sample used locally (#demo) so the page can be seen without the sheet.
// Not a real client.
export const DEMO_ROW = {
  token: 'demo',
  customerName: 'Sample Customer',
  phone: '08000000000',
  address: '1, Example Street, Yaba, Lagos State',
  agreementDate: '17 November, 2026',
  package: 'gridmax',
  months: 12,
  cashPrice: 4484960,
  deposit: 1345488,
  monthly: 317412,
  bankName: 'Sample Bank',
  accountNumber: '0000000000',
  accountName: 'Sample Account',
  status: 'Ready',
}
