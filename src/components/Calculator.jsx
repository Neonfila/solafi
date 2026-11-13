import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowRight, ChevronDown, Info } from 'lucide-react'
import SavingsChart from './SavingsChart.jsx'
import { generatorMonthly, project, naira, nairaShort, monthsLabel } from '../lib/calc.js'
import { calcDefaults, generators, loanDefaults, packages, reference, termsAreFinal } from '../lib/config.js'

function MoneyField({ label, hint, value, onChange, min = 0, max, step = 1000 }) {
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
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  )
}

function NumField({ label, hint, value, onChange, min = 0, max, step = 1, unit }) {
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
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  )
}

export default function Calculator({ onEstimate }) {
  const d = calcDefaults
  const [gridBill, setGridBill] = useState(d.gridBill)
  const [hours, setHours] = useState(d.genHoursPerDay)
  const [genId, setGenId] = useState(d.generatorId)
  const [lph, setLph] = useState(generators.find((g) => g.id === d.generatorId).litresPerHour)
  const [petrol, setPetrol] = useState(reference.petrolPerLitre)
  const [servicing, setServicing] = useState(d.genServicing)

  const [pkgId, setPkgId] = useState(d.packageId)
  const [price, setPrice] = useState(packages.find((p) => p.id === d.packageId).price)
  const [depositPct, setDepositPct] = useState(loanDefaults.depositPct)
  const [tenor, setTenor] = useState(loanDefaults.tenorMonths)
  const [rate, setRate] = useState(loanDefaults.monthlyRatePct)
  const [coverage, setCoverage] = useState(d.coveragePct)
  const [escalation, setEscalation] = useState(d.escalationPct)
  const [years, setYears] = useState(d.years)
  const [showTerms, setShowTerms] = useState(false)

  const pkg = packages.find((p) => p.id === pkgId)
  const pickGen = (id) => {
    setGenId(id)
    setLph(generators.find((g) => g.id === id).litresPerHour)
  }
  const pickPkg = (id) => {
    setPkgId(id)
    setPrice(packages.find((p) => p.id === id).price)
  }

  const gen = useMemo(
    () => generatorMonthly({ hoursPerDay: hours, litresPerHour: lph, petrolPerLitre: petrol, servicing: hours > 0 ? servicing : 0 }),
    [hours, lph, petrol, servicing],
  )
  const current = gridBill + gen.total
  const r = useMemo(
    () => project({ currentMonthly: current, price, depositPct, tenorMonths: tenor, monthlyRatePct: rate, coveragePct: coverage, escalationPct: escalation, years }),
    [current, price, depositPct, tenor, rate, coverage, escalation, years],
  )

  useEffect(() => {
    onEstimate?.({
      system: `${pkg.kw} kW + ${pkg.batteryKwh} kWh battery`,
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
            <div className="seg seg--stack" role="radiogroup" aria-label="Generator size">
              {generators.map((g) => (
                <button key={g.id} type="button" role="radio" aria-checked={genId === g.id} className={genId === g.id ? 'on' : ''} onClick={() => pickGen(g.id)}>
                  <strong>{g.label}</strong>
                  <span>{g.size}</span>
                </button>
              ))}
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Pick a system</legend>
          <div className="pkg-pick" role="radiogroup" aria-label="System size">
            {packages.map((p) => (
              <button key={p.id} type="button" role="radio" aria-checked={pkgId === p.id} className={pkgId === p.id ? 'on' : ''} onClick={() => pickPkg(p.id)}>
                <strong>{p.kw} kW</strong>
                <span>{p.batteryKwh} kWh battery</span>
              </button>
            ))}
          </div>

          <button type="button" className="terms-toggle" aria-expanded={showTerms} onClick={() => setShowTerms(!showTerms)}>
            <span>
              Adjust the details
              <em>{depositPct}% deposit · {tenor} months · petrol {naira(petrol)}/litre</em>
            </span>
            <ChevronDown size={18} className={showTerms ? 'flip' : ''} />
          </button>
          {showTerms && (
            <div className="terms">
              <div className="field-row">
                <NumField label="Generator fuel use" value={lph} onChange={setLph} min={0} max={10} step={0.1} unit="L/hr" />
                <MoneyField label="Petrol per litre" value={petrol} onChange={setPetrol} />
              </div>
              <MoneyField label="Generator servicing per month" value={servicing} onChange={setServicing} max={100000} step={1000} />
              <MoneyField label="System price, installed" value={price} onChange={setPrice} max={20000000} step={50000} />
              <div className="field-row">
                <NumField label="Deposit" value={depositPct} onChange={setDepositPct} max={90} step={5} unit="%" />
                <NumField label="Pay over" value={tenor} onChange={setTenor} min={1} max={60} step={1} unit="months" />
              </div>
              <div className="field-row">
                <NumField label="Interest per month" value={rate} onChange={setRate} max={10} step={0.1} unit="%" />
                <NumField label="Spend solar replaces" value={coverage} onChange={setCoverage} max={100} step={5} unit="%" />
              </div>
              <div className="field-row">
                <NumField label="Yearly price rise" value={escalation} onChange={setEscalation} max={50} step={1} unit="%" />
                <NumField label="Years to compare" value={years} onChange={setYears} min={1} max={15} step={1} unit="yrs" />
              </div>
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
        <div className="bars">
          <div className="bar">
            <div className="bar-head"><span>You pay now</span><strong>{naira(current)}<small>/month</small></strong></div>
            <div className="bar-track"><i className="bar-fill bar-fill--current" style={{ width: `${(current / barMax) * 100}%` }} /></div>
            <p>NEPA {naira(gridBill)} + fuel {naira(gen.fuel)}{gen.servicing > 0 && <> + servicing {naira(gen.servicing)}</>}</p>
          </div>
          <div className="bar">
            <div className="bar-head"><span>With Solafi, first {monthsLabel(tenor)}</span><strong>{naira(r.monthlyDuringLoan)}<small>/month</small></strong></div>
            <div className="bar-track"><i className="bar-fill bar-fill--solar" style={{ width: `${(r.monthlyDuringLoan / barMax) * 100}%` }} /></div>
            <p>Repayment {naira(r.payment)}{r.residualNow > 0 && <> + {naira(r.residualNow)} NEPA and fuel you still use</>}</p>
          </div>
          <div className="bar">
            <div className="bar-head"><span>After the loan</span><strong>{naira(r.monthlyAfterLoan)}<small>/month</small></strong></div>
            <div className="bar-track"><i className="bar-fill bar-fill--after" style={{ width: `${Math.max((r.monthlyAfterLoan / barMax) * 100, 1.5)}%` }} /></div>
          </div>
        </div>

        <div className={`verdict ${diff >= 0 ? 'verdict--good' : 'verdict--neutral'}`}>
          {diff >= 0
            ? <>You pay <strong>{naira(diff)} less</strong> every month from day one.</>
            : <>You pay <strong>{naira(-diff)} more</strong> a month while repaying, then <strong>{naira(current - r.monthlyAfterLoan)} less</strong> a month after.</>}
        </div>

        <div className="saved">
          <span>{r.savings >= 0 ? `Saved over ${years} years` : `Extra cost over ${years} years`}</span>
          <strong className={r.savings >= 0 ? 'good' : 'bad'}>{nairaShort(Math.abs(r.savings))}</strong>
        </div>
        <dl className="sums">
          <div><dt>Pays for itself in</dt><dd>{r.breakEvenMonth ? monthsLabel(r.breakEvenMonth) : `Over ${years} yrs`}</dd></div>
          <div><dt>Deposit to start</dt><dd>{nairaShort(r.deposit)}</dd></div>
        </dl>

        <SavingsChart series={r.series} tenorMonths={tenor} breakEvenMonth={r.breakEvenMonth} />

        <Link to="/#waitlist" className="btn btn--sun btn--block">
          Join the waitlist with this estimate <ArrowRight size={18} />
        </Link>
        <p className="sources">
          Petrol: {reference.petrolNote} (<a href={reference.petrolSource.url} target="_blank" rel="noreferrer">{reference.petrolSource.label}</a>).
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
        <span><small>Saved in {years} yrs</small><b className={r.savings >= 0 ? 'good' : 'bad'}>{nairaShort(r.savings)}</b></span>
        <i><ArrowDown size={18} /></i>
      </button>
    </div>
  )
}
