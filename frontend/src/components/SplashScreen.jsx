import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function SplashScreen({ onDone }) {
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const startFade = setTimeout(() => setFading(true), 1500)
    const unmount = setTimeout(() => onDone(), 2000)
    return () => {
      clearTimeout(startFade)
      clearTimeout(unmount)
    }
  }, [onDone])

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: fading ? 0 : 1 }}
      transition={{ opacity: { duration: fading ? 0.5 : 0.4, ease: 'easeOut' } }}
      aria-hidden="true"
    >
      <div className="flex flex-col items-center gap-6">
        <motion.div
          className="flex h-28 w-28 items-center justify-center rounded-full border-2 border-[#dc2626] bg-white p-3 sm:h-32 sm:w-32 sm:p-4"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.img
            src="/amalgated-lending-logo.png"
            alt=""
            className="h-full w-full object-contain"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.35 }}
          />
        </motion.div>

        <motion.div
          className="flex flex-col items-center gap-1"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="text-center text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Amalgated Lending
          </h1>
          <motion.div
            className="h-0.5 w-16 rounded-full bg-[#dc2626] sm:w-20"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.35, delay: 0.7 }}
            style={{ transformOrigin: 'center' }}
          />
          <p className="mt-2 text-center text-sm text-white/70">
            Trusted Lending Solutions
          </p>
        </motion.div>
      </div>
    </motion.div>
  )
}
