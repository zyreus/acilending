import { Outlet } from 'react-router-dom'
import ApplicationFormModalHost from '../components/loan/ApplicationFormModalHost.jsx'

export default function ApplicationFormLayout() {
  return (
    <>
      <Outlet />
      <ApplicationFormModalHost />
    </>
  )
}
