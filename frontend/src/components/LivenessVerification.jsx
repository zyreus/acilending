import { useCallback, useState } from 'react'
import '@aws-amplify/ui-react/styles.css'
import { LivenessQuickStartReact } from './LivenessQuickStartReact.jsx'

/**
 * AWS Amplify Face Liveness (quickstart-style) + Laravel CreateFaceLivenessSession / session results.
 */
export default function LivenessVerification({ borrowerId, onVerified, onFailed }) {
  const [statusMsg, setStatusMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [phase, setPhase] = useState('idle') // idle | active | done
  const [retryKey, setRetryKey] = useState(0)

  const hasIdentityPool = Boolean(
    import.meta.env.VITE_AWS_COGNITO_IDENTITY_POOL_ID &&
      String(import.meta.env.VITE_AWS_COGNITO_IDENTITY_POOL_ID).trim() !== '',
  )

  const handleVerified = useCallback(
    (data) => {
      setErrorMsg('')
      setStatusMsg(data.message || 'Liveness verification successful.')
      setPhase('done')
      onVerified?.(data)
    },
    [onVerified],
  )

  const handleFailed = useCallback(
    (data) => {
      const msg =
        data?.message ||
        (typeof data === 'string' ? data : null) ||
        'Liveness verification failed.'
      setStatusMsg('')
      setErrorMsg(msg)
      setPhase('done')
      onFailed?.(data)
    },
    [onFailed],
  )

  const reset = () => {
    setStatusMsg('')
    setErrorMsg('')
    setPhase('idle')
    setRetryKey((k) => k + 1)
  }

  const canRun = Boolean(borrowerId && hasIdentityPool)

  if (!borrowerId) {
    return null
  }

  return (
    <div className="mt-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-[#1F2937] dark:bg-[#111827]">
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Liveness verification</h3>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        AWS Amplify Face Liveness — follow the on-screen prompts (oval, movement).
      </p>
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
        Backend: POST <code className="rounded bg-black/5 px-1 dark:bg-white/10">/api/v1/liveness/amplify-session</code> and GET{' '}
        <code className="rounded bg-black/5 px-1 dark:bg-white/10">/api/v1/liveness/amplify-session/&#123;sessionId&#125;/results</code> (JWT).
        Configure <code className="rounded bg-black/5 px-1 dark:bg-white/10">LIVENESS_AMPLIFY_REGION</code> (e.g. us-east-1) and Cognito Identity Pool for
        the browser.
      </p>

      {!hasIdentityPool ? (
        <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
          <p className="font-semibold">AWS Amplify Face Liveness is not configured.</p>
          <p className="mt-1">
            Add{' '}
            <code className="rounded bg-black/5 px-1 dark:bg-white/10">VITE_AWS_COGNITO_IDENTITY_POOL_ID</code> to{' '}
            <code className="rounded bg-black/5 px-1 dark:bg-white/10">amalgated-lending/.env.development.local</code>{' '}
            then restart Vite.
          </p>
        </div>
      ) : null}

      {errorMsg ? (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">{errorMsg}</p>
      ) : null}
      {statusMsg ? (
        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-green-500/10 dark:text-emerald-200">
          {statusMsg}
        </p>
      ) : null}

      <div className="mt-4">
        {canRun && phase !== 'done' ? (
          <LivenessQuickStartReact
            key={retryKey}
            borrowerId={borrowerId}
            onVerified={handleVerified}
            onFailed={handleFailed}
          />
        ) : null}

        {canRun && phase === 'done' ? (
          <button
            type="button"
            onClick={reset}
            className="mt-4 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium dark:border-[#374151]"
          >
            Try again
          </button>
        ) : null}
      </div>
    </div>
  )
}
