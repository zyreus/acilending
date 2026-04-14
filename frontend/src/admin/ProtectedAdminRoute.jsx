import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAdminApiAuth } from './context/useAdminApiAuth.js'

export default function ProtectedAdminRoute() {
  const { authed, booting } = useAdminApiAuth()
  const location = useLocation()

  if (booting) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">Checking admin session…</p>
      </div>
    )
  }

  if (!authed) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    )
  }

  return <Outlet />
}

