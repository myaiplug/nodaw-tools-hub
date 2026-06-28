import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Zap } from 'lucide-react';

const tools = [
  { id: 'convert', path: '/convert', label: 'Convert', new: false },
  { id: 'trim', path: '/trim', label: 'Trim', new: false },
  { id: 'fx', path: '/fx', label: 'Fx', new: false },
  { id: 'test', path: '/test', label: 'A/B', new: false },
  { id: 'vocal-isolator', path: '/vocal-isolator', label: 'Vocals', new: false },
  { id: 'karaoke', path: '/karaoke', label: 'Karaoke', new: false },
  { id: 'mastering', path: '/mastering', label: 'Master', new: false },
  { id: 'ico', path: '/ico', label: 'ICO', new: false },
];

const Navigation = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <motion.nav initial={{ y: -100 }} animate={{ y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'glass-strong py-3' : 'py-5 bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-nodaw-gold to-nodaw-amber flex items-center justify-center shadow-lg shadow-nodaw-gold/20 group-hover:shadow-nodaw-gold/40 transition-shadow">
              <Zap className="w-5 h-5 text-nodaw-black" />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase italic text-white">
              No<span className="text-gradient">DAW</span>
            </span>
          </button>

          <div className="hidden md:flex items-center gap-1">
            {tools.map((tool) => (
              <button key={tool.id} onClick={() => navigate(tool.path)} className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive(tool.path) ? 'text-nodaw-gold bg-nodaw-gold/10' : 'text-nodaw-muted hover:text-white'
              }`}>
                {tool.label}
              </button>
            ))}
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-white">
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-nodaw-black/95 backdrop-blur-xl md:hidden">
            <div className="flex flex-col items-center justify-center h-full gap-6">
              <button onClick={() => { navigate('/'); setMobileOpen(false); }} className="text-2xl font-bold text-white hover:text-nodaw-gold transition-colors">Home</button>
              {tools.map((tool, i) => (
                <motion.button key={tool.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} onClick={() => { navigate(tool.path); setMobileOpen(false); }} className={`text-2xl font-bold transition-colors ${isActive(tool.path) ? 'text-nodaw-gold' : 'text-white hover:text-nodaw-gold'}`}>
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
