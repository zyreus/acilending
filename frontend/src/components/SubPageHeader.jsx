import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

export default function SubPageHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/#newsletter', label: 'News', isSection: true },
    { to: '/loan-products', label: 'Loan Products' },
    { to: '/features', label: 'Features' },
    { to: '/branches', label: 'Branches' },
    { to: '/borrower/login', label: 'Borrower Log in' },
  ]

  const goToSection = (id) => {
    if (location.pathname === '/') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    navigate('/')
    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 120)
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-black/10 bg-white">
      <div className="app-container flex items-center justify-between gap-2 py-3 sm:py-4">
        <Link to="/" className="flex shrink-0 items-center gap-3 transition hover:opacity-90">
          <img src="/amalgated-lending-logo.png" alt="Amalgated Lending" className="h-11 w-11 object-contain sm:h-12 sm:w-12" />
          <span className="hidden flex-col leading-tight sm:flex sm:flex-col">
            <span className="text-sm font-semibold tracking-wide text-black">Amalgated Lending</span>
            <span className="text-xs text-black/70">Trusted Lending Solutions</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 xl:gap-8 text-sm font-medium text-black lg:flex">
          {navLinks.map(({ to, label, isSection }) =>
            isSection ? (
              <button key={to} type="button" onClick={() => goToSection('newsletter')} className="transition hover:text-red-600">
                {label}
              </button>
            ) : (
              <Link key={to} to={to} className="transition hover:text-red-600">
                {label}
              </Link>
            )
          )}
          <Link
            to="/contact"
            className="inline-flex items-center justify-center rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/25"
          >
            Contact
          </Link>
        </nav>

        <button
          type="button"
          className="flex h-11 min-w-[44px] items-center justify-center rounded-lg text-black hover:bg-black/10 lg:hidden"
          onClick={() => setMobileOpen((o) => !o)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-black/10 bg-white px-4 py-4 lg:hidden">
          {navLinks.map(({ to, label, isSection }) =>
            isSection ? (
              <button
                key={to}
                type="button"
                className="block w-full rounded-lg px-3 py-2.5 text-left text-black hover:bg-red-50 hover:text-red-600"
                onClick={() => {
                  goToSection('newsletter')
                  setMobileOpen(false)
                }}
              >
                {label}
              </button>
            ) : (
              <Link key={to} to={to} className="block rounded-lg px-3 py-2.5 text-black hover:bg-red-50 hover:text-red-600" onClick={() => setMobileOpen(false)}>
                {label}
              </Link>
            )
          )}
          <Link to="/contact" className="mt-3 block rounded-xl bg-red-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-red-700" onClick={() => setMobileOpen(false)}>
            Contact
          </Link>
        </div>
      )}
    </header>
  )
}
