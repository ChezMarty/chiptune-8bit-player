import type { EffectCategory, EffectParameter } from './types'

/**
 * AudioEffect interface.
 *
 * Every DSP effect implements this interface so the PluginChain can
 * manage them uniformly regardless of whether they use native Web Audio
 * API nodes or AudioWorklet processors.
 *
 * Each effect declares its input/output AudioNode. The chain connects
 * output of effect N-1 → input of effect N.
 */
export interface AudioEffect {
  /** Unique identifier (e.g. 'equalizer-10band', 'preamp'). */
  readonly id: string

  /** Human-readable display name (e.g. 'Equalizer', 'Preamp'). */
  readonly name: string

  /** Functional category for grouping in the UI. */
  readonly category: EffectCategory

  /** Audio nodes owned by this effect (for diagnostics / visualisation). */
  readonly nodes: AudioNode[]

  /** The input node — the chain connects the previous effect's output here. */
  readonly input: AudioNode

  /** The output node — the chain feeds this into the next effect's input. */
  readonly output: AudioNode

  /** Whether this effect is currently enabled in the chain. */
  enabled: boolean

  /** Whether this effect is bypassed (signal passes through untouched). */
  bypassed: boolean

  /**
   * Processing latency in samples (0 if the effect is instantaneous).
   * Used by the engine to calculate total pipeline latency.
   */
  readonly latencySamples: number

  /**
   * Initialize the effect with a given AudioContext.
   * Creates all necessary AudioNodes.
   */
  initialize(ctx: AudioContext): void

  /** Tear down the effect and disconnect/release all nodes. */
  destroy(): void

  /** Get the list of adjustable parameters for this effect. */
  getParameters(): EffectParameter[]

  /** Set a single parameter by its ID. Accepts the parameter's native type. */
  setParameter(id: string, value: number | boolean | string): void

  /** Reset all parameters to their default values. */
  reset(): void
}
