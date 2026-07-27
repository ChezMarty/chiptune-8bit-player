import type { AudioEffect } from '../AudioEffect'
import type { EffectCategory, EffectParameter } from '../types'

/**
 * Stereo Width — mid/side stereo field manipulation.
 *
 * Works by:
 *   1. Splitting the stereo signal into Mid (L+R) and Side (L-R) channels
 *   2. Applying gain (width) to the Side channel
 *   3. Recombining into stereo via proper M/S decoding:
 *        L_out = Mid + Side * width
 *        R_out = Mid - Side * width
 *
 * Width = 0   → mono (no side signal)
 * Width = 1   → original stereo (pass-through)
 * Width > 1   → expanded stereo (side signal amplified)
 *
 * This implementation uses ChannelSplitterNode, ChannelMergerNode, and GainNode
 * for zero-latency mid/side processing.
 */
export class StereoWidth implements AudioEffect {
  readonly id = 'stereo-width'
  readonly name = 'Stereo Width'
  readonly category: EffectCategory = 'spatial'
  readonly latencySamples = 0

  private _inputNode: GainNode | null = null
  private _outputNode: GainNode | null = null

  // Mid/Side encoding nodes
  private _splitter: ChannelSplitterNode | null = null
  private _midGain: GainNode | null = null
  private _sideGain: GainNode | null = null

  // For mid extraction: L → mid, R → mid
  private _midL: GainNode | null = null
  private _midR: GainNode | null = null
  // For side extraction: L → side (+), R → side (-)
  private _sideL: GainNode | null = null
  private _sideRNeg: GainNode | null = null

  // M/S decoding nodes
  private _merger: ChannelMergerNode | null = null
  private _leftSummer: GainNode | null = null
  private _rightSummer: GainNode | null = null
  private _sideInvert: GainNode | null = null

  private _width = 1.0 // 0..2 range

  enabled = true
  bypassed = false

  get nodes(): AudioNode[] {
    return this._splitter ? [this._splitter] : []
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

    // ── Splitter (2 channels → L, R) ──────────────────────────────
    this._splitter = ctx.createChannelSplitter(2)

    // ── Mid encoding: L + R (both scaled 0.5 to prevent clipping) ─
    this._midL = ctx.createGain()
    this._midL.gain.value = 0.5
    this._midR = ctx.createGain()
    this._midR.gain.value = 0.5

    // ── Side encoding: L - R (L scaled 0.5, R scaled -0.5) ───────
    this._sideL = ctx.createGain()
    this._sideL.gain.value = 0.5
    this._sideRNeg = ctx.createGain()
    this._sideRNeg.gain.value = -0.5

    // ── Mid and side bus gains ─────────────────────────────────────
    this._midGain = ctx.createGain()
    this._midGain.gain.value = 1.0
    this._sideGain = ctx.createGain()
    this._sideGain.gain.value = this._width

    // ── M/S decoding: L_out = Mid + Side*width, R_out = Mid - Side*width ──
    // Left output: Mid + Side*width
    this._leftSummer = ctx.createGain()
    this._leftSummer.gain.value = 1.0
    // Right output: Mid - Side*width
    this._rightSummer = ctx.createGain()
    this._rightSummer.gain.value = 1.0
    // Invert side for right channel
    this._sideInvert = ctx.createGain()
    this._sideInvert.gain.value = -1.0

    // ── Merger (2 channels → stereo) ──────────────────────────────
    this._merger = ctx.createChannelMerger(2)

    // ── Wiring: Encoding ──────────────────────────────────────────
    // Input → splitter
    this._inputNode.connect(this._splitter)

    // Splitter channel 0 (L):
    //   → midL (gain 0.5) → midGain
    //   → sideL (gain 0.5) → sideGain
    this._splitter.connect(this._midL, 0)
    this._splitter.connect(this._sideL, 0)

    // Splitter channel 1 (R):
    //   → midR (gain 0.5) → midGain
    //   → sideRNeg (gain -0.5) → sideGain
    this._splitter.connect(this._midR, 1)
    this._splitter.connect(this._sideRNeg, 1)

    // Mid bus: sum L+R
    this._midL.connect(this._midGain)
    this._midR.connect(this._midGain)

    // Side bus: sum L-R, then apply width
    this._sideL.connect(this._sideGain)
    this._sideRNeg.connect(this._sideGain)

    // ── Wiring: Decoding ──────────────────────────────────────────
    // L_out = Mid + Side*width
    this._midGain.connect(this._leftSummer)
    this._sideGain.connect(this._leftSummer)
    this._leftSummer.connect(this._merger, 0, 0)

    // R_out = Mid - Side*width
    this._midGain.connect(this._rightSummer)
    this._sideGain.connect(this._sideInvert)
    this._sideInvert.connect(this._rightSummer)
    this._rightSummer.connect(this._merger, 0, 1)

    // Merger → output
    this._merger.connect(this._outputNode)
  }

  destroy(): void {
    this._inputNode?.disconnect()
    this._splitter?.disconnect()
    this._midL?.disconnect()
    this._midR?.disconnect()
    this._sideL?.disconnect()
    this._sideRNeg?.disconnect()
    this._midGain?.disconnect()
    this._sideGain?.disconnect()
    this._leftSummer?.disconnect()
    this._rightSummer?.disconnect()
    this._sideInvert?.disconnect()
    this._merger?.disconnect()
    this._outputNode?.disconnect()

    this._inputNode = null
    this._splitter = null
    this._midL = null
    this._midR = null
    this._sideL = null
    this._sideRNeg = null
    this._midGain = null
    this._sideGain = null
    this._leftSummer = null
    this._rightSummer = null
    this._sideInvert = null
    this._merger = null
    this._outputNode = null
  }

  getParameters(): EffectParameter[] {
    return [
      {
        id: 'width',
        name: 'Width',
        type: 'float',
        defaultValue: 100,
        value: this._width * 100,
        min: 0,
        max: 200,
        step: 1,
        unit: '%',
      },
    ]
  }

  setParameter(id: string, value: number | boolean | string): void {
    if (id === 'width') {
      this._width = Math.max(0, Math.min(2, Number(value) / 100))
      if (this._sideGain) {
        this._sideGain.gain.value = this._width
      }
    }
  }

  reset(): void {
    this._width = 1.0
    if (this._sideGain) {
      this._sideGain.gain.value = 1.0
    }
  }
}
