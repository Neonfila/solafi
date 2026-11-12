// Pure maths for the savings calculator. No React, no config imports.

const DAYS_PER_MONTH = 365 / 12

/** Monthly generator cost: fuel burned plus servicing. */
export function generatorMonthly({ hoursPerDay, litresPerHour, petrolPerLitre, servicing = 0 }) {
  const fuel = hoursPerDay * litresPerHour * petrolPerLitre * DAYS_PER_MONTH
  return { fuel, servicing, total: fuel + servicing }
}

/** Level monthly repayment on an amortising loan. `monthlyRatePct` is % per month. */
export function monthlyPayment(principal, monthlyRatePct, tenorMonths) {
  if (principal <= 0 || tenorMonths <= 0) return 0
  const r = monthlyRatePct / 100
  if (r === 0) return principal / tenorMonths
  return (principal * r) / (1 - Math.pow(1 + r, -tenorMonths))
}

/**
 * Month-by-month comparison.
 *
 * Staying as you are: grid bill + generator, every month, rising by
 * `escalationPct` once a year.
 *
 * With solar: deposit up front, the loan repayment for `tenorMonths`, plus the
 * part of today's spend solar does not replace ((100 - coveragePct)%), which
 * rises the same way.
 */
export function project({
  currentMonthly,
  price,
  depositPct,
  tenorMonths,
  monthlyRatePct,
  coveragePct,
  escalationPct = 0,
  years,
}) {
  const deposit = price * (depositPct / 100)
  const principal = price - deposit
  const payment = monthlyPayment(principal, monthlyRatePct, tenorMonths)
  const residualShare = 1 - coveragePct / 100
  const months = Math.round(years * 12)

  let cumCurrent = 0
  let cumSolar = deposit
  let breakEvenMonth = null
  const series = [{ month: 0, current: 0, solar: deposit }]

  for (let m = 1; m <= months; m++) {
    const factor = Math.pow(1 + escalationPct / 100, Math.floor((m - 1) / 12))
    const spend = currentMonthly * factor
    cumCurrent += spend
    cumSolar += (m <= tenorMonths ? payment : 0) + spend * residualShare
    if (breakEvenMonth === null && cumCurrent >= cumSolar) breakEvenMonth = m
    series.push({ month: m, current: cumCurrent, solar: cumSolar })
  }

  const residualNow = currentMonthly * residualShare
  return {
    deposit,
    principal,
    payment,
    totalRepaid: payment * tenorMonths,
    interestPaid: payment * tenorMonths - principal,
    residualNow,
    monthlyDuringLoan: payment + residualNow,
    monthlyAfterLoan: residualNow,
    monthlyDiffDuringLoan: currentMonthly - (payment + residualNow),
    breakEvenMonth,
    totalCurrent: cumCurrent,
    totalSolar: cumSolar,
    savings: cumCurrent - cumSolar,
    series,
  }
}

export const naira = (n) => '₦' + Math.round(n).toLocaleString('en-NG')

export function nairaShort(n) {
  const a = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (a >= 1e6) return `${sign}₦${(a / 1e6).toFixed(a >= 1e7 ? 1 : 2).replace(/\.?0+$/, '')}m`
  if (a >= 1e3) return `${sign}₦${Math.round(a / 1e3)}k`
  return `${sign}₦${Math.round(a)}`
}

export function monthsLabel(m) {
  if (m == null) return null
  const y = Math.floor(m / 12)
  const r = m % 12
  if (y === 0) return `${r} month${r === 1 ? '' : 's'}`
  if (r === 0) return `${y} year${y === 1 ? '' : 's'}`
  return `${y} yr ${r} mo`
}
