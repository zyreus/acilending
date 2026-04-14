import { useCallback, useEffect, useRef, useState } from 'react'
import { borrowerApi } from '../borrower/api/client.js'

function captureJpegBase64(video) {
  if (!video || video.videoWidth < 2) return ''
  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  ctx.drawImage(video, 0, 0)
  const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
  const parts = dataUrl.split(',')
  return parts[1] || ''
}

/**
 * Single-image face match vs registered KYC photo (AWS Rekognition).
 * POST /api/v1/face/verify with borrower JWT.
 */
export default function FaceRecognition({ borrowerId, onVerified, onFailed }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [phase, setPhase] = useState('idle') // idle | preview | submitting | done
  const [previewUrl, setPreviewUrl] = useState('')
  const [capturedBase64, setCapturedBase64] = useState('')
  const [cameraError, setCameraError] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [similarity, setSimilarity] = useState(null)
  const [session, setSession] = useState(0)

  const stopStream = useCallback(() => {
    const s = streamRef.current
    if (s) {
      s.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
  }, [])

  useEffect(() => {
    if (previewUrl) return
    let cancelled = false
    ;(async () => {
      setCameraError('')
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setCameraError('Camera is not supported in this browser.')
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
          setCameraError(
            e?.name === 'NotAllowedError'
              ? 'Camera permission denied.'
              : 'Could not open camera. Use HTTPS or localhost.',
          )
        }
      }
    })()
    return () => {
      cancelled = true
      stopStream()
    }
  }, [session, previewUrl, stopStream])

  const capture = () => {
    const video = videoRef.current
    const b64 = captureJpegBase64(video)
    if (!b64) return
    setCapturedBase64(b64)
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    setPreviewUrl(canvas.toDataURL('image/jpeg', 0.9))
    setPhase('preview')
    stopStream()
    if (videoRef.current) videoRef.current.srcObject = null
  }

  const retake = () => {
    setPreviewUrl('')
    setCapturedBase64('')
    setPhase('idle')
    setErrorMsg('')
    setSuccessMsg('')
    setSimilarity(null)
    setSession((s) => s + 1)
  }

  const submit = async () => {
    if (!capturedBase64 || borrowerId == null) {
      setErrorMsg('Missing capture or borrower.')
      return
    }
    setPhase('submitting')
    setErrorMsg('')
    setSuccessMsg('')
    setSimilarity(null)
    try {
      const res = await borrowerApi('/face/verify', {
        method: 'POST',
        body: JSON.stringify({
          borrower_id: borrowerId,
          image: capturedBase64,
        }),
      })
      if (res.status === 'verified') {
        setSuccessMsg(res.message || 'Face matched successfully')
        setSimilarity(res.similarity != null ? Number(res.similarity) : null)
        setPhase('done')
        onVerified?.(res)
      } else {
        setErrorMsg(res.message || 'Face does not match')
        setSimilarity(res.similarity != null ? Number(res.similarity) : null)
        onFailed?.(res)
        setPhase('preview')
      }
    } catch (err) {
      const msg = err.message || 'Verification failed.'
      setErrorMsg(msg)
      setSimilarity(err.body?.similarity != null ? Number(err.body.similarity) : null)
      onFailed?.({ message: msg })
      setPhase('preview')
    }
  }

  return (
    <div className="mt-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-[#1F2937] dark:bg-[#111827]">
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Face recognition</h3>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Align your face inside the frame
      </p>
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
        Your photo is compared to your loan application face (POST <code className="rounded bg-black/5 px-1 dark:bg-white/10">/api/v1/face/verify</code>).
      </p>

      {cameraError ? (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
          {cameraError}
        </p>
      ) : null}
      {errorMsg ? (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
          {errorMsg}
          {similarity != null && Number.isFinite(similarity) ? (
            <span className="block text-xs opacity-90">Similarity: {similarity.toFixed(1)}%</span>
          ) : null}
        </p>
      ) : null}
      {successMsg ? (
        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200">
          {successMsg}
          {similarity != null && Number.isFinite(similarity) ? (
            <span className="mt-1 block font-semibold tabular-nums">Match: {similarity.toFixed(1)}%</span>
          ) : null}
        </p>
      ) : null}

      <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-black/5 dark:border-[#1F2937]">
        {!previewUrl ? (
          <video ref={videoRef} className="aspect-video w-full object-cover" playsInline muted />
        ) : (
          <img src={previewUrl} alt="Captured" className="aspect-video w-full object-cover" />
        )}
      </div>

      {phase === 'submitting' ? (
        <div className="mt-4 flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
          <span
            className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-red-600 border-t-transparent dark:border-red-400"
            aria-hidden
          />
          Verifying face…
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {!previewUrl && phase !== 'done' ? (
          <button
            type="button"
            onClick={capture}
            disabled={!!cameraError || phase === 'submitting'}
            className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            Capture
          </button>
        ) : null}
        {previewUrl && phase !== 'done' && phase !== 'submitting' ? (
          <>
            <button
              type="button"
              onClick={submit}
              className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
            >
              Submit
            </button>
            <button
              type="button"
              onClick={retake}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm dark:border-[#374151]"
            >
              Retake
            </button>
          </>
        ) : null}
        {phase === 'done' ? (
          <button
            type="button"
            onClick={retake}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm dark:border-[#374151]"
          >
            Verify again
          </button>
        ) : null}
      </div>
    </div>
  )
}
