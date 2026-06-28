import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Download, FileAudio, Loader2, CheckCircle2, AlertCircle, ArrowLeft,
  AudioWaveform, Film, X, Sparkles,
} from 'lucide-react';
import {
  decodeAudioFile, encodeWAV, encodeMP3, isAudioLikeFile,
  formatTime, getFileNameWithoutExt,
} from '../utils/audio';

const OUTPUT_FORMATS = [
  { value: 'wav', label: 'WAV', sub: 'Lossless PCM 16-bit', icon: FileAudio, color: 'nodaw-cyan' },
  { value: 'mp3', label: 'MP3', sub: 'Compressed', icon: FileAudio, color: 'nodaw-gold' },
];

const MP3_BITRATES = [128, 192, 256, 320];

const ConvertIT = ({ onBack }) => {
  const [file, setFile] = useState(null);
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [sourceKind, setSourceKind] = useState(null);
  const [targetFormat, setTargetFormat] = useState('wav');
  const [mp3Bitrate, setMp3Bitrate] = useState(192);
  const [isConverting, setIsConverting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const [convertedBlob, setConvertedBlob] = useState(null);
  const [convertedUrl, setConvertedUrl] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef(null);
  const audioRef = useRef(null);
  const convertedAudioRef = useRef(null);

  const reset = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (convertedUrl) URL.revokeObjectURL(convertedUrl);
    setFile(null);
    setAudioBuffer(null);
    setPreviewUrl(null);
    setSourceKind(null);
    setConvertedBlob(null);
    setConvertedUrl(null);
    setShowPreview(false);
    setError(null);
  }, [previewUrl, convertedUrl]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (convertedUrl) URL.revokeObjectURL(convertedUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFile = useCallback(async (f) => {
    if (!isAudioLikeFile(f)) {
      setError('Unsupported file. Drop an MP3, WAV, M4A, OGG, FLAC, MP4, or MOV.');
      return;
    }
    setError(null);
    setConvertedBlob(null);
    setConvertedUrl(null);
    setFile(f);

    try {
      const { audioBuffer: buf } = await decodeAudioFile(f);
      setAudioBuffer(buf);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(f));
      const t = (f.type || '').toLowerCase();
      if (t.startsWith('video/') || /\.(mp4|m4v|mov|m4a)$/i.test(f.name || '')) {
        setSourceKind('mp4');
      } else {
        setSourceKind('audio');
      }
    } catch (err) {
      setError('Could not decode this file. Some MP4 codecs (e.g. HEVC) are not supported by your browser.');
      console.error(err);
    }
  }, [previewUrl]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleConvert = async () => {
    if (!audioBuffer) return;
    setIsConverting(true);
    setError(null);
    try {
      let blob;
      if (targetFormat === 'wav') {
        blob = encodeWAV(audioBuffer);
      } else {
        blob = await encodeMP3(audioBuffer, mp3Bitrate);
      }
      if (convertedUrl) URL.revokeObjectURL(convertedUrl);
      const url = URL.createObjectURL(blob);
      setConvertedBlob(blob);
      setConvertedUrl(url);
      setShowPreview(true);
    } catch (err) {
      setError('Conversion failed: ' + err.message);
      console.error(err);
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (!convertedBlob) return;
    const ext = targetFormat === 'wav' ? '.wav' : '.mp3';
    const base = getFileNameWithoutExt(file?.name || 'audio');
    const suffix = sourceKind === 'mp4' ? '_extracted' : '';
    const a = document.createElement('a');
    a.href = convertedUrl;
    a.download = base + suffix + ext;
    a.click();
  };

  if (convertedBlob) {
    const ext = targetFormat.toUpperCase();
    const sizeMB = (convertedBlob.size / (1024 * 1024)).toFixed(2);
    return (
      <div className="max-w-2xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-nodaw-muted hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Tools
        </button>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-strong rounded-3xl p-10 text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight mb-2">Converted</h2>
          <p className="text-nodaw-muted mb-1">
            {file?.name} <span className="text-nodaw-gold mx-2">→</span> {ext} ({sizeMB} MB)
          </p>
          {sourceKind === 'mp4' && (
            <p className="text-xs text-nodaw-cyan uppercase tracking-widest mt-2 flex items-center justify-center gap-2">
              <Sparkles className="w-3 h-3" /> Audio track extracted from video
            </p>
          )}
          {showPreview && (
            <div className="my-6">
              <audio ref={convertedAudioRef} src={convertedUrl} controls className="w-full rounded-xl" />
            </div>
          )}
          <button onClick={handleDownload} className="px-8 py-4 rounded-2xl bg-gradient-to-r from-nodaw-gold to-nodaw-amber text-nodaw-black font-black text-sm uppercase tracking-widest hover:shadow-lg hover:shadow-nodaw-gold/30 transition-all active:scale-95 inline-flex items-center gap-2">
            <Download className="w-5 h-5" /> Download {ext}
          </button>
          <button onClick={reset} className="block mx-auto mt-4 text-sm text-nodaw-muted hover:text-white transition-colors">
            Convert Another File
          </button>
        </motion.div>
      </div>
    );
  }

  const SourceIcon = sourceKind === 'mp4' ? Film : AudioWaveform;
  const inputAccept = 'audio/*,video/mp4,video/quicktime,video/webm,.mp3,.wav,.m4a,.aac,.flac,.ogg,.mp4,.m4v,.mov';

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-nodaw-muted hover:text-white mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Tools
      </button>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-3xl p-8 md:p-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-nodaw-gold/10 flex items-center justify-center">
            <AudioWaveform className="w-6 h-6 text-nodaw-gold" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">ConvertIT</h2>
            <p className="text-sm text-nodaw-muted">Audio & MP4 → WAV / MP3. Lossless, browser-native.</p>
          </div>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all mt-6 ${
            isDragging ? 'border-nodaw-gold bg-nodaw-gold/5' : 'border-nodaw-border hover:border-nodaw-gold/30'
          }`}
        >
          <input ref={fileInputRef} type="file" accept={inputAccept} className="hidden" onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])} />
          {file ? (
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${sourceKind === 'mp4' ? 'bg-nodaw-cyan/10' : 'bg-nodaw-gold/10'}`}>
                <SourceIcon className={`w-7 h-7 ${sourceKind === 'mp4' ? 'text-nodaw-cyan' : 'text-nodaw-gold'}`} />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-white font-semibold truncate">{file.name}</p>
                <p className="text-xs text-nodaw-muted mt-1">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                  {audioBuffer && <> • {formatTime(audioBuffer.duration)} • {audioBuffer.sampleRate}Hz</>}
                </p>
                {sourceKind === 'mp4' && (
                  <p className="text-xs text-nodaw-cyan mt-1">MP4 detected — audio track will be extracted</p>
                )}
              </div>
              <button onClick={(e) => { e.stopPropagation(); reset(); }} className="p-2 rounded-lg hover:bg-white/5 text-nodaw-muted">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div>
              <Upload className="w-10 h-10 mx-auto mb-3 text-nodaw-dim" />
              <p className="text-white font-semibold">Drop audio or video here</p>
              <p className="text-sm text-nodaw-muted mt-1">MP3, WAV, M4A, OGG, FLAC, AAC, MP4, MOV</p>
            </div>
          )}
        </div>

        {audioBuffer && (
          <div className="mt-6 space-y-5">
            <audio ref={audioRef} src={previewUrl} controls className="w-full rounded-xl" />

            <div>
              <label className="text-xs font-bold text-nodaw-muted uppercase tracking-widest mb-2 block">Output Format</label>
              <div className="grid grid-cols-2 gap-3">
                {OUTPUT_FORMATS.map(fmt => {
                  const Icon = fmt.icon;
                  const selected = targetFormat === fmt.value;
                  return (
                    <button
                      key={fmt.value}
                      onClick={() => setTargetFormat(fmt.value)}
                      className={`flex items-center gap-3 p-4 rounded-xl text-left transition-all ${
                        selected
                          ? 'bg-nodaw-gold/15 border border-nodaw-gold/50 text-white'
                          : 'glass border border-nodaw-border text-nodaw-muted hover:text-white'
                      }`}
                    >
                      <Icon className={`w-6 h-6 ${selected ? 'text-nodaw-gold' : ''}`} />
                      <div>
                        <div className="font-bold text-base">{fmt.label}</div>
                        <div className="text-xs opacity-70">{fmt.sub}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {targetFormat === 'mp3' && (
              <div>
                <label className="text-xs font-bold text-nodaw-muted uppercase tracking-widest mb-2 block">MP3 Bitrate</label>
                <div className="grid grid-cols-4 gap-2">
                  {MP3_BITRATES.map(br => (
                    <button key={br} onClick={() => setMp3Bitrate(br)} className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      mp3Bitrate === br ? 'bg-nodaw-gold text-nodaw-black' : 'glass text-nodaw-muted hover:text-white'
                    }`}>
                      {br}k
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button onClick={handleConvert} disabled={isConverting} className="w-full py-4 rounded-xl bg-gradient-to-r from-nodaw-gold to-nodaw-amber text-nodaw-black font-black text-sm uppercase tracking-widest hover:shadow-lg hover:shadow-nodaw-gold/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2">
              {isConverting ? <><Loader2 className="w-4 h-4 animate-spin" /> Converting...</> : <><Download className="w-4 h-4" /> Convert & Download</>}
            </button>
          </div>
        )}

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ConvertIT;
