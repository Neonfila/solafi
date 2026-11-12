import { useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { naira } from '../lib/calc.js'

// Set VITE_WAITLIST_ENDPOINT to a form backend URL that accepts a JSON POST.
// Without it the form runs in preview mode and sends nothing.
const ENDPOINT = import.meta.env.VITE_WAITLIST_ENDPOINT

export default function Waitlist({ estimate }) {
  const [state, setState] = useState('idle') // idle | sending | done | preview | error
  const [kind, setKind] = useState('Home')

  async function submit(e) {
    e.preventDefault()
    const data = Object.fromEntries(new FormData(e.currentTarget))
    data.kind = kind
    if (estimate) Object.assign(data, estimate)
    if (!ENDPOINT) {
      setState('preview')
      return
    }
    setState('sending')
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data),
      })
      setState(res.ok ? 'done' : 'error')
    } catch {
      setState('error')
    }
  }

  if (state === 'done' || state === 'preview') {
    return (
      <div className="waitlist-done">
        <span className="tick"><Check size={26} /></span>
        <h3>You are on the list.</h3>
        <p>We will reach out as soon as Solafi opens in your area.</p>
        {state === 'preview' && <p className="preview-note">Preview mode: the form is not connected yet, so nothing was sent.</p>}
      </div>
    )
  }

  return (
    <form className="waitlist-form" onSubmit={submit}>
      <div className="seg seg--wide" role="radiogroup" aria-label="This is for">
        {['Home', 'Business'].map((k) => (
          <button key={k} type="button" role="radio" aria-checked={kind === k} className={kind === k ? 'on' : ''} onClick={() => setKind(k)}>{k}</button>
        ))}
      </div>
      <label>
        <span>Full name</span>
        <input name="name" required autoComplete="name" placeholder="Your name" />
      </label>
      <label>
        <span>Phone or WhatsApp</span>
        <input name="phone" required type="tel" autoComplete="tel" inputMode="tel" placeholder="080..." />
      </label>
      <label>
        <span>Email <em>optional</em></span>
        <input name="email" type="email" autoComplete="email" placeholder="you@example.com" />
      </label>
      <label>
        <span>City or area</span>
        <input name="city" required autoComplete="address-level2" placeholder="Where should we install?" />
      </label>
      {estimate && (
        <p className="estimate-chip">
          Your estimate goes with it: {estimate.system}, about {naira(estimate.solafiMonthly)}/month against {naira(estimate.currentMonthly)} now.
        </p>
      )}
      <button className="btn btn--sun btn--block" disabled={state === 'sending'}>
        {state === 'sending' ? 'Sending…' : <>Join the waitlist <ArrowRight size={18} /></>}
      </button>
      {state === 'error' && <p className="form-error" role="alert">That did not go through. Check your connection and try again.</p>}
    </form>
  )
}
