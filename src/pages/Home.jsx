import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Plus } from 'lucide-react'
import StreetScene from '../components/StreetScene.jsx'
import Calculator from '../components/Calculator.jsx'
import PayTimeline from '../components/PayTimeline.jsx'
import Waitlist from '../components/Waitlist.jsx'
import { naira, nairaShort, monthlyPayment } from '../lib/calc.js'
import { loanDefaults, packages } from '../lib/config.js'


const faqs = [
  { q: 'Is the calculator a quote?', a: 'No, an estimate from your numbers. Your quote comes after we see what you need to power.' },
  { q: 'What does each system run?', a: '3 kW: lights, fans, TV, fridge, laptops and Wi-Fi. 5 kW: all that plus a freezer, a pumping machine and one inverter AC. 10 kW: several ACs and shop or office equipment. We size it with you.' },
  { q: 'Do I still need NEPA?', a: 'Keep it as a backup. Most people use far less of it and stop using the generator.' },
  { q: 'Where is Solafi available?', a: 'We are opening area by area. Join the waitlist and we will tell you when we reach you.' },
]

export default function Home() {
  const [estimate, setEstimate] = useState(null)
  const [openFaq, setOpenFaq] = useState(0)

  return (
    <>
      <section className="hero">
        <div className="wrap hero-head">
          <h1>Go solar now.<br /><span className="sun-text">Pay small‑small.</span></h1>
          <Link to="/#calculator" className="btn btn--sun hero-go">See what you would save <ArrowRight size={18} /></Link>
        </div>
        <StreetScene />
      </section>

      <section id="how" className="section">
        <div className="wrap">
          <h2>We install. You pay monthly.</h2>
          <PayTimeline />
        </div>
      </section>

      <section id="calculator" className="section section--calc">
        <div className="wrap">
          <h2>What would you save?</h2>
          <Calculator onEstimate={setEstimate} />
        </div>
      </section>

      <section id="packages" className="section">
        <div className="wrap">
          <h2>Systems</h2>
          <ul className="plans">
            {packages.map((p) => (
              <li key={p.id} className={`plan${p.featured ? ' plan--featured' : ''}`}>
                <p className="plan-size">{p.kw} kW<span>{p.batteryKwh} kWh battery</span></p>
                <h3 className="plan-fit">{p.fits}</h3>
                <p className="plan-price">
                  <strong>{naira(monthlyPayment(p.price * (1 - loanDefaults.depositPct / 100), loanDefaults.monthlyRatePct, loanDefaults.tenorMonths))}<small>/month</small></strong>
                  <span>{loanDefaults.tenorMonths} months</span><span>{nairaShort(p.price * loanDefaults.depositPct / 100)} deposit</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="faq" className="section">
        <div className="wrap faq-grid">
          <h2>Questions</h2>
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

      <section id="waitlist" className="section section--tint">
        <div className="wrap waitlist-grid">
          <h2>Join the waitlist. It is free.</h2>
          <Waitlist estimate={estimate} />
        </div>
      </section>
    </>
  )
}
