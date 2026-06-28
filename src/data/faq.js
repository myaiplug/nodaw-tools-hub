const faq = {
  '/trim': [
    { q: 'How do I trim an audio file online for free?', a: 'Upload your audio file to TrimIT, then drag the selection handles on the waveform to choose your start and end points. You can also apply fades, reverse the audio, and undo/redo any change. Click export to download your trimmed file — all processing happens in your browser, nothing is uploaded to any server.' },
    { q: 'Can I trim MP3 files without losing quality?', a: 'Yes. TrimIT uses the Web Audio API to process audio entirely in your browser. MP3, WAV, OGG, FLAC, and M4A files are decoded, trimmed, and re-encoded without any server-side processing. For lossless trimming, export as WAV or FLAC.' },
    { q: 'Is it safe to upload my audio files?', a: 'No files are uploaded anywhere. TrimIT runs completely in your browser using JavaScript. Your audio never leaves your computer.' },
    { q: 'What audio formats does TrimIT support?', a: 'TrimIT supports MP3, WAV, OGG, FLAC, and M4A files for input. You can export trimmed audio as WAV (uncompressed) or MP3 (compressed).' },
  ],
  '/convert': [
    { q: 'What audio formats can I convert between?', a: 'ConvertIT supports conversion between MP3, WAV, OGG, FLAC, and M4A formats. You can also extract audio from MP4 video files. All conversion happens locally in your browser with no file size limits.' },
    { q: 'Can I extract audio from a video file?', a: 'Yes. Upload an MP4 video file and ConvertIT will extract the audio track and let you download it in your choice of format. The video file stays on your computer — nothing is uploaded to a server.' },
    { q: 'Is audio conversion lossless?', a: 'WAV and FLAC exports are lossless. MP3, OGG, and M4A use lossy compression — you can adjust the quality setting to balance file size against audio quality.' },
    { q: 'What is the maximum file size I can convert?', a: 'There is no artificial limit. File size is limited only by your browser\'s available memory. Most modern browsers can handle files up to several hundred megabytes.' },
  ],
  '/fx': [
    { q: 'What audio effects are available in FxIT?', a: 'FxIT includes reverb, delay, chorus, flanger, phaser, distortion, bitcrusher, filter, and pitch shift. Each effect has adjustable parameters and can be toggled on/off independently in the effects chain.' },
    { q: 'Can I use multiple effects at the same time?', a: 'Yes. FxIT has a modular effects chain where you can enable, disable, and reorder multiple effects. Each effect processes your audio in real time so you can hear the combined result before exporting.' },
    { q: 'Are there preset configurations available?', a: 'Yes. FxIT includes several factory presets like "Warm Hall", "Tape Saturation", and "Phone Filter" that configure multiple effects at once to achieve a specific sound.' },
  ],
  '/test': [
    { q: 'What is A/B testing for audio mastering?', a: 'A/B testing lets you compare two versions of a mix or master side by side. TestIT switches between your reference track and processed track instantly so you can hear differences in level, EQ, compression, and stereo image without bias.' },
    { q: 'Can I import reference tracks for comparison?', a: 'Yes. Load up to two audio files and switch between them with a button press or keyboard shortcut. Each track has independent gain control for level-matched comparison.' },
  ],
  '/vocal-isolator': [
    { q: 'How does vocal isolation work?', a: 'Vocal Isolator uses center channel phase cancellation. In most stereo recordings, vocals are panned to the center while instruments spread across the stereo field. By subtracting the left channel from the right channel, center-panned sounds (vocals) are extracted while side-panned instruments are reduced.' },
    { q: 'Can I isolate vocals from any song?', a: 'The tool works best on well-mixed stereo recordings where vocals are panned to center. Mono recordings or songs where vocals are heavily panned to one side may produce lower quality results. The blend control lets you adjust the extraction strength.' },
    { q: 'Is my audio uploaded to a server?', a: 'No. All processing happens entirely in your web browser using the Web Audio API. Your audio file never leaves your computer.' },
    { q: "Why are there artifacts in the isolated vocals?", a: 'Phase cancellation is a simple technique that works well but can leave musical artifacts, especially with complex mixes. For professional-quality vocal separation, try Liminal StemSplit Pro which uses AI-powered source separation.' },
    { q: 'What\'s the difference between this and Liminal StemSplit Pro?', a: 'This free tool uses instant phase cancellation — fast but imperfect. Liminal StemSplit Pro uses trained AI models (Demucs, MDX, VR architecture) for much cleaner separation across multiple stems (vocals, drums, bass, other).' },
  ],
  '/karaoke': [
    { q: 'How does the karaoke maker remove vocals?', a: 'The karaoke maker removes center-panned vocals using phase cancellation — subtracting the left channel from the right channel. This leaves the instrumental content (typically panned wider) intact while eliminating or reducing the lead vocal.' },
    { q: 'Can I change the key of a karaoke track?', a: 'The key shift control lets you raise or lower the pitch by up to 12 semitones. This is useful if the original key doesn\'t suit your vocal range. Note: pitch shifting currently uses basic resampling — a more advanced real-time pitch shift is planned.' },
    { q: 'Can I slow down or speed up a karaoke track?', a: 'Yes. The tempo control adjusts playback speed from -50% to +50%. This changes pitch too unless used with the key shift control for compensation.' },
    { q: 'Why can\'t I hear the vocals removed completely?', a: 'Phase cancellation removes center-panned content but may leave residual vocals if they have stereo reverb or double-tracking. The effectiveness depends on the original mix. Our pro tool Liminal StemSplit uses AI for cleaner removal.' },
  ],
  '/instrumental': [
    { q: 'What is instrumental extraction?', a: 'Instrumental extraction removes or reduces the vocal content from a song while preserving the instrumental elements. The reduction strength slider controls how aggressively vocals are removed.' },
    { q: 'Can I use extracted instrumentals for remixes?', a: 'Yes, but be aware of copyright. The extracted instrumental is a derivative of the original work. For remixing, consider using officially released instrumental versions or royalty-free music.' },
    { q: 'How is this different from the vocal isolator?', a: 'The vocal isolator extracts vocals (center channel). The instrumental extractor removes vocals (inverted center channel). They produce complementary results — use whichever fits your workflow.' },
  ],
  '/enhancer': [
    { q: 'What does audio enhancement do?', a: 'The enhancer applies multi-band EQ (low, mid, high), compression, stereo widening, and loudness normalization to improve audio clarity and presence. Each parameter is independently adjustable.' },
    { q: 'What do the low, mid, and high EQ bands control?', a: 'Low (bass, ~20-250 Hz), Mid (vocals and instruments, ~250 Hz-4 kHz), and High (treble/air, ~4 kHz-20 kHz). Boost or cut each band by up to 12 dB.' },
    { q: 'How does stereo widening work?', a: 'Stereo width adjusts the balance between mid (center) and side (stereo) content. 100% is the original stereo image. Above 100% exaggerates stereo separation. Below 100% narrows the stereo field toward mono.' },
  ],
  '/lufs': [
    { q: 'What is LUFS?', a: 'LUFS (Loudness Units relative to Full Scale) is the standard for measuring perceived loudness in audio mastering. It accounts for how human hearing perceives volume across different frequencies, unlike simple peak or RMS measurements.' },
    { q: 'What LUFS level should I master to?', a: 'Streaming platforms use different targets: Spotify and YouTube normalize to -14 LUFS, Apple Music to -16 LUFS, and Amazon Music to -10 to -14 LUFS. For general mastering, -9 to -13 LUFS is a common range depending on genre.' },
    { q: 'What\'s the difference between integrated and short-term LUFS?', a: 'Integrated LUFS measures the average loudness over the entire track. Short-term LUFS measures loudness over a 3-second sliding window, showing how loudness changes throughout the song.' },
    { q: 'What is true peak?', a: 'True peak measures the actual maximum level of your audio after digital-to-analog conversion, accounting for inter-sample peaks that standard peak meters miss. Keep true peak below -1 dBTP for clean streaming playback.' },
  ],
  '/mastering': [
    { q: 'What is audio mastering?', a: 'Mastering is the final step in audio production — applying compression, EQ, limiting, and loudness normalization to polish a mix for distribution. The Mastering Tool provides a complete chain of processors to prepare your track for streaming platforms.' },
    { q: 'What LUFS target should I use for mastering?', a: '-14 LUFS is the standard for Spotify and YouTube. -16 LUFS for Apple Music. The Mastering Tool lets you set your target and automatically normalizes to it. For most genres, -9 to -13 LUFS is ideal.' },
    { q: 'What\'s the difference between compression and limiting?', a: 'Compression reduces the dynamic range of your audio with a ratio typically between 2:1 and 10:1. Limiting (ratio 20:1 or higher) catches only the loudest peaks to prevent clipping. The Mastering Tool has both — use compression for overall dynamics and the limiter as a safety ceiling.' },
    { q: 'Can I master any audio file?', a: 'Yes. Upload any supported audio file (MP3, WAV, FLAC, OGG, M4A) and the Mastering Tool processes it through a full chain: compressor, limiter, stereo widener, and LUFS normalization. All processing is done in your browser.' },
  ],
  '/ico': [
    { q: 'What image formats can I convert to ICO?', a: 'ImageToICO supports PNG, JPG, GIF, and WebP input images. The output is a standard .ico file containing multiple resolutions suitable for use as website favicons.' },
    { q: 'What sizes are included in the generated ICO file?', a: 'The ICO file includes 16×16, 32×32, 48×48, 64×64, 128×128, and 256×256 pixel versions. Browsers and operating systems will automatically select the appropriate size.' },
    { q: 'Can I use the generated ICO for my website?', a: 'Yes. Just place the generated .ico file in your website root as favicon.ico or link to it using &lt;link rel="icon" href="/path/to/favicon.ico"&gt; in your HTML head.' },
  ],
}

export default faq
