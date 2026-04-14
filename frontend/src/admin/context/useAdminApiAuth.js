import { useContext } from 'react'
import { AdminApiAuthContext } from './adminApiAuthContext.js'

export function useAdminApiAuth() {
  const ctx = useContext(AdminApiAuthContext)
  if (!ctx) throw new Error('useAdminApiAuth must be used within AdminApiAuthProvider')
  return ctx
}
