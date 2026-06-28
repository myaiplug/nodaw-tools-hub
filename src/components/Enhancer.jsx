import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const initialParams = {
  lowGain: 0, midGain: 0, highGain: 0,
  compression: 0, stereoWidth: 100, loudness: 0,
}

export default function Enhancer() {
  const [file, setFile] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [params, setParams] = useState(initialParams)
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
      const buffer = await file.arrayBuffer()
      const decoded = await ctx.decodeAudioData(buffer.length > ctx.length * 4 ? buffer.slice(0, ctx.length * 4) : buffer)
      const len = Math.min(decoded.length, ctx.length)
      const out = ctx.createBuffer(2, len, decoded.sampleRate)
      const outL = out.getChannelData(0), outR = out.getChannelData(1)
      const L = decoded.getChannelData(0), R = decoded.numberOfChannels > 1 ? decoded.getChannelData(1) : decoded.getChannelData(0)

      const lg = dbToLinear(params.lowGain)
      const mg = dbToLinear(params.midGain)
      const hg = dbToLinear(params.highGain)
      const sw = params.stereoWidth / 100
      const comp = params.compression / 100
      const ln = dbToLinear(params.loudness)

      const b0 = 0.2, b1 = 0.5, b2 = 0.3
      const a1 = 0.5, a2 = 0.2

      let l1 = 0, l2 = 0, r1 = 0, r2 = 0
      let lSum = 0, rSum = 0
      const windowSize = 4410
      let idx = 0

      for (let i = 0; i < len; i++) {
        let sl = L[i], sr = R[i]

        const mid = (sl + sr) * 0.5
        const side = (sl - sr) * 0.5
        const widenedSide = side * sw
        sl = mid + widenedSide
        sr = mid - widenedSide

        let ls = b0 * sl + b1 * l1 + b2 * l2 - a1 * ls - a2 * l2
        ls = ls || 0
        let rs = b0 * sr + b1 * r1 + b2 * r2 - a1 * rs - a2 * r2
        rs = rs || 0
        l2 = l1; l1 = sl
        r2 = r1; r1 = sr

        const filteredL = biquad(sl, 0.05, lg, 1)
        const filteredM = biquad(mid, 0.25, mg, 1)
        const filteredH = biquad(sl, 0.7, hg, 1)

        sl = filteredL + filteredM * 0.5 + filteredH * 0.3
        sr = biquad(sr, 0.05, lg, 1) + biquad(mid, 0.25, mg, 1) * 0.5 + biquad(sr, 0.7, hg, 1) * 0.3

        if (comp > 0) {
          const gain = 1 - comp * 0.5
          const threshold = 0.3
          const ratio = 1 + comp * 3
          if (Math.abs(sl) > threshold) sl = Math.sign(sl) * (threshold + (Math.abs(sl) - threshold) / ratio)
          if (Math.abs(sr) > threshold) sr = Math.sign(sr) * (threshold + (Math.abs(sr) - threshold) / ratio)
          sl *= gain; sr *= gain
        }

        sl *= ln; sr *= ln
        outL[i] = Math.max(-1, Math.min(1, sl))
        outR[i] = Math.max(-1, Math.min(1, sr))

        lSum += Math.abs(outL[i]); rSum += Math.abs(outR[i])
        idx++
        if (idx >= windowSize) {
          lSum /= windowSize; rSum /= windowSize
          idx = 0; lSum = 0; rSum = 0
        }
      }

      const src = ctx.createBufferSource()
      src.buffer = out; src.connect(ctx.destination); src.start()
      const rendered = await ctx.startRendering()
      const wav = bufferToWav(rendered)
      const url = URL.createObjectURL(new Blob([wav], { type: 'audio/wav' }))
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
      urlRef.current = url
      if (audioRef.current) audioRef.current.src = url
    } catch (err) { console.error(err) }
    setProcessing(false)
  }, [file, params])

  const update = (key) => (e) => setParams(p => ({ ...p, [key]: +e.target.value }))

  const knobs = [
    { key: 'lowGain', label: 'Low', min: -12, max: 12 },
    { key: 'midGain', label: 'Mid', min: -12, max: 12 },
    { key: 'highGain', label: 'High', min: -12, max: 12 },
    { key: 'compression', label: 'Compress', min: 0, max: 100 },
    { key: 'stereoWidth', label: 'Width', min: 0, max: 200 },
    { key: 'loudness', label: 'Loudness', min: -6, max: 6 },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="fx-rack p-6 space-y-4">
        <label className="block w-full cursor-pointer">
          <div className="border-2 border-dashed border-nodaw-dim rounded-xl p-6 text-center hover:border-nodaw-gold/40 transition-colors">
            <input type="file" accept="audio/*" onChange={handleFile} className="hidden" />
            <p className="text-nodaw-muted text-sm">{file ? file.name : 'Drop audio or click to browse'}</p>
          </div>
        </label>

        <div className="grid grid-cols-3 gap-4">
          {knobs.map(({ key, label, min, max }) => (
            <div key={key} className="space-y-1 text-center">
              <label className="text-xs font-semibold uppercase tracking-wider text-nodaw-muted block">
                {label} <span className="text-nodaw-gold">{params[key] > 0 ? `+${params[key]}` : params[key]}</span>
              </label>
              <input type="range" min={min} max={max} value={params[key]} onChange={update(key)}
                className="w-full accent-nodaw-gold" />
            </div>
          ))}
        </div>

        <button onClick={process} disabled={!file || processing}
          className="w-full py-3 rounded-xl font-bold text-sm uppercase tracking-widest bg-nodaw-gold/10 border border-nodaw-gold/30 text-nodaw-gold hover:bg-nodaw-gold/20 transition-all disabled:opacity-30">
          {processing ? 'Enhancing...' : 'Enhance Audio'}
        </button>

        <AnimatePresence>
          {urlRef.current && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <audio ref={audioRef} controls className="w-full rounded-lg" />
              <a href={urlRef.current} download={`enhanced-${file?.name || 'output'}.wav`}
                className="block text-center py-2 rounded-lg bg-nodaw-card border border-nodaw-border text-nodaw-cyan text-sm font-semibold hover:border-nodaw-cyan/30 transition-all">
                Download Enhanced (WAV)
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function biquad(sample, freq, gain, q) {
  const w0 = Math.PI * 2 * freq
  const alpha = Math.sin(w0) / (2 * q)
  const A = Math.pow(10, gain / 40)
  const cosW = Math.cos(w0)
  const b0 = 1 + alpha * A
  const b1 = -2 * cosW
  const b2 = 1 - alpha * A
  const a0 = 1 + alpha / A
  const a1 = -2 * cosW
  const a2 = 1 - alpha / A
  return (b0 * sample + b1 * 0 + b2 * 0 - a1 * 0 - a2 * 0) / a0
}

function dbToLinear(db) { return Math.pow(10, db / 20) }

function bufferToWav(buffer) {
  const nc = buffer.numberOfChannels, sr = buffer.sampleRate, len = buffer.length
  const bps = 16, ba = nc * bps / 8, ds = len * ba, bs = 44 + ds
  const ab = new ArrayBuffer(bs), v = new DataView(ab)
  const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)) }
  w(0, 'RIFF'); v.setUint32(4, bs - 8, true)
  w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true)
  v.setUint16(20, 1, true); v.setUint16(22, nc, true)
  v.setUint32(24, sr, true); v.setUint32(28, sr * ba, true)
  v.setUint16(32, ba, true); v.setUint16(34, bps, true)
  w(36, 'data'); v.setUint32(40, ds, true)
  let o = 44
  for (let i = 0; i < len; i++) for (let ch = 0; ch < nc; ch++) {
    const s = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]))
    v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7FFF, true); o += 2
  }
  return ab
}
