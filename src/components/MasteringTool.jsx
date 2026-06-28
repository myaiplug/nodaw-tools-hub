import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function MasteringTool() {
  const [file, setFile] = useState(null)
  const [params, setParams] = useState({ threshold: -12, ratio: 4, makeup: 3, attack: 5, release: 100, ceiling: -1, limiterOn: true, width: 100, lufsTarget: -14 })
  const [processing, setProcessing] = useState(false)
  const audioRef = useRef(null); const urlRef = useRef(null)

  const handleFile = useCallback((e) => { const f = e.target.files?.[0]; if (f) setFile(f) }, [])

  const process = useCallback(async () => {
    if (!file) return; setProcessing(true)
    try {
      const ctx = new OfflineAudioContext(2, 44100 * 30, 44100)
      const buf = await file.arrayBuffer()
      const decoded = await ctx.decodeAudioData(buf.length > ctx.length * 4 ? buf.slice(0, ctx.length * 4) : buf)
      const len = Math.min(decoded.length, ctx.length)
      const out = ctx.createBuffer(2, len, decoded.sampleRate)
      const outL = out.getChannelData(0), outR = out.getChannelData(1)
      const L = decoded.getChannelData(0), R = decoded.numberOfChannels > 1 ? decoded.getChannelData(1) : decoded.getChannelData(0)
      const { threshold, ratio, makeup, attack, release, ceiling, limiterOn, width, lufsTarget } = params
      const attS = Math.max(1, Math.floor(attack * 44.1)), relS = Math.max(1, Math.floor(release * 44.1))
      let envelope = 0, lSumSq = 0
      const targetRms = Math.pow(10, lufsTarget / 10)
      for (let i = 0; i < len; i++) {
        let sl = L[i], sr = R[i]
        const mid = (sl + sr) * 0.5, side = (sl - sr) * 0.5, w = width / 100
        sl = mid + side * w; sr = mid - side * w
        const db = 20 * Math.log10(Math.max(Math.abs(sl), Math.abs(sr), 1e-10))
        if (db > threshold) {
          const target = Math.pow(10, ((db - threshold) / ratio + threshold - db) / 20)
          envelope += (target - envelope) / attS
        } else envelope += (0 - envelope) / relS
        const cg = Math.pow(10, (envelope * ratio + makeup) / 20)
        sl *= cg; sr *= cg
        if (limiterOn) { const lim = Math.pow(10, ceiling / 20); if (Math.abs(sl) > lim) sl = Math.sign(sl) * lim; if (Math.abs(sr) > lim) sr = Math.sign(sr) * lim }
        outL[i] = Math.max(-1, Math.min(1, sl)); outR[i] = Math.max(-1, Math.min(1, sr))
        lSumSq += outL[i] * outL[i] + outR[i] * outR[i]
      }
      const curRms = Math.sqrt(lSumSq / len / 2)
      if (curRms > 0) { const ng = Math.min(targetRms / (curRms * curRms), 2); for (let i = 0; i < len; i++) { outL[i] = Math.max(-1, Math.min(1, outL[i] * ng)); outR[i] = Math.max(-1, Math.min(1, outR[i] * ng)) } }
      const src = ctx.createBufferSource(); src.buffer = out; src.connect(ctx.destination); src.start()
      const rendered = await ctx.startRendering()
      const wav = bufferToWav(rendered); const url = URL.createObjectURL(new Blob([wav], { type: 'audio/wav' }))
      if (urlRef.current) URL.revokeObjectURL(urlRef.current); urlRef.current = url; if (audioRef.current) audioRef.current.src = url
    } catch (err) { console.error(err) }; setProcessing(false)
  }, [file, params])

  const upd = (k) => (e) => setParams(p => ({ ...p, [k]: +e.target.value }))

  return (
    <div className="space-y-5">
      <label className="block cursor-pointer">
        <div className="nd-upload-zone">
          <input type="file" accept="audio/*" onChange={handleFile} className="hidden" />
          <p className="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-[0.12em] text-[#64748b]">{file ? file.name : 'Drop audio or click to master'}</p>
        </div>
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
        {[
          { key: 'threshold', label: 'Threshold', min: -40, max: 0, unit: 'dB' },
          { key: 'ratio', label: 'Ratio', min: 1, max: 20, unit: ':1' },
          { key: 'makeup', label: 'Makeup', min: 0, max: 12, unit: 'dB' },
          { key: 'attack', label: 'Attack', min: 1, max: 50, unit: 'ms' },
          { key: 'release', label: 'Release', min: 10, max: 500, unit: 'ms' },
          { key: 'ceiling', label: 'Ceiling', min: -6, max: 0, unit: 'dB' },
          { key: 'width', label: 'Width', min: 0, max: 200, unit: '%' },
          { key: 'lufsTarget', label: 'LUFS', min: -20, max: -8, unit: 'LUFS' },
        ].map(({ key, label, min, max, unit }) => (
          <div key={key} className="space-y-1">
            <div className="flex justify-between"><span className="nd-label">{label}</span><span className="nd-value text-[11px]">{params[key]}{unit}</span></div>
            <input type="range" min={min} max={max} value={params[key]} onChange={upd(key)} className="nd-slider" />
          </div>
        ))}
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={params.limiterOn} onChange={(e) => setParams(p => ({ ...p, limiterOn: e.target.checked }))} className="accent-[#22d3ee]" />
        <span className="nd-label text-[11px]">Limiter</span>
      </label>
      <button onClick={process} disabled={!file || processing} className="nd-btn nd-btn-primary w-full text-[10px]">
        {processing ? 'Mastering...' : 'Master Track'}
      </button>
      <AnimatePresence>
        {urlRef.current && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <audio ref={audioRef} controls className="w-full rounded-lg" />
            <a href={urlRef.current} download={`mastered-${file?.name || 'output'}.wav`} className="nd-btn nd-btn-secondary w-full text-[10px] text-center no-underline">Download Mastered (WAV)</a>
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
