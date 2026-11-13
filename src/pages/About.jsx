import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { naira } from '../lib/calc.js'
import { reference } from '../lib/config.js'

const jobs = ['We install it', 'We finance it', 'We show the maths']
const terms = ['No hidden numbers', 'The right size, not the biggest', 'Yours once it is paid off']

export default function About() {
  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <h1><span className="sun-text">The sun is free.</span> Getting it onto your roof should not take your savings.</h1>
        </div>
      </section>

      <section className="section">
        <div className="wrap about-split">
          <h2>Most people pay for power twice.</h2>
          <p className="prose">
            NEPA, then petrol at {naira(reference.petrolPerLitre)} a litre for the generator. Solar ends most of that.
            What stops people is the first payment, so we take it away.
          </p>
        </div>
      </section>

      <section className="section section--tint">
        <div className="wrap about-split">
          <h2>What we do</h2>
          <ul className="about-list">{jobs.map((j) => <li key={j}>{j}</li>)}</ul>
        </div>
      </section>

      <section className="section">
        <div className="wrap about-split">
          <h2>Plain terms</h2>
          <ul className="about-list">{terms.map((t) => <li key={t}>{t}</li>)}</ul>
        </div>
      </section>

      <section className="section">
        <div className="wrap cta-band">
          <h2>See your own numbers.</h2>
          <Link to="/#calculator" className="btn btn--sun">Open the calculator <ArrowRight size={18} /></Link>
        </div>
      </section>
    </>
  )
}
