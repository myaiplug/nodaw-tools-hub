import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import faqData from '../data/faq.js'

export default function FAQ({ path }) {
  const [openIndex, setOpenIndex] = useState(null)
  const items = faqData[path]
  if (!items || items.length === 0) return null

  return (
    <div className="nd-panel overflow-hidden">
      <div className="nd-titlebar">
        <div className="nd-led" />
        <span className="nd-titlebar-title">FAQ</span>
        <span className="nd-titlebar-status">{items.length} questions</span>
      </div>
      <div className="p-5 space-y-2">
        {items.map((item, i) => {
          const isOpen = openIndex === i
          return (
            <div key={i} className="nd-faq-item">
              <button onClick={() => setOpenIndex(isOpen ? null : i)}
                className="w-full flex items-center justify-between p-3 text-left transition-colors hover:bg-white/[0.02]">
                <span className="nd-faq-question text-[11px]">{item.q}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-[#64748b] flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                    <div className="px-3 pb-3 nd-faq-answer border-t border-white/[0.06] pt-3">{item.a}</div>
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
