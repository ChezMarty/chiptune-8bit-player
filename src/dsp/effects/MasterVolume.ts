import type { AudioEffect } from '../AudioEffect'
import type { EffectCategory, EffectParameter } from '../types'

/**
 * Master Volume — final output gain stage.
 * Always the last effect in the chain.
 * Range: 0..100% (linear gain 0..1 internally).
 */
export class MasterVolume implements AudioEffect {
  readonly id = 'master-volume'
  readonly name = 'Master Volume'
  readonly category: EffectCategory = 'utility'
  readonly latencySamples = 0

  private _inputNode: GainNode | null = null
  private _gainNode: GainNode | null = null
  private _outputNode: GainNode | null = null

  private _volume = 0.7 // 0..1 internal (linear gain)

  enabled = true
  bypassed = false

  get nodes(): AudioNode[] {
    return this._gainNode ? [this._gainNode] : []
  }

  get input(): AudioNode {
    return this._inputNode ?? (null as unknown as AudioNode)
  }

  get output(): AudioNode {
    return this._outputNode ?? (null as unknown as AudioNode)
  }

  initialize(ctx: AudioContext): void {
    this._inputNode = ctx.createGain()
    this._gainNode = ctx.createGain()
    this._outputNode = ctx.createGain()

    this._gainNode.gain.value = this._volume

    this._inputNode.connect(this._gainNode)
    this._gainNode.connect(this._outputNode)
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
        id: 'volume',
        name: 'Volume',
        type: 'float',
        defaultValue: 70,
        value: Math.round(this._volume * 100),
        min: 0,
        max: 100,
        step: 1,
        unit: '%',
      },
    ]
  }

  setParameter(id: string, value: number | boolean | string): void {
    if (id === 'volume') {
      this._volume = Math.max(0, Math.min(1, Number(value) / 100))
      if (this._gainNode) {
        this._gainNode.gain.value = this._volume
      }
    }
  }

  reset(): void {
    this._volume = 0.7
    if (this._gainNode) {
      this._gainNode.gain.value = 0.7
    }
  }
}
