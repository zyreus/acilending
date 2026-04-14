import { Navigate, useLocation } from 'react-router-dom'
import { useBorrowerAuth } from './context/useBorrowerAuth.js'

export default function BorrowerProtectedRoute({ children }) {
  const { authed, booting, user } = useBorrowerAuth()
  const location = useLocation()

  if (booting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 text-gray-600 transition-colors duration-300 dark:bg-[#0F172A] dark:text-gray-400">
        <p className="text-sm">Loading borrower session...</p>
      </div>
    )
  }

  if (!authed) {
    return <Navigate to="/borrower/login" state={{ from: location }} replace />
  }
  if (user?.role !== 'borrower') {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}
