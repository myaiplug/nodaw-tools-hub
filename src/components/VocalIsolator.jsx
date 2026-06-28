import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function VocalIsolator() {
  const [file, setFile] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [mode, setMode] = useState('vocals')
  const [blend, setBlend] = useState(100)
  const audioRef = useRef(null)
  const sourceRef = useRef(null)

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
      const decoded = await ctx.decodeAudioData(buffer)
      if (decoded.length > ctx.length) {
        const limited = ctx.createBuffer(decoded.numberOfChannels, ctx.length, ctx.sampleRate)
        for (let ch = 0; ch < decoded.numberOfChannels; ch++)
          limited.copyToChannel(decoded.getChannelData(ch).slice(0, ctx.length), ch)
        ctx.buffer = limited
      } else ctx.buffer = decoded
      const src = ctx.createBufferSource()
      src.buffer = ctx.buffer
      src.connect(ctx.destination)
      if (ctx.buffer.numberOfChannels >= 2) {
        const L = ctx.buffer.getChannelData(0), R = ctx.buffer.getChannelData(1)
        const out = ctx.createBuffer(2, ctx.buffer.length, ctx.sampleRate)
        const outL = out.getChannelData(0), outR = out.getChannelData(1)
        const b = blend / 100
        for (let i = 0; i < ctx.buffer.length; i++) {
          const sum = (L[i] + R[i]) * 0.5, diff = (L[i] - R[i]) * 0.5
          const v = mode === 'vocals' ? sum * b + diff * (1 - b) : diff * b + sum * (1 - b)
          outL[i] = v; outR[i] = v
        }
        const fs = ctx.createBufferSource()
        fs.buffer = out; fs.connect(ctx.destination); fs.start()
      } else src.start()
      const rendered = await ctx.startRendering()
      const wav = bufferToWav(rendered)
      const url = URL.createObjectURL(new Blob([wav], { type: 'audio/wav' }))
      if (sourceRef.current) URL.revokeObjectURL(sourceRef.current)
      sourceRef.current = url
      if (audioRef.current) audioRef.current.src = url
    } catch (err) { console.error(err) }
    setProcessing(false)
  }, [file, mode, blend])

  return (
    <div className="space-y-5">
      <label className="block cursor-pointer">
        <div className="nd-upload-zone">
          <input type="file" accept="audio/*" onChange={handleFile} className="hidden" />
          <p className="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-[0.12em] text-[#64748b]">
            {file ? file.name : 'Drop audio file or click to browse'}
          </p>
        </div>
      </label>
      <div className="flex gap-2">
        {['vocals', 'instrumental'].map((m) => (
          <button key={m} onClick={() => setMode(m)}
            className={`nd-btn text-[10px] ${mode === m ? 'nd-btn-primary' : 'nd-btn-secondary'}`}>
            {m === 'vocals' ? 'Extract Vocals' : 'Remove Vocals'}
          </button>
        ))}
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between">
          <span className="nd-label">Blend</span>
          <span className="nd-value text-[11px]">{blend}%</span>
        </div>
        <input type="range" min={0} max={100} value={blend}
          onChange={(e) => setBlend(+e.target.value)} className="nd-slider" />
        <div className="flex justify-between text-[9px] font-['JetBrains_Mono',monospace] text-[#475569] uppercase tracking-[0.08em]">
          <span>Wide</span><span>Center</span>
        </div>
      </div>
      <button onClick={process} disabled={!file || processing}
        className="nd-btn nd-btn-primary w-full text-[10px]">
        {processing ? 'Processing...' : mode === 'vocals' ? 'Extract Vocals' : 'Remove Vocals'}
      </button>
      <AnimatePresence>
        {sourceRef.current && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <audio ref={audioRef} controls className="w-full rounded-lg" />
            <a href={sourceRef.current} download={`${mode}-${file?.name || 'output'}.wav`}
              className="nd-btn nd-btn-secondary w-full text-[10px] text-center no-underline">
              Download {mode === 'vocals' ? 'Vocals' : 'Instrumental'} (WAV)
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
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
function w(v, o, s) { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)) }
