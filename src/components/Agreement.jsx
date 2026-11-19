import { forwardRef } from 'react'
import { SolafiMark } from './Logo.jsx'
import { DEFAULT_STAGES, PROVIDER, clauses, money } from '../lib/agreement.js'

function Clauses({ items }) {
  return items.map(([n, title, text]) => (
    <p key={n} className="ag-clause"><span className="ag-n">{n}</span> <b>{title}</b> {text}</p>
  ))
}

// The agreement itself, filled with one client's details. `signed` adds the
// signature and the details the client entered, for the signed copy.
// `customer` shows the name and phone as the client types them.
const Agreement = forwardRef(function Agreement({ d: row, signed, customer }, ref) {
  // the installation address is the one the client types, not the sheet's
  const address = (signed?.address || customer?.address || '').trim()
  const d = { ...row, address, addressShort: address.replace(/\s+State$/i, '') }
  const c = clauses(d)
  const consent = signed ? signed.remoteConsent : customer?.remoteConsent
  const blank = (v) => (v ? <span className="ag-filled">{v}</span> : <span className="ag-fill" />)
  return (
    <article className="agreement" ref={ref}>
      <header className="ag-mast">
        <span className="logo"><SolafiMark size={30} /><span className="logo-word">solafi</span></span>
        <p><b>{PROVIDER.name}</b><br />{PROVIDER.address}<br />{PROVIDER.site}</p>
      </header>

      <h1>SOLAR ENERGY SYSTEM LEASE-TO-OWN &amp; INSTALLATION AGREEMENT</h1>
      <dl className="ag-meta">
        <div><dt>Agreement Date</dt><dd>{d.agreementDate}</dd></div>
        <div><dt>Package</dt><dd>{d.pkg.label}</dd></div>
        <div><dt>Plan</dt><dd>{d.months}-Month Plan</dd></div>
      </dl>

      <div className="ag-scroll">
        <table>
          <thead><tr><th>Party Role</th><th>Legal Name / Entity</th><th>Registered / Installation Address &amp; Contact</th></tr></thead>
          <tbody>
            <tr><td className="k">1. Provider ("SOLAFI")</td><td>{PROVIDER.name}</td><td>{PROVIDER.address}  |  {PROVIDER.site}</td></tr>
            <tr><td className="k">2. Customer ("Customer")</td><td>{blank(signed?.fullName || customer?.name || d.customerName)}</td><td>{blank(d.address)}  |  Tel {blank(signed?.phone || customer?.phone || d.phone)}</td></tr>
          </tbody>
        </table>
      </div>

      <h3 className="ag-box-title">PAYMENT SUMMARY</h3>
      <div className="ag-scroll">
        <table className="ag-money">
          <thead><tr><th>Item</th><th>Amount</th><th>Due Date</th></tr></thead>
          <tbody>
            <tr><td className="k">System Price</td><td>{money(d.cashPrice)}</td><td>—</td></tr>
            <tr><td className="k">Deposit ({d.depositPct}%)</td><td className="big">{money(d.deposit)}</td><td>Before installation</td></tr>
            <tr><td className="k">Plan Charge</td><td>{money(d.planCharge)}</td><td>Included in the monthly payments</td></tr>
            <tr className="ag-total"><td className="k">Total Payable</td><td className="big">{money(d.total)}</td><td>Deposit + {d.months} monthly payments</td></tr>
            <tr><td className="k">Monthly Payment</td><td><span className="big">{money(d.regular)}</span> × {d.months}{d.last !== d.regular && <> (payment {d.months}: {money(d.last)})</>}</td><td>Monthly from the handover date</td></tr>
            {d.schedule.map((p) => (
              <tr key={p.n} className="ag-pay"><td>Payment {p.n}</td><td>{money(p.amount)}</td><td>{p.due}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>1. SYSTEM SPECIFICATIONS, WARRANTIES &amp; INSTALLATION (SCHEDULE A)</h2>
      <Clauses items={c.s1.slice(0, 1)} />
      <div className="ag-scroll">
        <table>
          <thead><tr><th>Item #</th><th>System Component</th><th>Brand / Technical Specification</th><th>Quantity</th><th>Warranty Period</th></tr></thead>
          <tbody>
            {d.pkg.components.map((row, i) => (
              <tr key={row[0]}><td className="c">{i + 1}</td><td className="k">{row[0]}</td><td>{row[1]}</td><td>{row[2]}</td><td>{row[3]}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <Clauses items={c.s1.slice(1)} />
      <div className="ag-scroll">
        <table className="ag-money">
          <thead><tr><th>Installation Record (completed on installation day)</th><th>Details</th></tr></thead>
          <tbody>
            <tr><td className="k">Handover Date</td><td>{blank(d.handoverDate)}</td></tr>
            <tr><td className="k">Inverter Serial Number</td><td>{blank(d.inverterSerial)}</td></tr>
            <tr><td className="k">Battery Serial Number</td><td>{blank(d.batterySerial)}</td></tr>
          </tbody>
        </table>
      </div>

      <h2>2. PRICE, REPAYMENT PLAN &amp; DEFAULT RULES (SCHEDULE B)</h2>
      <Clauses items={c.s2a} />
      <div className="ag-account">
        <h3>DESIGNATED PAYMENT ACCOUNT</h3>
        <dl>
          <div><dt>Account Name</dt><dd>{d.accountName}</dd></div>
          <div><dt>Account Number</dt><dd className="big">{d.accountNumber}</dd></div>
          <div><dt>Bank</dt><dd>{d.bankName}</dd></div>
        </dl>
      </div>
      <Clauses items={c.s2b} />
      <div className="ag-scroll">
        <table className="ag-stages">
          <thead><tr><th>Default Stage</th><th>Trigger Timing</th><th>Contractual Consequence &amp; Remedy</th></tr></thead>
          <tbody>{DEFAULT_STAGES.map((r) => <tr key={r[0]}><td>{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td></tr>)}</tbody>
        </table>
      </div>
      <p className="ag-consent"><span className="ag-box">{consent ? '☑' : '☐'}</span> I agree to remote monitoring and remote switch-off as described above.</p>

      <h2>3. PERMITTED APPLIANCES &amp; LOAD RESTRICTIONS (SCHEDULE C)</h2>
      <Clauses items={c.s3} />
      <div className="ag-use">
        <div className="yes"><h3>{d.pkg.permittedTitle}</h3><ul>
          {d.pkg.permitted.map((t) => <li key={t}>{t}</li>)}
          <li className="note">{d.pkg.exception}</li>
        </ul></div>
        <div className="no"><h3>{d.pkg.prohibitedTitle}</h3><ul>
          {d.pkg.prohibited.map((t) => <li key={t}>{t}</li>)}
        </ul></div>
      </div>

      <h2>4. OWNERSHIP, RETENTION OF TITLE &amp; REPOSSESSION</h2>
      <Clauses items={c.s4} />
      <h2>5. WARRANTIES, MAINTENANCE, RELOCATION &amp; RISK OF LOSS</h2>
      <Clauses items={c.s5} />
      <h2>6. LIMITATION OF LIABILITY &amp; GOVERNING LAW</h2>
      <Clauses items={c.s6} />

      <h2 className="ag-exec">7. CUSTOMER KYC DETAILS &amp; DIRECT EXECUTION</h2>
      <Clauses items={c.s7} />
      {signed && (
        <>
          <div className="ag-scroll">
            <table>
              <thead><tr><th>Verification Field</th><th>Customer Details (Fill Prior to Signing)</th><th>Verification Field</th><th>Customer Details (Fill Prior to Signing)</th></tr></thead>
              <tbody>
                <tr><td className="k">Valid ID Type &amp; Number</td><td>{signed.idType}: {signed.idNumber}</td><td className="k">Occupancy Status</td><td>{signed.occupancy}</td></tr>
                <tr><td className="k">Occupation / Business</td><td>{signed.occupation}</td><td className="k">Landlord Name</td><td>{signed.landlord || '—'}</td></tr>
                <tr><td className="k">Next of Kin Full Name</td><td>{signed.kinName}</td><td className="k">Next of Kin Phone</td><td>{signed.kinPhone}</td></tr>
              </tbody>
            </table>
          </div>
          <p className="ag-clause">By signing below.</p>
          <div className="ag-signed">
            <h3>ACCEPTED &amp; AGREED BY: THE CUSTOMER</h3>
            <div className="ag-signed-grid">
              <div className="wide"><span>Customer Signature:</span><img src={signed.signature} alt={`Signature of ${signed.fullName}`} /></div>
              <div><span>Full Legal Name:</span><b>{signed.fullName}</b></div>
              <div><span>Phone / WhatsApp:</span><b>{signed.phone}</b></div>
              <div><span>Date:</span><b>{signed.date}</b></div>
            </div>
          </div>
        </>
      )}
    </article>
  )
})

export default Agreement
