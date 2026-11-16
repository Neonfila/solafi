import { useEffect, useRef, useState } from 'react'

// Draw a signature with a finger or a mouse. Calls onChange with a PNG data URL,
// or null once cleared. The canvas keeps a white background so the PNG reads
// the same in the signed copy whatever theme the page was in.
export default function SignaturePad({ onChange, disabled }) {
  const ref = useRef(null)
  const drawing = useRef(false)
  const last = useRef(null)
  const [empty, setEmpty] = useState(true)

  useEffect(() => {
    const c = ref.current
    const ratio = window.devicePixelRatio || 1
    c.width = c.offsetWidth * ratio
    c.height = c.offsetHeight * ratio
    const ctx = c.getContext('2d')
    ctx.scale(ratio, ratio)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, c.offsetWidth, c.offsetHeight)
    ctx.lineWidth = 2.4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#0E1A14'
  }, [])

  const point = (e) => {
    const r = ref.current.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  const down = (e) => {
    if (disabled) return
    ref.current.setPointerCapture(e.pointerId)
    drawing.current = true
    last.current = point(e)
  }
  const move = (e) => {
    if (!drawing.current) return
    const p = point(e)
    const ctx = ref.current.getContext('2d')
    ctx.beginPath()
    ctx.moveTo(last.current.x, last.current.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    last.current = p
    if (empty) setEmpty(false)
  }
  const up = () => {
    if (!drawing.current) return
    drawing.current = false
    onChange(ref.current.toDataURL('image/png'))
  }
  const clear = () => {
    const c = ref.current
    const ctx = c.getContext('2d')
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, c.width, c.height)
    setEmpty(true)
    onChange(null)
  }

  return (
    <div className="sigpad">
      <canvas
        ref={ref}
        aria-label="Draw your signature"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
      />
      {empty && <span className="sigpad-hint" aria-hidden="true">Sign here</span>}
      <button type="button" onClick={clear} disabled={disabled || empty}>Clear</button>
    </div>
  )
}
