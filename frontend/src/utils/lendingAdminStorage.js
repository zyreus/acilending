const KEY_APPLICATIONS = 'lending_demo_applications_v1'

export function getDemoApplications() {
  try {
    const raw = localStorage.getItem(KEY_APPLICATIONS)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function addDemoApplication(payload) {
  const list = getDemoApplications()
  const entry = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    submittedAt: new Date().toISOString(),
    source: 'apply-form',
    ...payload,
  }
  list.unshift(entry)
  localStorage.setItem(KEY_APPLICATIONS, JSON.stringify(list.slice(0, 500)))
  return entry
}

export function clearDemoApplications() {
  try {
    localStorage.removeItem(KEY_APPLICATIONS)
  } catch {
    /* ignore */
  }
}

