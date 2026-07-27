import type { AudioEffect } from '../AudioEffect'
import type { EffectCategory, EffectParameter } from '../types'

/**
 * Treble Boost — high-end enhancement.
 * Uses a highshelf filter to boost frequencies above a cutoff.
 * Default: +4 dB boost at 8 kHz.
 */
export class TrebleBoost implements AudioEffect {
  readonly id = 'treble-boost'
  readonly name = 'Treble Boost'
  readonly category: EffectCategory = 'filter'
  readonly latencySamples = 0

  private _inputNode: GainNode | null = null
  private _filter: BiquadFilterNode | null = null
  private _outputNode: GainNode | null = null

  private _gainDb = 0 // 0..12 dB
  private _frequency = 4000 // 2000..20000 Hz (default ~4 kHz)

  enabled = true
  bypassed = false

  get nodes(): AudioNode[] {
    return this._filter ? [this._filter] : []
  }

  get input(): AudioNode {
    return this._inputNode ?? (null as unknown as AudioNode)
  }

  get output(): AudioNode {
    return this._outputNode ?? (null as unknown as AudioNode)
  }

  initialize(ctx: AudioContext): void {
    this._inputNode = ctx.createGain()
    this._filter = ctx.createBiquadFilter()
    this._outputNode = ctx.createGain()

    this._filter.type = 'highshelf'
    this._applyParams()

    this._inputNode.connect(this._filter)
    this._filter.connect(this._outputNode)
  }

  destroy(): void {
    this._inputNode?.disconnect()
    this._filter?.disconnect()
    this._outputNode?.disconnect()
    this._inputNode = null
    this._filter = null
    this._outputNode = null
  }

  getParameters(): EffectParameter[] {
    return [
      {
        id: 'gain',
        name: 'Boost',
        type: 'float',
        defaultValue: 0,
        value: this._gainDb,
        min: 0,
        max: 12,
        step: 0.5,
        unit: 'dB',
      },
      {
        id: 'frequency',
        name: 'Cutoff',
        type: 'float',
        defaultValue: 4.0,
        value: this._frequency / 1000,
        min: 2.0,
        max: 20.0,
        step: 0.5,
        unit: 'kHz',
      },
    ]
  }

  setParameter(id: string, value: number | boolean | string): void {
    switch (id) {
      case 'gain':
        this._gainDb = Math.max(0, Math.min(12, Number(value)))
        this._applyParams()
        break
      case 'frequency':
        this._frequency = Math.max(2000, Math.min(20000, Number(value) * 1000))
        this._applyParams()
        break
    }
  }

  reset(): void {
    this._gainDb = 0
    this._frequency = 4000
    this._applyParams()
  }

  private _applyParams(): void {
    if (!this._filter) return
    this._filter.gain.value = this._gainDb
    this._filter.frequency.value = this._frequency
  }
}
