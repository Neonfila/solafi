import test from 'node:test'
import assert from 'node:assert/strict'
import { FALLBACK, prepareProducts } from './products.js'

test('sizes come out of the sheet summary, however it is typed', () => {
  const [pocket, , , nova, indep] = prepareProducts(FALLBACK)
  assert.deepEqual([pocket.kva, pocket.batteryKwh, pocket.panels], [3, 2.56, 3])
  assert.deepEqual([nova.kva, nova.batteryKwh, nova.panels], [5, 15, 12])
  assert.deepEqual([indep.kva, indep.batteryKwh, indep.panels], [10, 32, 16])
})

test('months come from the plan total: deposit + 12 payments', () => {
  for (const p of prepareProducts(FALLBACK)) assert.equal(p.months, 12)
})

test('product names in the runs text match the real names', () => {
  const list = prepareProducts(FALLBACK)
  assert.match(list[3].runs, /^Everything in GridMax \(1hp or 1.5hp AC\)/)
  assert.equal(list.find((p) => p.featured).name, 'PocketGrid')
})

test('nothing private is in the built-in copy', () => {
  for (const r of FALLBACK) assert.deepEqual(Object.keys(r).sort(), ['cashPrice', 'deposit', 'monthly', 'name', 'runs', 'summary', 'total'])
})
