import type { AudioEffect } from '../AudioEffect'
import type { EffectCategory, EffectParameter } from '../types'

/**
 * Master Volume — final output gain stage.
 * Always the last effect in the chain.
 * Range: 0..1 (linear), with display as 0..100%.
 */
export class MasterVolume implements AudioEffect {
  readonly id = 'master-volume'
  readonly name = 'Master Volume'
  readonly category: EffectCategory = 'utility'
  readonly latencySamples = 0

  private _inputNode: GainNode | null = null
  private _gainNode: GainNode | null = null
  private _outputNode: GainNode | null = null

  private _volume = 0.7 // 0..1

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

    console.log('[MV] 🏁 initialize() — GainNode CREATED. _gainNode.gain.value=' + this._gainNode.gain.value + ' _volume=' + this._volume + ' _gainNode exists=' + (this._gainNode !== null) + ' instance=', this)
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
        defaultValue: 0.7,
        value: this._volume,
        min: 0,
        max: 1,
        step: 0.01,
        unit: '%',
      },
    ]
  }

  setParameter(id: string, value: number | boolean | string): void {
    if (id === 'volume') {
      const beforeGain = this._gainNode?.gain?.value ?? 'N/A (null)'
      this._volume = Math.max(0, Math.min(1, Number(value)))
      console.log('[MV] setParameter(volume,', value, ') — ' +
        '_gainNode exists=' + (this._gainNode !== null) + ' ' +
        '_gainNode.gain.value BEFORE=' + beforeGain + ' ' +
        '_volume AFTER=' + this._volume)
      if (this._gainNode) {
        this._gainNode.gain.value = this._volume
        console.log('[MV]   → _gainNode.gain.value SET TO', this._gainNode.gain.value, '(expected:', this._volume, ') — MATCH:', this._gainNode.gain.value === this._volume)
      } else {
        console.warn('[MV] ⚠️  _gainNode is NULL — volume stored in _volume but NOT applied to audio graph!')
      }
    }
  }

  reset(): void {
    this._volume = 0.7
    if (this._gainNode) {
      this._gainNode.gain.value = 0.7
      console.log('[MV] reset() — _gainNode.gain.value set to', this._gainNode.gain.value)
    } else {
      console.warn('[MV] reset() — _gainNode is NULL!')
    }
  }
}
