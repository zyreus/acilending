export const REQUIRED_FIELD_MESSAGE = 'This field is required.'

export function hasText(value) {
  return String(value ?? '').trim().length > 0
}

export function collectMissingFields(entries) {
  return entries.reduce((errors, [key, value]) => {
    if (!hasText(value)) {
      errors[key] = REQUIRED_FIELD_MESSAGE
    }
    return errors
  }, {})
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
