import { useEffect, useState } from 'react'
import { Moon, Palette, Sun, X } from 'lucide-react'

// Design review only. Lets a reviewer flip the primary colour and light/dark
// on the preview build without separate deploys. It is not part of the product:
// it renders only on the /preview/ build, or locally with ?review in the address.
export const showColourReview =
  import.meta.env.BASE_URL.includes('/preview/') ||
  (import.meta.env.DEV && new URLSearchParams(window.location.search).has('review'))

// Each colour carries its own dark and light values. A primary that is easy to
// read on dark is often too pale on light, so light uses a deeper shade.
const options = [
  {
    id: 'lime', name: 'Lime',
    dark: { '--sun': '#C8F53C', '--on-sun': '#131C00' },
    light: { '--sun': '#5E8C00', '--on-sun': '#FFFFFF' },
  },
  {
    // Laterite is close to the red used for "what you pay now", so that turns grey with it.
    id: 'laterite', name: 'Laterite red-earth',
    dark: { '--sun': '#E8673F', '--on-sun': '#1A0700', '--coral': '#8C9A93' },
    light: { '--sun': '#C4472A', '--on-sun': '#FFFFFF', '--coral': '#7C8A83' },
  },
  {
    // Blue on dark green looks muddy, so the dark background turns navy with it.
    id: 'blue', name: 'Panel blue',
    dark: {
      '--sun': '#6E9BFF', '--on-sun': '#050D24',
      '--ink': '#070B14', '--ink-2': '#0C1220', '--ink-3': '#121A2C', '--ink-4': '#1B2539', '--muted': '#9AA6BC',
    },
    light: { '--sun': '#2F5BD8', '--on-sun': '#FFFFFF' },
  },
  {
    // Mint as primary clashes with the mint "paid off" colour, so that turns warm.
    id: 'mint', name: 'Mint',
    dark: { '--sun': '#5FE3B4', '--on-sun': '#04170F', '--leaf': '#E9C46A' },
    light: { '--sun': '#0E8F66', '--on-sun': '#FFFFFF', '--leaf': '#B9861E' },
  },
]
const allVars = [...new Set(options.flatMap((o) => [...Object.keys(o.dark), ...Object.keys(o.light)]))]

function apply(option, mode) {
  const root = document.documentElement
  root.dataset.theme = mode
  for (const v of allVars) root.style.removeProperty(v)
  for (const [v, val] of Object.entries(option[mode])) root.style.setProperty(v, val)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', getComputedStyle(root).getPropertyValue('--ink').trim())
}

function read(key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
function write(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // private browsing: the choice just won't be remembered
  }
}

export default function ColourReview() {
  const params = new URLSearchParams(window.location.search)
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState(() => {
    const want = params.get('colour') || read('solafi-review-colour')
    return options.find((o) => o.id === want)?.id || 'lime'
  })
  const [mode, setMode] = useState(() => {
    const want = params.get('mode') || read('solafi-review-mode')
    return want === 'light' ? 'light' : 'dark'
  })

  useEffect(() => {
    apply(options.find((o) => o.id === current), mode)
    write('solafi-review-colour', current)
    write('solafi-review-mode', mode)
  }, [current, mode])

  return (
    <div className="review">
      {open && (
        <div className="review-panel">
          <p>Design review: try a colour and a mode</p>
          <div role="radiogroup" aria-label="Primary colour">
            {options.map((o) => (
              <button key={o.id} type="button" role="radio" aria-checked={current === o.id} className={current === o.id ? 'on' : ''} onClick={() => setCurrent(o.id)}>
                <i style={{ background: o[mode]['--sun'] }} />
                {o.name}
              </button>
            ))}
          </div>
          <hr />
          <div className="review-modes" role="radiogroup" aria-label="Light or dark">
            <button type="button" role="radio" aria-checked={mode === 'dark'} className={mode === 'dark' ? 'on' : ''} onClick={() => setMode('dark')}>
              <Moon size={16} /> Dark
            </button>
            <button type="button" role="radio" aria-checked={mode === 'light'} className={mode === 'light' ? 'on' : ''} onClick={() => setMode('light')}>
              <Sun size={16} /> Light
            </button>
          </div>
        </div>
      )}
      <button type="button" className="review-toggle" aria-expanded={open} aria-label={open ? 'Close colour options' : 'Try other colours'} onClick={() => setOpen(!open)}>
        {open ? <X size={20} /> : <Palette size={20} />}
      </button>
    </div>
  )
}
