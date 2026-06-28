import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'

function calcLUFS(buffer) {
  const L = buffer.getChannelData(0), R = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : buffer.getChannelData(0)
  const len = buffer.length, ws = Math.min(len, 44100), nw = Math.floor(len / ws)
  let integrated = 0, shortTerm = 0, truePeak = 0, crestSum = 0, numCrest = 0
  for (let w = 0; w < nw; w++) {
    let sumSq = 0, wp = 0
    for (let i = w * ws; i < (w + 1) * ws && i < len; i++) {
      const s = (L[i] + R[i]) * 0.5; sumSq += s * s
      const a = Math.abs(s); if (a > wp) wp = a
    }
    integrated += -0.691 + 10 * Math.log10(sumSq / ws + 1e-10)
    const rms = Math.sqrt(sumSq / ws)
    if (rms > 0) crestSum += wp / rms; numCrest++
  }
  integrated = nw > 0 ? integrated / nw : -70; shortTerm = integrated
  const crest = numCrest > 0 ? crestSum / numCrest : 1, dr = 20 * Math.log10(crest + 1e-10)
  for (let i = 0; i < len; i++) {
    const a = Math.abs(L[i]); if (a > truePeak) truePeak = a
    if (buffer.numberOfChannels > 1) { const ar = Math.abs(R[i]); if (ar > truePeak) truePeak = ar }
  }
  const tp = 20 * Math.log10(truePeak + 1e-10)
  return { integrated: Math.round(integrated * 10) / 10, shortTerm: Math.round(shortTerm * 10) / 10, truePeak: Math.round(tp * 10) / 10, dynamicRange: Math.round(dr * 10) / 10, crest: Math.round(crest * 10) / 10 }
}

export default function LUFSMeter() {
  const [file, setFile] = useState(null); const [metrics, setMetrics] = useState(null); const [analyzing, setAnalyzing] = useState(false)
  const handleFile = useCallback(async (e) => {
    const f = e.target.files?.[0]; if (!f) return; setFile(f); setAnalyzing(true); setMetrics(null)
    try {
      const ctx = new OfflineAudioContext(2, 44100 * 60, 44100)
      const buf = await f.arrayBuffer(); const decoded = await ctx.decodeAudioData(buf.length > ctx.length * 4 ? buf.slice(0, ctx.length * 4) : buf)
      setMetrics(calcLUFS(decoded))
    } catch (err) { console.error(err) }; setAnalyzing(false)
  }, [])

  const Bar = ({ label, value, unit, min, max, color }) => {
    const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))
    return (
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="nd-label">{label}</span>
          <span className="font-['JetBrains_Mono',monospace] text-[13px] font-bold" style={{ color }}>{value} {unit}</span>
        </div>
        <div className="h-[6px] bg-[#000000] rounded-full overflow-hidden border border-white/[0.06]">
          <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} style={{ backgroundColor: color }} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <label className="block cursor-pointer">
        <div className="nd-upload-zone">
          <input type="file" accept="audio/*" onChange={handleFile} className="hidden" />
          <p className="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-[0.12em] text-[#64748b]">{file ? file.name : 'Drop audio or click to analyze'}</p>
        </div>
      </label>
      {analyzing && <div className="text-center text-[#64748b] text-[11px] font-['JetBrains_Mono',monospace] animate-pulse">Analyzing loudness...</div>}
      {metrics && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="space-y-4">
          <Bar label="Integrated LUFS" value={metrics.integrated} unit="LUFS" min={-30} max={0} color="#22d3ee" />
          <Bar label="Short-Term LUFS" value={metrics.shortTerm} unit="LUFS" min={-30} max={0} color="#8b5cf6" />
          <Bar label="True Peak" value={metrics.truePeak} unit="dBTP" min={-18} max={0} color="#f43f5e" />
          <Bar label="Dynamic Range" value={metrics.dynamicRange} unit="dB" min={0} max={30} color="#c8a24a" />
          <Bar label="Crest Factor" value={metrics.crest} unit="dB" min={0} max={20} color="#f59e0b" />
          <div className="nd-panel p-4 mt-4">
            <div className="flex items-center gap-2 mb-3"><div className="nd-led off" /><span className="nd-label text-[#64748b]">Streaming Targets</span></div>
            <div className="grid grid-cols-2 gap-2 font-['JetBrains_Mono',monospace] text-[10px]">
              <span className="text-[#475569]">Spotify: <span className="text-[#e2e8f0]">-14 LUFS</span></span>
              <span className="text-[#475569]">Apple Music: <span className="text-[#e2e8f0]">-16 LUFS</span></span>
              <span className="text-[#475569]">YouTube: <span className="text-[#e2e8f0]">-14 LUFS</span></span>
              <span className="text-[#475569]">Mastering: <span className="text-[#e2e8f0]">-9 to -13 LUFS</span></span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
