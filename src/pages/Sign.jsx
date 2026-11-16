import { useEffect, useRef, useState } from 'react'
import { Check, Download, FileUp } from 'lucide-react'
import Agreement from '../components/Agreement.jsx'
import SignaturePad from '../components/SignaturePad.jsx'
import { DEMO_ROW, TERMS_VERSION, prepare } from '../lib/agreement.js'
import { agreementEndpoint } from '../lib/config.js'

// The client signs their agreement here. The link is /sign/#<token>: the token
// stays after the # so it never reaches a server log. #demo shows a sample.
const ENDPOINT = import.meta.env.VITE_AGREEMENT_ENDPOINT || agreementEndpoint
const MAX_FILE = 5 * 1024 * 1024

const today = () => new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve({ name: file.name, type: file.type, data: String(r.result).split(',')[1] })
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

// The PDF maker can't draw SVG, so the signed copy gets the logo as a PNG.
async function pdfHtml(article) {
  try {
    const blob = await (await fetch(`${import.meta.env.BASE_URL}agreement-logo.png`)).blob()
    const src = await new Promise((resolve) => {
      const r = new FileReader()
      r.onload = () => resolve(r.result)
      r.readAsDataURL(blob)
    })
    return article.outerHTML.replace(/<svg[\s\S]*?<\/svg>/, `<img src="${src}" width="30" height="30" alt="" style="vertical-align:-4px;margin-right:6px">`)
  } catch {
    return article.outerHTML
  }
}

function Upload({ label, file, onFile }) {
  return (
    <label className={`upload${file ? ' upload--done' : ''}`}>
      <input type="file" accept="image/*,application/pdf" onChange={(e) => onFile(e.target.files[0] || null)} />
      {file ? <Check size={18} /> : <FileUp size={18} />}
      <span><b>{label}</b>{file ? file.name : 'Photo or PDF, up to 5 MB'}</span>
    </label>
  )
}

export default function Sign() {
  const token = decodeURIComponent(window.location.hash.slice(1))
  const [state, setState] = useState('loading') // loading | missing | error | ready | sending | signed | already
  const [d, setD] = useState(null)
  const [f, setF] = useState({ fullName: '', phone: '', address: '', idType: 'NIN', idNumber: '', occupancy: '', landlord: '', occupation: '', kinName: '', kinPhone: '' })
  const [files, setFiles] = useState({ id: null, proof: null })
  const [signature, setSignature] = useState(null)
  const [agree, setAgree] = useState(false)
  const [problem, setProblem] = useState('')
  const [signed, setSigned] = useState(null)
  const [demo, setDemo] = useState(false)
  const agreementRef = useRef(null)

  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex'
    document.head.appendChild(meta)
    return () => meta.remove()
  }, [])

  useEffect(() => {
    if (!token) return setState('missing')
    if (token === 'demo') {
      setDemo(true)
      setD(prepare(DEMO_ROW))
      setF((v) => ({ ...v, fullName: DEMO_ROW.customerName, phone: DEMO_ROW.phone, address: DEMO_ROW.address }))
      return setState('ready')
    }
    if (!ENDPOINT) return setState('error')
    fetch(`${ENDPOINT}?action=agreement&token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((out) => {
        if (!out.ok) return setState('missing')
        const row = prepare(out.agreement)
        setD(row)
        setF((v) => ({ ...v, fullName: row.customerName || '', phone: row.phone || '' }))
        setState(out.agreement.status === 'Signed' ? 'already' : 'ready')
      })
      .catch(() => setState('error'))
  }, [token])

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const pick = (k) => (file) => {
    if (file && file.size > MAX_FILE) return setProblem('That file is over 5 MB. Try a smaller photo.')
    setProblem('')
    setFiles({ ...files, [k]: file })
  }

  async function submit(e) {
    e.preventDefault()
    const missing = []
    if (!files.id) missing.push('a copy of your ID')
    if (!files.proof) missing.push('your utility bill or tenancy proof')
    if (!signature) missing.push('your signature')
    if (!agree) missing.push('the agreement tick box')
    if (missing.length) return setProblem(`Still needed: ${missing.join(', ')}.`)
    setProblem('')
    setState('sending')

    const record = { ...f, date: today(), signature }
    // the exact text the client read, so the signature is tied to these words
    const text = agreementRef.current.innerText
    try {
      const payload = {
        action: 'sign',
        token,
        ...f,
        signature,
        files: { id: await readFile(files.id), proof: await readFile(files.proof) },
        termsVersion: TERMS_VERSION,
        text,
        html: await pdfHtml(agreementRef.current),
        textHash: await sha256(text),
        userAgent: navigator.userAgent,
      }
      if (!demo) {
        const res = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) })
        const out = await res.json().catch(() => null)
        if (!res.ok || !out?.ok) throw new Error(out?.error || 'not saved')
        if (out.signedAt) record.date = out.signedAt
      }
      setSigned(record)
      setState('signed')
      window.scrollTo(0, 0)
    } catch (err) {
      setState('ready')
      setProblem(String(err.message).includes('already') ? 'This agreement has already been signed.' : 'That did not go through. Check your connection and try again.')
    }
  }

  if (state === 'loading') return <section className="section sign-page"><div className="wrap"><p className="sign-note">Opening your agreement…</p></div></section>
  if (state === 'missing' || state === 'error') {
    return (
      <section className="section sign-page"><div className="wrap sign-msg">
        <h1>{state === 'missing' ? 'This link does not open an agreement.' : 'We could not open your agreement.'}</h1>
        <p>{state === 'missing' ? 'Check that you used the whole link Solafi sent you.' : 'Check your connection and open the link again.'}</p>
      </div></section>
    )
  }
  if (state === 'already') {
    return (
      <section className="section sign-page"><div className="wrap sign-msg">
        <h1>This agreement is signed.</h1>
        <p>Signed {d.signedAt ? `on ${d.signedAt}` : ''}{d.signedName ? ` by ${d.signedName}` : ''}. Solafi has your copy.</p>
      </div></section>
    )
  }

  if (state === 'signed') {
    return (
      <section className="section sign-page">
        <div className="wrap">
          <div className="sign-done">
            <span className="tick"><Check size={26} /></span>
            <div>
              <h1>Signed. Thank you.</h1>
              {demo && <p className="preview-note">Sample: nothing was sent.</p>}
            </div>
            <button type="button" className="btn btn--sun" onClick={() => window.print()}><Download size={18} /> Save a copy</button>
          </div>
          <Agreement d={d} signed={signed} />
        </div>
      </section>
    )
  }

  return (
    <section className="section sign-page">
      <div className="wrap">
        {demo && <p className="preview-note sign-demo">Sample agreement</p>}
        <Agreement d={d} customer={{ name: f.fullName, phone: f.phone, address: f.address }} ref={agreementRef} />

        <form className="sign-form" onSubmit={submit}>
          <h2>Your details</h2>
          <div className="sign-grid">
            <label><span>Full legal name</span><input required value={f.fullName} onChange={set('fullName')} autoComplete="name" /></label>
            <label><span>Phone / WhatsApp</span><input required type="tel" inputMode="tel" value={f.phone} onChange={set('phone')} autoComplete="tel" /></label>
            <label className="wide"><span>Installation address</span><input required value={f.address} onChange={set('address')} autoComplete="street-address" placeholder="House number, street, area, state" /></label>
            <label><span>ID type</span>
              <select value={f.idType} onChange={set('idType')}>
                <option>NIN</option><option>Passport</option><option>Driver's licence</option>
              </select>
            </label>
            <label><span>ID number</span><input required value={f.idNumber} onChange={set('idNumber')} /></label>
            <fieldset className="sign-occupancy">
              <legend>Occupancy</legend>
              <div className="seg seg--wide" role="radiogroup" aria-label="Occupancy">
                {['Property Owner', 'Tenant / Lessee'].map((o) => (
                  <button key={o} type="button" role="radio" aria-checked={f.occupancy === o} className={f.occupancy === o ? 'on' : ''} onClick={() => setF({ ...f, occupancy: o })}>{o}</button>
                ))}
              </div>
            </fieldset>
            {f.occupancy === 'Tenant / Lessee' && <label><span>Landlord name</span><input required value={f.landlord} onChange={set('landlord')} /></label>}
            <label><span>Occupation / business</span><input required value={f.occupation} onChange={set('occupation')} /></label>
            <label><span>Next of kin full name</span><input required value={f.kinName} onChange={set('kinName')} /></label>
            <label><span>Next of kin phone</span><input required type="tel" inputMode="tel" value={f.kinPhone} onChange={set('kinPhone')} /></label>
          </div>

          <h2>Documents</h2>
          <div className="sign-grid">
            <Upload label="Government ID" file={files.id} onFile={pick('id')} />
            <Upload label="Utility bill or tenancy proof" file={files.proof} onFile={pick('proof')} />
          </div>

          <h2>Signature</h2>
          <SignaturePad onChange={setSignature} disabled={state === 'sending'} />
          <label className="sign-agree">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            <span>I have read this agreement and agree to its terms. My name and drawn signature above are my signature.</span>
          </label>

          {problem && <p className="form-error" role="alert">{problem}</p>}
          <button className="btn btn--sun btn--block" disabled={state === 'sending' || (!f.occupancy)}>
            {state === 'sending' ? 'Signing…' : 'Sign agreement'}
          </button>
        </form>
      </div>
    </section>
  )
}
