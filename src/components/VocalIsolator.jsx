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
        for (let ch = 0; ch < decoded.numberOfChannels; ch++) {
          limited.copyToChannel(decoded.getChannelData(ch).slice(0, ctx.length), ch)
        }
        ctx.samples = ctx.length
        ctx.buffer = limited
      } else {
        ctx.buffer = decoded
      }

      const src = ctx.createBufferSource()
      src.buffer = ctx.buffer
      src.connect(ctx.destination)

      if (ctx.buffer.numberOfChannels >= 2) {
        const L = ctx.buffer.getChannelData(0)
        const R = ctx.buffer.getChannelData(1)
        const outL = ctx.createBuffer(2, ctx.buffer.length, ctx.sampleRate)
        const outR = outL.getChannelData(0)
        const outLch = outL.getChannelData(1)

        const b = blend / 100
        for (let i = 0; i < ctx.buffer.length; i++) {
          const sum = (L[i] + R[i]) * 0.5
          const diff = (L[i] - R[i]) * 0.5
          if (mode === 'vocals') {
            outR[i] = sum * b + diff * (1 - b)
            outLch[i] = sum * b + diff * (1 - b)
          } else {
            outR[i] = diff * b + sum * (1 - b)
            outLch[i] = diff * b + sum * (1 - b)
          }
        }

        const finalSrc = ctx.createBufferSource()
        finalSrc.buffer = outL
        finalSrc.connect(ctx.destination)
        finalSrc.start()
      } else {
        src.start()
      }

      const rendered = await ctx.startRendering()
      const wav = bufferToWav(rendered)
      const url = URL.createObjectURL(new Blob([wav], { type: 'audio/wav' }))
      if (sourceRef.current) URL.revokeObjectURL(sourceRef.current)
      sourceRef.current = url
      if (audioRef.current) audioRef.current.src = url
    } catch (err) {
      console.error(err)
    }
    setProcessing(false)
  }, [file, mode, blend])

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="fx-rack p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="block w-full cursor-pointer">
              <div className="border-2 border-dashed border-nodaw-dim rounded-xl p-6 text-center hover:border-nodaw-gold/40 transition-colors">
                <input type="file" accept="audio/*" onChange={handleFile} className="hidden" />
                <p className="text-nodaw-muted text-sm">
                  {file ? file.name : 'Drop an audio file or click to browse'}
                </p>
              </div>
            </label>
          </div>
        </div>

        <div className="flex gap-2">
          {['vocals', 'instrumental'].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold uppercase tracking-wider transition-all ${
                mode === m
                  ? 'bg-nodaw-gold/20 text-nodaw-gold border border-nodaw-gold/40'
                  : 'bg-nodaw-card text-nodaw-muted border border-nodaw-border hover:border-nodaw-gold/20'
              }`}
            >
              {m === 'vocals' ? 'Extract Vocals' : 'Remove Vocals'}
            </button>
          ))}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-nodaw-muted">Blend</label>
          <input
            type="range"
            min={0}
            max={100}
            value={blend}
            onChange={(e) => setBlend(+e.target.value)}
            className="w-full accent-nodaw-gold"
          />
          <div className="flex justify-between text-xs text-nodaw-dim">
            <span>Wide</span>
            <span>{blend}%</span>
            <span>Center</span>
          </div>
        </div>

        <button
          onClick={process}
          disabled={!file || processing}
          className="w-full py-3 rounded-xl font-bold text-sm uppercase tracking-widest bg-nodaw-gold/10 border border-nodaw-gold/30 text-nodaw-gold hover:bg-nodaw-gold/20 transition-all disabled:opacity-30"
        >
          {processing ? 'Processing...' : mode === 'vocals' ? 'Extract Vocals' : 'Remove Vocals'}
        </button>

        <AnimatePresence>
          {sourceRef.current && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <audio ref={audioRef} controls className="w-full rounded-lg" />
              <a
                href={sourceRef.current}
                download={`${mode}-${file?.name || 'output'}.wav`}
                className="block text-center py-2 rounded-lg bg-nodaw-card border border-nodaw-border text-nodaw-cyan text-sm font-semibold hover:border-nodaw-cyan/30 transition-all"
              >
                Download {mode === 'vocals' ? 'Vocals' : 'Instrumental'} (WAV)
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="fx-module p-4 text-xs text-nodaw-muted space-y-1" style={{ color: '#22d3ee' }}>
        <p className="font-semibold uppercase tracking-wider text-nodaw-cyan">How it works</p>
        <p>This tool uses center channel phase cancellation to isolate or remove vocals from stereo tracks. Works best on well-mixed stereo recordings. For professional isolation, try our <a href="https://liminal-stemsplit.onrender.com" className="text-nodaw-gold hover:underline" target="_blank" rel="noopener">Liminal StemSplit Pro</a>.</p>
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
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
}
