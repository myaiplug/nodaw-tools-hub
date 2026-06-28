import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AudioWaveform, Scissors, ImagePlus, GitCompare, Sparkles, Mic, Music, ArrowRight, Zap, ExternalLink, Disc3, Waves, Sliders } from 'lucide-react';
import Navigation from './components/Navigation';
import ParticleField from './components/ParticleField';
import SeoHelmet from './components/SeoHelmet';
import AdUnit from './components/AdUnit';
import ConvertIT from './components/ConvertIT';
import TrimIT from './components/TrimIT';
import FxIT from './components/FxIT';
import ImageToICO from './components/ImageToICO';
import TestIT from './components/TestIT';
import VocalIsolator from './components/VocalIsolator';
import KaraokeMaker from './components/KaraokeMaker';
import InstrumentalExtractor from './components/InstrumentalExtractor';
import Enhancer from './components/Enhancer';
import LUFSMeter from './components/LUFSMeter';
import MasteringTool from './components/MasteringTool';
import FAQ from './components/FAQ';

function ToolPage({ children, path, title }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-nodaw-black text-nodaw-text overflow-x-hidden">
      <div className="noise-overlay" />
      <Navigation />
      <SeoHelmet path={path} />
      <main className="pt-24 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <button onClick={() => navigate('/')} className="mb-6 inline-flex items-center gap-2 text-xs text-nodaw-muted hover:text-nodaw-gold font-semibold uppercase tracking-widest transition-colors">
            ← Back to Tools
          </button>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-nodaw-gold/15 flex items-center justify-center flex-shrink-0">
              <Music className="w-5 h-5 text-nodaw-gold" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-white">{title}</h1>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={path} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
              <AdUnit slot="1234567890" />
              <div className="my-6">{children}</div>
              <AdUnit slot="0987654321" />
              <FAQ path={path} />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <FooterCTA />
    </div>
  );
}

const tools = [
  { id: 'convert', icon: AudioWaveform, title: 'ConvertIT', subtitle: 'WAV / MP3 / MP4', description: 'Convert between formats. Extract audio from MP4. Lossless, browser-native.', color: '#d4af37', path: '/convert' },
  { id: 'trim', icon: Scissors, title: 'TrimIT', subtitle: 'Cut - Fade - Reverse', description: 'Waveform editor with select, cut, fade in/out, reverse, and undo/redo.', color: '#22d3ee', path: '/trim' },
  { id: 'fx', icon: Sparkles, title: 'FxIT', subtitle: 'EQ - Reverb - FX', description: 'Studio effects. Skeuomorphic knobs, real-time preview, chain presets.', color: '#f43f5e', path: '/fx' },
  { id: 'vocal-isolator', icon: Mic, title: 'Vocal Isolator', subtitle: 'Extract Vocals', description: 'Isolate vocals from any stereo track using center channel extraction.', color: '#22d3ee', path: '/vocal-isolator' },
  { id: 'karaoke', icon: Disc3, title: 'Karaoke Maker', subtitle: 'Remove Vocals', description: 'Make karaoke tracks. Remove vocals, adjust key and tempo.', color: '#d4af37', path: '/karaoke' },
  { id: 'mastering', icon: Waves, title: 'Mastering Tool', subtitle: 'Polish & Master', description: 'Professional mastering chain: compressor, limiter, EQ, stereo widener.', color: '#8b5cf6', path: '/mastering' },
  { id: 'enhancer', icon: Sliders, title: 'Enhancer', subtitle: 'EQ & Dynamics', description: 'Enhance clarity with multi-band EQ, compression, stereo width, and loudness.', color: '#f59e0b', path: '/enhancer' },
  { id: 'lufs', icon: Waves, title: 'LUFS Meter', subtitle: 'Loudness Analysis', description: 'Measure integrated LUFS, true peak, dynamic range, and crest factor.', color: '#22d3ee', path: '/lufs' },
  { id: 'ab', icon: GitCompare, title: 'TestIT', subtitle: 'A/B compare', description: 'Real-time A/B switching with synced transport and per-track gain.', color: '#8b5cf6', path: '/test' },
  { id: 'ico', icon: ImagePlus, title: 'Image to ICO', subtitle: 'Multi-res', description: 'Generate ICO files with embedded resolutions. Perfect for favicons and apps.', color: '#f43f5e', path: '/ico' },
];

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-nodaw-black text-nodaw-text overflow-x-hidden">
      <div className="noise-overlay" />
      <SeoHelmet path="/" />
      <Navigation />

      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-nodaw-black via-nodaw-dark to-nodaw-black" />
        <ParticleField count={60} />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-nodaw-gold/10 rounded-full blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-nodaw-cyan/8 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: '2s' }} />

        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8">
            <Zap className="w-4 h-4 text-nodaw-gold" />
            <span className="text-xs font-semibold text-nodaw-muted uppercase tracking-widest">Free Creator Tools — Powered by NoDAW</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.4 }} className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] mb-6">
            <span className="block text-white">Create.</span>
            <span className="block text-gradient">Convert.</span>
            <span className="block text-white">Launch.</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }} className="text-lg md:text-xl text-nodaw-muted max-w-2xl mx-auto mb-10 leading-relaxed">
            Ten professional creator tools — convert, trim, effects, vocal isolate, karaoke, mastering, and more. All free, all browser-based.
          </motion.p>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            {[{ value: '10', label: 'Free Tools' }, { value: '0', label: 'Sign-up' }, { value: '<1s', label: 'Processing' }].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl md:text-3xl font-black text-gradient">{stat.value}</div>
                <div className="text-xs text-nodaw-muted uppercase tracking-widest mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-nodaw-black via-nodaw-dark to-nodaw-black" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-nodaw-gold/20 to-transparent" />
        <AdUnit slot="home_mid" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 mt-8">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter mb-4">
              Choose Your Tool.
              <br />
              <span className="text-gradient">Start Creating.</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {tools.map((tool, i) => {
              const Icon = tool.icon;
              return (
                <motion.button key={tool.id} initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: i * 0.08 }} onClick={() => navigate(tool.path)} className="group relative text-left">
                  <div className="rounded-3xl p-8 glass hover:bg-white/[0.04] transition-all duration-500 h-full border border-nodaw-border hover:border-white/10">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500" style={{ background: `${tool.color}15` }}>
                      <Icon className="w-7 h-7" style={{ color: tool.color }} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest" style={{ color: tool.color }}>{tool.subtitle}</span>
                    <h3 className="text-2xl font-black text-white mt-1 tracking-tight mb-3">{tool.title}</h3>
                    <p className="text-sm text-nodaw-muted leading-relaxed mb-6">{tool.description}</p>
                    <span className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: tool.color }}>
                      Launch Tool <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </section>

      <NoDAWFunnel />
      <FooterCTA />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/convert" element={<ToolPage path="/convert" title="ConvertIT"><ConvertIT onBack={() => window.history.back()} /></ToolPage>} />
      <Route path="/trim" element={<ToolPage path="/trim" title="TrimIT"><TrimIT onBack={() => window.history.back()} onSendToFx={() => {}} /></ToolPage>} />
      <Route path="/fx" element={<ToolPage path="/fx" title="FxIT"><FxIT onBack={() => window.history.back()} /></ToolPage>} />
      <Route path="/test" element={<ToolPage path="/test" title="TestIT"><TestIT onBack={() => window.history.back()} /></ToolPage>} />
      <Route path="/ico" element={<ToolPage path="/ico" title="Image to ICO"><ImageToICO onBack={() => window.history.back()} /></ToolPage>} />
      <Route path="/vocal-isolator" element={<ToolPage path="/vocal-isolator" title="Vocal Isolator"><VocalIsolator /></ToolPage>} />
      <Route path="/karaoke" element={<ToolPage path="/karaoke" title="Karaoke Maker"><KaraokeMaker /></ToolPage>} />
      <Route path="/instrumental" element={<ToolPage path="/instrumental" title="Instrumental Extractor"><InstrumentalExtractor /></ToolPage>} />
      <Route path="/enhancer" element={<ToolPage path="/enhancer" title="Audio Enhancer"><Enhancer /></ToolPage>} />
      <Route path="/lufs" element={<ToolPage path="/lufs" title="LUFS Meter"><LUFSMeter /></ToolPage>} />
      <Route path="/mastering" element={<ToolPage path="/mastering" title="Mastering Tool"><MasteringTool /></ToolPage>} />
    </Routes>
  );
}

const NoDAWFunnel = () => (
  <section className="relative py-32 overflow-hidden">
    <div className="absolute inset-0 bg-nodaw-dark" />
    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-nodaw-gold/30 to-transparent" />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-nodaw-gold/5 rounded-full blur-[200px]" />

    <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
      <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter mb-6">
          Ready for the
          <br />
          <span className="text-gradient">Full Studio?</span>
        </h2>
        <p className="text-nodaw-muted text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          These free tools are just the beginning. NoDAW is a complete DAW-less production ecosystem — CLI-first, one-time purchase, zero subscriptions.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="https://nodaw.studio" target="_blank" rel="noopener noreferrer" className="group px-8 py-4 rounded-2xl bg-gradient-to-r from-nodaw-gold to-nodaw-amber text-nodaw-black font-black text-sm uppercase tracking-widest hover:shadow-2xl hover:shadow-nodaw-gold/30 transition-all active:scale-95 inline-flex items-center gap-2">
            Explore NoDAW Studio
            <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </div>
      </motion.div>
    </div>
  </section>
);

const FooterCTA = () => (
  <footer className="relative py-12 border-t border-nodaw-border">
    <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-nodaw-gold to-nodaw-amber flex items-center justify-center">
          <Zap className="w-3 h-3 text-nodaw-black" />
        </div>
        <span className="text-sm font-black tracking-tighter uppercase italic text-white">No<span className="text-gradient">DAW</span></span>
      </div>
      <p className="text-xs text-nodaw-dim">&copy; {new Date().getFullYear()} NoDAW Studio. All rights reserved.</p>
    </div>
  </footer>
);
