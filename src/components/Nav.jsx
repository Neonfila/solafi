import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Logo from './Logo.jsx'

const links = [
  { to: '/#how', label: 'How it works' },
  { to: '/#calculator', label: 'Calculator' },
  { to: '/#packages', label: 'Packages' },
  { to: '/#faq', label: 'FAQ' },
  { to: '/about', label: 'About' },
]

export default function Nav() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()

  useEffect(() => setOpen(false), [location])
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`nav${scrolled ? ' nav--scrolled' : ''}${open ? ' nav--open' : ''}`}>
      <div className="wrap nav-row">
        <Link to="/" aria-label="Solafi home"><Logo /></Link>
        <nav className="nav-links" aria-label="Main">
          {links.map((l) => (
            <Link key={l.to} to={l.to}>{l.label}</Link>
          ))}
        </nav>
        <Link to="/#waitlist" className="btn btn--sun btn--sm nav-cta">Join the waitlist</Link>
        <button className="nav-toggle" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {open && (
        <nav className="nav-sheet" aria-label="Mobile">
          {links.map((l) => (
            <Link key={l.to} to={l.to}>{l.label}</Link>
          ))}
          <Link to="/#waitlist" className="btn btn--sun">Join the waitlist</Link>
        </nav>
      )}
    </header>
  )
}
