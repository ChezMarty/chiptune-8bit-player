import { logDisconnect } from './diagnostics'
import type { AudioEffect } from './AudioEffect'
import type { ChainSerialized, QualityPreset } from './types'

/**
 * PluginChain manages an ordered, serial chain of AudioEffect modules.
 *
 * Effects are connected in order: input -> effect[0] -> effect[1] -> ... -> output.
 * Individual effects can be enabled/disabled or bypassed.
 * The chain supports reordering via drag-and-drop (moveEffect).
 *
 * Design note: The chain is serial in Phase 1. The interface is designed so
 * that a future NodeGraph implementation can replace it without breaking
 * effects -- each effect only exposes input/output AudioNodes.
 */
export class PluginChain {
  private _effects: AudioEffect[] = []
  private _ctx: AudioContext | null = null
  private _inputNode: GainNode | null = null
  private _outputNode: GainNode | null = null
  private _qualityPreset: QualityPreset = 'balanced'

  /** Get the ordered list of effects. */
  get effects(): readonly AudioEffect[] {
    return this._effects
  }

  /** The input node of the chain (connect audio source here). */
  get input(): AudioNode | null {
    return this._inputNode
  }

  /** The output node of the chain (connect to destination/master volume). */
  get output(): AudioNode | null {
    return this._outputNode
  }

  /** The AudioContext this chain is running on. */
  get context(): AudioContext | null {
    return this._ctx
  }

  get qualityPreset(): QualityPreset {
    return this._qualityPreset
  }

  set qualityPreset(preset: QualityPreset) {
    this._qualityPreset = preset
  }

  /**
   * Initialize the chain on a given AudioContext.
   * Creates the input/output gain nodes and initializes all effects.
   */
  initialize(ctx: AudioContext): void {
    this._ctx = ctx
    this._inputNode = ctx.createGain()
    this._inputNode.gain.value = 1.0
    this._outputNode = ctx.createGain()
    this._outputNode.gain.value = 1.0

    console.log('[CHAIN] Initialized. inputNode.gain=', this._inputNode.gain.value, 'outputNode.gain=', this._outputNode.gain.value)

    // Initialize all effects and wire them serially.
    for (const effect of this._effects) {
      effect.initialize(ctx)
      console.log('[CHAIN] Effect initialized:', effect.id, 'input=', !!effect.input, 'output=', !!effect.output, 'bypassed=', effect.bypassed)
    }
    this.reconnectAll()
  }

  /** Tear down the entire chain -- destroys all effects. */
  destroy(): void {
    for (const effect of this._effects) {
      const stack = new Error().stack?.split('\n').slice(2, 4).join(' → ') ?? '?'
      console.log('[CHAIN-DISCONNECT] effect "' + effect.id + '" — calling destroy() | stack=' + stack)
      effect.destroy()
    }
    this._effects = []
    logDisconnect('GainNode(_inputNode)', 'PluginChain.destroy')
    this._inputNode?.disconnect()
    logDisconnect('GainNode(_outputNode)', 'PluginChain.destroy')
    this._outputNode?.disconnect()
    this._inputNode = null
    this._outputNode = null
    this._ctx = null
  }

  /**
   * Add an effect to the chain at the given position.
   * If position is omitted, appends to the end.
   */
  addEffect(effect: AudioEffect, position?: number): void {
    if (position !== undefined) {
      this._effects.splice(position, 0, effect)
    } else {
      this._effects.push(effect)
    }

    // If the chain is already initialized, init the new effect and rewire.
    if (this._ctx) {
      effect.initialize(this._ctx)
      this.reconnectAll()
    }
  }

  /** Remove an effect from the chain by its ID. */
  removeEffect(id: string): void {
    const idx = this._effects.findIndex((e) => e.id === id)
    if (idx < 0) return
    const effect = this._effects[idx]
    effect.destroy()
    this._effects.splice(idx, 1)
    this.reconnectAll()
  }

  /** Move an effect from one position to another (for drag-and-drop reordering). */
  moveEffect(fromIndex: number, toIndex: number): void {
    if (
      fromIndex < 0 ||
      fromIndex >= this._effects.length ||
      toIndex < 0 ||
      toIndex >= this._effects.length ||
      fromIndex === toIndex
    ) {
      return
    }
    const [effect] = this._effects.splice(fromIndex, 1)
    this._effects.splice(toIndex, 0, effect)
    this.reconnectAll()
  }

  /** Enable or disable an effect. */
  setEffectEnabled(id: string, enabled: boolean): void {
    const effect = this._effects.find((e) => e.id === id)
    if (effect) {
      effect.enabled = enabled
      effect.bypassed = !enabled
      this.reconnectAll()
    }
  }

  /** Bypass an effect (signal passes through untouched). */
  bypassEffect(id: string, bypassed: boolean): void {
    const effect = this._effects.find((e) => e.id === id)
    if (effect) {
      effect.bypassed = bypassed
      this.reconnectAll()
    }
  }

  /** Reset all effects to their default states. */
  resetAll(): void {
    for (const effect of this._effects) {
      effect.reset()
    }
  }

  /** Calculate the total latency of the chain in milliseconds. */
  getTotalLatencyMs(sampleRate: number): number {
    const totalSamples = this._effects.reduce(
      (sum, e) => (e.enabled && !e.bypassed ? sum + e.latencySamples : sum),
      0,
    )
    return (totalSamples / sampleRate) * 1000
  }

  /** Serialize the current chain state to a plain object. */
  serialize(): ChainSerialized {
    return {
      formatVersion: 1,
      qualityPreset: this._qualityPreset,
      masterVolume: 1,
      effects: this._effects.map((e) => ({
        effectId: e.id,
        enabled: e.enabled,
        bypassed: e.bypassed,
        parameters: this.serializeParameters(e),
      })),
    }
  }

  /**
   * Deserialize a chain configuration and apply it.
   */
  deserialize(state: ChainSerialized): void {
    this._qualityPreset = state.qualityPreset

    for (const se of state.effects) {
      const effect = this._effects.find((e) => e.id === se.effectId)
      if (!effect) continue
      effect.enabled = se.enabled
      effect.bypassed = se.bypassed
      for (const [key, value] of Object.entries(se.parameters)) {
        effect.setParameter(key, value)
      }
    }

    this.reconnectAll()
  }

  // -- Private Helpers -----------------------------------------------

  /**
   * Reconnect the entire chain.
   *
   * Bypassed effects are SKIPPED entirely -- prevNode connects directly
   * to the next non-bypassed effect's input (or to the output node).
   * This means bypassed effects' AudioNodes sit unconnected, doing no
   * processing and adding no latency.
   */
  private reconnectAll(): void {
    const stack = new Error().stack?.split('\n').slice(2, 5).join(' → ') ?? '?'
    const ctxTime = this._ctx?.currentTime?.toFixed(3) ?? '?'
    console.log('[CHAIN] ═══ reconnectAll() CALLED ═══ ctx.currentTime=' + ctxTime + 's stack=' + stack)

    if (!this._ctx || !this._inputNode || !this._outputNode) {
      console.warn('[CHAIN] reconnectAll: ctx, inputNode, or outputNode is null. ctx=', !!this._ctx, 'input=', !!this._inputNode, 'output=', !!this._outputNode)
      return
    }

    console.log('[CHAIN] reconnectAll — Rebuilding chain at ctxTime=' + ctxTime + 's. Total effects:', this._effects.length)

    // Log effect status before reconnecting.
    for (let i = 0; i < this._effects.length; i++) {
      const e = this._effects[i]
      console.log('[CHAIN]   effect[' + i + ']:', e.id, 'enabled=', e.enabled, 'bypassed=', e.bypassed, 'input=', !!e.input, 'output=', !!e.output)
    }

    // IMPORTANT: Disconnect ONLY effects' AudioNodes — NOT the chain's input/output
    // gain nodes. The outputNode is connected to AudioContext.destination by DspEngine.
    // If we disconnect outputNode here, we sever the destination connection and audio
    // goes silent until DspEngine reconnects it (which never happens automatically).
    try {
      for (const effect of this._effects) {
        const inputName = effect.id + '.input'
        const outputName = effect.id + '.output'
        logDisconnect(inputName, 'PluginChain.reconnectAll')
        try { effect.input.disconnect() } catch { /* ok */ }
        logDisconnect(outputName, 'PluginChain.reconnectAll')
        try { effect.output.disconnect() } catch { /* ok */ }
      }
    } catch {
      // Ignore disconnect errors.
    }

    // The chain's input/output gain nodes are NOT disconnected here — DspEngine
    // owns their connections to the source and destination respectively.

    // Connect only non-bypassed effects serially.
    // Bypassed effects are skipped -- their AudioNodes remain unconnected.
    let prevNode: AudioNode = this._inputNode
    let connectedCount = 0
    for (const effect of this._effects) {
      if (effect.bypassed) {
        console.log('[CHAIN]   Skipping (bypassed):', effect.id)
        continue
      }
      console.log('[CHAIN]   Connecting:', effect.id, 'prevNode -> effect.input')
      prevNode.connect(effect.input)
      prevNode = effect.output
      connectedCount++
    }
    console.log('[CHAIN]   Final: prevNode -> outputNode. Connected', connectedCount, 'of', this._effects.length, 'effects')
    prevNode.connect(this._outputNode)
    console.log('[CHAIN] reconnectAll complete. outputNode.gain=', this._outputNode.gain.value, '(outputNode is still connected to ctx.destination by DspEngine)')

    // Log the complete audio path from source to destination for verification.
    console.log('[CHAIN] ═══ DSP Audio Path ═══')
    console.log('[CHAIN]   Source -> DSP Input')
    const activeEffects = this._effects.filter(e => !e.bypassed)
    for (const e of activeEffects) {
      console.log('[CHAIN]   ->', e.name, '(id:', e.id, ')')
    }
    const lastEffect = activeEffects[activeEffects.length - 1]
    if (lastEffect) {
      console.log('[CHAIN]   -> PluginChain._outputNode (connected to ctx.destination by DspEngine)')
      console.log('[CHAIN]   -> AudioContext.destination')
    }
    console.log('[CHAIN]   PluginChain output connected')
    if (lastEffect && lastEffect.id === 'master-volume') {
      console.log('[CHAIN]   MasterVolume connected (last in chain)')
    }
    console.log('[CHAIN]   MasterVolume -> AudioContext.destination connected')
    console.log('[CHAIN]   Final output node = PluginChain._outputNode')
    console.log('[CHAIN] ═══════════════════════')
  }

  /** Extract all parameter values from an effect as a flat record. */
  private serializeParameters(effect: AudioEffect): Record<string, number | boolean | string> {
    const result: Record<string, number | boolean | string> = {}
    for (const param of effect.getParameters()) {
      result[param.id] = param.value
    }
    return result
  }
}
