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
    <div className="min-h-screen bg-[#000000] text-[#f5f5f5] overflow-x-hidden">
      <div className="noise-overlay" />
      <Navigation />
      <SeoHelmet path={path} />
      <main className="pt-28 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => navigate('/')} className="mb-6 inline-flex items-center gap-2 text-[9px] text-[#64748b] hover:text-[#22d3ee] font-['JetBrains_Mono',monospace] font-bold uppercase tracking-[0.12em] transition-colors">
            ← Back to Tools
          </button>
          <div className="nd-panel overflow-hidden">
            <div className="nd-titlebar">
              <div className="nd-led" />
              <span className="nd-titlebar-title">{title}</span>
            </div>
            <div className="p-5 sm:p-6">
              <AdUnit slot="1234567890" />
              <div className="my-6">{children}</div>
              <AdUnit slot="0987654321" />
              <FAQ path={path} />
            </div>
          </div>
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
    <div className="min-h-screen bg-[#000000] text-[#f5f5f5] overflow-x-hidden">
      <div className="noise-overlay" />
      <SeoHelmet path="/" />
      <Navigation />

      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[#000000]" />
        <ParticleField count={40} />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#22d3ee]/5 rounded-full blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#c8a24a]/5 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: '2s' }} />

        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-white/[0.08] bg-[rgba(0,0,0,0.6)] backdrop-blur-[12px] mb-8">
            <div className="w-[5px] h-[5px] rounded-full bg-[#22d3ee] shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
            <span className="text-[9px] font-['JetBrains_Mono',monospace] font-bold text-[#64748b] uppercase tracking-[0.15em]">Free Creator Tools — Powered by NoDAW</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.4 }} className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-['Rajdhani',sans-serif] font-bold tracking-tighter leading-[0.9] mb-6">
            <span className="block text-white">Create.</span>
            <span className="block text-[#22d3ee]">Convert.</span>
            <span className="block text-white">Launch.</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }} className="text-lg md:text-xl text-[#94a3b8] max-w-2xl mx-auto mb-10 leading-relaxed">
            Ten professional creator tools — convert, trim, effects, vocal isolate, karaoke, mastering, and more. All free, all browser-based.
          </motion.p>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            {[{ value: '10', label: 'Free Tools' }, { value: '0', label: 'Sign-up' }, { value: '<1s', label: 'Processing' }].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-[#22d3ee]">{stat.value}</div>
                <div className="text-[9px] text-[#64748b] font-['JetBrains_Mono',monospace] uppercase tracking-[0.12em] mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-[#000000]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(34,211,238,0.15)] to-transparent" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 mt-8">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-['Rajdhani',sans-serif] font-bold text-white tracking-tighter mb-4">
              Choose Your Tool.
              <br />
              <span className="text-[#22d3ee]">Start Creating.</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {tools.map((tool, i) => {
              const Icon = tool.icon;
              return (
                <motion.button key={tool.id} initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: i * 0.08 }} onClick={() => navigate(tool.path)} className="group relative text-left">
                  <div className="nd-panel p-6 transition-all duration-500 h-full hover:border-[rgba(34,211,238,0.2)]">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: tool.color, boxShadow: `0 0 8px ${tool.color}40` }} />
                      <span className="text-[9px] font-['JetBrains_Mono',monospace] font-bold uppercase tracking-[0.12em] text-[#64748b]">{tool.subtitle}</span>
                    </div>
                    <h3 className="text-xl font-['Rajdhani',sans-serif] font-bold text-white tracking-tight mb-2">{tool.title}</h3>
                    <p className="text-[12px] text-[#94a3b8] leading-relaxed mb-4">{tool.description}</p>
                    <span className="inline-flex items-center gap-2 text-[10px] font-['JetBrains_Mono',monospace] font-bold uppercase tracking-[0.1em]" style={{ color: tool.color }}>
                      Launch <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
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
    <div className="absolute inset-0 bg-[#080a0e]" />
    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(34,211,238,0.2)] to-transparent" />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[rgba(34,211,238,0.04)] rounded-full blur-[200px]" />

    <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
      <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-['Rajdhani',sans-serif] font-bold text-white tracking-tighter mb-6">
          Ready for the
          <br />
          <span className="text-[#22d3ee]">Full Studio?</span>
        </h2>
        <p className="text-[#94a3b8] text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          These free tools are just the beginning. NoDAW is a complete DAW-less production ecosystem — CLI-first, one-time purchase, zero subscriptions.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="https://nodaw.studio" target="_blank" rel="noopener noreferrer" className="nd-btn nd-btn-primary text-[11px] no-underline">
            Explore NoDAW Studio
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </motion.div>
    </div>
  </section>
);

const FooterCTA = () => (
  <footer className="relative py-10 border-t border-white/[0.06]">
    <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-[5px] h-[5px] rounded-full bg-[#22d3ee] shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
        <span className="text-[11px] font-['JetBrains_Mono',monospace] font-bold uppercase tracking-[0.15em] text-white">No<span className="text-[#22d3ee]">DAW</span></span>
      </div>
      <p className="text-[9px] font-['JetBrains_Mono',monospace] text-[#475569]">&copy; {new Date().getFullYear()} NoDAW Studio. All rights reserved.</p>
    </div>
  </footer>
);
