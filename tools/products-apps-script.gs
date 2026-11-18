// Solafi products: the website reads its product list and prices from here.
//
// Setup (once): open the "Solafi" products sheet → Extensions → Apps Script,
// paste this file, Deploy → New deployment → Web app, Execute as: Me,
// Who has access: Anyone. Put the /exec URL in src/lib/config.js
// (productsEndpoint).
//
// Only the columns a customer should see leave the sheet: name, what is in
// the system, what it runs, cash price, deposit, monthly payment and plan
// total. Net cost, Solafi input, charges and profit never do.
//
// Columns are found by their header text, so they can be moved around.
// Renaming a header may need the pattern below changed too.

const OVERVIEW_TAB = 'Products overview'
const SPEC_TAB = 'Product Specification'

function doGet() {
  try {
    return json({ ok: true, products: products() })
  } catch (err) {
    return json({ ok: false, error: String(err.message || err) })
  }
}

function products() {
  const book = SpreadsheetApp.getActiveSpreadsheet()
  const overview = table(book, OVERVIEW_TAB)
  const spec = table(book, SPEC_TAB)

  const name = col(overview, /^product$/i)
  const total = col(overview, /^total client bill/i)
  const cash = col(overview, /^client bill/i)
  const deposit = col(overview, /initial payment/i)
  const monthly = col(overview, /month\s*installment/i)

  const sName = col(spec, /^product$/i)
  const summary = col(spec, /summary/i)
  const runs = col(spec, /permitted/i)
  const specBy = {}
  spec.rows.forEach((r) => { specBy[key(r[sName])] = r })

  return overview.rows
    .filter((r) => String(r[name]).trim())
    .map((r) => {
      const s = specBy[key(r[name])] || []
      return {
        name: String(r[name]).trim(),
        summary: String(s[summary] || '').trim(),
        runs: String(s[runs] || '').trim(),
        cashPrice: num(r[cash]),
        deposit: num(r[deposit]),
        monthly: num(r[monthly]),
        total: num(r[total]),
      }
    })
}

function table(book, tab) {
  const sheet = book.getSheetByName(tab)
  if (!sheet) throw new Error('No tab called ' + tab)
  const values = sheet.getDataRange().getValues()
  return { head: values[0].map((h) => String(h).replace(/\s+/g, ' ').trim()), rows: values.slice(1) }
}

function col(t, re) {
  const i = t.head.findIndex((h) => re.test(h))
  if (i < 0) throw new Error('No column matching ' + re)
  return i
}

const key = (v) => String(v).toLowerCase().replace(/[^a-z0-9]/g, '')
const num = (v) => Math.round(typeof v === 'number' ? v : Number(String(v).replace(/[^\d.]/g, '')) || 0)
const json = (o) => ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON)
