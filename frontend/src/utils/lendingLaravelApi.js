/**
 * Laravel JWT API base resolution (Holdings-style): dev proxy, explicit URL, localhost fallbacks.
 * Used by admin/api/client.js for /api/v1 routes.
 */

const STORAGE_KEY = 'lending_laravel_working_api_base'

function addBase(bases, b) {
  const s = b === '' || b == null ? '' : String(b).replace(/\/$/, '')
  if (!bases.includes(s)) bases.push(s)
}

/**
 * Ensure absolute bases always end with `/api/v1` so login hits Laravel JWT routes,
 * not `/admin/login` at the app root (404).
 */
export function normalizeLaravelApiBase(base) {
  if (base === '' || base == null) return ''
  const s = String(base).trim().replace(/\/$/, '')
  if (!s) return ''
  if (!/^https?:\/\//i.test(s)) return s
  if (/\/api\/v1$/i.test(s)) return s
  if (/\/api$/i.test(s)) return `${s}/v1`
  return `${s}/api/v1`
}

function buildUrl(base, path) {
  const p = path.startsWith('/') ? path : `/${path}`
  if (base === '' || base == null) {
    return `/api/v1${p}`
  }
  return `${String(base).replace(/\/$/, '')}${p}`
}

export function laravelApiBases() {
  const bases = []
  const explicit = (import.meta.env.VITE_LENDING_API_URL || '').trim().replace(/\/$/, '')

  // Dev: same-origin `/api/v1` via Vite proxy first — avoids stale localStorage like `http://127.0.0.1:8000` (missing /api/v1).
  if (typeof window !== 'undefined' && import.meta.env.DEV) {
    addBase(bases, '')
  }

  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved != null) {
        const normalized = normalizeLaravelApiBase(saved)
        const loopback = /^https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?(?:\/|$)/i.test(normalized)
        // In dev, ignore cached loopback bases — they pin :8000 while Laravel may bind :8001+.
        if (!import.meta.env.DEV || !loopback) {
          addBase(bases, normalized)
        }
      }
    }
  } catch {
    /* ignore */
  }

  if (explicit) addBase(bases, normalizeLaravelApiBase(explicit))

  const backendPort = String(import.meta.env.VITE_BACKEND_PORT || '8000')
  if (typeof window !== 'undefined') {
    const h = window.location.hostname
    if (h === 'localhost' || h === '127.0.0.1') {
      addBase(bases, normalizeLaravelApiBase(`http://127.0.0.1:${backendPort}`))
    }
  }
  if (bases.length === 0) {
    addBase(bases, normalizeLaravelApiBase(explicit || `http://127.0.0.1:${backendPort}`))
  }
  return bases
}

/**
 * Laravel app origin where `/storage/...` is served (uploads, public disk).
 * Do not use `window.location.origin` from the Vite dev server — it is not Laravel.
 */
export function getLaravelPublicOrigin() {
  const override = (import.meta.env.VITE_LENDING_PUBLIC_URL || '').trim().replace(/\/$/, '')
  if (override) {
    try {
      const u = new URL(override.startsWith('http') ? override : `https://${override}`)
      return u.origin
    } catch {
      /* fall through */
    }
  }
  const apiUrl = (import.meta.env.VITE_LENDING_API_URL || '').trim()
  if (apiUrl) {
    try {
      const withProto = apiUrl.startsWith('http') ? apiUrl : `http://${apiUrl}`
      const u = new URL(withProto)
      return `${u.protocol}//${u.host}`
    } catch {
      /* fall through */
    }
  }
  const port = String(import.meta.env.VITE_BACKEND_PORT || '8000')
  const host =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? '127.0.0.1'
      : typeof window !== 'undefined'
        ? window.location.hostname
        : '127.0.0.1'
  return `http://${host}:${port}`
}

/**
 * Absolute URL for a file on the `public` disk, e.g. `borrower-receipts/xxx.png`.
 */
export function getLaravelStorageFileUrl(relativePath) {
  if (relativePath == null || relativePath === '') return ''
  const s = String(relativePath).trim()
  if (!s) return ''
  if (/^https?:\/\//i.test(s)) return s
  const clean = s.replace(/^\/+/, '')
  return `${getLaravelPublicOrigin()}/storage/${clean}`
}

export function rememberWorkingLaravelBase(base) {
  try {
    if (typeof localStorage === 'undefined') return
    const s = base === '' || base == null ? '' : normalizeLaravelApiBase(String(base).replace(/\/$/, ''))
    localStorage.setItem(STORAGE_KEY, s)
  } catch {
    /* ignore */
  }
}

function shouldRetryStatus(status) {
  // Retry other candidate bases on server-side failures and common gateway misses.
  return status === 404 || status >= 500
}

/**
 * Try each Laravel base. Does not hop on 401 (same credentials on all).
 */
export async function laravelRequest(path, init = {}) {
  const bases = laravelApiBases()
  let lastRes = null
  for (const base of bases) {
    const url = buildUrl(base, path)
    try {
      const res = await fetch(url, { cache: 'no-store', ...init })
      lastRes = res
      if (shouldRetryStatus(res.status)) continue
      if (res.ok) rememberWorkingLaravelBase(base)
      return { res, base }
    } catch {
      continue
    }
  }
  return { res: lastRes, base: null }
}

/**
 * Unauthenticated POST to /api/v1/... (forgot password, etc.).
 */
export async function publicLaravelPost(path, body) {
  const rel = path.startsWith('/') ? path : `/${path}`
  const { res } = await laravelRequest(rel, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body ?? {}),
  })
  if (!res) {
    const err = new Error('Could not reach lending API (check Laravel URL and Vite proxy).')
    err.status = 0
    throw err
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    let msg = data.message || data.error
    if (!msg && data.errors && typeof data.errors === 'object') {
      const flat = Object.values(data.errors).flat()
      if (flat.length) msg = flat.join(' ')
    }
    const err = new Error(msg || `HTTP ${res.status}`)
    err.status = res.status
    err.body = data
    throw err
  }
  return data
}
