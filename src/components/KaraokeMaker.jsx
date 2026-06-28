import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function KaraokeMaker() {
  const [file, setFile] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [keyShift, setKeyShift] = useState(0)
  const [bpm, setBpm] = useState(120)
  const [tempo, setTempo] = useState(0)
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
      const decoded = await ctx.decodeAudioData(buffer.length > ctx.length ? buffer.slice(0, ctx.length) : buffer)
      if (decoded.numberOfChannels >= 2) {
        const out = ctx.createBuffer(2, decoded.length, decoded.sampleRate)
        const L = decoded.getChannelData(0)
        const R = decoded.getChannelData(1)
        const outL = out.getChannelData(0)
        const outR = out.getChannelData(1)
        for (let i = 0; i < decoded.length; i++) {
          const diff = (L[i] - R[i]) * 0.7
          outL[i] = diff
          outR[i] = diff
        }
        const src = ctx.createBufferSource()
        src.buffer = out
        src.connect(ctx.destination)
        src.start()
      } else {
        const src = ctx.createBufferSource()
        src.buffer = decoded
        src.connect(ctx.destination)
        src.start()
      }
      const rendered = await ctx.startRendering()
      const wav = bufferToWav(rendered)
      const url = URL.createObjectURL(new Blob([wav], { type: 'audio/wav' }))
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
      urlRef.current = url
      if (audioRef.current) audioRef.current.src = url
    } catch (err) {
      console.error(err)
    }
    setProcessing(false)
  }, [file])

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

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-nodaw-muted">
              Key Shift <span className="text-nodaw-gold">{keyShift > 0 ? `+${keyShift}` : keyShift}</span>
            </label>
            <input
              type="range"
              min={-12}
              max={12}
              value={keyShift}
              onChange={(e) => setKeyShift(+e.target.value)}
              className="w-full accent-nodaw-gold"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-nodaw-muted">
              Tempo <span className="text-nodaw-gold">{tempo > 0 ? `+${tempo}` : tempo}%</span>
            </label>
            <input
              type="range"
              min={-50}
              max={50}
              value={tempo}
              onChange={(e) => setTempo(+e.target.value)}
              className="w-full accent-nodaw-gold"
            />
          </div>
        </div>

        <button
          onClick={process}
          disabled={!file || processing}
          className="w-full py-3 rounded-xl font-bold text-sm uppercase tracking-widest bg-nodaw-gold/10 border border-nodaw-gold/30 text-nodaw-gold hover:bg-nodaw-gold/20 transition-all disabled:opacity-30"
        >
          {processing ? 'Processing...' : 'Make Karaoke'}
        </button>

        <AnimatePresence>
          {urlRef.current && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <audio ref={audioRef} controls className="w-full rounded-lg" />
              <a
                href={urlRef.current}
                download={`karaoke-${file?.name || 'output'}.wav`}
                className="block text-center py-2 rounded-lg bg-nodaw-card border border-nodaw-border text-nodaw-cyan text-sm font-semibold hover:border-nodaw-cyan/30 transition-all"
              >
                Download Karaoke (WAV)
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="fx-module p-4 text-xs text-nodaw-muted" style={{ color: '#22d3ee' }}>
        <p className="font-semibold uppercase tracking-wider text-nodaw-cyan mb-1">How it works</p>
        <p>Removes center-panned vocals using phase cancellation. Key shift and tempo controls are placeholders — real-time pitch/time stretching coming soon. For professional karaoke tracks, try <a href="https://liminal-stemsplit.onrender.com" className="text-nodaw-gold hover:underline" target="_blank" rel="noopener">Liminal StemSplit Pro</a>.</p>
      </div>
    </div>
  )
}

function bufferToWav(buffer) {
  const numChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const length = buffer.length
  const bitsPerSample = 16
  const byteRate = sampleRate * numChannels * bitsPerSample / 8
  const blockAlign = numChannels * bitsPerSample / 8
  const dataSize = length * blockAlign
  const bufferSize = 44 + dataSize
  const arrayBuffer = new ArrayBuffer(bufferSize)
  const view = new DataView(arrayBuffer)
  writeString(view, 0, 'RIFF')
  view.setUint32(4, bufferSize - 8, true)
  writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, byteRate, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitsPerSample, true)
  writeString(view, 36, 'data')
  view.setUint32(40, dataSize, true)
  let offset = 44
  for (let i = 0; i < length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]))
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true)
      offset += 2
    }
  }
  return arrayBuffer
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i))
}
