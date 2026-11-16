import { Link } from 'react-router-dom'
import Logo from './Logo.jsx'
import NeonMark from './NeonMark.jsx'
import { brand } from '../lib/config.js'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-grid">
        <div>
          <Logo size={30} />
        </div>
        <nav className="footer-links" aria-label="Footer">
          <Link to="/#how">How it works</Link>
          <Link to="/#calculator">Savings calculator</Link>
          <Link to="/#packages">Packages</Link>
          <Link to="/#faq">FAQ</Link>
          <Link to="/about">About</Link>
          <Link to="/#waitlist">Join the waitlist</Link>
        </nav>
      </div>
      <div className="wrap footer-base">
        <span>© {new Date().getFullYear()} {brand.name} · {brand.domain}</span>
        <span>Calculator figures are estimates, not a loan offer.</span>
        <span className="footer-credit">Website by <a href="https://neonfila.com" target="_blank" rel="noreferrer"><NeonMark size={14} glow={false} />NeonFila</a></span>
      </div>
    </footer>
  )
}
