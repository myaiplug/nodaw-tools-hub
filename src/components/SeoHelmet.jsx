import { Helmet } from 'react-helmet-async'

const site = {
  name: 'NoDAW Tools',
  shortName: 'NoDAW',
  url: 'https://tools.halfscrew.com',
  twitter: '@halfscrew',
  logo: 'https://tools.halfscrew.com/og-image.png',
}

const pages = {
  '/': {
    title: 'Free Online Audio Tools | NoDAW Tools by HalfScrew',
    description:
      'Professional free online audio tools: trim, convert, split vocals, make karaoke, master tracks, and analyze loudness — all in your browser. No install, no upload to servers.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'NoDAW Tools',
      url: 'https://tools.halfscrew.com',
      description: 'Free online professional audio processing tools. Trim, convert, extract vocals, make karaoke, master tracks, and analyze loudness in your browser.',
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'All',
      browserRequirements: 'Requires JavaScript',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
  },
  '/trim': {
    title: 'Free Online Audio Trimmer & Cutter | NoDAW TrimIT',
    description:
      'Trim, cut, fade, and reverse audio files online for free. Visual waveform editor with undo/redo. Supports MP3, WAV, OGG, FLAC, M4A. No uploads, all in-browser.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'TrimIT - Audio Trimmer',
      description: 'Free online audio trimming tool with waveform visualization, fade in/out, reverse, and undo/redo support.',
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'All',
    },
  },
  '/convert': {
    title: 'Free Online Audio Converter | NoDAW ConvertIT',
    description:
      'Convert audio files between MP3, WAV, OGG, FLAC, and M4A online for free. Batch convert, adjust quality, all in your browser. No uploads, no limits.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'ConvertIT - Audio Converter',
      description: 'Free online audio converter supporting MP3, WAV, OGG, FLAC, and M4A formats.',
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'All',
    },
  },
  '/fx': {
    title: 'Free Online Audio Effects | NoDAW FxIT',
    description:
      'Apply real-time audio effects online for free: reverb, delay, chorus, flanger, phaser, distortion, bitcrusher, filter, pitch shift. All in-browser, no install.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'FxIT - Audio Effects Processor',
      description: 'Free online multi-effects processor with reverb, delay, chorus, flanger, phaser, distortion, bitcrusher, and more.',
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'All',
    },
  },
  '/test': {
    title: 'Free Online A/B Audio Test Tool | NoDAW TestIT',
    description:
      'Compare two audio versions side-by-side with blind A/B testing, EQ matching, and spectrum analysis. Perfect for mastering engineers and producers.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'TestIT - A/B Audio Comparator',
      description: 'Professional A/B audio comparison tool with blind testing, EQ matching, and spectrum analysis.',
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'All',
    },
  },
  '/vocal-isolator': {
    title: 'Free Online Vocal Isolator & Extractor | NoDAW Tools',
    description:
      'Isolate vocals from any song online for free. Extract vocal stems using center channel phase cancellation. No upload, no install, works in your browser.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Vocal Isolator',
      description: 'Free online vocal isolation tool using phase cancellation to extract vocals from stereo tracks.',
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'All',
    },
  },
  '/karaoke': {
    title: 'Free Online Karaoke Maker | Remove Vocals | NoDAW Tools',
    description:
      'Make karaoke tracks from any song for free. Remove vocals from MP3 files online, adjust key and tempo. Perfect for singers, parties, and practice.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Karaoke Maker',
      description: 'Free online karaoke maker that removes vocals from any song. Adjustable key and tempo controls.',
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'All',
    },
  },
  '/instrumental': {
    title: 'Free Online Instrumental Extractor | NoDAW Tools',
    description:
      'Extract instrumental tracks from any song for free. Remove vocals while preserving music quality. Perfect for remixes, sampling, and practice.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Instrumental Extractor',
      description: 'Free online instrumental track extraction tool. Remove vocals from music while preserving instrumental quality.',
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'All',
    },
  },
  '/ico': {
    title: 'Free Online ICO Converter | Image to ICO | NoDAW Tools',
    description:
      'Convert PNG, JPG, or WebP images to ICO favicon format online for free. Generate multi-size ICO files for your website. No uploads, all in-browser.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'ImageToICO - Favicon Generator',
      description: 'Free online image to ICO converter for creating favicons from PNG, JPG, and WebP images.',
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'All',
    },
  },
  '/enhancer': {
    title: 'Free Online Audio Enhancer | NoDAW Tools',
    description:
      'Enhance your audio online for free. Improve clarity with EQ, compression, stereo widening, and loudness optimization. All in your browser.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Audio Enhancer',
      description: 'Free online audio enhancement tool with parametric EQ, compression, stereo widening, and loudness optimization.',
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'All',
    },
  },
  '/lufs': {
    title: 'Free Online LUFS Meter & Loudness Analyzer | NoDAW Tools',
    description:
      'Measure integrated LUFS, short-term LUFS, true peak, and dynamic range of your audio online for free. Perfect for mastering and loudness normalization.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'LUFS Meter',
      description: 'Free online loudness meter measuring integrated LUFS, short-term LUFS, true peak, and dynamic range.',
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'All',
    },
  },
  '/mastering': {
    title: 'Free Online Audio Mastering Tool | NoDAW Tools',
    description:
      'Master your tracks online for free. Professional mastering chain with compressor, limiter, EQ, stereo widener, and loudness normalization. No install required.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Mastering Tool',
      description: 'Free online audio mastering chain with compressor, limiter, parametric EQ, stereo widener, and loudness normalization.',
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'All',
    },
  },
}

export default function SeoHelmet({ path }) {
  const page = pages[path]
  if (!page) return null
  return (
    <Helmet>
      <title>{page.title}</title>
      <meta name="description" content={page.description} />
      <meta property="og:title" content={page.title} />
      <meta property="og:description" content={page.description} />
      <meta property="og:url" content={`${site.url}${path}`} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={site.name} />
      <meta property="og:image" content={site.logo} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={site.twitter} />
      <meta name="twitter:title" content={page.title} />
      <meta name="twitter:description" content={page.description} />
      <meta name="twitter:image" content={site.logo} />
      <link rel="canonical" href={`${site.url}${path}`} />
      <script type="application/ld+json">{JSON.stringify(page.jsonLd)}</script>
    </Helmet>
  )
}
