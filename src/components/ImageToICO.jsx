import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, Download, Image, ArrowLeft, Loader2, AlertCircle, CheckCircle2, RotateCcw, Eye } from 'lucide-react';
import { imageToICO, loadImageFromFile, previewImage } from '../utils/image';

const ICO_SIZES = [16, 32, 48, 64, 128, 256];

const ImageToICO = ({ onBack }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [imageElement, setImageElement] = useState(null);
  const [selectedSizes, setSelectedSizes] = useState([16, 32, 48, 64, 128, 256]);
  const [isConverting, setIsConverting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const [icoUrl, setIcoUrl] = useState(null);
  const [icoBlob, setIcoBlob] = useState(null);
  const [imageDimensions, setImageDimensions] = useState(null);
  const fileInputRef = useRef(null);

  const handleFile = useCallback(async (f) => {
    if (!f || !f.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }
    setError(null);
    setIcoUrl(null);
    setIcoBlob(null);
    setFile(f);

    try {
      const dataUrl = await previewImage(f);
      setPreview(dataUrl);

      const img = await loadImageFromFile(f);
      setImageElement(img);
      setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    } catch (err) {
      setError('Could not load image.');
      console.error(err);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const toggleSize = (size) => {
    setSelectedSizes(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size].sort((a, b) => a - b)
    );
  };

  const handleConvert = async () => {
    if (!imageElement || selectedSizes.length === 0) return;
    setIsConverting(true);
    setError(null);

    try {
      const blob = imageToICO(imageElement, selectedSizes);
      if (icoUrl) URL.revokeObjectURL(icoUrl);
      const url = URL.createObjectURL(blob);
      setIcoUrl(url);
      setIcoBlob(blob);
    } catch (err) {
      setError('Conversion failed: ' + err.message);
      console.error(err);
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (!icoBlob) return;
    const name = file?.name.replace(/\.[^/.]+$/, '') || 'icon';
    const a = document.createElement('a');
    a.href = icoUrl;
    a.download = name + '.ico';
    a.click();
  };

  if (icoUrl) {
    const sizeMB = (icoBlob.size / 1024).toFixed(1);
    return (
      <div className="max-w-2xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-nodaw-muted hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Tools
        </button>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-strong rounded-3xl p-10 text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight mb-2">ICO Generated</h2>
          <p className="text-nodaw-muted mb-2">{selectedSizes.length} sizes embedded • {sizeMB} KB</p>
          <p className="text-xs text-nodaw-dim mb-6">{selectedSizes.map(s => s + 'px').join(', ')}</p>

          <div className="flex items-center justify-center gap-6 mb-8">
            {selectedSizes.slice(0, 4).map(size => (
              <div key={size} className="text-center">
                <img src={icoUrl} alt={`${size}px preview`} style={{ width: size, height: size }} className="rounded-lg border border-nodaw-border" />
                <p className="text-xs text-nodaw-muted mt-1">{size}px</p>
              </div>
            ))}
          </div>

          <button onClick={handleDownload} className="px-8 py-4 rounded-2xl bg-gradient-to-r from-nodaw-rose to-nodaw-gold text-white font-black text-sm uppercase tracking-widest hover:shadow-lg hover:shadow-nodaw-rose/30 transition-all active:scale-95 inline-flex items-center gap-2">
            <Download className="w-5 h-5" /> Download .ICO
          </button>

          <button onClick={() => { setIcoUrl(null); setIcoBlob(null); }} className="block mx-auto mt-4 text-sm text-nodaw-muted hover:text-white transition-colors">
            Convert Another Image
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-nodaw-muted hover:text-white mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Tools
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-3xl p-8 md:p-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-nodaw-rose/10 flex items-center justify-center">
            <Image className="w-6 h-6 text-nodaw-rose" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Image to ICO</h2>
            <p className="text-sm text-nodaw-muted">Generate multi-resolution ICO files</p>
          </div>
        </div>

        {!preview ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all ${isDragging ? 'border-nodaw-rose bg-nodaw-rose/5' : 'border-nodaw-border hover:border-nodaw-rose/30'}`}
          >
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])} />
            <Upload className="w-10 h-10 mx-auto mb-4 text-nodaw-dim" />
            <p className="text-white font-semibold">Drop image here</p>
            <p className="text-sm text-nodaw-muted mt-1">or click to browse • PNG, JPG, WebP, SVG</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-nodaw-border bg-nodaw-surface flex items-center justify-center">
                <img src={preview} alt="Preview" className="max-w-full max-h-full object-contain" />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold">{file?.name}</p>
                {imageDimensions && (
                  <p className="text-sm text-nodaw-muted">{imageDimensions.width} × {imageDimensions.height}px</p>
                )}
                <p className="text-xs text-nodaw-dim mt-1">{(file?.size / 1024).toFixed(1)} KB</p>
              </div>
              <button onClick={() => { setPreview(null); setImageElement(null); setFile(null); setImageDimensions(null); }} className="p-2 rounded-lg hover:bg-white/5 text-nodaw-muted hover:text-white transition-colors">
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-nodaw-muted uppercase tracking-widest mb-3 block">Include Sizes</label>
              <div className="grid grid-cols-3 gap-2">
                {ICO_SIZES.map(size => (
                  <button key={size} onClick={() => toggleSize(size)} className={`py-2.5 rounded-xl text-sm font-semibold transition-all inline-flex items-center justify-center gap-2 ${
                    selectedSizes.includes(size) ? 'bg-nodaw-rose text-white' : 'glass text-nodaw-muted hover:text-white'
                  }`}>
                    {size}px
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-nodaw-surface border border-nodaw-border">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-4 h-4 text-nodaw-muted" />
                <span className="text-xs font-bold text-nodaw-muted uppercase tracking-widest">Preview Sizes</span>
              </div>
              <div className="flex items-end gap-4">
                {selectedSizes.slice(0, 5).map(size => (
                  <div key={size} className="text-center">
                    <img src={preview} alt="" style={{ width: Math.min(size, 64), height: Math.min(size, 64) }} className="rounded border border-nodaw-border" />
                    <p className="text-[10px] text-nodaw-dim mt-1">{size}px</p>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={handleConvert} disabled={isConverting || selectedSizes.length === 0} className="w-full py-4 rounded-xl bg-gradient-to-r from-nodaw-rose to-nodaw-gold text-white font-black text-sm uppercase tracking-widest hover:shadow-lg hover:shadow-nodaw-rose/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2">
              {isConverting ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Download className="w-4 h-4" /> Generate ICO</>}
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ImageToICO;
