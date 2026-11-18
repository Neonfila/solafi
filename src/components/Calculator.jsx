import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowRight, ChevronDown, Info } from 'lucide-react'
import SavingsChart from './SavingsChart.jsx'
import { generatorMonthly, project, naira, nairaShort, monthsLabel } from '../lib/calc.js'
import { calcDefaults, generators, reference, termsAreFinal } from '../lib/config.js'
import { featuredOf, useProducts } from '../lib/products.js'

function MoneyField({ label, value, onChange, min = 0, max, step = 1000 }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <span className="field-input">
        <b>₦</b>
        <input
          type="text"
          inputMode="numeric"
          value={value.toLocaleString('en-NG')}
          onChange={(e) => onChange(Math.min(Number(e.target.value.replace(/[^\d]/g, '')) || 0, 999999999))}
        />
      </span>
      {max != null && (
        <input type="range" aria-label={label} min={min} max={max} step={step} value={Math.min(value, max)} onChange={(e) => onChange(Number(e.target.value))} />
      )}
    </label>
  )
}

function NumField({ label, value, onChange, min = 0, max, step = 1, unit }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <span className="field-input">
        <input
          type="number"
          inputMode="decimal"
          min={min} max={max} step={step}
          value={value}
          onChange={(e) => {
            const n = Number(e.target.value)
            onChange(Number.isFinite(n) ? Math.max(min, max != null ? Math.min(n, max) : n) : min)
          }}
        />
        {unit && <b className="unit">{unit}</b>}
      </span>
      {max != null && (
        <input type="range" aria-label={label} min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      )}
    </label>
  )
}

// The chart looks five years ahead: far enough to show the system paying off,
// short enough to trust.
const CHART_YEARS = 5

export default function Calculator({ onEstimate }) {
  const d = calcDefaults
  const [gridBill, setGridBill] = useState(d.gridBill)
  const [hours, setHours] = useState(d.genHoursPerDay)
  const [genId, setGenId] = useState(d.generatorId)
  const [lph, setLph] = useState(generators.find((g) => g.id === d.generatorId).litresPerHour)
  const [petrol, setPetrol] = useState(reference.petrolPerLitre)
  const [servicing, setServicing] = useState(d.genServicing)

  const products = useProducts()
  const [pkgId, setPkgId] = useState(null)
  const [coverage, setCoverage] = useState(d.coveragePct)
  const [showTerms, setShowTerms] = useState(false)

  // the plan picked, or the featured one; follows the sheet when prices change
  const pkg = products.find((p) => p.id === pkgId) || featuredOf(products)
  const tenor = pkg.months
  const pickGen = (id) => {
    setGenId(id)
    setLph(generators.find((g) => g.id === id).litresPerHour)
  }

  const gen = useMemo(
    () => generatorMonthly({ hoursPerDay: hours, litresPerHour: lph, petrolPerLitre: petrol, servicing: hours > 0 ? servicing : 0 }),
    [hours, lph, petrol, servicing],
  )
  const current = gridBill + gen.total
  const r = useMemo(
    () => project({ currentMonthly: current, deposit: pkg.deposit, payment: pkg.monthly, tenorMonths: tenor, coveragePct: coverage, escalationPct: 0, years: CHART_YEARS }),
    [current, pkg, tenor, coverage],
  )

  useEffect(() => {
    onEstimate?.({
      system: pkg.name,
      currentMonthly: Math.round(current),
      solafiMonthly: Math.round(r.monthlyDuringLoan),
    })
  }, [onEstimate, pkg, current, r.monthlyDuringLoan])

  // Phones: inputs and result do not fit on one screen, so a small bar keeps
  // the live result in view while the inputs are being edited.
  const inputsRef = useRef(null)
  const resultRef = useRef(null)
  const [dock, setDock] = useState(false)
  useEffect(() => {
    const seen = { inputs: false, result: false }
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) seen[e.target === inputsRef.current ? 'inputs' : 'result'] = e.isIntersecting
      setDock(seen.inputs && !seen.result)
    }, { rootMargin: '-25% 0px -90px 0px' })
    io.observe(inputsRef.current)
    io.observe(resultRef.current)
    return () => io.disconnect()
  }, [])

  const barMax = Math.max(current, r.monthlyDuringLoan, 1)
  const diff = r.monthlyDiffDuringLoan

  return (
    <div className="calc">
      <div className={`calc-inputs${showTerms ? '' : ' calc-inputs--stick'}`} ref={inputsRef}>
        <fieldset>
          <legend>What you spend now</legend>
          <MoneyField label="Monthly NEPA bill" value={gridBill} onChange={setGridBill} max={400000} step={5000} />
          <NumField label="Generator hours per day" value={hours} onChange={setHours} max={24} step={0.5} unit="hrs" />
          <div className="field">
            <span className="field-label">Generator size</span>
            <div className="seg" role="radiogroup" aria-label="Generator size">
              {generators.map((g) => (
                <button key={g.id} type="button" role="radio" aria-checked={genId === g.id} className={genId === g.id ? 'on' : ''} onClick={() => pickGen(g.id)}>
                  {g.size}
                </button>
              ))}
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Pick a package</legend>
          <div className="pkg-pick" role="radiogroup" aria-label="Package">
            {products.map((p) => (
              <button key={p.id} type="button" role="radio" aria-checked={pkg.id === p.id} className={pkg.id === p.id ? 'on' : ''} onClick={() => setPkgId(p.id)}>
                <b>{p.name}</b>
                <small>{[p.kva && `${p.kva} kVA`, p.batteryKwh && `${p.batteryKwh} kWh`].filter(Boolean).join(' · ')}</small>
              </button>
            ))}
          </div>

          <button type="button" className="terms-toggle" aria-expanded={showTerms} onClick={() => setShowTerms(!showTerms)}>
            Change fuel price and other details
            <ChevronDown size={18} className={showTerms ? 'flip' : ''} />
          </button>
          {showTerms && (
            <div className="terms">
              <div className="field-row">
                <NumField label="Generator fuel use" value={lph} onChange={setLph} min={0} max={10} step={0.1} unit="L/hr" />
                <MoneyField label="Petrol per litre" value={petrol} onChange={setPetrol} />
              </div>
              <MoneyField label="Generator servicing per month" value={servicing} onChange={setServicing} max={100000} step={1000} />
              <NumField label="Share of your NEPA and fuel spend solar covers" value={coverage} onChange={setCoverage} max={100} step={5} unit="%" />
            </div>
          )}
          {!termsAreFinal && (
            <p className="assumption">
              <Info size={15} />
              Prices and loan terms here are placeholders while Solafi finalises its plans. This is an estimate, not a quote.
            </p>
          )}
        </fieldset>
      </div>

      <div className="calc-result" aria-live="polite" ref={resultRef}>
        <div className="answer">
          {diff >= 0
            ? <p className="answer-main">You save <strong>{naira(diff)}</strong> every month.</p>
            : <p className="answer-main">You pay <strong className="more">{naira(-diff)} more</strong> a month for {monthsLabel(tenor)}.</p>}
        </div>

        <div className="bars">
          <div className="bar">
            <div className="bar-head"><span>Now</span><strong>{naira(current)}<small>/month</small></strong></div>
            <div className="bar-track"><i className="bar-fill bar-fill--current" style={{ width: `${(current / barMax) * 100}%` }} /></div>
          </div>
          <div className="bar">
            <div className="bar-head"><span>With Solafi, for {monthsLabel(tenor)}</span><strong>{naira(r.monthlyDuringLoan)}<small>/month</small></strong></div>
            <div className="bar-track"><i className="bar-fill bar-fill--solar" style={{ width: `${(r.monthlyDuringLoan / barMax) * 100}%` }} /></div>
          </div>
          <div className="bar">
            <div className="bar-head"><span>After {monthsLabel(tenor)}, it is yours</span><strong>{naira(r.monthlyAfterLoan)}<small>/month</small></strong></div>
            <div className="bar-track"><i className="bar-fill bar-fill--after" style={{ width: `${Math.max((r.monthlyAfterLoan / barMax) * 100, 1.5)}%` }} /></div>
          </div>
        </div>

        <div className="five">
          <p className="five-head">
            {r.savings >= 0
              ? <>Over {CHART_YEARS} years you keep <strong>{nairaShort(r.savings)}</strong></>
              : <>Over {CHART_YEARS} years Solafi costs <strong className="more">{nairaShort(-r.savings)} more</strong></>}
          </p>
          <SavingsChart series={r.series} tenorMonths={tenor} />
        </div>

        <p className="deposit-line"><span>Deposit</span><strong>{naira(r.deposit)}</strong></p>

        <Link to="/#waitlist" className="btn btn--sun btn--block">
          Join the waitlist <ArrowRight size={18} />
        </Link>
        <p className="sources">
          Petrol {naira(reference.petrolPerLitre)}/litre, <a href={reference.petrolSource.url} target="_blank" rel="noreferrer">{reference.petrolSource.label}</a>
        </p>
      </div>

      <button
        type="button"
        className={`calc-dock${dock ? ' show' : ''}`}
        tabIndex={dock ? 0 : -1}
        aria-hidden={!dock}
        onClick={() => resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })}
      >
        <span><small>Now</small><b className="now">{nairaShort(current)}</b></span>
        <span><small>With Solafi</small><b className="then">{nairaShort(r.monthlyDuringLoan)}</b></span>
        <span><small>{diff >= 0 ? 'You save' : 'Extra'}</small><b className={diff >= 0 ? 'good' : 'bad'}>{nairaShort(Math.abs(diff))}/mo</b></span>
        <i><ArrowDown size={18} /></i>
      </button>
    </div>
  )
}
