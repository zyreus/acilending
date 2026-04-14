import { Navigate } from 'react-router-dom'
import { getToken, setToken } from '../admin/api/client.js'
import { clearAuthUser, getAuthUser } from '../auth/session.js'

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const token = getToken()
  const user = getAuthUser()

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}

export function logoutAndRedirect(navigate) {
  setToken(null)
  clearAuthUser()
  navigate('/login', { replace: true })
}
