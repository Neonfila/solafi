import { useEffect, useRef, useState } from 'react'

// How it works: four fixed steps on one rail, one mark per monthly payment.
// Fixed text on purpose: it never shows a package, deposit or monthly amount,
// so it does not follow the calculator.
const MONTHS = 12

export default function PayTimeline() {
  const ref = useRef(null)
  const [seen, setSeen] = useState(false)

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setSeen(true)
        io.disconnect()
      }
    }, { threshold: 0.4 })
    io.observe(ref.current)
    return () => io.disconnect()
  }, [])

  return (
    <ol ref={ref} className={`track${seen ? ' track--in' : ''}`} style={{ '--n': MONTHS }}>
      <li>
        <span className="track-mark"><i className="track-dot" /></span>
        <h3>Tell us what you want to power</h3>
        <p>We check your home or shop and recommend a package.</p>
      </li>
      <li>
        <span className="track-mark"><i className="track-dot" /></span>
        <h3>Pay your deposit</h3>
        <p>30% of the system price. Sign your plan online, then we install.</p>
      </li>
      <li className="track-months">
        <span className="track-mark">
          {Array.from({ length: MONTHS }, (_, i) => <i key={i} style={{ '--i': i }} />)}
        </span>
        <h3>Pay small-small monthly</h3>
        <p>Fixed payments for 12 months. We monitor your system remotely.</p>
      </li>
      <li className="track-end">
        <span className="track-mark"><i className="track-dot" /></span>
        <h3>Then it is yours</h3>
        <p>No more payments.</p>
      </li>
    </ol>
  )
}
