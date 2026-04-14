import { useCallback, useEffect, useRef } from 'react'

/**
 * Simple canvas signature capture (no extra deps). Returns PNG data URL on demand.
 */
export default function SignaturePad({ label, width = 400, height = 160, onChange, className = '' }) {
  const canvasRef = useRef(null)
  const drawing = useRef(false)

  const pos = (e) => {
    const c = canvasRef.current
    if (!c) return { x: 0, y: 0 }
    const r = c.getBoundingClientRect()
    const cx = e.touches ? e.touches[0].clientX : e.clientX
    const cy = e.touches ? e.touches[0].clientY : e.clientY
    return { x: cx - r.left, y: cy - r.top }
  }

  const start = (e) => {
    e.preventDefault()
    drawing.current = true
    const c = canvasRef.current
    const ctx = c?.getContext('2d')
    if (!ctx) return
    const { x, y } = pos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const move = (e) => {
    if (!drawing.current) return
    e.preventDefault()
    const c = canvasRef.current
    const ctx = c?.getContext('2d')
    if (!ctx) return
    const { x, y } = pos(e)
    ctx.lineTo(x, y)
    ctx.strokeStyle = '#111827'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.stroke()
    const data = c.toDataURL('image/png')
    onChange?.(data)
  }

  const end = () => {
    drawing.current = false
  }

  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, c.width, c.height)
  }, [])

  const clear = useCallback(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, c.width, c.height)
    onChange?.(null)
  }, [onChange])

  return (
    <div className={className}>
      {label ? <p className="mb-1 text-xs font-semibold text-gray-700 dark:text-gray-300">{label}</p> : null}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="touch-none w-full max-w-full cursor-crosshair rounded-lg border border-gray-300 bg-white dark:border-gray-600"
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
      <button
        type="button"
        onClick={clear}
        className="mt-2 rounded-lg border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-white/5"
      >
        Clear
      </button>
    </div>
  )
}
