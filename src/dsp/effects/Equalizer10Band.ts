import type { AudioEffect } from '../AudioEffect'
import type { EffectCategory, EffectParameter } from '../types'

/**
 * ISO 10-band graphic equalizer.
 *
 * Bands:
 *   31 Hz  (lowshelf)
 *   62 Hz  (peaking)
 *   125 Hz (peaking)
 *   250 Hz (peaking)
 *   500 Hz (peaking)
 *   1 kHz  (peaking)
 *   2 kHz  (peaking)
 *   4 kHz  (peaking)
 *   8 kHz  (peaking)
 *   16 kHz (highshelf)
 *
 * Each band: ±12 dB range, Q = 1.0 (configurable in advanced parameters).
 * Uses native BiquadFilterNode for zero-latency, efficient filtering.
 */
interface BandConfig {
  freq: number
  type: BiquadFilterType
  label: string
}

const BAND_CONFIGS: BandConfig[] = [
  { freq: 31, type: 'lowshelf', label: '31' },
  { freq: 62, type: 'peaking', label: '62' },
  { freq: 125, type: 'peaking', label: '125' },
  { freq: 250, type: 'peaking', label: '250' },
  { freq: 500, type: 'peaking', label: '500' },
  { freq: 1000, type: 'peaking', label: '1k' },
  { freq: 2000, type: 'peaking', label: '2k' },
  { freq: 4000, type: 'peaking', label: '4k' },
  { freq: 8000, type: 'peaking', label: '8k' },
  { freq: 16000, type: 'highshelf', label: '16k' },
]

export class Equalizer10Band implements AudioEffect {
  readonly id = 'equalizer-10band'
  readonly name = 'Equalizer'
  readonly category: EffectCategory = 'filter'
  readonly latencySamples = 0

  private _inputNode: GainNode | null = null
  private _outputNode: GainNode | null = null
  private _filters: BiquadFilterNode[] = []
  private _q = 1.0

  // Band gains in dB (-12..+12)
  private _gains: number[] = new Array(10).fill(0)

  enabled = true
  bypassed = false

  get nodes(): AudioNode[] {
    return [...this._filters]
  }

  get input(): AudioNode {
    return this._inputNode ?? (null as unknown as AudioNode)
  }

  get output(): AudioNode {
    return this._outputNode ?? (null as unknown as AudioNode)
  }

  initialize(ctx: AudioContext): void {
    this._inputNode = ctx.createGain()
    this._outputNode = ctx.createGain()
    this._filters = []

    // Create all band filters and wire them serially.
    let prevNode: AudioNode = this._inputNode
    for (let i = 0; i < BAND_CONFIGS.length; i++) {
      const config = BAND_CONFIGS[i]
      const filter = ctx.createBiquadFilter()
      filter.type = config.type
      filter.frequency.value = config.freq
      filter.Q.value = this._q
      filter.gain.value = this._gains[i]
      prevNode.connect(filter)
      this._filters.push(filter)
      prevNode = filter
    }
    prevNode.connect(this._outputNode)
  }

  destroy(): void {
    this._inputNode?.disconnect()
    for (const f of this._filters) {
      f.disconnect()
    }
    this._outputNode?.disconnect()
    this._inputNode = null
    this._outputNode = null
    this._filters = []
  }

  getParameters(): EffectParameter[] {
    const params: EffectParameter[] = []
    for (let i = 0; i < BAND_CONFIGS.length; i++) {
      params.push({
        id: `band${i + 1}`,
        name: BAND_CONFIGS[i].label,
        type: 'float',
        defaultValue: 0,
        value: this._gains[i],
        min: -12,
        max: 12,
        step: 0.5,
        unit: 'dB',
        group: 'bands',
      })
    }
    params.push({
      id: 'q',
      name: 'Q Factor',
      type: 'float',
      defaultValue: 1.0,
      value: this._q,
      min: 0.1,
      max: 10,
      step: 0.1,
    })
    return params
  }

  setParameter(id: string, value: number | boolean | string): void {
    if (id === 'q') {
      this._q = Math.max(0.1, Math.min(10, Number(value)))
      for (const filter of this._filters) {
        filter.Q.value = this._q
      }
      return
    }

    // band1..band10
    const match = id.match(/^band(\d+)$/)
    if (match) {
      const idx = parseInt(match[1], 10) - 1
      if (idx >= 0 && idx < this._gains.length) {
        this._gains[idx] = Math.max(-12, Math.min(12, Number(value)))
        if (this._filters[idx]) {
          this._filters[idx].gain.value = this._gains[idx]
        }
      }
    }
  }

  /** Convenience: set all band gains at once. */
  setAllGains(gains: number[]): void {
    for (let i = 0; i < Math.min(gains.length, 10); i++) {
      this.setParameter(`band${i + 1}`, Math.max(-12, Math.min(12, gains[i])))
    }
  }

  reset(): void {
    this._gains.fill(0)
    this._q = 1.0
    for (const filter of this._filters) {
      filter.gain.value = 0
      filter.Q.value = this._q
    }
  }
}
