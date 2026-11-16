import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Nav from './components/Nav.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import About from './pages/About.jsx'
import Sign from './pages/Sign.jsx'
import ColourReview, { showColourReview } from './components/ColourReview.jsx'

// Scroll to the #section in the URL after a route change, or to the top.
function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1))
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

// A new link code (#…) means a different agreement, so start the page afresh.
function SignRoute() {
  const { hash } = useLocation()
  return <Sign key={hash} />
}

export default function App() {
  return (
    <>
      <ScrollManager />
      <Nav />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/sign" element={<SignRoute />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <Footer />
      {showColourReview && <ColourReview />}
    </>
  )
}
