import { useState, useRef, useCallback } from 'react'

function calcLUFS(buffer) {
  const L = buffer.getChannelData(0)
  const R = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : buffer.getChannelData(0)
  const len = buffer.length
  const windowSize = Math.min(len, 44100)
  const numWindows = Math.floor(len / windowSize)
  let integrated = 0
  let shortTerm = 0
  let truePeak = 0
  let crestSum = 0
  let numCrest = 0

  for (let w = 0; w < numWindows; w++) {
    let sumSq = 0
    let windowPeak = 0
    for (let i = w * windowSize; i < (w + 1) * windowSize && i < len; i++) {
      const s = (L[i] + R[i]) * 0.5
      sumSq += s * s
      const abs = Math.abs(s)
      if (abs > windowPeak) windowPeak = abs
    }
    const rms = Math.sqrt(sumSq / windowSize)
    const loudness = -0.691 + 10 * Math.log10(sumSq / windowSize + 1e-10)
    integrated += loudness
    if (rms > 0) crestSum += windowPeak / rms
    numCrest++
  }
  integrated = numWindows > 0 ? integrated / numWindows : -70
  shortTerm = numWindows > 0 ? integrated : -70
  const crest = numCrest > 0 ? crestSum / numCrest : 1
  const dynamicRange = 20 * Math.log10(crest + 1e-10)

  for (let i = 0; i < len; i++) {
    const abs = Math.abs(L[i])
    if (abs > truePeak) truePeak = abs
    if (buffer.numberOfChannels > 1) {
      const absR = Math.abs(R[i])
      if (absR > truePeak) truePeak = absR
    }
  }
  const truePeakDb = 20 * Math.log10(truePeak + 1e-10)

  return {
    integrated: Math.round(integrated * 10) / 10,
    shortTerm: Math.round(shortTerm * 10) / 10,
    truePeak: Math.round(truePeakDb * 10) / 10,
    dynamicRange: Math.round(dynamicRange * 10) / 10,
    crest: Math.round(crest * 10) / 10,
  }
}

export default function LUFSMeter() {
  const [file, setFile] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)

  const handleFile = useCallback(async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setAnalyzing(true)
    setMetrics(null)
    try {
      const ctx = new OfflineAudioContext(2, 44100 * 60, 44100)
      const buf = await f.arrayBuffer()
      const decoded = await ctx.decodeAudioData(buf.length > ctx.length * 4 ? buf.slice(0, ctx.length * 4) : buf)
      const m = calcLUFS(decoded)
      setMetrics(m)
    } catch (err) { console.error(err) }
    setAnalyzing(false)
  }, [])

  const bar = (label, value, unit, min, max, color) => {
    const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-nodaw-muted font-semibold uppercase tracking-wider">{label}</span>
          <span className="font-mono font-bold" style={{ color }}>{value} {unit}</span>
        </div>
        <div className="h-2 bg-nodaw-black rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="fx-rack p-6 space-y-6">
        <label className="block w-full cursor-pointer">
          <div className="border-2 border-dashed border-nodaw-dim rounded-xl p-6 text-center hover:border-nodaw-gold/40 transition-colors">
            <input type="file" accept="audio/*" onChange={handleFile} className="hidden" />
            <p className="text-nodaw-muted text-sm">{file ? file.name : 'Drop audio or click to analyze'}</p>
          </div>
        </label>

        {analyzing && (
          <div className="text-center text-nodaw-muted text-sm animate-pulse">Analyzing loudness...</div>
        )}

        {metrics && (
          <div className="space-y-4 animate-fade-up">
            {bar('Integrated LUFS', metrics.integrated, 'LUFS', -30, 0, '#22d3ee')}
            {bar('Short-Term LUFS', metrics.shortTerm, 'LUFS', -30, 0, '#8b5cf6')}
            {bar('True Peak', metrics.truePeak, 'dBTP', -18, 0, '#f43f5e')}
            {bar('Dynamic Range', metrics.dynamicRange, 'dB', 0, 30, '#d4af37')}
            {bar('Crest Factor', metrics.crest, 'dB', 0, 20, '#f59e0b')}

            <div className="mt-4 p-3 rounded-lg bg-nodaw-black/50 border border-nodaw-border">
              <p className="text-xs font-semibold uppercase tracking-wider text-nodaw-muted mb-2">Targets</p>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <span className="text-nodaw-dim">Spotify: <span className="text-nodaw-text">-14 LUFS</span></span>
                <span className="text-nodaw-dim">YouTube: <span className="text-nodaw-text">-14 LUFS</span></span>
                <span className="text-nodaw-dim">Apple Music: <span className="text-nodaw-text">-16 LUFS</span></span>
                <span className="text-nodaw-dim">Mastering: <span className="text-nodaw-text">-9 to -13 LUFS</span></span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
