const ADMIN_USER_KEY = 'admin_user'
const BORROWER_USER_KEY = 'borrower_user'

function setStoredUser(key, user) {
  if (user) localStorage.setItem(key, JSON.stringify(user))
  else localStorage.removeItem(key)
}

function getStoredUser(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setAdminUser(user) {
  setStoredUser(ADMIN_USER_KEY, user)
}

export function getAdminUser() {
  return getStoredUser(ADMIN_USER_KEY)
}

export function clearAdminUser() {
  localStorage.removeItem(ADMIN_USER_KEY)
}

export function setBorrowerUser(user) {
  setStoredUser(BORROWER_USER_KEY, user)
}

export function getBorrowerUser() {
  return getStoredUser(BORROWER_USER_KEY)
}

export function clearBorrowerUser() {
  localStorage.removeItem(BORROWER_USER_KEY)
}

// Backward compatibility for older imports.
export function setAuthUser(user) {
  setBorrowerUser(user)
}

export function getAuthUser() {
  return getBorrowerUser()
}

export function clearAuthUser() {
  clearBorrowerUser()
}
