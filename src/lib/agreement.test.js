import test from 'node:test'
import assert from 'node:assert/strict'
import { DEMO_ROW, clauses, dueDate, inWords, money, prepare } from './agreement.js'

test('months in words, as the agreement writes them', () => {
  assert.equal(inWords(12), 'twelve (12)')
  assert.equal(inWords(20), 'twenty (20)')
  assert.equal(inWords(24), 'twenty-four (24)')
  assert.equal(inWords(36), 'thirty-six (36)')
})

test('naira with kobo', () => {
  assert.equal(money(318395.24), '₦318,395.24')
  assert.equal(money(1499000), '₦1,499,000.00')
})

test('prepare works out the plan totals from the sheet row', () => {
  const d = prepare(DEMO_ROW)
  assert.equal(d.months, 12)
  assert.equal(d.instalments, 12 * 317412)
  assert.equal(d.total, 1345488 + 12 * 317412)
  assert.equal(d.depositPct, 30)
  assert.equal(d.last, 317412)
  assert.equal(d.addressShort, '1, Example Street, Yaba, Lagos')
})

test('an exact monthly share: payments rounded up, the last one takes the remainder', () => {
  const d = prepare({ ...DEMO_ROW, monthly: 3660170 / 12 })
  assert.equal(d.regular, 305015)
  assert.equal(d.last, 305005)
  assert.equal(d.total, 5005658)
  assert.equal(d.planCharge, 520698)
  assert.equal(d.schedule.reduce((a, p) => a + p.amount, 0), 3660170)
})

test('due dates: one month after handover, same day each month', () => {
  assert.equal(dueDate('', 1), '1 month after the handover date')
  assert.equal(dueDate('', 3), '3 months after the handover date')
  assert.equal(dueDate('20 November, 2026', 1), '20 December, 2026')
  assert.equal(dueDate('20 November, 2026', 12), '20 November, 2027')
  assert.equal(dueDate('31 January, 2027', 1), '28 February, 2027')
})

test('clauses carry the client address and plan length', () => {
  const c = clauses(prepare(DEMO_ROW))
  assert.match(c.s1[0][2], /1, Example Street, Yaba, Lagos State/)
  assert.match(c.s2a[0][2], /twelve \(12\) monthly payments/)
  assert.match(c.s5[2][2], /from 1, Example Street, Yaba, Lagos without/)
})

test('an unknown package is refused, not shown blank', () => {
  assert.throws(() => prepare({ ...DEMO_ROW, package: 'nope' }), /Unknown package/)
})

test('with no address typed yet, the clauses say "your address"', () => {
  const c = clauses(prepare({ ...DEMO_ROW, address: '' }))
  assert.match(c.s1[0][2], /premises at your address strictly/)
  assert.match(c.s5[2][2], /from your address without/)
})
