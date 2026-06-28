import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import faqData from '../data/faq.js'

export default function FAQ({ path }) {
  const [openIndex, setOpenIndex] = useState(null)
  const items = faqData[path]
  if (!items || items.length === 0) return null

  return (
    <div className="mt-12">
      <h2 className="text-xl font-black text-white tracking-tighter mb-6">
        Frequently Asked Questions
      </h2>
      <div className="space-y-2">
        {items.map((item, i) => {
          const isOpen = openIndex === i
          return (
            <div key={i} className="fx-module overflow-hidden" style={{ color: '#d4af37' }}>
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left text-sm font-semibold text-nodaw-text hover:text-nodaw-gold transition-colors"
              >
                <span>{item.q}</span>
                <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 text-xs text-nodaw-muted leading-relaxed border-t border-nodaw-border pt-3">
                      {item.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  )
}
