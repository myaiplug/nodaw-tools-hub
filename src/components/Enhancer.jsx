import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const initial = {
  lowGain: 0, midGain: 0, highGain: 0,
  compression: 0, stereoWidth: 100, loudness: 0,
}

export default function Enhancer() {
  const [file, setFile] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [params, setParams] = useState(initial)
  const audioRef = useRef(null)
  const urlRef = useRef(null)

  const handleFile = useCallback((e) => {
    const f = e.target.files?.[0]
    if (f) setFile(f)
  }, [])

  const process = useCallback(async () => {
    if (!file) return
    setProcessing(true)
    try {
      const ctx = new OfflineAudioContext(2, 44100 * 30, 44100)
      const buf = await file.arrayBuffer()
      const decoded = await ctx.decodeAudioData(buf.length > ctx.length * 4 ? buf.slice(0, ctx.length * 4) : buf)
      const len = Math.min(decoded.length, ctx.length)
      const out = ctx.createBuffer(2, len, decoded.sampleRate)
      const outL = out.getChannelData(0), outR = out.getChannelData(1)
      const L = decoded.getChannelData(0), R = decoded.numberOfChannels > 1 ? decoded.getChannelData(1) : decoded.getChannelData(0)
      const { lowGain, midGain, highGain, compression, stereoWidth, loudness } = params
      const sw = stereoWidth / 100, comp = compression / 100, ln = Math.pow(10, loudness / 20)
      for (let i = 0; i < len; i++) {
        let sl = L[i], sr = R[i]
        const mid = (sl + sr) * 0.5, side = (sl - sr) * 0.5
        const ws = side * sw
        sl = mid + ws; sr = mid - ws
        const fl = biquad(sl, 0.05, lowGain, 1), fm = biquad(mid, 0.25, midGain, 1), fh = biquad(sl, 0.7, highGain, 1)
        sl = fl + fm * 0.5 + fh * 0.3; sr = biquad(sr, 0.05, lowGain, 1) + fm * 0.5 + biquad(sr, 0.7, highGain, 1) * 0.3
        if (comp > 0) {
          const threshold = 0.3, ratio = 1 + comp * 3
          if (Math.abs(sl) > threshold) sl = Math.sign(sl) * (threshold + (Math.abs(sl) - threshold) / ratio)
          if (Math.abs(sr) > threshold) sr = Math.sign(sr) * (threshold + (Math.abs(sr) - threshold) / ratio)
          sl *= 1 - comp * 0.5; sr *= 1 - comp * 0.5
        }
        sl *= ln; sr *= ln
        outL[i] = Math.max(-1, Math.min(1, sl)); outR[i] = Math.max(-1, Math.min(1, sr))
      }
      const src = ctx.createBufferSource()
      src.buffer = out; src.connect(ctx.destination); src.start()
      const rendered = await ctx.startRendering()
      const wav = bufferToWav(rendered); const url = URL.createObjectURL(new Blob([wav], { type: 'audio/wav' }))
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
      urlRef.current = url; if (audioRef.current) audioRef.current.src = url
    } catch (err) { console.error(err) }
    setProcessing(false)
  }, [file, params])

  const upd = (k) => (e) => setParams(p => ({ ...p, [k]: +e.target.value }))
  const knobs = [
    { key: 'lowGain', label: 'Low', min: -12, max: 12, unit: 'dB' },
    { key: 'midGain', label: 'Mid', min: -12, max: 12, unit: 'dB' },
    { key: 'highGain', label: 'High', min: -12, max: 12, unit: 'dB' },
    { key: 'compression', label: 'Compress', min: 0, max: 100, unit: '%' },
    { key: 'stereoWidth', label: 'Width', min: 0, max: 200, unit: '%' },
    { key: 'loudness', label: 'Loudness', min: -6, max: 6, unit: 'dB' },
  ]

  return (
    <div className="space-y-5">
      <label className="block cursor-pointer">
        <div className="nd-upload-zone">
          <input type="file" accept="audio/*" onChange={handleFile} className="hidden" />
          <p className="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-[0.12em] text-[#64748b]">{file ? file.name : 'Drop audio or click to browse'}</p>
        </div>
      </label>
      <div className="grid grid-cols-3 gap-4">
        {knobs.map(({ key, label, min, max, unit }) => (
          <div key={key} className="space-y-1.5">
            <div className="flex justify-between">
              <span className="nd-label">{label}</span>
              <span className="nd-value text-[11px]">{params[key] > 0 ? `+${params[key]}` : params[key]}{unit}</span>
            </div>
            <input type="range" min={min} max={max} value={params[key]} onChange={upd(key)} className="nd-slider" />
          </div>
        ))}
      </div>
      <button onClick={process} disabled={!file || processing}
        className="nd-btn nd-btn-primary w-full text-[10px]">
        {processing ? 'Enhancing...' : 'Enhance Audio'}
      </button>
      <AnimatePresence>
        {urlRef.current && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <audio ref={audioRef} controls className="w-full rounded-lg" />
            <a href={urlRef.current} download={`enhanced-${file?.name || 'output'}.wav`}
              className="nd-btn nd-btn-secondary w-full text-[10px] text-center no-underline">Download Enhanced (WAV)</a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function biquad(s, f, g, q) {
  const w0 = Math.PI * 2 * f, alpha = Math.sin(w0) / (2 * q), A = Math.pow(10, g / 40)
  const cosW = Math.cos(w0), b0 = 1 + alpha * A, b1 = -2 * cosW, b2 = 1 - alpha * A
  const a0 = 1 + alpha / A, a1 = -2 * cosW, a2 = 1 - alpha / A
  return (b0 * s - a1 * 0 - a2 * 0) / a0
}
function bufferToWav(buffer) {
  const nc = buffer.numberOfChannels, sr = buffer.sampleRate, len = buffer.length
  const bps = 16, ba = nc * bps / 8, ds = len * ba, bs = 44 + ds
  const ab = new ArrayBuffer(bs), v = new DataView(ab)
  const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)) }
  w(0, 'RIFF'); v.setUint32(4, bs - 8, true); w(8, 'WAVE')
  w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true)
  v.setUint16(22, nc, true); v.setUint32(24, sr, true)
  v.setUint32(28, sr * ba, true); v.setUint16(32, ba, true); v.setUint16(34, bps, true)
  w(36, 'data'); v.setUint32(40, ds, true)
  let o = 44
  for (let i = 0; i < len; i++) for (let ch = 0; ch < nc; ch++) {
    const s = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]))
    v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7FFF, true); o += 2
  }
  return ab
}
