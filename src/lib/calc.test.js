import test from 'node:test'
import assert from 'node:assert/strict'
import { generatorMonthly, monthlyPayment, project, monthsLabel } from './calc.js'

const near = (a, b, tol = 1) => assert.ok(Math.abs(a - b) <= tol, `${a} not within ${tol} of ${b}`)

test('generator fuel: 5 h/day at 1.8 L/h and ₦1,360/L', () => {
  const g = generatorMonthly({ hoursPerDay: 5, litresPerHour: 1.8, petrolPerLitre: 1360, servicing: 10000 })
  near(g.fuel, 5 * 1.8 * 1360 * (365 / 12))
  near(g.fuel, 372300)
  near(g.total, 382300)
})

test('zero-interest payment is principal / months', () => {
  assert.equal(monthlyPayment(2400000, 0, 24), 100000)
})

test('amortised payment matches the annuity formula', () => {
  // ₦3,150,000 at 2.5%/month over 24 months
  const p = monthlyPayment(3150000, 2.5, 24)
  near(p, 176125, 5)
  // repaying at that level clears the balance
  let bal = 3150000
  for (let i = 0; i < 24; i++) bal = bal * 1.025 - p
  near(bal, 0, 0.01)
})

test('projection totals, break-even and savings', () => {
  const r = project({
    currentMonthly: 200000, price: 2400000, depositPct: 50, tenorMonths: 12,
    monthlyRatePct: 0, coveragePct: 100, escalationPct: 0, years: 2,
  })
  assert.equal(r.deposit, 1200000)
  assert.equal(r.payment, 100000)
  assert.equal(r.totalCurrent, 4800000)
  assert.equal(r.totalSolar, 2400000)
  assert.equal(r.savings, 2400000)
  // month m: current 200k*m vs 1.2m + 100k*m  → equal at m = 12
  assert.equal(r.breakEvenMonth, 12)
  assert.equal(r.series.length, 25)
})

test('coverage below 100% leaves residual spend on the solar side', () => {
  const r = project({
    currentMonthly: 100000, price: 1200000, depositPct: 0, tenorMonths: 12,
    monthlyRatePct: 0, coveragePct: 80, escalationPct: 0, years: 1,
  })
  near(r.residualNow, 20000, 0.01)
  near(r.monthlyDuringLoan, 120000, 0.01)
  near(r.totalSolar, 1440000, 0.01)
  assert.equal(r.breakEvenMonth, null)
  near(r.savings, -240000, 0.01)
})

test('escalation applies from year two', () => {
  const r = project({
    currentMonthly: 100000, price: 0, depositPct: 0, tenorMonths: 0,
    monthlyRatePct: 0, coveragePct: 100, escalationPct: 10, years: 2,
  })
  near(r.totalCurrent, 1200000 + 1320000)
})

test('monthsLabel', () => {
  assert.equal(monthsLabel(7), '7 months')
  assert.equal(monthsLabel(24), '2 years')
  assert.equal(monthsLabel(31), '2 yr 7 mo')
})
