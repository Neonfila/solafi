import { Link } from 'react-router-dom'
import { ArrowRight, Calculator, HandCoins, Sun, Wrench } from 'lucide-react'
import NeonMark from '../components/NeonMark.jsx'
import { naira } from '../lib/calc.js'
import { brand, reference } from '../lib/config.js'

export default function About() {
  return (
    <>
      <section className="page-hero">
        <div className="wrap narrow">
          <p className="eyebrow">About Solafi</p>
          <h1><span className="sun-text">The sun is free.</span> Getting it onto your roof should not take your savings.</h1>
          <p className="lede">
            Solafi is a solar financing company. We install the system, you pay for it monthly,
            and the money you were already burning on power starts buying you something you keep.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap about-split">
          <div>
            <p className="eyebrow">The problem</p>
            <h2>Most people pay for power twice.</h2>
          </div>
          <div className="prose">
            <p>
              First the NEPA bill. Then the generator for the hours the light is gone: petrol at {naira(reference.petrolPerLitre)} a litre,
              engine oil, plugs, the mechanic, and eventually a new generator.
            </p>
            <p>
              Solar ends most of that. What stops people is not doubt about solar. It is the size of the first payment.
              A proper system with a battery costs millions of naira on day one, so families keep paying
              for fuel a few thousand naira at a time, forever.
            </p>
            <p>Solafi exists to remove that first payment as the obstacle.</p>
          </div>
        </div>
      </section>

      <section className="section section--tint">
        <div className="wrap">
          <p className="eyebrow">What we do</p>
          <h2>Three jobs, one company.</h2>
          <div className="reasons reasons--3">
            <div className="reason">
              <Wrench size={22} />
              <h3>We engineer and install</h3>
              <p>We already have the system designs: panels, inverter and battery sized to real household and business loads, installed and tested for you.</p>
            </div>
            <div className="reason">
              <HandCoins size={22} />
              <h3>We finance it</h3>
              <p>You pay a deposit and then a fixed monthly amount over an agreed period, instead of the full cost up front.</p>
            </div>
            <div className="reason">
              <Calculator size={22} />
              <h3>We show the maths</h3>
              <p>Our calculator puts your current spend next to the monthly payment. If the numbers do not work for you, you will see that too.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap about-split">
          <div>
            <p className="eyebrow">What we believe</p>
            <h2>Plain terms, in plain sight.</h2>
          </div>
          <ul className="beliefs">
            <li><Sun size={18} /><div><strong>No hidden numbers.</strong> The price, the deposit, the monthly payment and the total you repay are stated before you agree to anything.</div></li>
            <li><Sun size={18} /><div><strong>Right-sized systems.</strong> We would rather fit the system that matches your load than sell you the biggest one.</div></li>
            <li><Sun size={18} /><div><strong>Ownership at the end.</strong> The plan is built so that the system is yours once it is paid for.</div></li>
          </ul>
        </div>
      </section>

      <section className="section section--tint">
        <div className="wrap studio">
          <NeonMark size={96} ignite title="NeonFila" />
          <div>
            <p className="eyebrow">A NeonFila company</p>
            <h2>Built inside the NeonFila studio.</h2>
            <p className="section-lede">
              NeonFila is a studio that builds and runs its own products. {brand.name} is the studio's energy company:
              the same care for clear, honest products, pointed at the power problem.
            </p>
            <a className="btn btn--ghost" href="https://neonfila.com" target="_blank" rel="noreferrer">Visit neonfila.com <ArrowRight size={18} /></a>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap cta-band">
          <h2>See your own numbers.</h2>
          <div className="hero-cta">
            <Link to="/#calculator" className="btn btn--sun">Open the calculator <ArrowRight size={18} /></Link>
            <Link to="/#waitlist" className="btn btn--ghost">Join the waitlist</Link>
          </div>
        </div>
      </section>
    </>
  )
}
