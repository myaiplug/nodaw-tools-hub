import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Play, Pause, Download, ArrowLeft, Loader2, AlertCircle, CheckCircle2,
  RotateCcw, RotateCw, Scissors, SquareDashed, Wand2, Sliders,
  X,
} from 'lucide-react';
import {
  decodeAudioFile, encodeWAV, encodeMP3, computeWaveform,
  trimAudioBuffer, cutAudioBuffer, reverseAudioBuffer,
  applyFadeIn, applyFadeOut, cloneAudioBuffer, formatTime,
  getFileNameWithoutExt, isAudioLikeFile,
} from '../utils/audio';
import { bus } from '../utils/bus';

const TOOLS = [
  { id: 'select', label: 'Select', icon: SquareDashed, kbd: 'V' },
  { id: 'cut',    label: 'Cut',    icon: Scissors,     kbd: 'C' },
  { id: 'fx',     label: 'Send to FX', icon: Wand2,    kbd: 'F' },
  { id: 'fade-in',  label: 'Fade In',  icon: Sliders, kbd: 'I' },
  { id: 'fade-out', label: 'Fade Out', icon: Sliders, kbd: 'O' },
  { id: 'reverse',  label: 'Reverse',  icon: RotateCcw, kbd: 'R' },
];

const drawWave = (canvas, wave, opts) => {
  if (!canvas || !wave) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const w = rect.width, h = rect.height;
  if (w === 0 || h === 0) return;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const midY = h / 2;
  ctx.fillStyle = '#06060a';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 8; i++) {
    const y = (i / 8) * h;
    ctx.beginPath();
    ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(0, midY); ctx.lineTo(w, midY); ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.stroke();

  const step = w / wave.length;
  for (let i = 0; i < wave.length; i++) {
    const p = wave[i];
    const x = i * step;
    const yMax = midY - p.max * (h / 2) * 0.82;
    const yMin = midY - p.min * (h / 2) * 0.82;
    ctx.strokeStyle = '#9aa3b2';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, yMax);
    ctx.lineTo(x, yMin);
    ctx.stroke();
  }

  const { selectionStart, selectionEnd, playhead, fadeIn, fadeOut, cutStart, cutEnd } = opts;
  if (selectionStart != null && selectionEnd != null && selectionStart < selectionEnd) {
    const x1 = (selectionStart / opts.duration) * w;
    const x2 = (selectionEnd / opts.duration) * w;
    ctx.fillStyle = 'rgba(212, 175, 55, 0.14)';
    ctx.fillRect(x1, 0, x2 - x1, h);
  }
  if (cutStart != null && cutEnd != null && cutStart < cutEnd) {
    const x1 = (cutStart / opts.duration) * w;
    const x2 = (cutEnd / opts.duration) * w;
    ctx.fillStyle = 'rgba(244, 63, 94, 0.18)';
    ctx.fillRect(x1, 0, x2 - x1, h);
    ctx.strokeStyle = '#f43f5e';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x1, 0); ctx.lineTo(x1, h);
    ctx.moveTo(x2, 0); ctx.lineTo(x2, h);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  if (fadeIn != null && fadeIn > 0) {
    const x = (fadeIn / opts.duration) * w;
    const grad = ctx.createLinearGradient(0, 0, x, 0);
    grad.addColorStop(0, 'rgba(0,0,0,0.7)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, x, h);
  }
  if (fadeOut != null && fadeOut > 0) {
    const x = ((opts.duration - fadeOut) / opts.duration) * w;
    const grad = ctx.createLinearGradient(x, 0, w, 0);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.7)');
    ctx.fillStyle = grad;
    ctx.fillRect(x, 0, w - x, h);
  }
  if (playhead != null && playhead >= 0) {
    const x = (playhead / opts.duration) * w;
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
};

const useHistory = (initial) => {
  const [stack, setStack] = useState([initial]);
  const [idx, setIdx] = useState(0);
  const push = useCallback((buf) => {
    setStack(s => {
      const trimmed = s.slice(0, idx + 1);
      const next = [...trimmed, buf];
      if (next.length > 50) next.shift();
      return next;
    });
    setIdx(i => Math.min(i + 1, 49));
  }, [idx]);
  const undo = useCallback(() => {
    setIdx(i => Math.max(0, i - 1));
  }, []);
  const redo = useCallback(() => {
    setIdx(i => Math.min(stack.length - 1, i + 1));
  }, [stack.length]);
  const current = stack[idx];
  const canUndo = idx > 0;
  const canRedo = idx < stack.length - 1;
  return { current, push, undo, redo, canUndo, canRedo, reset: (b) => { setStack([b]); setIdx(0); } };
};

const TrimIT = ({ onBack, onSendToFx }) => {
  const [file, setFile] = useState(null);
  const [wave, setWave] = useState(null);
  const [duration, setDuration] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [tool, setTool] = useState('select');
  const [selStart, setSelStart] = useState(null);
  const [selEnd, setSelEnd] = useState(null);
  const [dragMode, setDragMode] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playhead, setPlayhead] = useState(0);
  const [fadeInSec, setFadeInSec] = useState(0);
  const [fadeOutSec, setFadeOutSec] = useState(0);
  const [showFadeInSlider, setShowFadeInSlider] = useState(false);
  const [showFadeOutSlider, setShowFadeOutSlider] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [resultBlob, setResultBlob] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  const [exportFormat, setExportFormat] = useState('wav');

  const hostRef = useRef(null);
  const fileInputRef = useRef(null);
  const audioRef = useRef(null);
  const animFrameRef = useRef(null);
  const playStartedAtRef = useRef(0);
  const playStartOffsetRef = useRef(0);
  const fadeInRef = useRef(0);
  const fadeOutRef = useRef(0);
  useEffect(() => { fadeInRef.current = fadeInSec; }, [fadeInSec]);
  useEffect(() => { fadeOutRef.current = fadeOutSec; }, [fadeOutSec]);

  const history = useHistory(null);

  const draw = useCallback(() => {
    drawWave(hostRef.current?.querySelector('canvas'), wave, {
      duration,
      selectionStart: tool === 'select' ? selStart : null,
      selectionEnd: tool === 'select' ? selEnd : null,
      cutStart: tool === 'cut' ? selStart : null,
      cutEnd: tool === 'cut' ? selEnd : null,
      playhead,
      fadeIn: tool === 'fade-in' || fadeInSec > 0 ? fadeInSec : null,
      fadeOut: tool === 'fade-out' || fadeOutSec > 0 ? fadeOutSec : null,
    });
  }, [wave, duration, tool, selStart, selEnd, playhead, fadeInSec, fadeOutSec]);

  useEffect(() => { draw(); }, [draw]);

  useEffect(() => {
    if (!hostRef.current) return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(hostRef.current);
    return () => ro.disconnect();
  }, [draw]);

  const setBuffer = useCallback((buf, url) => {
    if (!buf) return;
    history.reset(buf);
    const w = computeWaveform(buf, 800);
    setWave(w);
    setDuration(buf.duration);
    setSelStart(null);
    setSelEnd(null);
    setPlayhead(0);
    setFadeInSec(0);
    setFadeOutSec(0);
    if (previewUrl && previewUrl !== url) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(url);
  }, [history, previewUrl]);

  const handleFile = useCallback(async (f) => {
    if (!isAudioLikeFile(f)) {
      setError('Unsupported file. Drop an audio or video file.');
      return;
    }
    setError(null);
    setResultBlob(null);
    setResultUrl(null);
    setFile(f);
    try {
      const { audioBuffer: buf } = await decodeAudioFile(f);
      setBuffer(buf, URL.createObjectURL(f));
    } catch (err) {
      setError('Could not decode file: ' + (err.message || ''));
      console.error(err);
    }
  }, [setBuffer]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const getTimeFromEvent = (e) => {
    if (!hostRef.current || !duration) return 0;
    const rect = hostRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    return (x / rect.width) * duration;
  };

  const onMouseDown = (e) => {
    if (!duration) return;
    e.preventDefault();
    const t = getTimeFromEvent(e);
    if (tool === 'reverse') {
      if (selStart != null && selEnd != null && selEnd > selStart) {
        const cur = history.current;
        if (cur) {
          const a = Math.floor(selStart * cur.sampleRate);
          const b = Math.floor(selEnd * cur.sampleRate);
          const slice = trimAudioBuffer(cur, selStart, selEnd);
          const reversed = reverseAudioBuffer(slice);
          const out = cloneAudioBuffer(cur);
          for (let ch = 0; ch < out.numberOfChannels; ch++) {
            const dst = out.getChannelData(ch);
            const src = reversed.getChannelData(ch);
            for (let i = 0; i < b - a; i++) dst[a + i] = src[i];
          }
          history.push(out);
          const w = computeWaveform(out, 800);
          setWave(w);
        }
      } else {
        const cur = history.current;
        if (cur) {
          const rev = reverseAudioBuffer(cur);
          history.push(rev);
          setWave(computeWaveform(rev, 800));
        }
      }
      return;
    }
    if (tool === 'fade-in' || tool === 'fade-out') {
      return;
    }
    if (tool === 'fx') {
      setSelStart(t);
      setSelEnd(t);
      setDragMode('fx');
      return;
    }
    setSelStart(t);
    setSelEnd(t);
    setDragMode(tool);
  };

  const onMouseMove = (e) => {
    if (!dragMode) return;
    const t = getTimeFromEvent(e);
    setSelEnd(t);
  };

  const onMouseUp = () => {
    if (!dragMode) return;
    const a = Math.min(selStart ?? 0, selEnd ?? 0);
    const b = Math.max(selStart ?? 0, selEnd ?? 0);
    setSelStart(a);
    setSelEnd(b);
    setDragMode(null);

    if (tool === 'cut' && a < b) {
      const cur = history.current;
      if (cur) {
        const out = cutAudioBuffer(cur, a, b);
        history.push(out);
        setWave(computeWaveform(out, 800));
        setDuration(out.duration);
        setSelStart(null); setSelEnd(null);
        setPlayhead(Math.min(playhead, out.duration));
      }
    } else if (tool === 'fx' && a < b) {
      const cur = history.current;
      if (cur) {
        const region = trimAudioBuffer(cur, a, b);
        bus.emit('fxit:loadRegion', {
          buffer: region,
          fileName: file?.name || 'region',
          regionStart: a,
          regionEnd: b,
          fromTool: 'TrimIT',
        });
        if (onSendToFx) onSendToFx();
        setSelStart(null); setSelEnd(null);
      }
    }
  };

  useEffect(() => {
    if (!dragMode) return;
    const move = (e) => onMouseMove(e);
    const up = () => onMouseUp();
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragMode, selStart, selEnd, tool, history, file, playhead]);

  const togglePlay = useCallback(() => {
    if (!history.current) return;
    if (isPlaying) {
      if (audioRef.current) audioRef.current.pause();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      setIsPlaying(false);
      return;
    }
    const startAt = playhead >= duration - 0.05 ? 0 : playhead;
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(previewUrl);
    audio.currentTime = startAt;
    audioRef.current = audio;
    audio.play().then(() => {
      playStartedAtRef.current = performance.now();
      playStartOffsetRef.current = startAt;
      setIsPlaying(true);
      const update = () => {
        const elapsed = (performance.now() - playStartedAtRef.current) / 1000;
        const t = playStartOffsetRef.current + elapsed;
        if (t >= duration || audio.paused) {
          audio.pause();
          setIsPlaying(false);
          setPlayhead(duration);
          return;
        }
        setPlayhead(t);
        animFrameRef.current = requestAnimationFrame(update);
      };
      animFrameRef.current = requestAnimationFrame(update);
    }).catch((e) => {
      console.warn('Audio play blocked:', e);
      setIsPlaying(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history.current, isPlaying, playhead, duration, previewUrl]);

  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioRef.current) audioRef.current.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
      else if (e.key === 'z' && (e.metaKey || e.ctrlKey) && e.shiftKey) { e.preventDefault(); history.redo(); }
      else if (e.key === 'z' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); history.undo(); }
      else if (e.key === 'v' || e.key === 'V') setTool('select');
      else if (e.key === 'c' || e.key === 'C') setTool('cut');
      else if (e.key === 'f' || e.key === 'F') setTool('fx');
      else if (e.key === 'i' || e.key === 'I') { setTool('fade-in'); setShowFadeInSlider(true); }
      else if (e.key === 'o' || e.key === 'O') { setTool('fade-out'); setShowFadeOutSlider(true); }
      else if (e.key === 'r' || e.key === 'R') setTool('reverse');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePlay, history]);

  const commitFadeIn = useCallback(() => {
    if (!history.current) return;
    const out = applyFadeIn(history.current, fadeInSec);
    history.push(out);
    setWave(computeWaveform(out, 800));
    setShowFadeInSlider(false);
  }, [history, fadeInSec]);

  const commitFadeOut = useCallback(() => {
    if (!history.current) return;
    const out = applyFadeOut(history.current, fadeOutSec);
    history.push(out);
    setWave(computeWaveform(out, 800));
    setShowFadeOutSlider(false);
  }, [history, fadeOutSec]);

  const exportResult = useCallback(async () => {
    if (!history.current) return;
    setIsProcessing(true);
    setError(null);
    try {
      const blob = exportFormat === 'wav'
        ? encodeWAV(history.current)
        : await encodeMP3(history.current, 192);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      const url = URL.createObjectURL(blob);
      setResultBlob(blob);
      setResultUrl(url);
    } catch (err) {
      setError('Export failed: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history.current, exportFormat, resultUrl]);

  const downloadResult = () => {
    if (!resultBlob) return;
    const ext = exportFormat === 'wav' ? '.wav' : '.mp3';
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = getFileNameWithoutExt(file?.name || 'audio') + '_trimmed' + ext;
    a.click();
  };

  const resetAll = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null);
    setWave(null);
    setDuration(0);
    setSelStart(null); setSelEnd(null);
    setPlayhead(0); setIsPlaying(false);
    setFadeInSec(0); setFadeOutSec(0);
    setResultBlob(null); setResultUrl(null);
    history.reset(null);
  };

  const hostClass = useMemo(() => {
    if (tool === 'select') return 'wave-mode-select';
    if (tool === 'cut') return 'wave-mode-cut';
    if (tool === 'fx') return 'wave-mode-fx';
    return '';
  }, [tool]);

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
          <h2 className="text-3xl font-black text-white tracking-tight mb-2">Exported</h2>
          <p className="text-nodaw-muted mb-6">{formatTime(duration)} • {ext} • {sizeMB} MB</p>
          <audio src={resultUrl} controls className="w-full rounded-xl mb-6" />
          <button onClick={downloadResult} className="px-8 py-4 rounded-2xl bg-gradient-to-r from-nodaw-gold to-nodaw-amber text-nodaw-black font-black text-sm uppercase tracking-widest hover:shadow-lg hover:shadow-nodaw-gold/30 transition-all active:scale-95 inline-flex items-center gap-2">
            <Download className="w-5 h-5" /> Download {ext}
          </button>
          <button onClick={() => { setResultBlob(null); setResultUrl(null); }} className="block mx-auto mt-4 text-sm text-nodaw-muted hover:text-white transition-colors">
            Edit & Re-export
          </button>
        </motion.div>
      </div>
    );
  }

  const currentBuf = history.current;

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-nodaw-muted hover:text-white mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Tools
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-3xl p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-nodaw-cyan/10 flex items-center justify-center">
              <Scissors className="w-6 h-6 text-nodaw-cyan" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">TrimIT</h2>
              <p className="text-sm text-nodaw-muted">Cut, fade, reverse. Send a region straight into FxIT.</p>
            </div>
          </div>
          {currentBuf && (
            <div className="flex items-center gap-1">
              <button onClick={history.undo} disabled={!history.canUndo} className="tool-btn" title="Undo (Ctrl+Z)">
                <RotateCcw className="w-4 h-4" /><span className="tooltip">Undo</span><span className="kbd">⌘Z</span>
              </button>
              <button onClick={history.redo} disabled={!history.canRedo} className="tool-btn" title="Redo (Ctrl+Shift+Z)">
                <RotateCw className="w-4 h-4" /><span className="tooltip">Redo</span><span className="kbd">⇧⌘Z</span>
              </button>
              <button onClick={resetAll} className="tool-btn danger" title="Reset">
                <X className="w-4 h-4" /><span className="tooltip">Reset</span>
              </button>
            </div>
          )}
        </div>

        {!currentBuf ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all ${isDragging ? 'border-nodaw-cyan bg-nodaw-cyan/5' : 'border-nodaw-border hover:border-nodaw-cyan/30'}`}
          >
            <input ref={fileInputRef} type="file" accept="audio/*,video/mp4,video/quicktime,.mp3,.wav,.m4a,.mp4" className="hidden" onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])} />
            <Upload className="w-10 h-10 mx-auto mb-4 text-nodaw-dim" />
            <p className="text-white font-semibold">Drop audio or video here</p>
            <p className="text-sm text-nodaw-muted mt-1">MP3, WAV, M4A, OGG, FLAC, MP4</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="text-white font-semibold text-sm truncate max-w-xs">{file?.name}</p>
                <p className="text-xs text-nodaw-muted">{formatTime(duration)} • {currentBuf.sampleRate}Hz • {currentBuf.numberOfChannels}ch</p>
              </div>
              <div className="text-[10px] font-mono text-nodaw-dim uppercase tracking-widest">
                Edits: {history.canUndo ? '✓' : '—'} Undo / {history.canRedo ? '✓' : '—'} Redo
              </div>
            </div>

            <div className={`wave-host h-44 ${hostClass}`} ref={hostRef} onMouseDown={onMouseDown}>
              <canvas style={{ width: '100%', height: '100%' }} />
            </div>

            <div className="flex items-center justify-between text-xs text-nodaw-muted font-mono">
              <span>{formatTime(playhead)}</span>
              <span>{(selStart != null && selEnd != null) ? `${formatTime(selEnd - selStart)} selected` : 'No selection'}</span>
              <span>{formatTime(duration)}</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {TOOLS.map(t => {
                const Icon = t.icon;
                const active = tool === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTool(t.id);
                      if (t.id === 'fade-in') setShowFadeInSlider(true);
                      if (t.id === 'fade-out') setShowFadeOutSlider(true);
                      if (t.id !== 'fade-in') setShowFadeInSlider(false);
                      if (t.id !== 'fade-out') setShowFadeOutSlider(false);
                    }}
                    className={`tool-btn ${active ? 'active' : ''} ${t.id === 'fx' ? 'cyan' : ''}`}
                    title={t.label}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="tooltip">{t.label}</span>
                    <span className="kbd">{t.kbd}</span>
                  </button>
                );
              })}
              <div className="w-px h-6 bg-nodaw-border mx-1" />
              <button onClick={togglePlay} className={`tool-btn ${isPlaying ? 'active cyan' : ''}`} title={isPlaying ? 'Pause' : 'Play'}>
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span className="tooltip">{isPlaying ? 'Pause' : 'Play'} (Space)</span>
                <span className="kbd">⎵</span>
              </button>
            </div>

            <AnimatePresence>
              {showFadeInSlider && tool === 'fade-in' && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  className="rounded-xl border border-nodaw-border bg-black/40 p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-nodaw-cyan uppercase tracking-widest">Fade In Duration</label>
                    <span className="text-xs font-mono text-nodaw-cyan">{fadeInSec.toFixed(2)}s</span>
                  </div>
                  <input
                    type="range" min="0" max={Math.max(0.1, duration * 0.5)} step="0.01"
                    value={fadeInSec}
                    onChange={(e) => setFadeInSec(Number(e.target.value))}
                    className="w-full accent-nodaw-cyan"
                  />
                  <div className="flex items-center justify-end gap-2 mt-3">
                    <button onClick={() => setShowFadeInSlider(false)} className="text-xs text-nodaw-muted hover:text-white">Cancel</button>
                    <button onClick={commitFadeIn} className="text-xs px-3 py-1 rounded-lg bg-nodaw-cyan text-nodaw-black font-bold">Apply</button>
                  </div>
                </motion.div>
              )}
              {showFadeOutSlider && tool === 'fade-out' && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  className="rounded-xl border border-nodaw-border bg-black/40 p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-nodaw-cyan uppercase tracking-widest">Fade Out Duration</label>
                    <span className="text-xs font-mono text-nodaw-cyan">{fadeOutSec.toFixed(2)}s</span>
                  </div>
                  <input
                    type="range" min="0" max={Math.max(0.1, duration * 0.5)} step="0.01"
                    value={fadeOutSec}
                    onChange={(e) => setFadeOutSec(Number(e.target.value))}
                    className="w-full accent-nodaw-cyan"
                  />
                  <div className="flex items-center justify-end gap-2 mt-3">
                    <button onClick={() => setShowFadeOutSlider(false)} className="text-xs text-nodaw-muted hover:text-white">Cancel</button>
                    <button onClick={commitFadeOut} className="text-xs px-3 py-1 rounded-lg bg-nodaw-cyan text-nodaw-black font-bold">Apply</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between gap-3 flex-wrap pt-2">
              <div className="flex items-center gap-2">
                <label className="text-xs text-nodaw-muted uppercase tracking-widest">Export</label>
                <div className="flex gap-1">
                  {['wav', 'mp3'].map(f => (
                    <button key={f} onClick={() => setExportFormat(f)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${exportFormat === f ? 'bg-nodaw-cyan text-nodaw-black' : 'glass text-nodaw-muted hover:text-white'}`}>
                      {f.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={exportResult} disabled={isProcessing} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-nodaw-cyan to-nodaw-purple text-white font-black text-sm uppercase tracking-widest hover:shadow-lg hover:shadow-nodaw-cyan/30 transition-all active:scale-95 disabled:opacity-50 inline-flex items-center gap-2">
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Export
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default TrimIT;
