import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Play, Pause, Download, ArrowLeft, Loader2, AlertCircle, CheckCircle2,
  Power, Trash2, Sparkles, Volume2, ChevronRight, AudioWaveform, Sliders,
} from 'lucide-react';
import {
  decodeAudioFile, encodeWAV, encodeMP3, computeWaveform,
  formatTime, getFileNameWithoutExt, isAudioLikeFile,
  FX_DEFS, FX_CATEGORIES, FX_PRESETS,
  fxNodeFromPresetNode, makeFxNode, applyFxNode, renderFxChain,
} from '../utils/audio';
import { bus } from '../utils/bus';
import SkeuomorphicKnob from './SkeuomorphicKnob';

const CATEGORY_ICONS = {
  Dynamics: Volume2,
  Filter: Sliders,
  Time: ChevronRight,
  Space: Sparkles,
  Modulation: AudioWaveform,
  Distortion: Power,
  Utility: Sparkles,
};

const CATEGORY_COLORS = {
  Dynamics: '#22d3ee',
  Filter: '#d4af37',
  Time: '#8b5cf6',
  Space: '#f43f5e',
  Modulation: '#a78bfa',
  Distortion: '#fbbf24',
  Utility: '#71717a',
};

const FxIT = ({ onBack }) => {
  const [file, setFile] = useState(null);
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [wave, setWave] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [chain, setChain] = useState([]);
  const [activeNodeId, setActiveNodeId] = useState(null);
  const [activeCategory, setActiveCategory] = useState('Dynamics');
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isRenderingPreview, setIsRenderingPreview] = useState(false);
  const [previewPosition, setPreviewPosition] = useState(0);
  const [resultBlob, setResultBlob] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  const [exportFormat, setExportFormat] = useState('wav');
  const [history, setHistory] = useState([]);

  const fileInputRef = useRef(null);
  const ctxRef = useRef(null);
  const previewSourceRef = useRef(null);
  const previewStartedAtRef = useRef(0);
  const previewOffsetRef = useRef(0);
  const animFrameRef = useRef(null);
  const previewBufRef = useRef(null);
  const previewUrlRef = useRef(null);

  const renderBufferToWavUrl = async (buf) => {
    const blob = encodeWAV(buf);
    return URL.createObjectURL(blob);
  };

  useEffect(() => {
    const off = bus.on('fxit:loadRegion', async (payload) => {
      try {
        setError(null);
        setFile({ name: payload.fileName || 'region.wav' });
        setAudioBuffer(payload.buffer);
        const w = computeWaveform(payload.buffer, 600);
        setWave(w);
        const url = await renderBufferToWavUrl(payload.buffer);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(url);
        setChain([]);
        setHistory([]);
        setResultBlob(null);
        if (resultUrl) URL.revokeObjectURL(resultUrl);
        setResultUrl(null);
      } catch (e) {
        console.error(e);
        setError('Could not load region: ' + e.message);
      }
    });
    return off;
  }, [previewUrl, resultUrl]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    if (ctxRef.current) ctxRef.current.close();
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFile = useCallback(async (f) => {
    if (!isAudioLikeFile(f)) {
      setError('Unsupported file. Drop an audio or video file.');
      return;
    }
    setError(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultBlob(null);
    setResultUrl(null);
    setChain([]);
    setHistory([]);
    setFile(f);
    try {
      const { audioBuffer: buf } = await decodeAudioFile(f);
      setAudioBuffer(buf);
      setWave(computeWaveform(buf, 600));
      setPreviewUrl(URL.createObjectURL(f));
    } catch (err) {
      setError('Could not decode file: ' + (err.message || ''));
    }
  }, [previewUrl, resultUrl]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const ensureCtx = () => {
    if (ctxRef.current) return ctxRef.current;
    ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    return ctxRef.current;
  };

  const addToHistory = (prevChain) => {
    setHistory(h => [...h.slice(-49), prevChain]);
  };

  const updateNode = (id, updater) => {
    setChain(c => {
      const next = c.map(n => n.id === id ? { ...n, ...updater(n) } : n);
      return next;
    });
  };

  const setNodeParam = (id, key, value) => {
    addToHistory(chain);
    updateNode(id, (n) => ({ params: { ...n.params, [key]: value } }));
  };

  const toggleNode = (id) => {
    addToHistory(chain);
    setChain(c => c.map(n => n.id === id ? { ...n, enabled: !n.enabled } : n));
  };

  const removeNode = (id) => {
    addToHistory(chain);
    setChain(c => c.filter(n => n.id !== id));
    if (activeNodeId === id) setActiveNodeId(null);
  };

  const moveNode = (id, dir) => {
    addToHistory(chain);
    setChain(c => {
      const idx = c.findIndex(n => n.id === id);
      if (idx < 0) return c;
      const ni = idx + dir;
      if (ni < 0 || ni >= c.length) return c;
      const next = c.slice();
      const [it] = next.splice(idx, 1);
      next.splice(ni, 0, it);
      return next;
    });
  };

  const applyPreset = (presetId) => {
    const preset = FX_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    addToHistory(chain);
    const newChain = preset.chain.map(p => fxNodeFromPresetNode(p));
    setChain(newChain);
    setActiveNodeId(newChain[0]?.id || null);
  };

  const addEffect = (type) => {
    addToHistory(chain);
    const node = makeFxNode(type);
    if (!node) return;
    setChain(c => [...c, node]);
    setActiveNodeId(node.id);
  };

  const undo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    setChain(last);
  };

  const stopPreview = useCallback(() => {
    if (previewSourceRef.current) {
      try { previewSourceRef.current.stop(); } catch { /* already stopped */ }
      previewSourceRef.current = null;
    }
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setIsPreviewing(false);
  }, []);

  const previewFxApplied = useCallback(async () => {
    if (!audioBuffer) return;
    stopPreview();
    setIsRenderingPreview(true);
    try {
      const rendered = await renderFxChain(audioBuffer, chain.map(applyFxNode));
      previewBufRef.current = rendered;
      const url = await renderBufferToWavUrl(rendered);
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = url;

      const ctx = ensureCtx();
      if (ctx.state === 'suspended') await ctx.resume();
      const src = ctx.createBufferSource();
      src.buffer = rendered;
      const gain = ctx.createGain();
      gain.gain.value = 0.9;
      src.connect(gain).connect(ctx.destination);
      previewSourceRef.current = src;
      previewStartedAtRef.current = ctx.currentTime;
      previewOffsetRef.current = 0;
      setPreviewPosition(0);
      setIsPreviewing(true);
      src.start(0);
      const tickFn = () => {
        if (!previewSourceRef.current) return;
        const t = (ctx.currentTime - previewStartedAtRef.current) + previewOffsetRef.current;
        if (t >= rendered.duration) {
          stopPreview();
          return;
        }
        setPreviewPosition(t);
        animFrameRef.current = requestAnimationFrame(tickFn);
      };
      animFrameRef.current = requestAnimationFrame(tickFn);
    } catch (e) {
      console.error(e);
      setError('Preview render failed: ' + e.message);
    } finally {
      setIsRenderingPreview(false);
    }
  }, [audioBuffer, chain, stopPreview]);

  const previewDry = useCallback(() => {
    if (!audioBuffer) return;
    stopPreview();
    const ctx = ensureCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const src = ctx.createBufferSource();
    src.buffer = audioBuffer;
    const gain = ctx.createGain();
    gain.gain.value = 0.9;
    src.connect(gain).connect(ctx.destination);
    previewSourceRef.current = src;
    previewStartedAtRef.current = ctx.currentTime;
    previewOffsetRef.current = 0;
    setPreviewPosition(0);
    setIsPreviewing(true);
    src.start(0);
    const tickFn = () => {
      if (!previewSourceRef.current) return;
      const t = (ctx.currentTime - previewStartedAtRef.current) + previewOffsetRef.current;
      if (t >= audioBuffer.duration) { stopPreview(); return; }
      setPreviewPosition(t);
      animFrameRef.current = requestAnimationFrame(tickFn);
    };
    animFrameRef.current = requestAnimationFrame(tickFn);
  }, [audioBuffer, stopPreview]);

  const applyAndDownload = useCallback(async () => {
    if (!audioBuffer) return;
    setIsProcessing(true);
    setError(null);
    stopPreview();
    try {
      const rendered = await renderFxChain(audioBuffer, chain.map(applyFxNode));
      const blob = exportFormat === 'wav'
        ? encodeWAV(rendered)
        : await encodeMP3(rendered, 192);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      const url = URL.createObjectURL(blob);
      setResultBlob(blob);
      setResultUrl(url);
    } catch (e) {
      setError('Export failed: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  }, [audioBuffer, chain, exportFormat, resultUrl, stopPreview]);

  const downloadResult = () => {
    if (!resultBlob) return;
    const ext = exportFormat === 'wav' ? '.wav' : '.mp3';
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = getFileNameWithoutExt(file?.name || 'audio') + '_fx' + ext;
    a.click();
  };

  const activeNode = chain.find(n => n.id === activeNodeId);
  const activeDef = activeNode ? FX_DEFS[activeNode.type] : null;

  if (resultBlob) {
    const ext = exportFormat.toUpperCase();
    const sizeMB = (resultBlob.size / (1024 * 1024)).toFixed(2);
    return (
      <div className="max-w-2xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-nodaw-muted hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Tools
        </button>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-strong rounded-3xl p-10 text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight mb-2">FX Rendered</h2>
          <p className="text-nodaw-muted mb-1">{chain.length} effect{chain.length !== 1 ? 's' : ''} in chain</p>
          <p className="text-nodaw-muted mb-6">{formatTime(audioBuffer.duration)} • {ext} • {sizeMB} MB</p>
          <audio src={resultUrl} controls className="w-full rounded-xl mb-6" />
          <button onClick={downloadResult} className="px-8 py-4 rounded-2xl bg-gradient-to-r from-nodaw-gold to-nodaw-amber text-nodaw-black font-black text-sm uppercase tracking-widest hover:shadow-lg hover:shadow-nodaw-gold/30 transition-all active:scale-95 inline-flex items-center gap-2">
            <Download className="w-5 h-5" /> Download {ext}
          </button>
          <button onClick={() => { setResultBlob(null); setResultUrl(null); }} className="block mx-auto mt-4 text-sm text-nodaw-muted hover:text-white transition-colors">
            Edit & Re-render
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-nodaw-muted hover:text-white mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Tools
      </button>

      {!audioBuffer ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-3xl p-8 md:p-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-nodaw-rose/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-nodaw-rose" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">FxIT</h2>
              <p className="text-sm text-nodaw-muted">Studio-grade effects. Chain, tweak with skeuomorphic knobs, preview, export.</p>
            </div>
          </div>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-2xl border-2 border-dashed border-nodaw-border p-12 text-center cursor-pointer hover:border-nodaw-rose/30 transition-all"
          >
            <input ref={fileInputRef} type="file" accept="audio/*,video/mp4,video/quicktime,.mp3,.wav,.m4a,.mp4" className="hidden" onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])} />
            <Upload className="w-10 h-10 mx-auto mb-3 text-nodaw-dim" />
            <p className="text-white font-semibold">Drop audio or video here</p>
            <p className="text-sm text-nodaw-muted mt-1">Or pick a region from TrimIT — it appears here automatically.</p>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_320px] gap-5">
          <div className="fx-rack p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="fx-screw" />
              <span className="text-[10px] font-black uppercase tracking-widest text-nodaw-muted">Categories</span>
              <span className="fx-screw ml-auto" />
            </div>
            <div className="space-y-1">
              {FX_CATEGORIES.map(cat => {
                const Icon = CATEGORY_ICONS[cat];
                const color = CATEGORY_COLORS[cat];
                const active = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                      active ? 'bg-white/5' : 'hover:bg-white/5 text-nodaw-muted'
                    }`}
                    style={active ? { color } : {}}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 mb-3 text-[10px] font-black uppercase tracking-widest text-nodaw-muted">One-Click Presets</div>
            <div className="grid grid-cols-1 gap-1.5">
              {FX_PRESETS.map(p => (
                <button
                  key={p.id}
                  onClick={() => applyPreset(p.id)}
                  className="text-left px-3 py-2 rounded-lg text-xs font-semibold text-nodaw-muted hover:text-white hover:bg-white/5 transition-all flex items-center justify-between"
                >
                  <span>{p.label}</span>
                  <span className="text-[10px] text-nodaw-dim">{p.chain.length || 'clean'}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight">FxIT — Signal Chain</h2>
                  <p className="text-xs text-nodaw-muted">{file?.name} • {formatTime(audioBuffer.duration)} • {audioBuffer.sampleRate}Hz</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={previewDry} disabled={isPreviewing || isRenderingPreview} className="tool-btn" title="Play dry">
                    <Play className="w-4 h-4" /><span className="tooltip">Dry (Bypass)</span>
                  </button>
                  <button onClick={previewFxApplied} disabled={isRenderingPreview} className="tool-btn active cyan" title="Preview with FX">
                    {isRenderingPreview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span className="tooltip">{isRenderingPreview ? 'Rendering...' : 'Preview FX'}</span>
                  </button>
                  <button onClick={stopPreview} disabled={!isPreviewing} className="tool-btn" title="Stop">
                    <Pause className="w-4 h-4" /><span className="tooltip">Stop</span>
                  </button>
                </div>
              </div>

              <div className="wave-host h-28 mb-3">
                {wave && <WavePreview wave={wave} duration={audioBuffer.duration} position={previewPosition} isPlaying={isPreviewing} />}
              </div>

              <div className="flex items-center justify-between text-xs text-nodaw-muted font-mono">
                <span>{formatTime(previewPosition)}</span>
                <span>{isPreviewing ? 'PLAYING' : (isRenderingPreview ? 'RENDERING FX' : 'READY')}</span>
                <span>{formatTime(audioBuffer.duration)}</span>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
                <div className="text-xs text-nodaw-muted flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-nodaw-rose" />
                  Chain has {chain.length} node{chain.length !== 1 ? 's' : ''}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={undo} disabled={history.length === 0} className="tool-btn" title="Undo">
                    <Sparkles className="w-4 h-4" /><span className="tooltip">Undo</span>
                  </button>
                  <div className="flex gap-1">
                    {['wav', 'mp3'].map(f => (
                      <button key={f} onClick={() => setExportFormat(f)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${exportFormat === f ? 'bg-nodaw-rose text-nodaw-black' : 'glass text-nodaw-muted hover:text-white'}`}>
                        {f.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  <button onClick={applyAndDownload} disabled={isProcessing} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-nodaw-rose to-nodaw-gold text-nodaw-black font-black text-sm uppercase tracking-widest hover:shadow-lg hover:shadow-nodaw-rose/30 transition-all active:scale-95 disabled:opacity-50 inline-flex items-center gap-2">
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Apply & Export
                  </button>
                </div>
              </div>
            </motion.div>

            <div className="fx-rack p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-nodaw-muted">{activeCategory} Effects</span>
                <span className="text-[10px] text-nodaw-dim">Click to add</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.values(FX_DEFS)
                  .filter(d => d.category === activeCategory)
                  .map(d => (
                    <button
                      key={d.id}
                      onClick={() => addEffect(d.id)}
                      className="px-3 py-2 rounded-lg text-xs font-semibold glass text-nodaw-muted hover:text-white transition-all"
                      style={{ borderColor: `${CATEGORY_COLORS[d.category]}30` }}
                    >
                      {d.label}
                    </button>
                  ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="fx-rack p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-nodaw-muted">Chain</span>
                <span className="text-[10px] text-nodaw-dim">{chain.length} node{chain.length !== 1 ? 's' : ''}</span>
              </div>
              {chain.length === 0 ? (
                <p className="text-xs text-nodaw-dim py-8 text-center">No effects. Pick a preset or click a category effect.</p>
              ) : (
                <div className="space-y-2">
                  {chain.map((node, i) => {
                    const def = FX_DEFS[node.type];
                    const color = CATEGORY_COLORS[def.category];
                    const active = activeNodeId === node.id;
                    return (
                      <motion.div
                        layout
                        key={node.id}
                        onClick={() => setActiveNodeId(node.id)}
                        className={`fx-module p-3 cursor-pointer ${active ? 'ring-1' : ''}`}
                        style={{ color, ['--tw-ring-color']: active ? color : 'transparent' }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] font-mono text-nodaw-dim">#{i + 1}</span>
                            <span className="text-sm font-bold text-white truncate">{def.label}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={(e) => { e.stopPropagation(); moveNode(node.id, -1); }} className="p-1 text-nodaw-dim hover:text-white" title="Move up">↑</button>
                            <button onClick={(e) => { e.stopPropagation(); moveNode(node.id, 1); }} className="p-1 text-nodaw-dim hover:text-white" title="Move down">↓</button>
                            <button onClick={(e) => { e.stopPropagation(); toggleNode(node.id); }} className={`p-1 ${node.enabled ? '' : 'opacity-40'}`} style={{ color: node.enabled ? color : '#666' }} title={node.enabled ? 'Bypass' : 'Enable'}>
                              <Power className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); removeNode(node.id); }} className="p-1 text-nodaw-dim hover:text-nodaw-rose" title="Remove">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            <AnimatePresence mode="wait">
              {activeNode && activeDef ? (
                <motion.div
                  key={activeNode.id}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                  className="fx-rack p-4"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className="fx-screw" />
                    <span className="text-xs font-black uppercase tracking-widest text-white">{activeDef.label}</span>
                    <div className="fx-screw ml-auto" />
                  </div>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-2 justify-items-center">
                    {activeDef.params.map(p => (
                      <SkeuomorphicKnob
                        key={p.id}
                        param={p}
                        value={activeNode.params[p.id] ?? p.default}
                        onChange={(v) => setNodeParam(activeNode.id, p.id, v)}
                        color={CATEGORY_COLORS[activeDef.category]}
                        disabled={!activeNode.enabled}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => { updateNode(activeNode.id, () => ({ params: { ...activeDef.defaults } })); }}
                    className="mt-4 text-[10px] uppercase tracking-widest text-nodaw-dim hover:text-white"
                  >
                    Reset to defaults
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fx-rack p-6 text-center"
                >
                  <Sliders className="w-8 h-8 text-nodaw-dim mx-auto mb-2" />
                  <p className="text-xs text-nodaw-muted">Select a node in the chain to tweak its knobs.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}
    </div>
  );
};

const WavePreview = ({ wave, duration, position, isPlaying }) => {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = c.getBoundingClientRect();
    c.width = rect.width * dpr;
    c.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const w = rect.width, h = rect.height;
    const midY = h / 2;
    ctx.fillStyle = '#06060a';
    ctx.fillRect(0, 0, w, h);
    const step = w / wave.length;
    for (let i = 0; i < wave.length; i++) {
      const p = wave[i];
      const x = i * step;
      const yMax = midY - p.max * (h / 2) * 0.82;
      const yMin = midY - p.min * (h / 2) * 0.82;
      ctx.strokeStyle = isPlaying ? '#d4af37' : '#9aa3b2';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, yMax);
      ctx.lineTo(x, yMin);
      ctx.stroke();
    }
    if (position > 0) {
      const px = (position / duration) * w;
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, 0); ctx.lineTo(px, h); ctx.stroke();
    }
  }, [wave, position, duration, isPlaying]);
  return <canvas ref={ref} style={{ width: '100%', height: '100%' }} />;
};

export default FxIT;
