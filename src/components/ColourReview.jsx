import { useEffect, useState } from 'react'
import { Palette, X } from 'lucide-react'

// Design review only. Lets a reviewer flip the primary colour on the preview
// build without separate deploys. It is not part of the product: it renders
// only on the /preview/ build, or locally with ?review in the address.
export const showColourReview =
  import.meta.env.BASE_URL.includes('/preview/') ||
  (import.meta.env.DEV && new URLSearchParams(window.location.search).has('review'))

const options = [
  { id: 'lime', name: 'Lime', sun: '#C8F53C', on: '#131C00' },
  // Laterite is close to the red used for "what you pay now", so that turns grey with it.
  { id: 'laterite', name: 'Laterite red-earth', sun: '#E8673F', on: '#1A0700', coral: '#8C9A93' },
  { id: 'blue', name: 'Panel blue', sun: '#6E9BFF', on: '#050D24' },
  { id: 'mint', name: 'Mint', sun: '#5FE3B4', on: '#04170F' },
]

function apply(o) {
  const r = document.documentElement.style
  r.setProperty('--sun', o.sun)
  r.setProperty('--on-sun', o.on)
  if (o.coral) r.setProperty('--coral', o.coral)
  else r.removeProperty('--coral')
}

function saved() {
  try {
    return localStorage.getItem('solafi-review-colour')
  } catch {
    return null
  }
}

export default function ColourReview() {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('colour')
    return options.find((o) => o.id === fromUrl || o.id === saved())?.id || 'lime'
  })

  useEffect(() => {
    apply(options.find((o) => o.id === current))
    try {
      localStorage.setItem('solafi-review-colour', current)
    } catch {
      // private browsing: the choice just won't be remembered
    }
  }, [current])

  return (
    <div className="review">
      {open && (
        <div className="review-panel" role="radiogroup" aria-label="Primary colour">
          <p>Design review: try a primary colour</p>
          {options.map((o) => (
            <button key={o.id} type="button" role="radio" aria-checked={current === o.id} className={current === o.id ? 'on' : ''} onClick={() => setCurrent(o.id)}>
              <i style={{ background: o.sun }} />
              {o.name}
            </button>
          ))}
        </div>
      )}
      <button type="button" className="review-toggle" aria-expanded={open} aria-label={open ? 'Close colour options' : 'Try other colours'} onClick={() => setOpen(!open)}>
        {open ? <X size={20} /> : <Palette size={20} />}
      </button>
    </div>
  )
}
