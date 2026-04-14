/**
 * Opens the application-form modal host and supports tone-aware payloads.
 */
export function openModal(messageOrOptions) {
  if (typeof window === 'undefined') return
  const payload =
    typeof messageOrOptions === 'object' && messageOrOptions !== null
      ? messageOrOptions
      : { message: String(messageOrOptions ?? '') }
  const run = () => {
    if (typeof window.openModal === 'function') {
      window.openModal(payload)
    } else {
      window.__applicationFormPendingModal = payload
    }
  }
  if (typeof window.openModal === 'function') run()
  else queueMicrotask(run)
}
