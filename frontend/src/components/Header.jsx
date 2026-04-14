import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const scrollToSection = (id) => {
    const el = document.getElementById(id)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const goToSection = (id) => {
    if (location.pathname === '/') {
      scrollToSection(id)
      return
    }
    navigate('/')
    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 120)
  }

  const goHome = () => {
    if (location.pathname === '/') {
      scrollToSection('hero')
      return
    }
    navigate('/')
    window.setTimeout(() => {
      document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 120)
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-brand-secondary/60 bg-brand-background-alt/95 backdrop-blur-md">
      <div className="app-container flex items-center justify-between gap-2 py-3 sm:py-4">
        <button
          type="button"
          onClick={goHome}
          className="flex shrink-0 items-center gap-3 transition hover:opacity-90 text-left"
        >
          <img src="/amalgated-lending-logo.png" alt="Amalgated Lending" className="h-11 w-11 object-contain sm:h-12 sm:w-12" />
          <span className="hidden flex-col leading-tight sm:flex sm:flex-col">
            <span className="text-sm font-semibold tracking-wide text-brand-text">Amalgated Lending</span>
            <span className="text-xs text-brand-text/70">Trusted Lending Solutions</span>
          </span>
        </button>

        <nav className="hidden items-center gap-5 xl:gap-6 text-sm font-medium text-brand-text lg:flex">
          <button type="button" onClick={goHome} className="nav-link">Home</button>
          <button type="button" onClick={() => goToSection('newsletter')} className="nav-link">News</button>
          <Link to="/loan-products" className="nav-link">Loan Products</Link>
          <Link to="/features" className="nav-link">Features</Link>
          <Link to="/branches" className="nav-link">Branches</Link>
          <Link to="/borrower/login" className="nav-link">Borrower Log in</Link>
          <Link
            to="/contact"
            className="inline-flex items-center justify-center rounded-full bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white shadow-brand-primary transition hover:bg-brand-primary-hover hover:shadow-[0_4px_12px_rgba(220,38,38,0.4)]"
          >
            Contact
          </Link>
        </nav>

        <button
          type="button"
          className="flex h-11 min-w-[44px] items-center justify-center rounded-lg text-brand-text hover:bg-black/10 lg:hidden"
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
        <div className="border-t border-brand-secondary/40 px-4 py-4 lg:hidden">
          <button type="button" className="block w-full rounded-lg px-3 py-2.5 text-left text-brand-text hover:bg-brand-primary/10 hover:text-brand-primary" onClick={() => { goHome(); setMobileOpen(false) }}>Home</button>
          <button type="button" className="block w-full rounded-lg px-3 py-2.5 text-left text-brand-text hover:bg-brand-primary/10 hover:text-brand-primary" onClick={() => { goToSection('newsletter'); setMobileOpen(false) }}>News &amp; Announcements</button>
          <Link to="/loan-products" className="block w-full rounded-lg px-3 py-2.5 text-left text-brand-text hover:bg-brand-primary/10 hover:text-brand-primary" onClick={() => setMobileOpen(false)}>Loan Products</Link>
          <Link to="/features" className="block w-full rounded-lg px-3 py-2.5 text-left text-brand-text hover:bg-brand-primary/10 hover:text-brand-primary" onClick={() => setMobileOpen(false)}>Features</Link>
          <Link to="/branches" className="block w-full rounded-lg px-3 py-2.5 text-left text-brand-text hover:bg-brand-primary/10 hover:text-brand-primary" onClick={() => setMobileOpen(false)}>Branches</Link>
          <Link to="/borrower/login" className="block w-full rounded-lg px-3 py-2.5 text-left text-brand-text hover:bg-brand-primary/10 hover:text-brand-primary" onClick={() => setMobileOpen(false)}>Borrower Log in</Link>
          <Link to="/contact" className="mt-3 block w-full rounded-xl bg-brand-primary px-4 py-3 text-center text-sm font-semibold text-white" onClick={() => setMobileOpen(false)}>Contact</Link>
        </div>
      )}
    </header>
  )
}
