import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function KaraokeMaker() {
  const [file, setFile] = useState(null); const [processing, setProcessing] = useState(false)
  const [keyShift, setKeyShift] = useState(0); const [tempo, setTempo] = useState(0)
  const audioRef = useRef(null); const urlRef = useRef(null)
  const handleFile = useCallback((e) => { const f = e.target.files?.[0]; if (f) setFile(f) }, [])
  const process = useCallback(async () => {
    if (!file) return; setProcessing(true)
    try {
      const ctx = new OfflineAudioContext(2, 44100 * 30, 44100)
      const buf = await file.arrayBuffer(); const decoded = await ctx.decodeAudioData(buf.length > ctx.length ? buf.slice(0, ctx.length) : buf)
      if (decoded.numberOfChannels >= 2) {
        const out = ctx.createBuffer(2, decoded.length, decoded.sampleRate)
        const L = decoded.getChannelData(0), R = decoded.getChannelData(1), oL = out.getChannelData(0), oR = out.getChannelData(1)
        for (let i = 0; i < decoded.length; i++) { const d = (L[i] - R[i]) * 0.7; oL[i] = d; oR[i] = d }
        const src = ctx.createBufferSource(); src.buffer = out; src.connect(ctx.destination); src.start()
      } else { const src = ctx.createBufferSource(); src.buffer = decoded; src.connect(ctx.destination); src.start() }
      const rendered = await ctx.startRendering()
      const wav = bufferToWav(rendered); const url = URL.createObjectURL(new Blob([wav], { type: 'audio/wav' }))
      if (urlRef.current) URL.revokeObjectURL(urlRef.current); urlRef.current = url; if (audioRef.current) audioRef.current.src = url
    } catch (err) { console.error(err) }; setProcessing(false)
  }, [file])

  return (
    <div className="space-y-5">
      <label className="block cursor-pointer">
        <div className="nd-upload-zone">
          <input type="file" accept="audio/*" onChange={handleFile} className="hidden" />
          <p className="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-[0.12em] text-[#64748b]">{file ? file.name : 'Drop a song or click to browse'}</p>
        </div>
      </label>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1"><div className="flex justify-between"><span className="nd-label">Key Shift</span><span className="nd-value text-[11px]">{keyShift > 0 ? `+${keyShift}` : keyShift}</span></div><input type="range" min={-12} max={12} value={keyShift} onChange={(e) => setKeyShift(+e.target.value)} className="nd-slider" /></div>
        <div className="space-y-1"><div className="flex justify-between"><span className="nd-label">Tempo</span><span className="nd-value text-[11px]">{tempo > 0 ? `+${tempo}` : tempo}%</span></div><input type="range" min={-50} max={50} value={tempo} onChange={(e) => setTempo(+e.target.value)} className="nd-slider" /></div>
      </div>
      <button onClick={process} disabled={!file || processing} className="nd-btn nd-btn-primary w-full text-[10px]">{processing ? 'Processing...' : 'Make Karaoke'}</button>
      <AnimatePresence>{urlRef.current && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <audio ref={audioRef} controls className="w-full rounded-lg" />
          <a href={urlRef.current} download={`karaoke-${file?.name || 'output'}.wav`} className="nd-btn nd-btn-secondary w-full text-[10px] text-center no-underline">Download Karaoke (WAV)</a>
        </motion.div>
      )}</AnimatePresence>
    </div>
  )
}

function bufferToWav(buffer) {
  const nc = buffer.numberOfChannels, sr = buffer.sampleRate, len = buffer.length
  const bps = 16, ba = nc * bps / 8, ds = len * ba, bs = 44 + ds
  const ab = new ArrayBuffer(bs), v = new DataView(ab)
  const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)) }
  w(0, 'RIFF'); v.setUint32(4, bs - 8, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true)
  v.setUint16(20, 1, true); v.setUint16(22, nc, true); v.setUint32(24, sr, true)
  v.setUint32(28, sr * ba, true); v.setUint16(32, ba, true); v.setUint16(34, bps, true)
  w(36, 'data'); v.setUint32(40, ds, true)
  let o = 44
  for (let i = 0; i < len; i++) for (let ch = 0; ch < nc; ch++) {
    const s = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]))
    v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7FFF, true); o += 2
  }
  return ab
}
