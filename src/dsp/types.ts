/** Which category an effect belongs to. */
export type EffectCategory =
  | 'filter'
  | 'dynamic'
  | 'spatial'
  | 'time'
  | 'modulation'
  | 'utility'
  | 'distortion'
  | 'pitch'

/** Quality / latency preset for the DSP pipeline. */
export type QualityPreset = 'low-latency' | 'balanced' | 'high-quality'

/** Visualization display modes. */
export type VisualizerMode =
  | 'spectrum'
  | 'waveform'
  | 'circular-spectrum'
  | 'oscilloscope'

/** A single parameter for an effect module. */
export interface EffectParameter {
  id: string
  name: string
  type: 'float' | 'int' | 'boolean' | 'select'
  defaultValue: number | boolean | string
  value: number | boolean | string
  min?: number
  max?: number
  step?: number
  options?: { label: string; value: string }[]
  unit?: string
  group?: string
}

/** Serializable representation of one effect in a chain. */
export interface ChainEffectSerialized {
  effectId: string
  enabled: boolean
  bypassed: boolean
  parameters: Record<string, number | boolean | string>
}

/** Serializable representation of an entire plugin chain. */
export interface ChainSerialized {
  formatVersion: number
  qualityPreset: QualityPreset
  masterVolume: number
  effects: ChainEffectSerialized[]
}

/** A preset file stored on disk or bundled. */
export interface Preset {
  formatVersion: number
  name: string
  author: string
  description: string
  category: string
  tags: string[]
  createdAt: string
  updatedAt: string
  qualityPreset: QualityPreset
  chain: ChainEffectSerialized[]
}

/** Data emitted by the AnalyzerService each frame. */
export interface AnalyzerData {
  spectrum: Float32Array
  waveform: Float32Array
  rms: number
  peak: number
  /** Raw (un-held) peak from the current frame. */
  rawPeak: number
  /** Whether the clipping indicator is active (signal near 0 dBFS). */
  clipped: boolean
  bands: {
    subBass: number   // 20-60 Hz
    bass: number      // 60-250 Hz
    lowMid: number    // 250-500 Hz
    mid: number       // 500-2000 Hz
    upperMid: number  // 2000-4000 Hz
    presence: number  // 4000-6000 Hz
    brilliance: number // 6000-20000 Hz
  }
  timestamp: number
}

/** Callback type for analyzer subscribers. */
export type AnalyzerCallback = (data: AnalyzerData) => void

/** Provider type for audio sources that can connect to the DSP pipeline. */
export type AudioSourceType = 'local' | 'spotify-librespot' | 'spotify-sdk'
