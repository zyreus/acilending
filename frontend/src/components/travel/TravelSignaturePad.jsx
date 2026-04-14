import { useCallback, useEffect, useRef, useState } from 'react'

const PEN = '#0f172a'

export default function TravelSignaturePad({ value, onChange, className = '' }) {
  const canvasRef = useRef(null)
  const drawing = useRef(false)
  const [hasInk, setHasInk] = useState(false)

  const getCtx = () => canvasRef.current?.getContext('2d')

  const resize = useCallback(() => {
    const c = canvasRef.current
    if (!c) return
    const rect = c.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    const w = Math.max(320, Math.floor(rect.width))
    const h = 160
    c.width = w * dpr
    c.height = h * dpr
    c.style.height = `${h}px`
    const ctx = c.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.strokeStyle = PEN
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  useEffect(() => {
    resize()
    const ro = new ResizeObserver(() => resize())
    if (canvasRef.current?.parentElement) ro.observe(canvasRef.current.parentElement)
    return () => ro.disconnect()
  }, [resize])

  const pos = (e) => {
    const c = canvasRef.current
    if (!c) return { x: 0, y: 0 }
    const r = c.getBoundingClientRect()
    const t = e.touches?.[0]
    const cx = t ? t.clientX : e.clientX
    const cy = t ? t.clientY : e.clientY
    return { x: cx - r.left, y: cy - r.top }
  }

  const start = (e) => {
    e.preventDefault()
    drawing.current = true
    const ctx = getCtx()
    const { x, y } = pos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const move = (e) => {
    if (!drawing.current) return
    e.preventDefault()
    const ctx = getCtx()
    const { x, y } = pos(e)
    ctx.lineTo(x, y)
    ctx.stroke()
    setHasInk(true)
    if (onChange) onChange(canvasRef.current.toDataURL('image/png'))
  }

  const end = () => {
    drawing.current = false
    if (onChange && canvasRef.current) onChange(canvasRef.current.toDataURL('image/png'))
  }

  const clear = () => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, c.width, c.height)
    resize()
    setHasInk(false)
    onChange?.('')
  }

  return (
    <div className={className}>
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full touch-none cursor-crosshair bg-slate-50"
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={end}
          onMouseLeave={end}
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={end}
        />
      </div>
      <div className="mt-2 flex justify-between gap-2">
        <p className="text-xs text-slate-500">Sign inside the box</p>
        <button type="button" onClick={clear} className="text-xs font-semibold text-red-600 hover:underline">
          Clear
        </button>
      </div>
      {value && !hasInk ? null : null}
    </div>
  )
}
