import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

const tools = [
  { id: 'convert', path: '/convert', label: 'Convert' },
  { id: 'trim', path: '/trim', label: 'Trim' },
  { id: 'fx', path: '/fx', label: 'FX' },
  { id: 'vocal-isolator', path: '/vocal-isolator', label: 'Vocals' },
  { id: 'karaoke', path: '/karaoke', label: 'Karaoke' },
  { id: 'mastering', path: '/mastering', label: 'Master' },
  { id: 'lufs', path: '/lufs', label: 'LUFS' },
  { id: 'ico', path: '/ico', label: 'ICO' },
];

const Navigation = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path) => location.pathname === path;
  const isHome = location.pathname === '/';

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'py-2'
            : 'py-4'
        }`}
      >
        <div className={`absolute inset-0 transition-all duration-500 ${
          scrolled
            ? 'bg-[#000000] border-b border-white/[0.06] backdrop-blur-[24px] bg-opacity-85'
            : 'bg-transparent'
        }`} />
        <div className="relative z-10 max-w-7xl mx-auto px-6 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-3 group">
            <div className="flex items-center gap-2">
              <div className="w-[7px] h-[7px] rounded-full bg-[#22d3ee] shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
              <span className="text-sm font-bold tracking-[0.15em] uppercase text-white font-['JetBrains_Mono',monospace]">
                No<span className="text-[#22d3ee]">DAW</span>
              </span>
            </div>
          </button>

          <div className="hidden md:flex items-center gap-1">
            {tools.slice(0, 6).map((tool) => (
              <button
                key={tool.id}
                onClick={() => navigate(tool.path)}
                className={`px-3 py-1.5 text-[10px] font-bold tracking-[0.12em] uppercase font-['JetBrains_Mono',monospace] transition-all rounded ${
                  isActive(tool.path)
                    ? 'text-[#22d3ee] bg-[rgba(34,211,238,0.08)]'
                    : 'text-[#64748b] hover:text-[#e2e8f0]'
                }`}
              >
                {tool.label}
              </button>
            ))}
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-white">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-[#000000] md:hidden">
            <div className="flex flex-col items-center justify-center h-full gap-6">
              <button onClick={() => { navigate('/'); setMobileOpen(false); }} className="text-lg font-bold tracking-[0.12em] uppercase font-['JetBrains_Mono',monospace] text-white hover:text-[#22d3ee] transition-colors">
                Home
              </button>
              {tools.map((tool, i) => (
                <motion.button
                  key={tool.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => { navigate(tool.path); setMobileOpen(false); }}
                  className={`text-lg font-bold tracking-[0.12em] uppercase font-['JetBrains_Mono',monospace] transition-colors ${
                    isActive(tool.path) ? 'text-[#22d3ee]' : 'text-white hover:text-[#22d3ee]'
                  }`}
                >
                  {tool.label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navigation;
