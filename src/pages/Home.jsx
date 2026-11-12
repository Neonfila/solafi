import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BatteryCharging, CalendarCheck, ClipboardList, Fuel, Plus, ShieldCheck, Sun, Volume2, Wallet, Wrench, Zap } from 'lucide-react'
import StreetScene from '../components/StreetScene.jsx'
import Calculator from '../components/Calculator.jsx'
import Waitlist from '../components/Waitlist.jsx'
import { naira } from '../lib/calc.js'
import { packages, reference, termsAreFinal } from '../lib/config.js'

const steps = [
  { icon: ClipboardList, title: 'Tell us what you run', body: 'Share your NEPA bill, your generator habits and what you need to power. We match you to a system size.' },
  { icon: Wrench, title: 'We install everything', body: 'Panels, inverter and battery, designed and fitted for you. You do not source parts or chase installers.' },
  { icon: CalendarCheck, title: 'You pay monthly', body: 'A deposit to start, then one fixed payment each month. No fuel queue, no surprise bill.' },
  { icon: Sun, title: 'Then it is yours', body: 'When the last payment lands the system is fully paid for, and the sun keeps running your home.' },
]

const reasons = [
  { icon: Wallet, title: 'One fixed payment', body: 'You know the number before you start, and it does not move with the pump price.' },
  { icon: Zap, title: 'Light that stays on', body: 'The battery carries you through the night and through outages, without the changeover dance.' },
  { icon: Volume2, title: 'Quiet nights', body: 'No engine under the window, no fumes in the compound, no 6 a.m. trip for fuel.' },
  { icon: ShieldCheck, title: 'Numbers you can check', body: 'Every figure in our calculator is visible and editable. If solar does not beat your current spend, it will tell you.' },
]

const faqs = [
  { q: 'How does Solafi work?', a: 'We design and install a complete solar system at your home or business: panels, inverter and battery. Instead of paying the full cost up front, you pay a deposit and then a fixed amount every month until it is paid off.' },
  { q: 'Is the calculator result a quote?', a: 'No. It is an estimate built from the numbers you enter and the plan terms shown, which you can edit. Your real quote comes after we look at what you need to power.' },
  { q: 'What can a 5 kW system with battery run?', a: 'Typically the everyday load of a family home: lights, fans, TV, fridge and freezer, laptops, Wi-Fi and a pumping machine, with room for an inverter air conditioner. What it can run and for how long depends on your appliances, so we size it with you.' },
  { q: 'Do I still need NEPA?', a: 'You can keep your grid connection as a backup and for heavy loads. Most people simply use far less of it, and stop depending on the generator.' },
  { q: 'How much do I pay to start, and for how long?', a: 'You pay a deposit, then monthly payments over an agreed period. The deposit and period in the calculator are examples; your exact terms are confirmed in your quote.' },
  { q: 'Where is Solafi available?', a: 'We are opening area by area. Join the waitlist with your city and we will tell you when we reach you.' },
]

export default function Home() {
  const [estimate, setEstimate] = useState(null)
  const [openFaq, setOpenFaq] = useState(0)

  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <p className="pill"><Sun size={14} /> Solar on a monthly plan</p>
            <h1>Go solar now.<br /><span className="sun-text">Pay small‑small.</span></h1>
            <p className="lede">
              Solafi installs a complete solar system at your home or business. You pay for it monthly,
              with the money you already spend on NEPA and generator fuel.
            </p>
            <div className="hero-cta">
              <Link to="/#calculator" className="btn btn--sun">See what you would save <ArrowRight size={18} /></Link>
              <Link to="/#waitlist" className="btn btn--ghost">Join the waitlist</Link>
            </div>
            <ul className="hero-points">
              <li><Wrench size={16} /> We install</li>
              <li><CalendarCheck size={16} /> You pay monthly</li>
              <li><BatteryCharging size={16} /> Battery included</li>
            </ul>
          </div>
          <StreetScene />
        </div>
      </section>

      <section className="facts" aria-label="Today's energy prices">
        <div className="wrap facts-row">
          <div className="fact">
            <Fuel size={20} />
            <div>
              <strong>{naira(reference.petrolPerLitre)}<small>/litre</small></strong>
              <span>Petrol. {reference.petrolNote}. <a href={reference.petrolSource.url} target="_blank" rel="noreferrer">Source</a></span>
            </div>
          </div>
          <div className="fact">
            <Zap size={20} />
            <div>
              <strong>₦{reference.bandATariff.toFixed(2)}<small>/kWh</small></strong>
              <span>Grid power. {reference.bandANote}. <a href={reference.bandASource.url} target="_blank" rel="noreferrer">Source</a></span>
            </div>
          </div>
          <div className="fact fact--sun">
            <Sun size={20} />
            <div>
              <strong>₦0<small>/day</small></strong>
              <span>Sunlight. Same price as yesterday.</span>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="section">
        <div className="wrap">
          <p className="eyebrow">How it works</p>
          <h2>We install. You pay monthly.</h2>
          <ol className="steps">
            {steps.map((s, i) => (
              <li key={s.title}>
                <span className="step-icon"><s.icon size={22} /></span>
                <span className="step-num">0{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="calculator" className="section section--calc">
        <div className="wrap">
          <p className="eyebrow">Savings calculator</p>
          <h2>NEPA plus generator, against Solafi.</h2>
          <p className="section-lede">Put in what you spend today. See the monthly payment next to it, and how the gap adds up over the years.</p>
          <Calculator onEstimate={setEstimate} />
        </div>
      </section>

      <section id="packages" className="section">
        <div className="wrap">
          <p className="eyebrow">Packages</p>
          <h2>A system for the way you live.</h2>
          {!termsAreFinal && <p className="section-lede">Sizes are set. Prices shown are examples until Solafi publishes its plans.</p>}
          <div className="packages">
            {packages.map((p) => (
              <article key={p.id} className={`package${p.featured ? ' package--featured' : ''}`}>
                {p.featured && <span className="package-flag">Most homes</span>}
                <h3>{p.name}</h3>
                <p className="package-size">{p.kw} kW <span>+ {p.batteryKwh} kWh battery</span></p>
                <p className="package-fits">{p.fits}</p>
                <ul>
                  {p.runs.map((r) => <li key={r}><Zap size={14} /> {r}</li>)}
                </ul>
                <p className="package-price">
                  {termsAreFinal ? 'From' : 'Example price'} <strong>{naira(p.price)}</strong>
                </p>
                <Link to="/#calculator" className="btn btn--ghost btn--block">Work out my payment</Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--tint">
        <div className="wrap">
          <p className="eyebrow">Why Solafi</p>
          <h2>Stop renting darkness.</h2>
          <div className="reasons">
            {reasons.map((r) => (
              <div key={r.title} className="reason">
                <r.icon size={22} />
                <h3>{r.title}</h3>
                <p>{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="section">
        <div className="wrap faq-grid">
          <div>
            <p className="eyebrow">FAQ</p>
            <h2>Questions people ask first.</h2>
            <p className="section-lede">Something else on your mind? <Link to="/about">Read about the company</Link>.</p>
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
            <p className="eyebrow">Join the waitlist</p>
            <h2>Be first on your street to stop buying fuel.</h2>
            <p className="section-lede">Leave your details and we will contact you when Solafi opens in your area. No payment, no commitment.</p>
          </div>
          <Waitlist estimate={estimate} />
        </div>
      </section>
    </>
  )
}
