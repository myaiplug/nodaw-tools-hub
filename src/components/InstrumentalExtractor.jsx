import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function InstrumentalExtractor() {
  const [file, setFile] = useState(null); const [processing, setProcessing] = useState(false)
  const [strength, setStrength] = useState(70)
  const audioRef = useRef(null); const urlRef = useRef(null)
  const handleFile = useCallback((e) => { const f = e.target.files?.[0]; if (f) setFile(f) }, [])
  const process = useCallback(async () => {
    if (!file) return; setProcessing(true)
    try {
      const ctx = new OfflineAudioContext(2, 44100 * 30, 44100)
      const buf = await file.arrayBuffer(); const decoded = await ctx.decodeAudioData(buf)
      const len = Math.min(decoded.length, ctx.length); const out = ctx.createBuffer(2, len, decoded.sampleRate)
      const oL = out.getChannelData(0), oR = out.getChannelData(1)
      if (decoded.numberOfChannels >= 2) {
        const L = decoded.getChannelData(0), R = decoded.getChannelData(1), s = strength / 100
        for (let i = 0; i < len; i++) { const d = (L[i] - R[i]) * 0.5, sum = (L[i] + R[i]) * 0.5; oL[i] = sum + d * s; oR[i] = sum + d * s }
      } else for (let i = 0; i < len; i++) { oL[i] = decoded.getChannelData(0)[i]; oR[i] = oL[i] }
      const src = ctx.createBufferSource(); src.buffer = out; src.connect(ctx.destination); src.start()
      const rendered = await ctx.startRendering()
      const wav = bufferToWav(rendered); const url = URL.createObjectURL(new Blob([wav], { type: 'audio/wav' }))
      if (urlRef.current) URL.revokeObjectURL(urlRef.current); urlRef.current = url; if (audioRef.current) audioRef.current.src = url
    } catch (err) { console.error(err) }; setProcessing(false)
  }, [file, strength])

  return (
    <div className="space-y-5">
      <label className="block cursor-pointer">
        <div className="nd-upload-zone">
          <input type="file" accept="audio/*" onChange={handleFile} className="hidden" />
          <p className="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-[0.12em] text-[#64748b]">{file ? file.name : 'Drop a song or click to browse'}</p>
        </div>
      </label>
      <div className="space-y-1"><div className="flex justify-between"><span className="nd-label">Reduction</span><span className="nd-value text-[11px]">{strength}%</span></div><input type="range" min={0} max={100} value={strength} onChange={(e) => setStrength(+e.target.value)} className="nd-slider" /></div>
      <button onClick={process} disabled={!file || processing} className="nd-btn nd-btn-primary w-full text-[10px]">{processing ? 'Extracting...' : 'Extract Instrumental'}</button>
      <AnimatePresence>{urlRef.current && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3"><audio ref={audioRef} controls className="w-full rounded-lg" /><a href={urlRef.current} download={`instrumental-${file?.name || 'output'}.wav`} className="nd-btn nd-btn-secondary w-full text-[10px] text-center no-underline">Download Instrumental (WAV)</a></motion.div>}</AnimatePresence>
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
