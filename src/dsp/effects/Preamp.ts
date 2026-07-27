import type { AudioEffect } from '../AudioEffect'
import type { EffectCategory, EffectParameter } from '../types'

/**
 * Preamp — input gain stage.
 * A simple GainNode that applies a pre-gain boost or cut before the
 * rest of the DSP chain. Range: -12 dB to +12 dB.
 */
export class Preamp implements AudioEffect {
  readonly id = 'preamp'
  readonly name = 'Preamp'
  readonly category: EffectCategory = 'utility'
  readonly latencySamples = 0

  private _gainNode: GainNode | null = null
  private _inputNode: GainNode | null = null
  private _outputNode: GainNode | null = null

  enabled = true
  bypassed = false

  // Parameters
  private _gainDb = 0 // -12..+12 dB

  get nodes(): AudioNode[] {
    return this._gainNode ? [this._gainNode] : []
  }

  get input(): AudioNode {
    if (!this._inputNode) throw new Error('Preamp not initialized')
    return this._inputNode
  }

  get output(): AudioNode {
    if (!this._outputNode) throw new Error('Preamp not initialized')
    return this._outputNode
  }

  initialize(ctx: AudioContext): void {
    this._inputNode = ctx.createGain()
    this._gainNode = ctx.createGain()
    this._outputNode = ctx.createGain()

    // Wire: input → gain → output
    this._inputNode.connect(this._gainNode)
    this._gainNode.connect(this._outputNode)

    this._updateGain()
  }

  destroy(): void {
    this._inputNode?.disconnect()
    this._gainNode?.disconnect()
    this._outputNode?.disconnect()
    this._inputNode = null
    this._gainNode = null
    this._outputNode = null
  }

  getParameters(): EffectParameter[] {
    return [
      {
        id: 'gain',
        name: 'Gain',
        type: 'float',
        defaultValue: 0,
        value: this._gainDb,
        min: -12,
        max: 12,
        step: 0.5,
        unit: 'dB',
      },
    ]
  }

  setParameter(id: string, value: number | boolean | string): void {
    if (id === 'gain') {
      this._gainDb = Math.max(-12, Math.min(12, Number(value)))
      this._updateGain()
    }
  }

  reset(): void {
    this._gainDb = 0
    this._updateGain()
  }

  private _updateGain(): void {
    if (!this._gainNode) return
    // Convert dB to linear gain: gain = 10^(dB/20)
    this._gainNode.gain.value = Math.pow(10, this._gainDb / 20)
  }
}
