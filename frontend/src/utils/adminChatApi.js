/**
 * Chat / CRM API + Socket.IO — Amalgated Holdings adminApi pattern (multi-origin retry).
 * Used by AdminChatDashboard, LendingChatWidget, and lendingApi public inquiry.
 *
 * HTTP: In Vite dev, `/api/*` is proxied to Laravel — chat REST lives on the Node server (8010),
 * so {@link chatHttpBases} tries the chat origin first. Sockets already use {@link adminSocketUrl}.
 */

import { adminFetchUrl } from './adminApi.js'

export { adminApiBases, rememberWorkingAdminBase, clearWorkingAdminBase } from './adminApi.js'

const API_BASE = (import.meta.env.VITE_CHAT_SERVER_URL || '').trim().replace(/\/$/, '')

/** Persisted origin that successfully served chat/CRM REST (separate from Laravel adminApi). */
const CHAT_ORIGIN_STORAGE_KEY = 'lending_chat_working_api_origin'

/** Same key as lendingApi `setSessionLendingAdminSecret` — Bearer for Node (LENDING_ADMIN_API_SECRET). */
const SESSION_LENDING_SECRET_KEY = 'lending_admin_api_secret'

function getLendingSecretForChat() {
  const fromEnv =
    (import.meta.env.VITE_LENDING_ADMIN_API_SECRET || '').trim() ||
    (import.meta.env.VITE_CHAT_API_SECRET || '').trim()
  if (fromEnv) return fromEnv
  try {
    return sessionStorage.getItem(SESSION_LENDING_SECRET_KEY)?.trim() || ''
  } catch {
    return ''
  }
}

/** Default Node chat/Socket.IO origin in dev (see chat-server `PORT`, usually 8010). */
const DEFAULT_CHAT_DEV_ORIGIN = 'http://127.0.0.1:8010'

/**
 * Holdings Node (Socket.IO + chat API) origin in dev.
 * Never use `VITE_API_PROXY_TARGET` here — that is Laravel; Socket.IO must hit the Node chat server
 * (`npm run serve:chat` / port 8010 by default).
 */
export function devNodeChatOrigin() {
  const explicit = (import.meta.env.VITE_CHAT_DEV_ORIGIN || '').trim().replace(/\/$/, '')
  if (explicit) return explicit
  const chatTarget = (import.meta.env.VITE_CHAT_PROXY_TARGET || '').trim().replace(/\/$/, '')
  if (chatTarget) return chatTarget
  const apiProxy = (import.meta.env.VITE_API_PROXY_TARGET || '').trim().replace(/\/$/, '')
  // Legacy docs assumed Laravel on :8000 with no separate env for Node; still map to chat port only.
  if (apiProxy && /:8000\/?$/.test(apiProxy)) {
    return DEFAULT_CHAT_DEV_ORIGIN
  }
  return DEFAULT_CHAT_DEV_ORIGIN
}

/**
 * Socket.IO URL. Prefer VITE_CHAT_SERVER_URL.
 * In dev, connect straight to the Node chat port (see {@link devNodeChatOrigin}) so traffic does not go through
 * Vite’s `/socket.io` proxy — that avoids noisy `ws proxy error` / ECONNABORTED logs when sockets reconnect.
 */
export function adminSocketUrl() {
  if (API_BASE) return API_BASE
  if (typeof window !== 'undefined' && import.meta.env.DEV) return devNodeChatOrigin()
  return typeof window !== 'undefined' ? window.location.origin : ''
}

function addChatBase(bases, b) {
  const s = b === '' || b == null ? '' : String(b).replace(/\/$/, '')
  if (!bases.includes(s)) bases.push(s)
}

/**
 * Origins for chat/CRM REST (`/api/admin/...`, `/api/feedback`, etc.).
 * Dev: Node first (Vite’s `/api` proxy targets Laravel only).
 */
export function chatHttpBases() {
  const bases = []
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(CHAT_ORIGIN_STORAGE_KEY)
      if (saved != null) addChatBase(bases, saved)
    }
  } catch {
    /* ignore */
  }
  if (API_BASE) {
    addChatBase(bases, API_BASE)
    return bases
  }
  if (typeof window !== 'undefined' && import.meta.env.DEV) {
    addChatBase(bases, devNodeChatOrigin())
    addChatBase(bases, '')
  } else if (typeof window !== 'undefined') {
    addChatBase(bases, window.location.origin)
  } else {
    addChatBase(bases, '')
  }
  return bases
}

function rememberChatWorkingBase(base) {
  try {
    if (typeof localStorage === 'undefined') return
    const s = base === '' || base == null ? '' : String(base).replace(/\/$/, '')
    localStorage.setItem(CHAT_ORIGIN_STORAGE_KEY, s)
  } catch {
    /* ignore */
  }
}

function shouldRetryStatus(status) {
  return status === 404 || status === 502 || status === 503
}

async function chatRequest(path, init = {}) {
  const bases = chatHttpBases()
  let lastRes = null
  for (const base of bases) {
    const url = adminFetchUrl(base, path)
    try {
      const res = await fetch(url, { cache: 'no-store', ...init })
      lastRes = res
      if (shouldRetryStatus(res.status)) continue
      if (res.status === 401 || res.status === 403) continue
      if (res.ok) rememberChatWorkingBase(base)
      return { res, base }
    } catch {
      continue
    }
  }
  return { res: lastRes, base: null }
}

/**
 * Primary URL for a path (first candidate base). Prefer for display or one-off fetches.
 * For resilient requests use {@link chatFetch} / {@link publicChatFetch}.
 */
export function chatApiUrl(path) {
  const bases = chatHttpBases()
  const base = bases[0] ?? ''
  return adminFetchUrl(base, path)
}

/**
 * Auth headers for Node chat/CRM API.
 */
export function getChatAuthHeaders() {
  const secret = getLendingSecretForChat()
  return {
    Authorization: secret ? `Bearer ${secret}` : '',
    'Content-Type': 'application/json',
  }
}

/** True when env or session has the Node shared secret (required for Chat & CRM REST). */
export function hasChatServerAuth() {
  return Boolean(getLendingSecretForChat())
}

/**
 * Authenticated chat admin request — tries Node chat origin before same-origin in dev.
 */
export async function chatFetch(path, init = {}) {
  const auth = getChatAuthHeaders()
  const headers = { ...auth, ...init.headers }
  return chatRequest(path, { cache: 'no-store', ...init, headers })
}

export async function chatJson(path, init = {}) {
  const auth = getChatAuthHeaders()
  const headers = { ...auth, ...init.headers }
  const { res, base } = await chatRequest(path, { cache: 'no-store', ...init, headers })
  const data = (await res?.json?.().catch(() => ({}))) ?? {}
  return { res, data, base }
}

/**
 * Public visitor endpoints (no Bearer) — same origin ordering as {@link chatHttpBases}.
 */
export async function publicChatFetch(path, init = {}) {
  return chatRequest(path, { cache: 'no-store', ...init })
}

export async function publicChatJson(path, init = {}) {
  const { res, base } = await chatRequest(path, { cache: 'no-store', ...init })
  const data = (await res?.json?.().catch(() => ({}))) ?? {}
  return { res, data, base }
}
