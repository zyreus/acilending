import { useCallback, useEffect, useRef, useState } from 'react'

const POOL = [
  { key: 'blink', label: 'Blink slowly' },
  { key: 'smile', label: 'Smile' },
  { key: 'turn_left', label: 'Turn your head slightly to the left' },
  { key: 'turn_right', label: 'Turn your head slightly to the right' },
]

function pickThreeActions() {
  const shuffled = [...POOL].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 3)
}

function captureJpegBlobFromVideo(video, quality = 0.92) {
  if (!video || video.videoWidth < 2) return null
  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.drawImage(video, 0, 0)
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob || null), 'image/jpeg', quality)
  })
}

/**
 * Public loan application: guided prompts (blink / smile / head turns), then one still for `face_photo`.
 * Does not call JWT liveness API — image is sent with the multipart apply form.
 */
export default function ApplyFaceLivenessCapture({ onCapture, disabled }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const [phase, setPhase] = useState('idle') // idle | running | final | preview
  const [currentStep, setCurrentStep] = useState(0)
  const [cameraError, setCameraError] = useState('')
  const [instruction, setInstruction] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [session, setSession] = useState(0)

  const stopStream = useCallback(() => {
    const s = streamRef.current
    if (s) {
      s.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
  }, [])

  const runActionCapture = useCallback((stepIndex, actionList) => {
    const video = videoRef.current
    if (!video) return

    const label = actionList[stepIndex]?.label || 'Follow the prompt'
    setCurrentStep(stepIndex)
    setInstruction(label)

    window.setTimeout(() => {
      if (stepIndex < 2) {
        // Recursive step; stable useCallback below — eslint immutability rule is overly strict here
        // eslint-disable-next-line react-hooks/immutability -- intentional sequential capture steps
        runActionCapture(stepIndex + 1, actionList)
      } else {
        setPhase('final')
        setInstruction('Hold still for a clear photo — then tap Capture photo.')
      }
    }, 2500)
  }, [])

  const startCamera = useCallback(async () => {
    setCameraError('')
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera is not supported in this browser.')
      return false
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false,
    })
    streamRef.current = stream
    if (videoRef.current) {
      videoRef.current.srcObject = stream
      await videoRef.current.play().catch(() => {})
    }
    return true
  }, [])

  const begin = async () => {
    setCameraError('')
    setPreviewUrl('')
    onCapture?.(null)
    const list = pickThreeActions()
    setCurrentStep(0)

    try {
      await startCamera()
    } catch (e) {
      setCameraError(
        e?.name === 'NotAllowedError'
          ? 'Camera permission denied. Allow camera access to continue.'
          : 'Could not open camera. Use HTTPS or localhost.',
      )
      return
    }

    setPhase('running')
    runActionCapture(0, list)
  }

  const captureFinal = async () => {
    const video = videoRef.current
    const blob = await captureJpegBlobFromVideo(video)
    if (!blob) return
    const file = new File([blob], 'face-capture.jpg', { type: 'image/jpeg' })
    const url = URL.createObjectURL(blob)
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return url
    })
    stopStream()
    onCapture?.(file)
    setPhase('preview')
    setInstruction('')
  }

  const retake = () => {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return ''
    })
    onCapture?.(null)
    setPhase('idle')
    setInstruction('')
    setSession((s) => s + 1)
  }

  useEffect(() => () => stopStream(), [stopStream])

  const btnClass =
    'rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50'
  const outlineBtn =
    'rounded-lg border border-black/15 bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-black/5 disabled:opacity-50'

  return (
    <div className="space-y-3">
      {cameraError ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{cameraError}</p>
      ) : null}

      {!previewUrl ? (
        <div className="overflow-hidden rounded-xl border border-black/15 bg-black/5">
          <video key={session} ref={videoRef} className="aspect-video w-full object-cover" playsInline muted />
          <div className="border-t border-black/10 bg-white p-3">
            {phase === 'idle' && (
              <button type="button" disabled={disabled} onClick={() => void begin()} className={btnClass}>
                Start face verification
              </button>
            )}
            {phase === 'running' && (
              <p className="text-sm text-black/70">
                Step {currentStep + 1} of 3 — <span className="font-medium text-black">{instruction}</span>
              </p>
            )}
            {phase === 'final' && (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-black/70">{instruction}</p>
                <button type="button" disabled={disabled} onClick={() => void captureFinal()} className={btnClass}>
                  Capture photo
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-xl border border-black/15">
            <img src={previewUrl} alt="Captured face" className="aspect-video w-full object-cover" />
          </div>
          <button type="button" disabled={disabled} onClick={retake} className={outlineBtn}>
            Retake
          </button>
        </div>
      )}

      <p className="text-xs text-black/45">
        Follow on-screen prompts (blink, smile, head turns), then capture one clear photo for your application.
      </p>
    </div>
  )
}
