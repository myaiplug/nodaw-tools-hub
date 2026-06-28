import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function InstrumentalExtractor() {
  const [file, setFile] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [strength, setStrength] = useState(70)
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
      const decoded = await ctx.decodeAudioData(buffer)
      const len = Math.min(decoded.length, ctx.length)
      const out = ctx.createBuffer(2, len, decoded.sampleRate)
      const outL = out.getChannelData(0)
      const outR = out.getChannelData(1)
      if (decoded.numberOfChannels >= 2) {
        const L = decoded.getChannelData(0)
        const R = decoded.getChannelData(1)
        const s = strength / 100
        for (let i = 0; i < len; i++) {
          const diff = (L[i] - R[i]) * 0.5
          const sum = (L[i] + R[i]) * 0.5
          outL[i] = sum + diff * s
          outR[i] = sum + diff * s
        }
      } else {
        for (let i = 0; i < len; i++) {
          const s = decoded.getChannelData(0)[i]
          outL[i] = s
          outR[i] = s
        }
      }
      const src = ctx.createBufferSource()
      src.buffer = out
      src.connect(ctx.destination)
      src.start()
      const rendered = await ctx.startRendering()
      const wav = bufferToWav(rendered)
      const url = URL.createObjectURL(new Blob([wav], { type: 'audio/wav' }))
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
      urlRef.current = url
      if (audioRef.current) audioRef.current.src = url
    } catch (err) { console.error(err) }
    setProcessing(false)
  }, [file, strength])

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="fx-rack p-6 space-y-4">
        <label className="block w-full cursor-pointer">
          <div className="border-2 border-dashed border-nodaw-dim rounded-xl p-6 text-center hover:border-nodaw-gold/40 transition-colors">
            <input type="file" accept="audio/*" onChange={handleFile} className="hidden" />
            <p className="text-nodaw-muted text-sm">
              {file ? file.name : 'Drop a song or click to browse'}
            </p>
          </div>
        </label>

        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-nodaw-muted">
            Reduction Strength <span className="text-nodaw-gold">{strength}%</span>
          </label>
          <input type="range" min={0} max={100} value={strength} onChange={(e) => setStrength(+e.target.value)} className="w-full accent-nodaw-gold" />
        </div>

        <button
          onClick={process}
          disabled={!file || processing}
          className="w-full py-3 rounded-xl font-bold text-sm uppercase tracking-widest bg-nodaw-gold/10 border border-nodaw-gold/30 text-nodaw-gold hover:bg-nodaw-gold/20 transition-all disabled:opacity-30"
        >
          {processing ? 'Extracting...' : 'Extract Instrumental'}
        </button>

        <AnimatePresence>
          {urlRef.current && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <audio ref={audioRef} controls className="w-full rounded-lg" />
              <a href={urlRef.current} download={`instrumental-${file?.name || 'output'}.wav`}
                className="block text-center py-2 rounded-lg bg-nodaw-card border border-nodaw-border text-nodaw-cyan text-sm font-semibold hover:border-nodaw-cyan/30 transition-all">
                Download Instrumental (WAV)
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function bufferToWav(buffer) {
  const numChannels = buffer.numberOfChannels, sampleRate = buffer.sampleRate, length = buffer.length
  const bitsPerSample = 16, blockAlign = numChannels * bitsPerSample / 8
  const dataSize = length * blockAlign, bufferSize = 44 + dataSize
  const ab = new ArrayBuffer(bufferSize), v = new DataView(ab)
  writeString(v, 0, 'RIFF'); v.setUint32(4, bufferSize - 8, true)
  writeString(v, 8, 'WAVE'); writeString(v, 12, 'fmt '); v.setUint32(16, 16, true)
  v.setUint16(20, 1, true); v.setUint16(22, numChannels, true)
  v.setUint32(24, sampleRate, true); v.setUint32(28, sampleRate * blockAlign, true)
  v.setUint16(32, blockAlign, true); v.setUint16(34, bitsPerSample, true)
  writeString(v, 36, 'data'); v.setUint32(40, dataSize, true)
  let o = 44
  for (let i = 0; i < length; i++) for (let ch = 0; ch < numChannels; ch++) {
    const s = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]))
    v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7FFF, true); o += 2
  }
  return ab
}
function writeString(v, o, s) { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)) }
