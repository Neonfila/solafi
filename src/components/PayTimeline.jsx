import { useEffect, useRef, useState } from 'react'
import { naira, nairaShort } from '../lib/calc.js'
import { featuredOf, useProducts } from '../lib/products.js'

// How it works, told with the real numbers of the most common plan:
// a deposit, one mark per monthly payment, then the system is yours.
// The months fill in once, the first time the timeline scrolls into view.
export default function PayTimeline() {
  const pkg = featuredOf(useProducts())
  const { deposit, monthly, months: tenorMonths } = pkg
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
    <ol ref={ref} className={`track${seen ? ' track--in' : ''}`} style={{ '--n': tenorMonths }}>
      <li>
        <span className="track-mark"><i className="track-dot" /></span>
        <h3>Tell us what you run</h3>
        <p>Today</p>
      </li>
      <li>
        <span className="track-mark"><i className="track-dot" /></span>
        <h3>We install {pkg.name}</h3>
        <p><b>{nairaShort(deposit)}</b> deposit</p>
      </li>
      <li className="track-months">
        <span className="track-mark">
          {Array.from({ length: tenorMonths }, (_, i) => <i key={i} style={{ '--i': i }} />)}
        </span>
        <h3>You pay monthly</h3>
        <p><b>{naira(monthly)}</b> × {tenorMonths}</p>
      </li>
      <li className="track-end">
        <span className="track-mark"><i className="track-dot" /></span>
        <h3>Then it is yours</h3>
        <p>No more payments</p>
      </li>
    </ol>
  )
}
