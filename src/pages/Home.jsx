import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Plus } from 'lucide-react'
import StreetScene from '../components/StreetScene.jsx'
import Calculator from '../components/Calculator.jsx'
import PayTimeline from '../components/PayTimeline.jsx'
import Waitlist from '../components/Waitlist.jsx'
import { naira, nairaShort } from '../lib/calc.js'
import { useProducts } from '../lib/products.js'


const faqs = [
  { q: 'Is the calculator a quote?', a: 'No, an estimate from your numbers. Your quote comes after we see what you need to power.' },
  { q: 'Which system do I need?', a: 'Each system above lists what it runs. Tell us what you want to power and we size it with you.' },
  { q: 'Do I still need NEPA?', a: 'Keep it as a backup. Most people use far less of it and stop using the generator.' },
  { q: 'Where is Solafi available?', a: 'We are opening area by area. Join the waitlist and we will tell you when we reach you.' },
]

export default function Home() {
  const [estimate, setEstimate] = useState(null)
  const [openFaq, setOpenFaq] = useState(0)
  const products = useProducts()

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
            {products.map((p) => (
              <li key={p.id} className={`plan${p.featured ? ' plan--featured' : ''}`}>
                <div className="plan-size">
                  <h3>{p.name}</h3>
                  <span>{[p.kva && `${p.kva} kVA`, p.batteryKwh && `${p.batteryKwh} kWh battery`, p.panels && `${p.panels} panels`].filter(Boolean).join(' · ')}</span>
                </div>
                <p className="plan-fit">{p.runs}</p>
                <p className="plan-price">
                  <strong>{naira(p.monthly)}<small>/month</small></strong>
                  <span>{p.months} months</span><span>{nairaShort(p.deposit)} deposit</span>
                  <em>or {nairaShort(p.cashPrice)} paid in full</em>
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
