import { test } from 'node:test'
import assert from 'node:assert/strict'
import { FALLBACK, prepareProducts } from './products.js'
import { recommend, totals, describe } from './finder.js'

const products = prepareProducts(FALLBACK)
const pick = (sel) => recommend(products, sel)

test('nothing added: smallest package, no overflow', () => {
  const r = pick({})
  assert.equal(r.pkg.name, 'PocketGrid')
  assert.equal(r.beyond, false)
})

test('a typical small home fits PocketGrid', () => {
  assert.equal(pick({ bulb: 6, fan: 2, tv: 1, decoder: 1, fridge: 1, laptop: 1 }).pkg.name, 'PocketGrid')
})

test('microwave and pumping machine move up to Prime', () => {
  const r = pick({ bulb: 6, fan: 2, tv: 1, fridge: 1, freezer: 1, microwave: 1, pump: 1 })
  assert.equal(r.pkg.name, 'Prime')
})

test('PocketGrid and Prime never take an AC', () => {
  const r = pick({ ac1: 1 })
  assert.notEqual(r.pkg.name, 'PocketGrid')
  assert.notEqual(r.pkg.name, 'Prime')
})

test('one 1HP AC: GridMax', () => {
  const r = pick({ bulb: 4, fan: 1, tv: 1, fridge: 1, ac1: 1 })
  assert.equal(r.pkg.name, 'GridMax')
  assert.match(r.reason, /1HP AC/)
})

test('one 1.5HP AC: SuperNova', () => {
  assert.equal(pick({ bulb: 4, fridge: 1, ac15: 1 }).pkg.name, 'SuperNova')
})

test('two ACs need Independence', () => {
  assert.equal(pick({ ac1: 2 }).pkg.name, 'Independence')
})

test('up to 4HP of AC fits Independence; more is beyond', () => {
  assert.equal(pick({ ac2: 2 }).beyond, false)
  const r = pick({ ac2: 2, ac1: 1 })
  assert.equal(r.pkg.name, 'Independence')
  assert.equal(r.beyond, true)
})

test('only the biggest short-burst appliance counts toward the load at once', () => {
  const t = totals({ kettle: 1, iron: 1, microwave: 1, fan: 1 })
  assert.equal(t.peakW, 1500 + 70)
})

test('describe lists the selection for the waitlist', () => {
  assert.equal(describe({ fan: 2, ac1: 1, tv: 0 }), '2× Fan, 1× AC 1HP')
})
