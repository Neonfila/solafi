import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Plus } from 'lucide-react'
import StreetScene from '../components/StreetScene.jsx'
import Calculator from '../components/Calculator.jsx'
import Waitlist from '../components/Waitlist.jsx'
import { naira, nairaShort, monthlyPayment } from '../lib/calc.js'
import { loanDefaults, packages } from '../lib/config.js'

const steps = [
  { title: 'Tell us what you run', body: 'Your NEPA bill, your generator, what you need to power.' },
  { title: 'We install everything', body: 'Panels, inverter and battery, fitted for you.' },
  { title: 'You pay monthly', body: 'A deposit to start, then one fixed payment a month.' },
  { title: 'Then it is yours', body: 'After the last payment, the system belongs to you.' },
]

const faqs = [
  { q: 'Is the calculator result a quote?', a: 'No. It is an estimate built from the numbers you enter and the plan terms shown, which you can edit. Your real quote comes after we look at what you need to power.' },
  { q: 'What can a 5 kW system with battery run?', a: 'Typically the everyday load of a family home: lights, fans, TV, fridge and freezer, laptops, Wi-Fi and a pumping machine, with room for an inverter air conditioner. What it can run and for how long depends on your appliances, so we size it with you.' },
  { q: 'Do I still need NEPA?', a: 'You can keep your grid connection as a backup and for heavy loads. Most people simply use far less of it, and stop depending on the generator.' },
  { q: 'Where is Solafi available?', a: 'We are opening area by area. Join the waitlist with your city and we will tell you when we reach you.' },
]

export default function Home() {
  const [estimate, setEstimate] = useState(null)
  const [openFaq, setOpenFaq] = useState(0)

  return (
    <>
      <section className="hero">
        <div className="wrap hero-head">
          <h1>Go solar now.<br /><span className="sun-text">Pay small‑small.</span></h1>
          <div className="hero-side">
            <p className="lede">
              Solafi installs a complete solar system at your home or business. You pay for it monthly,
              with the money you already spend on NEPA and generator fuel.
            </p>
            <div className="hero-cta">
              <Link to="/#calculator" className="btn btn--sun">See what you would save <ArrowRight size={18} /></Link>
              <Link to="/#waitlist" className="btn btn--ghost">Join the waitlist</Link>
            </div>
          </div>
        </div>
        <StreetScene />
      </section>

      <section id="how" className="section">
        <div className="wrap">
          <h2>We install. You pay monthly.</h2>
          <ol className="steps">
            {steps.map((s, i) => (
              <li key={s.title}>
                <span className="step-num">{i + 1}</span>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="calculator" className="section section--calc">
        <div className="wrap">
          <h2>NEPA plus generator, against Solafi.</h2>
          <Calculator onEstimate={setEstimate} />
        </div>
      </section>

      <section id="packages" className="section">
        <div className="wrap">
          <h2>A system for the way you live.</h2>
          <p className="section-lede">{loanDefaults.depositPct}% deposit to start, then {loanDefaults.tenorMonths} fixed monthly payments. Installation included.</p>
          <ul className="plans">
            {packages.map((p) => (
              <li key={p.id} className={`plan${p.featured ? ' plan--featured' : ''}`}>
                <p className="plan-size">{p.kw} kW<span>{p.batteryKwh} kWh battery</span></p>
                <div className="plan-fit">
                  <h3>{p.name}{p.featured && <em>Most homes</em>}</h3>
                  <p>{p.fits}</p>
                  <p className="plan-runs">{p.runs.join(' · ')}</p>
                </div>
                <p className="plan-price">
                  <strong>{naira(monthlyPayment(p.price * (1 - loanDefaults.depositPct / 100), loanDefaults.monthlyRatePct, loanDefaults.tenorMonths))}<small>/month</small></strong>
                  <span>{nairaShort(p.price * loanDefaults.depositPct / 100)} deposit</span><span>{naira(p.price)} installed</span>
                </p>
              </li>
            ))}
          </ul>
          <Link to="/#calculator" className="btn btn--ghost packages-cta">Work out my payment <ArrowRight size={18} /></Link>
        </div>
      </section>

      <section id="faq" className="section">
        <div className="wrap faq-grid">
          <div>
            <h2>Questions people ask first.</h2>
          </div>
          <div className="faq">
            {faqs.map((f, i) => (
              <div key={f.q} className={`faq-item${openFaq === i ? ' open' : ''}`}>
                <button type="button" aria-expanded={openFaq === i} onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
                  {f.q} <Plus size={18} />
                </button>
                {openFaq === i && <p>{f.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="waitlist" className="section section--waitlist">
        <div className="wrap waitlist-grid">
          <div>
            <h2>Be first on your street to stop buying fuel.</h2>
            <p className="section-lede">We will contact you when Solafi opens in your area. No payment, no commitment.</p>
          </div>
          <Waitlist estimate={estimate} />
        </div>
      </section>
    </>
  )
}
