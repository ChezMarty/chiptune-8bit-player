import type { AudioEffect } from '../AudioEffect'
import type { EffectCategory, EffectParameter } from '../types'

/**
 * Balance — left/right pan control.
 * Uses StereoPannerNode for efficient, zero-latency panning.
 * Range: -1 (full left) to +1 (full right). Default: 0 (center).
 */
export class Balance implements AudioEffect {
  readonly id = 'balance'
  readonly name = 'Balance'
  readonly category: EffectCategory = 'spatial'
  readonly latencySamples = 0

  private _inputNode: GainNode | null = null
  private _panner: StereoPannerNode | null = null
  private _outputNode: GainNode | null = null

  private _pan = 0 // -1..+1

  enabled = true
  bypassed = false

  get nodes(): AudioNode[] {
    return this._panner ? [this._panner] : []
  }

  get input(): AudioNode {
    return this._inputNode ?? (null as unknown as AudioNode)
  }

  get output(): AudioNode {
    return this._outputNode ?? (null as unknown as AudioNode)
  }

  initialize(ctx: AudioContext): void {
    this._inputNode = ctx.createGain()
    this._panner = ctx.createStereoPanner()
    this._outputNode = ctx.createGain()

    this._panner.pan.value = this._pan

    this._inputNode.connect(this._panner)
    this._panner.connect(this._outputNode)
  }

  destroy(): void {
    this._inputNode?.disconnect()
    this._panner?.disconnect()
    this._outputNode?.disconnect()
    this._inputNode = null
    this._panner = null
    this._outputNode = null
  }

  getParameters(): EffectParameter[] {
    return [
      {
        id: 'pan',
        name: 'Pan',
        type: 'float',
        defaultValue: 0,
        value: this._pan,
        min: -1,
        max: 1,
        step: 0.01,
        unit: 'degrees',
      },
    ]
  }

  setParameter(id: string, value: number | boolean | string): void {
    if (id === 'pan') {
      this._pan = Math.max(-1, Math.min(1, Number(value)))
      if (this._panner) {
        this._panner.pan.value = this._pan
      }
    }
  }

  reset(): void {
    this._pan = 0
    if (this._panner) {
      this._panner.pan.value = 0
    }
  }
}
