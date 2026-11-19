import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Plus } from 'lucide-react'
import StreetScene from '../components/StreetScene.jsx'
import Calculator from '../components/Calculator.jsx'
import PayTimeline from '../components/PayTimeline.jsx'
import Waitlist from '../components/Waitlist.jsx'
import { naira, nairaShort } from '../lib/calc.js'
import { featuredOf, useProducts } from '../lib/products.js'


// Photos of systems the team has installed, logo added (public/installs).
const installs = [
  ['install-01', 'Solar panels on a dark tiled roof'],
  ['install-02', 'Four inverters and batteries in a stairwell'],
  ['install-03', 'Solar panels on a metal roof'],
  ['install-04', 'Installers fitting panels on a roof'],
  ['install-05', 'Inverter and battery on a wall'],
  ['install-06', 'Lithium battery and inverter on a tiled wall'],
  ['install-07', 'Inverter above a lithium battery'],
  ['install-08', 'Inverter with two batteries under the stairs'],
  ['install-09', 'Inverter and wall battery in a side passage'],
  ['install-10', 'Rows of panels on a roof'],
]

const faqs = [
  { q: 'Is the calculator a quote?', a: 'No, an estimate from your numbers. Your quote comes after we see what you need to power.' },
  { q: 'Which package do I need?', a: 'Each package above lists what it powers. Tell us what you want to run and we help you pick.' },
  { q: 'What do kVA and kWh mean?', a: 'kVA is how much the inverter can carry at the same time: more kVA, more appliances on together. kWh is how much the battery stores: more kWh, more hours of light at night.' },
  { q: 'Who owns the system while I am paying?', a: 'Solafi does, until your last payment. Then it is fully yours.' },
  { q: 'How do I pay?', a: 'By bank transfer into the Solafi account written in your agreement. Never pay cash to an installer or any staff.' },
  { q: 'What if I miss a payment?', a: 'You have 3 days to pay with no penalty. From day 4, a late fee of ₦5,000 a day is added. From day 7, the system is switched off until you pay. After 30 days unpaid, Solafi takes the system back.' },
  { q: 'Do I still need NEPA?', a: 'Keep it as a backup. Most people use far less of it and stop using the generator.' },
  { q: 'Where is Solafi available?', a: 'We are opening area by area. Join the waitlist and we will tell you when we reach you.' },
]

export default function Home() {
  const [estimate, setEstimate] = useState(null)
  const [openFaq, setOpenFaq] = useState(0)
  const products = useProducts()
  const main = featuredOf(products)
  const depositPct = Math.round((main.deposit / main.cashPrice) * 100)

  return (
    <>
      <section className="hero">
        <div className="wrap hero-head">
          <div>
            <h1>Go solar now.<br /><span className="sun-text">Pay small‑small.</span></h1>
            <p className="hero-sub">We install solar panels, an inverter and a battery at your home or shop. Pay {depositPct}% first, then the rest monthly for {main.months} months. After that, it is yours.</p>
          </div>
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
          <h2>Solar packages</h2>
          <p className="section-lede">Every price includes installation and maintenance. Pay {depositPct}% first, then monthly for {main.months} months.</p>
          <ul className="plans">
            {products.map((p) => (
              <li key={p.id} className={`plan${p.featured ? ' plan--featured' : ''}`}>
                <div className="plan-size">
                  <h3>{p.name}</h3>
                  <span>{[p.kva && `${p.kva} kVA inverter`, p.batteryKwh && `${p.batteryKwh} kWh battery`, p.panels && `${p.panels} panels`].filter(Boolean).join(' · ')}</span>
                </div>
                <p className="plan-fit"><b>Powers:</b> {p.runs}</p>
                <p className="plan-price">
                  <strong>{naira(p.monthly)}<small>/month</small></strong>
                  <span>{p.months} months</span><span>{nairaShort(p.deposit)} deposit</span>
                  <em>or {nairaShort(p.cashPrice)} outright</em>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="installs" className="section">
        <div className="wrap">
          <h2>Systems we have installed</h2>
          <p className="section-lede">Panels, inverters and batteries our team has put in homes and shops.</p>
        </div>
        <div className="installs" tabIndex={0} aria-label="Photos of installed systems">
          {installs.map(([file, alt]) => (
            <a key={file} href={`/installs/${file}.jpg`} target="_blank" rel="noreferrer">
              <img src={`/installs/${file}.jpg`} alt={alt} loading="lazy" decoding="async" />
            </a>
          ))}
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
