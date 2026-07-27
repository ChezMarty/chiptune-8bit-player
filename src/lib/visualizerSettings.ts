/**
 * Visualizer settings — persisted to localStorage.
 *
 * All settings are optional — defaults are applied on load.
 */

export interface VisualizerSettings {
  /** FFT size for the AnalyserNode (power of 2, 256..4096). Default 2048. */
  fftSize: number
  /** Number of bars in spectrum / circular visualizers. Default 32. */
  barCount: number
  /** EMA smoothing for spectrum bars (0..1). Default 0. */
  spectrumSmoothing: number
  /** EMA smoothing for waveform (0..1). Default 0.3. */
  waveformSmoothing: number
  /** EMA smoothing for circular bars (0..1). Default 0. */
  circularSmoothing: number
  /** Spectrum sensitivity scale (0.1..5). Default 1. */
  spectrumSensitivity: number
  /** Waveform sensitivity scale (0.1..5). Default 1. */
  waveformSensitivity: number
  /** Circular sensitivity scale (0.1..5). Default 1. */
  circularSensitivity: number
  /** Peak hold duration in ms (0..5000). Default 1500. */
  peakHoldMs: number
  /** Peak decay rate in dB/s (0..60). Default 12. */
  peakDecayDbPerSec: number
  /** RMS EMA smoothing factor (0..1). Default 0.3. */
  rmsSmoothing: number
  /** Color theme hex string for visualizer lines/bars. Default 'theme' (uses CSS custom properties). */
  colorTheme: string
  /** Show the peak meter bar. Default true. */
  showPeakMeter: boolean
  /** Show the RMS meter bar. Default true. */
  showRmsMeter: boolean
  /** Show the CLIP badge. Default true. */
  showClipIndicator: boolean
}

const STORAGE_KEY = 'chiptune-visualizer-settings'

export const DEFAULT_VISUALIZER_SETTINGS: VisualizerSettings = {
  fftSize: 2048,
  barCount: 32,
  spectrumSmoothing: 0,
  waveformSmoothing: 0.3,
  circularSmoothing: 0,
  spectrumSensitivity: 1,
  waveformSensitivity: 1,
  circularSensitivity: 1,
  peakHoldMs: 1500,
  peakDecayDbPerSec: 12,
  rmsSmoothing: 0.3,
  colorTheme: 'theme',
  showPeakMeter: true,
  showRmsMeter: true,
  showClipIndicator: true,
}

/** Load settings from localStorage, merging with defaults for any missing keys. */
export function loadVisualizerSettings(): VisualizerSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_VISUALIZER_SETTINGS }
    const parsed = JSON.parse(raw) as Partial<VisualizerSettings>
    return { ...DEFAULT_VISUALIZER_SETTINGS, ...parsed }
  } catch {
    return { ...DEFAULT_VISUALIZER_SETTINGS }
  }
}

/** Persist settings to localStorage. */
export function saveVisualizerSettings(settings: VisualizerSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Silently ignore if localStorage is unavailable.
  }
}
