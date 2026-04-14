import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Browser webcam capture for loan KYC (localhost or HTTPS only for getUserMedia).
 */
export default function FaceCapture({ onCapture, disabled }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [error, setError] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [starting, setStarting] = useState(true)
  const [session, setSession] = useState(0)

  const stopStream = useCallback(() => {
    const s = streamRef.current
    if (s) {
      s.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  useEffect(() => {
    if (previewUrl) return
    let cancelled = false
    ;(async () => {
      setError('')
      setStarting(true)
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setError('Camera not supported in this browser.')
          setStarting(false)
          return
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play().catch(() => {})
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e?.name === 'NotAllowedError'
              ? 'Camera permission denied. Allow camera access to complete face capture.'
              : 'Could not open camera. Use HTTPS or localhost, and check device settings.',
          )
        }
      } finally {
        if (!cancelled) setStarting(false)
      }
    })()
    return () => {
      cancelled = true
      stopStream()
    }
  }, [session, previewUrl, stopStream])

  const capture = () => {
    const video = videoRef.current
    if (!video || video.videoWidth < 2) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0)
    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev)
          return url
        })
        const file = new File([blob], 'face-capture.jpg', { type: 'image/jpeg' })
        onCapture?.(file)
        stopStream()
        if (video) video.srcObject = null
      },
      'image/jpeg',
      0.92,
    )
  }

  const retake = () => {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return ''
    })
    onCapture?.(null)
    setSession((s) => s + 1)
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{error}</p>
      ) : null}

      {!previewUrl ? (
        <div className="overflow-hidden rounded-xl border border-black/15 bg-black/5">
          <video ref={videoRef} className="aspect-video w-full object-cover" playsInline muted />
          <div className="flex flex-wrap gap-2 border-t border-black/10 bg-white p-3">
            <button
              type="button"
              disabled={disabled || starting || !!error}
              onClick={capture}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {starting ? 'Starting camera…' : 'Capture photo'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <img src={previewUrl} alt="Captured face" className="max-h-56 rounded-xl border border-black/15 object-contain" />
          <button
            type="button"
            onClick={retake}
            className="text-sm font-medium text-red-600 underline hover:text-red-700"
          >
            Retake photo
          </button>
        </div>
      )}
    </div>
  )
}
