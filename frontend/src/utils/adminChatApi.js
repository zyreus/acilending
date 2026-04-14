/**
 * Chat / CRM API + Socket.IO — Amalgated Holdings adminApi pattern (multi-origin retry).
 * Used by AdminChatDashboard, LendingChatWidget, and lendingApi public inquiry.
 */

import {
  adminApiBases,
  adminFetchUrl,
  adminRequest,
  adminJson,
  rememberWorkingAdminBase,
  clearWorkingAdminBase,
} from './adminApi.js'

export { adminApiBases, rememberWorkingAdminBase, clearWorkingAdminBase }

const API_BASE = (import.meta.env.VITE_CHAT_SERVER_URL || '').trim().replace(/\/$/, '')

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

/**
 * Holdings Node (Socket.IO + chat API) origin in dev.
 * `dev:full` runs Laravel on 8000 — Node must use another port (e.g. 8010 via `npm run serve:chat`).
 */
export function devNodeChatOrigin() {
  const explicit = (import.meta.env.VITE_CHAT_DEV_ORIGIN || '').trim().replace(/\/$/, '')
  if (explicit) return explicit
  const proxy = (import.meta.env.VITE_API_PROXY_TARGET || '').trim().replace(/\/$/, '')
  if (proxy && /:8000\/?$/.test(proxy)) {
    return 'http://127.0.0.1:8010'
  }
  return proxy || 'http://127.0.0.1:8010'
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

/**
 * Primary URL for a path (first candidate base). Prefer for display or one-off fetches.
 * For resilient requests use {@link chatFetch} / {@link publicChatFetch}.
 */
export function chatApiUrl(path) {
  const bases = adminApiBases()
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
 * Authenticated chat admin request — Holdings-style multi-origin retry + Bearer secret.
 */
export async function chatFetch(path, init = {}) {
  const auth = getChatAuthHeaders()
  const headers = { ...auth, ...init.headers }
  return adminRequest(path, { cache: 'no-store', ...init, headers })
}

export async function chatJson(path, init = {}) {
  const auth = getChatAuthHeaders()
  const headers = { ...auth, ...init.headers }
  return adminJson(path, { cache: 'no-store', ...init, headers })
}

/**
 * Public visitor endpoints (no Bearer) — still benefits from origin retry.
 */
export async function publicChatFetch(path, init = {}) {
  return adminRequest(path, { cache: 'no-store', ...init })
}

export async function publicChatJson(path, init = {}) {
  return adminJson(path, { cache: 'no-store', ...init })
}
