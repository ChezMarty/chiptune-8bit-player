import { PluginChain } from './PluginChain'
import { MasterVolume } from './effects/MasterVolume'
import { Preamp } from './effects/Preamp'
import { Equalizer10Band } from './effects/Equalizer10Band'
import { BassBoost } from './effects/BassBoost'
import { TrebleBoost } from './effects/TrebleBoost'
import { Balance } from './effects/Balance'
import { StereoWidth } from './effects/StereoWidth'
import { AnalyzerService } from './analyzers/AnalyzerService'
import { PresetManager } from './presets/PresetManager'
import { logDisconnect } from './diagnostics'
import type { AudioEffect } from './AudioEffect'
import type { QualityPreset, Preset, ChainEffectSerialized } from './types'

/**
 * Set to true to enable verbose DSP debug logging (wiring, probes, diagnostics).
 * Can be toggled at runtime from the console: `DSP_DEBUG = true`
 */
export let DSP_DEBUG = false

/** localStorage key for persisting the last active preset name across sessions. */
const STORED_PRESET_KEY = 'chiptune-last-preset'

/**
 * DspEngine — the top-level singleton that:
 *
 * 1. Owns the shared AudioContext used by all playback providers
 * 2. Provides an input node for audio sources to connect to
 * 3. Provides a master volume GainNode
 *
 * ── Phase 7 topology (StereoWidth inserted between Balance and MasterVolume) ──
 *
 *   Source → DspEngine._inputNode
 *   → Preamp class
 *   → Equalizer class (10 bands, all 0 dB flat)
 *   → BassBoost class (lowshelf filter, default 0 dB transparent)
 *   → TrebleBoost class (highshelf filter, default 0 dB transparent)
 *   → Balance class (StereoPannerNode, default center)
 *   → StereoWidth class (mid/side processing, default 100%)
 *   → MasterVolume class
 *   → AudioContext.destination
 *
 * The PluginChain, AnalyzerService, and PresetManager exist as stubs for
 * UI compatibility but are NOT connected to the audio path.
 * They will be wired in incrementally:
 *   8. + Compressor
 *   9. + Limiter
 */
class DspEngineSingleton {
  private _ctx: AudioContext | null = null
  private _chain: PluginChain
  private _analyzer: AnalyzerService
  private _presets: PresetManager
  private _inputNode: GainNode | null = null
  /** Preamp effect — input gain stage before the rest of the DSP chain. Default 0 dB (unity). */
  private _preampEffect: Preamp | null = null
  /** Equalizer — 10-band graphic EQ. Default all bands at 0 dB (flat, transparent). */
  private _equalizerEffect: Equalizer10Band | null = null
  /** Bass Boost — lowshelf filter boosting frequencies below ~120 Hz. Default 0 dB (transparent). */
  private _bassBoostEffect: BassBoost | null = null
  /** Treble Boost — highshelf filter boosting frequencies above ~4 kHz. Default 0 dB (transparent). */
  private _trebleBoostEffect: TrebleBoost | null = null
  /** Balance — StereoPannerNode for left/right pan. Default center (0). */
  private _balanceEffect: Balance | null = null
  /** Stereo Width — mid/side stereo field manipulation. Default 100% (original stereo). */
  private _stereoWidthEffect: StereoWidth | null = null
  /** Dedicated MasterVolume effect (AudioEffect interface, post-chain stage). */
  private _masterVolumeEffect: MasterVolume | null = null
  /** Ordered list of effects — single source of truth for the UI. */
  private _effects: AudioEffect[] = []
  private _applyVersion = 0
  private _activePresetName: string | null = null
  private _initialized = false
  private _masterVolume = 0.7
  /** 🔬 Input probe — AnalyserNode snooping signal entering _inputNode. */
  private _inputProbe: AnalyserNode | null = null
  /** 🔬 Output probe — AnalyserNode snooping signal leaving MasterVolume. */
  private _outputProbe: AnalyserNode | null = null
  /** 🔬 Probe polling interval handle. */
  private _probeInterval: ReturnType<typeof setInterval> | null = null

  /** Shared AudioContext for all DSP processing. */
  get audioCtx(): AudioContext {
    if (!this._ctx) {
      throw new Error('DspEngine not initialized. Call initialize() first.')
    }
    return this._ctx
  }

  /** The plugin chain manager. Currently DISCONNECTED from audio path. */
  get chain(): PluginChain {
    return this._chain
  }

  /** The analyzer service. Currently DISCONNECTED from audio path. */
  get analyzerService(): AnalyzerService {
    return this._analyzer
  }

  /** The preset manager. Works but affects only the stub chain. */
  get presetManager(): PresetManager {
    return this._presets
  }

  /** Whether the engine has been initialized. */
  get initialized(): boolean {
    return this._initialized
  }

  /** Current master volume (0..1). */
  get masterVolume(): number {
    return this._masterVolume
  }

  /** The real Equalizer10Band instance (connected to audio path). */
  get equalizerEffect(): Equalizer10Band | null {
    return this._equalizerEffect
  }

  /** Ordered list of real effects wired into the audio graph — single source of truth. */
  get effects(): readonly AudioEffect[] {
    return this._effects
  }

  /** Version counter incremented on every applyPreset() call — used by UI to refresh. */
  get applyVersion(): number {
    return this._applyVersion
  }

  /** Name of the currently active preset, or null if none. */
  get activePresetName(): string | null {
    return this._activePresetName
  }

  constructor() {
    this._chain = new PluginChain()
    this._analyzer = new AnalyzerService()
    this._presets = new PresetManager()
  }

  /**
   * Initialize the DSP engine.
   * Creates the shared AudioContext and the minimum audio graph:
   *
   *   Source → _inputNode (gain=1.0) → MasterVolume class → AudioContext.destination
   *
   * PluginChain and AnalyzerService are initialized as stubs but are NOT
   * connected to the audio path.
   */
  async initialize(): Promise<void> {
    if (this._initialized) return

    // Create the shared AudioContext.
    this._ctx = new AudioContext()
    console.log('[DSP] AudioContext created — sampleRate:', this._ctx.sampleRate)

    // Monitor AudioContext state changes (always visible).
    this._ctx.onstatechange = () => {
      if (!this._ctx) return
      console.log('[DSP] AudioContext state:', this._ctx.state)
    }

    // Create input gain node (sources connect here).
    this._inputNode = this._ctx.createGain()
    this._inputNode.gain.value = 1.0

    // ── Create effects in processing order ────────────────────────
    this._preampEffect = new Preamp()
    this._preampEffect.initialize(this._ctx)
    this._effects.push(this._preampEffect)

    this._equalizerEffect = new Equalizer10Band()
    this._equalizerEffect.initialize(this._ctx)
    this._effects.push(this._equalizerEffect)

    this._bassBoostEffect = new BassBoost()
    this._bassBoostEffect.initialize(this._ctx)
    this._effects.push(this._bassBoostEffect)

    this._trebleBoostEffect = new TrebleBoost()
    this._trebleBoostEffect.initialize(this._ctx)
    this._effects.push(this._trebleBoostEffect)

    this._balanceEffect = new Balance()
    this._balanceEffect.initialize(this._ctx)
    this._effects.push(this._balanceEffect)

    this._stereoWidthEffect = new StereoWidth()
    this._stereoWidthEffect.initialize(this._ctx)
    this._effects.push(this._stereoWidthEffect)

    this._masterVolumeEffect = new MasterVolume()
    this._masterVolumeEffect.initialize(this._ctx)
    this._masterVolumeEffect.setParameter('volume', this._masterVolume * 100)
    this._effects.push(this._masterVolumeEffect)

    // Wire: _inputNode → Preamp → Equalizer → BassBoost → TrebleBoost → Balance → StereoWidth → MasterVolume → destination
    this._inputNode.connect(this._preampEffect.input)
    this._preampEffect.output.connect(this._equalizerEffect.input)
    this._equalizerEffect.output.connect(this._bassBoostEffect.input)
    this._bassBoostEffect.output.connect(this._trebleBoostEffect.input)
    this._trebleBoostEffect.output.connect(this._balanceEffect.input)
    this._balanceEffect.output.connect(this._stereoWidthEffect.input)
    this._stereoWidthEffect.output.connect(this._masterVolumeEffect.input)
    this._masterVolumeEffect.output.connect(this._ctx.destination)

    if (DSP_DEBUG) {
      console.log('[DSP] Audio graph wired: _inputNode → Preamp → Equalizer → BassBoost → TrebleBoost → Balance → StereoWidth → MasterVolume → destination')
    }

    // ── Create analyser probes (debug only) ─────────────────────
    if (DSP_DEBUG) {
      this._inputProbe = this._ctx.createAnalyser()
      this._inputProbe.fftSize = 2048
      this._outputProbe = this._ctx.createAnalyser()
      this._outputProbe.fftSize = 2048
      this._inputNode.connect(this._inputProbe)
      this._masterVolumeEffect.output.connect(this._outputProbe)
      this._startProbeLogging()
      console.log('[DSP] 🔬 Analyser probes active (DSP_DEBUG mode)')
    }

    // Initialize stub PluginChain for UI compatibility.
    this._chain.initialize(this._ctx)

    // ── Wire the real AnalyzerService to the post-FX output ────
    // Tap the MasterVolume output (post-FX) through the AnalyzerService.
    // The service creates its own internal AnalyserNode for the tap.
    this._analyzer.initialize(this._ctx, this._masterVolumeEffect.output!)
    this._analyzer.start()

    await this._presets.loadPresets()

    // Restore last active preset, if any.
    try {
      const storedName = localStorage.getItem(STORED_PRESET_KEY)
      if (storedName) {
        this.applyPresetByName(storedName)
      }
    } catch {
      // localStorage may not be available in all environments — ignore.
    }

    this._initialized = true

    if (DSP_DEBUG) {
      console.log('[DSP] DSP Engine initialized — Phase 7 (Preamp + Equalizer + BassBoost + TrebleBoost + Balance + StereoWidth + MasterVolume → destination)')
    } else {
      console.log('[DSP] DSP Engine initialized —', this._effects.length, 'effects in chain')
    }

    // Resume AudioContext on first user gesture.
    const resumeOnInteraction = () => {
      if (this._ctx?.state === 'suspended') {
        console.log('[DSP] User gesture detected — resuming AudioContext')
        this._ctx.resume().then(() => {
          console.log('[DSP] AudioContext resumed. New state:', this._ctx?.state)
        }).catch((err) => {
          console.error('[DSP] Failed to resume AudioContext:', err)
        })
      }
    }
    document.addEventListener('click', resumeOnInteraction, { once: true })
    document.addEventListener('keydown', resumeOnInteraction, { once: true })
  }

  /** Destroy the engine and release all resources. */
  destroy(): void {
    if (this._ctx) {
      this._ctx.onstatechange = null
    }
    this._stopProbeLogging()
    this._inputProbe?.disconnect()
    this._inputProbe = null
    this._outputProbe?.disconnect()
    this._outputProbe = null
    this._analyzer.destroy()
    this._preampEffect?.destroy()
    this._preampEffect = null
    this._equalizerEffect?.destroy()
    this._equalizerEffect = null
    this._bassBoostEffect?.destroy()
    this._bassBoostEffect = null
    this._trebleBoostEffect?.destroy()
    this._trebleBoostEffect = null
    this._balanceEffect?.destroy()
    this._balanceEffect = null
    this._stereoWidthEffect?.destroy()
    this._stereoWidthEffect = null
    this._masterVolumeEffect?.destroy()
    this._masterVolumeEffect = null
    this._effects = []
    this._chain.destroy()
    if (DSP_DEBUG) logDisconnect('GainNode(_inputNode)', 'DspEngine.destroy')
    this._inputNode?.disconnect()
    this._inputNode = null
    if (this._ctx && this._ctx.state !== 'closed') {
      this._ctx.close().catch(() => {})
    }
    this._ctx = null
    this._initialized = false
  }

  /** Get the input AudioNode for playback providers to connect to. */
  getInput(): AudioNode {
    if (!this._inputNode) {
      throw new Error('DspEngine not initialized')
    }
    return this._inputNode
  }

  /**
   * Connect an external AudioNode to the DSP pipeline.
   * The source feeds into:
   *   _inputNode → Preamp → Equalizer → BassBoost → TrebleBoost → Balance → StereoWidth → MasterVolume → destination.
   *
   * @returns A disconnect function.
   */
  connectSource(source: AudioNode): () => void {
    if (!this._inputNode) {
      throw new Error('DspEngine not initialized')
    }
    if (DSP_DEBUG) {
      console.log('[DSP] connectSource —', source.constructor.name)
    }
    try {
      source.connect(this._inputNode)
    } catch (err) {
      console.error('[DSP] FAILED to connect source:', err)
    }
    return () => {
      if (DSP_DEBUG) logDisconnect(source.constructor.name, 'connectSource')
      try {
        source.disconnect(this._inputNode!)
      } catch (err) {
        console.warn('[DSP] Error disconnecting source:', err)
      }
    }
  }

  /** Set master volume (0..1). Delegates to MasterVolume effect. */
  setMasterVolume(v: number): void {
    this._masterVolume = Math.max(0, Math.min(1, v))
    if (DSP_DEBUG) {
      console.log('[DSP] setMasterVolume →', this._masterVolume)
    }
    if (this._masterVolumeEffect) {
      this._masterVolumeEffect.setParameter('volume', this._masterVolume * 100)
    }
  }

  // ── 🔬 Probe logging ────────────────────────────────────────────

  /** Start polling probe AnalyserNodes every 500ms and log RMS/Peak/Silent. */
  private _startProbeLogging(): void {
    this._stopProbeLogging()
    this._probeInterval = setInterval(() => {
      if (!this._inputProbe || !this._outputProbe) return

      const fftSize = this._inputProbe.fftSize
      const inputData = new Uint8Array(fftSize)
      const outputData = new Uint8Array(fftSize)

      try {
        this._inputProbe.getByteTimeDomainData(inputData)
        this._outputProbe.getByteTimeDomainData(outputData)
      } catch (_) {
        return
      }

      let inputSumSq = 0, outputSumSq = 0
      let inputPeak = 0, outputPeak = 0
      for (let i = 0; i < fftSize; i++) {
        const iDev = inputData[i] - 128
        inputSumSq += iDev * iDev
        if (Math.abs(iDev) > inputPeak) inputPeak = Math.abs(iDev)

        const oDev = outputData[i] - 128
        outputSumSq += oDev * oDev
        if (Math.abs(oDev) > outputPeak) outputPeak = Math.abs(oDev)
      }

      const inputRms = Math.sqrt(inputSumSq / fftSize)
      const outputRms = Math.sqrt(outputSumSq / fftSize)

      const inputSilent = inputRms < 0.5
      const outputSilent = outputRms < 0.5

      if (!inputSilent && outputSilent) {
        console.warn('[PROBE] ⚠️  SIGNAL LOST IN DSP GRAPH! Input has signal, output is silent.')
      }
    }, 1000)
  }

  /** Stop probe logging interval. */
  private _stopProbeLogging(): void {
    if (this._probeInterval) {
      clearInterval(this._probeInterval)
      this._probeInterval = null
    }
  }

  // ── Preset serialization & application ──────────────────────

  /** Serialize the current state of all real effects. */
  serializeChain(): ChainEffectSerialized[] {
    return this._effects.map((effect) => ({
      effectId: effect.id,
      enabled: effect.enabled,
      bypassed: effect.bypassed,
      parameters: this._effectParamsToRecord(effect),
    }))
  }

  /** Apply a preset to all real effects in the audio graph. */
  applyPreset(preset: Preset): void {
    if (DSP_DEBUG) {
      console.log('[DSP] applyPreset —', preset.name)
    }
    for (const serialized of preset.chain) {
      const effect = this._effects.find((e) => e.id === serialized.effectId)
      if (!effect) {
        if (DSP_DEBUG) console.warn('[DSP] applyPreset: effect not found:', serialized.effectId)
        continue
      }
      effect.enabled = serialized.enabled
      effect.bypassed = serialized.bypassed
      for (const [paramId, value] of Object.entries(serialized.parameters)) {
        effect.setParameter(paramId, value)
      }
    }
    this._activePresetName = preset.name
    this._applyVersion++
    this._notifyDspChanged()

    // Persist last active preset.
    try {
      localStorage.setItem(STORED_PRESET_KEY, preset.name)
    } catch {
      // Silently ignore if localStorage is unavailable.
    }
  }

  /** Convert an effect's parameters to a flat record for serialization. */
  private _effectParamsToRecord(effect: AudioEffect): Record<string, number | boolean | string> {
    const record: Record<string, number | boolean | string> = {}
    for (const param of effect.getParameters()) {
      record[param.id] = param.value
    }
    return record
  }

  /** Load and apply a built-in or user preset by name. Returns true if found. */
  applyPresetByName(name: string): boolean {
    const preset = this._presets.allPresets.find((p) => p.name === name)
    if (!preset) return false
    this.applyPreset(preset)
    return true
  }

  /** Return the name of the currently active preset, or null. */
  getActivePresetName(): string | null {
    return this._activePresetName
  }

  /** Reset every DSP effect to its default values. */
  resetAllEffects(): void {
    for (const effect of this._effects) {
      effect.reset()
    }
    this._activePresetName = null
    this._applyVersion++
    this._notifyDspChanged()

    // Clear the persisted last preset.
    try {
      localStorage.removeItem(STORED_PRESET_KEY)
    } catch {
      // Silently ignore.
    }
  }

  /**
   * Broadcast a DOM event whenever the active preset changes so
   * non-React consumers (e.g. the Discord Rich Presence module) can
   * refresh without polling. Mirrors the existing 'toggle-audio-lab'
   * window-event convention.
   */
  private _notifyDspChanged(): void {
    window.dispatchEvent(new CustomEvent('chiptune-dsp-changed'))
  }

  // ── Stub methods for future use ────────────────────────────

  setQualityPreset(_preset: QualityPreset): void {
    // No-op until quality presets are implemented.
  }

  setAnalyserSource(source: 'pre-fx' | 'post-fx'): void {
    // TODO: Implement pre-fx / post-fx switching. Currently always post-FX.
    if (DSP_DEBUG) {
      console.log('[DSP] setAnalyserSource —', source, '(not yet implemented)')
    }
  }
}

/** Singleton instance — import and use directly. */
export const dspEngine = new DspEngineSingleton()
