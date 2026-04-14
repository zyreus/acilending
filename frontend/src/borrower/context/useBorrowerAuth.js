import { useContext } from 'react'
import { BorrowerAuthContext } from './borrowerAuthContext.js'

export function useBorrowerAuth() {
  const ctx = useContext(BorrowerAuthContext)
  if (!ctx) throw new Error('useBorrowerAuth must be used within BorrowerAuthProvider')
  return ctx
}
