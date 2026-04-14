import { motion } from 'framer-motion'

const FEEDBACK_ITEMS = [
  {
    id: 'fb-1',
    name: 'Maria L.',
    role: 'Salary Loan Client',
    rating: 5,
    comment:
      'Fast processing and very clear requirements. The team guided me from application to approval.',
  },
  {
    id: 'fb-2',
    name: 'John C.',
    role: 'Business Loan Client',
    rating: 5,
    comment:
      'The loan officers explained the terms well and helped me choose the best option for my small business.',
  },
  {
    id: 'fb-3',
    name: 'Anne P.',
    role: 'Personal Loan Client',
    rating: 4,
    comment:
      'Responsive support and smooth follow-up. I appreciated how transparent the process was.',
  },
]

function Stars({ value }) {
  return (
    <div className="flex items-center gap-1" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= value ? 'text-amber-400' : 'text-gray-300'}>
          ★
        </span>
      ))}
    </div>
  )
}

export default function CustomerFeedbackSection() {
  return (
    <section id="customer-feedback" className="border-t border-brand-secondary/25 bg-brand-background py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.45 }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary">Customer Feedback</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-brand-text sm:text-3xl">
            What our borrowers say
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-brand-text/70 sm:text-base">
            Real experiences from clients who trusted Amalgated Lending for personal, salary, and business financing.
          </p>
        </motion.div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEEDBACK_ITEMS.map((item, index) => (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              className="rounded-2xl border border-black/10 bg-white p-5 shadow-[0_8px_22px_rgba(0,0,0,0.06)]"
            >
              <Stars value={item.rating} />
              <p className="mt-3 text-sm leading-relaxed text-brand-text/85">{item.comment}</p>
              <div className="mt-4 border-t border-black/10 pt-3">
                <p className="text-sm font-semibold text-brand-text">{item.name}</p>
                <p className="text-xs text-brand-text/60">{item.role}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}

