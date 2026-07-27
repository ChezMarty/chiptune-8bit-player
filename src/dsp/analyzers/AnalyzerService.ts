import type { AnalyzerCallback, AnalyzerData } from '../types'

/**
 * AnalyzerService — captures audio analysis data from an AnalyserNode
 * and distributes it to subscribers (visualizer components).
 *
 * Provides:
 *   - FFT spectrum (frequency domain)
 *   - Waveform (time domain)
 *   - RMS level
 *   - Peak level
 *   - Frequency band energy (sub-bass → brilliance)
 *
 * The service can be connected to either a pre-FX or post-FX AnalyserNode.
 * Default: post-FX (what the user hears).
 */
export class AnalyzerService {
  private _analyserNode: AnalyserNode | null = null
  private _subscribers: Set<AnalyzerCallback> = new Set()
  private _running = false
  private _rafId: number | null = null
  private _fftSize = 2048
  private _smoothingTimeConstant = 0.8

  /** The underlying AnalyserNode (read-only). */
  get analyserNode(): AnalyserNode | null {
    return this._analyserNode
  }

  get fftSize(): number {
    return this._fftSize
  }

  set fftSize(size: number) {
    this._fftSize = size
    if (this._analyserNode) {
      this._analyserNode.fftSize = size
    }
  }

  get smoothingTimeConstant(): number {
    return this._smoothingTimeConstant
  }

  set smoothingTimeConstant(t: number) {
    this._smoothingTimeConstant = t
    if (this._analyserNode) {
      this._analyserNode.smoothingTimeConstant = t
    }
  }

  /**
   * Initialize the analyzer by creating an AnalyserNode on the given
   * AudioContext and connecting it to the given source node.
   *
   * @param ctx - The AudioContext to create the analyser on
   * @param sourceNode - The audio node to analyze (should be the post-FX output)
   */
  initialize(ctx: AudioContext, sourceNode: AudioNode): void {
    this._analyserNode = ctx.createAnalyser()
    this._analyserNode.fftSize = this._fftSize
    this._analyserNode.smoothingTimeConstant = this._smoothingTimeConstant

    // Connect source → analyser. Note: this is a TAP — it doesn't
    // intercept the signal path, it just reads it.
    sourceNode.connect(this._analyserNode)
  }

  /** Destroy the service and release the AnalyserNode. */
  destroy(): void {
    this.stop()
    this._analyserNode?.disconnect()
    this._analyserNode = null
    this._subscribers.clear()
  }

  /** Start the analysis loop (requestAnimationFrame-driven). */
  start(): void {
    if (this._running || !this._analyserNode) return
    this._running = true
    this._tick()
  }

  /** Stop the analysis loop. */
  stop(): void {
    this._running = false
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId)
      this._rafId = null
    }
  }

  /** Subscribe to analysis updates. Returns an unsubscribe function. */
  subscribe(callback: AnalyzerCallback): () => void {
    this._subscribers.add(callback)
    // Auto-start if not running and has subscribers
    if (!this._running) {
      this.start()
    }
    return () => {
      this._subscribers.delete(callback)
      if (this._subscribers.size === 0) {
        this.stop()
      }
    }
  }

  // ── Private ──────────────────────────────────────────────

  private _tick(): void {
    if (!this._running || !this._analyserNode) return

    const analyser = this._analyserNode
    const bufferLength = analyser.frequencyBinCount
    const timeData = new Float32Array(bufferLength)
    const freqData = new Float32Array(bufferLength)

    analyser.getFloatTimeDomainData(timeData)
    analyser.getFloatFrequencyData(freqData)

    // Calculate RMS (root mean square) from time domain data.
    let sumSquares = 0
    for (let i = 0; i < timeData.length; i++) {
      sumSquares += timeData[i] * timeData[i]
    }
    const rms = Math.sqrt(sumSquares / timeData.length)

    // Calculate peak level (max absolute value in time domain).
    let peak = 0
    for (let i = 0; i < timeData.length; i++) {
      const abs = Math.abs(timeData[i])
      if (abs > peak) peak = abs
    }

    // Calculate band energy from frequency data.
    // freqData is in dB (negative values, range ~-100 to 0).
    // We convert to linear energy for each band.
    const nyquist = analyser.context.sampleRate / 2
    const bands = this._calculateBands(freqData, nyquist)

    const data: AnalyzerData = {
      spectrum: freqData,
      waveform: timeData,
      rms,
      peak,
      bands,
      timestamp: performance.now(),
    }

    // Distribute to subscribers.
    for (const cb of this._subscribers) {
      cb(data)
    }

    this._rafId = requestAnimationFrame(() => this._tick())
  }

  private _calculateBands(
    freqData: Float32Array,
    nyquist: number,
  ): AnalyzerData['bands'] {
    const binCount = freqData.length
    const binWidth = nyquist / binCount

    // Helper: average dB values in a frequency range, convert to 0..1 energy.
    const bandEnergy = (lowHz: number, highHz: number): number => {
      const lowBin = Math.round(lowHz / binWidth)
      const highBin = Math.round(highHz / binWidth)
      let sum = 0
      let count = 0
      for (let i = lowBin; i <= highBin && i < binCount; i++) {
        // freqData is in dB (-100 to 0). Convert to 0..1 energy.
        // -100 dB → 0, 0 dB → 1
        const normalized = (freqData[i] + 100) / 100
        sum += Math.max(0, Math.min(1, normalized))
        count++
      }
      return count > 0 ? sum / count : 0
    }

    return {
      subBass: bandEnergy(20, 60),
      bass: bandEnergy(60, 250),
      lowMid: bandEnergy(250, 500),
      mid: bandEnergy(500, 2000),
      upperMid: bandEnergy(2000, 4000),
      presence: bandEnergy(4000, 6000),
      brilliance: bandEnergy(6000, 20000),
    }
  }
}
