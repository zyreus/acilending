export const REQUIRED_FIELD_MESSAGE = 'This field is required.'

export function hasText(value) {
  return String(value ?? '').trim().length > 0
}

export function collectMissingFields(entries) {
  return entries.reduce((errors, [key, value, label]) => {
    if (!hasText(value)) {
      errors[key] = label ? `${label} is required.` : REQUIRED_FIELD_MESSAGE
    }
    return errors
  }, {})
}

export function buildMissingFieldsSummary(fieldErrors, maxItems = 3) {
  const entries = Object.entries(fieldErrors || {})
  const total = entries.length
  if (!total) return 'Please fill in all required fields.'

  const labels = entries
    .map(([, message]) => String(message || '').replace(/\s*is required\.\s*$/i, '').trim())
    .filter(Boolean)
  const preview = labels.slice(0, Math.max(1, maxItems))
  const suffix = total > preview.length ? ', ...' : ''

  return `Please fill in all required fields. (${total} field${total > 1 ? 's' : ''}) Missing: ${preview.join(', ')}${suffix}`
}

export function focusFirstInvalidField(fieldErrors) {
  if (typeof document === 'undefined') return
  const firstKey = Object.keys(fieldErrors || {})[0]
  if (!firstKey) return
  const target = document.querySelector(`[data-field-path="${firstKey}"]`)
  if (!target) return
  target.scrollIntoView({ behavior: 'smooth', block: 'center' })
  if (typeof target.focus === 'function') {
    target.focus({ preventScroll: true })
  }
}
