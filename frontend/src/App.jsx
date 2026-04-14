import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { gsap } from 'gsap'
import './App.css'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import NewsletterSection from './components/NewsletterSection.jsx'
import CustomerFeedbackSection from './components/CustomerFeedbackSection.jsx'

const AMALGATED_HOLDINGS_URL = import.meta.env.VITE_AMALGATED_HOLDINGS_URL || 'http://amalgatedholdings.com'

function App() {
  const heroRef = useRef(null)

  const sectionVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: (index) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        delay: 0.12 * index,
        ease: [0.22, 1, 0.36, 1],
      },
    }),
  }

  useEffect(() => {
    const ctx = gsap.context(() => {
      const words = heroRef.current?.querySelectorAll('.hero-word')
      if (words?.length) {
        gsap.set(words, { yPercent: 110 })
        gsap.to(words, {
          yPercent: 0,
          duration: 0.8,
          stagger: 0.06,
          ease: 'power4.out',
          force3D: true,
          delay: 0.15,
        })
      }

      const afterTitle = heroRef.current?.querySelectorAll('.hero-after-title')
      if (afterTitle?.length) {
        gsap.set(afterTitle, { y: 30, opacity: 0 })
        gsap.to(afterTitle, {
          y: 0,
          opacity: 1,
          duration: 0.7,
          stagger: 0.1,
          ease: 'power3.out',
          force3D: true,
          delay: 0.6,
        })
      }
    }, heroRef)
    return () => ctx.revert()
  }, [])

  return (
    <div className="min-h-screen bg-brand-background-alt text-brand-text">
      <div className="relative flex min-h-screen flex-col">
        <Header />

        <main className="flex-1">
          <motion.section
            id="hero"
            className="relative overflow-hidden bg-brand-dark py-20 text-white sm:py-28 lg:py-36"
            initial="visible"
            animate="visible"
          >
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(220,38,38,0.2)_0%,transparent_50%)]" aria-hidden />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-brand-primary/50" aria-hidden />
            <div ref={heroRef} className="relative mx-auto min-w-0 max-w-7xl grid gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] items-center">
              <div className="space-y-0">
                <p className="hero-after-title text-xs font-semibold uppercase tracking-[0.2em] text-red-200">
                  Trusted lending in the Philippines
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl" style={{ clipPath: 'inset(0 0 0 0)' }}>
                  {'Personal, Business, Salary,'.split(' ').map((word, i) => (
                    <span key={i} className="hero-word inline-block will-change-transform" style={{ display: 'inline-block' }}>
                      {word}&nbsp;
                    </span>
                  ))}
                  <span className="text-brand-primary" style={{ clipPath: 'inset(0 0 0 0)' }}>
                    {'Retail & Asset financing.'.split(' ').map((word, i) => (
                      <span key={`r-${i}`} className="hero-word inline-block will-change-transform" style={{ display: 'inline-block' }}>
                        {word}&nbsp;
                      </span>
                    ))}
                  </span>
                </h1>
                <p className="hero-after-title mt-4 max-w-2xl text-lg leading-relaxed text-white/85">
                  Amalgated Lending Inc. (ALI) — accessible lending solutions for individuals and businesses across the Philippines. We care for our Partners, Employees, Tenants and Suppliers by providing services that exceed expectations.
                </p>
                <div className="hero-after-title mt-8 flex flex-wrap items-center gap-4">
                  <Link
                    to="/loan-products"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white shadow-brand-primary transition hover:bg-brand-primary-hover hover:shadow-[0_4px_12px_rgba(220,38,38,0.4)]"
                  >
                    Explore loan products
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </Link>
                  <Link
                    to="/apply"
                    className="hero-after-title inline-flex items-center text-sm font-semibold text-white/90 transition hover:text-white"
                  >
                    Apply now
                    <span className="ml-2 h-px w-6 bg-white/50" />
                  </Link>
                </div>
                <dl className="hero-after-title mt-10 grid max-w-2xl grid-cols-1 gap-6 border-t border-white/10 pt-8 text-sm text-white/80 sm:grid-cols-3">
                  <div className="min-w-0">
                    <dt className="text-xs uppercase tracking-[0.18em] text-white/60">Branches</dt>
                    <dd className="mt-2 text-xl font-semibold text-white sm:text-2xl">8+ nationwide</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs uppercase tracking-[0.18em] text-white/60">Established</dt>
                    <dd className="mt-2 text-xl font-semibold text-white sm:text-2xl">2015</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs uppercase tracking-[0.18em] text-white/60">Coverage</dt>
                    <dd className="mt-2 break-words text-lg font-semibold leading-snug text-white sm:text-2xl">Luzon, Visayas, Mindanao</dd>
                  </div>
                </dl>
              </div>

              <motion.div variants={sectionVariants} custom={0.4} className="relative">
                <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/10 backdrop-blur-xl p-5 sm:p-7 lg:p-8">
                  <div className="absolute inset-x-[-40%] top-[-35%] h-56 rounded-[3rem] bg-brand-primary/20 blur-3xl" />

                  <div className="relative space-y-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.26em] text-white/60">
                          Loan application snapshot
                        </p>
                        <p className="text-sm font-semibold text-white">
                          Fast approval process
                        </p>
                      </div>
                      <span className="rounded-full bg-brand-primary/20 px-3 py-1 text-[11px] font-medium text-red-200 ring-1 ring-brand-primary/40">
                        In progress
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
                      <div className="rounded-2xl bg-white/10 p-3">
                        <p className="text-[11px] text-white/60">Personal Loans</p>
                        <p className="mt-1 text-lg font-semibold text-brand-primary">85%</p>
                        <p className="mt-1 text-[11px] text-white/60">
                          Emergency, education, medical, travel.
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white/10 p-3">
                        <p className="text-[11px] text-white/60">Business Loans</p>
                        <p className="mt-1 text-lg font-semibold text-white">72%</p>
                        <p className="mt-1 text-[11px] text-white/60">
                          Working capital, equipment, expansion.
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white/10 p-3">
                        <p className="text-[11px] text-white/60">Retail Financing</p>
                        <p className="mt-1 text-lg font-semibold text-white">64%</p>
                        <p className="mt-1 text-[11px] text-white/60">
                          Appliances, furniture, M. Conpinco partner.
                        </p>
                      </div>
                    </div>

                    <div className="mt-2 rounded-2xl bg-white/10 p-3.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-white/80">Next steps in your application</span>
                        <span className="rounded-full bg-white/10 px-2 py-1 text-[11px] text-white/60">This week</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-white/80">Document review</span>
                        <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-white/80">Approval</span>
                        <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-white/80">Disbursement</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.section>

          <CustomerFeedbackSection />
          <NewsletterSection />

          <motion.section
            className="border-t border-brand-secondary/30 bg-brand-background py-16"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5 }}
          >
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <p className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-brand-text/70">Explore</p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link to="/loan-products" className="rounded-full border border-brand-secondary/60 bg-brand-background-alt px-6 py-3 text-sm font-medium text-brand-text transition hover:border-brand-primary hover:bg-brand-primary/10 hover:text-brand-primary">Loan Products</Link>
                <Link to="/features" className="rounded-full border border-brand-secondary/60 bg-brand-background-alt px-6 py-3 text-sm font-medium text-brand-text transition hover:border-brand-primary hover:bg-brand-primary/10 hover:text-brand-primary">Features</Link>
                <Link to="/branches" className="rounded-full border border-brand-secondary/60 bg-brand-background-alt px-6 py-3 text-sm font-medium text-brand-text transition hover:border-brand-primary hover:bg-brand-primary/10 hover:text-brand-primary">Branches</Link>
                <Link to="/apply" className="rounded-full border border-brand-secondary/60 bg-brand-background-alt px-6 py-3 text-sm font-medium text-brand-text transition hover:border-brand-primary hover:bg-brand-primary/10 hover:text-brand-primary">Apply</Link>
                <Link to="/borrower/login" className="rounded-full border border-brand-secondary/60 bg-brand-background-alt px-6 py-3 text-sm font-medium text-brand-text transition hover:border-brand-primary hover:bg-brand-primary/10 hover:text-brand-primary">Borrower Log in</Link>
                <Link to="/contact" className="rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary-hover">Contact</Link>
                <a href={`${AMALGATED_HOLDINGS_URL}`} target="_blank" rel="noreferrer" className="rounded-full border border-brand-secondary/60 bg-brand-background-alt px-6 py-3 text-sm font-medium text-brand-text transition hover:border-brand-primary hover:bg-brand-primary/10 hover:text-brand-primary">Amalgated Holdings</a>
              </div>
            </div>
          </motion.section>
        </main>

        <Footer />
      </div>
    </div>
  )
}

export default App
