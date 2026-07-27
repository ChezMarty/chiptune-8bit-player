import { PluginChain } from './PluginChain'
import { MasterVolume } from './effects/MasterVolume'
import { Preamp } from './effects/Preamp'
import { Equalizer10Band } from './effects/Equalizer10Band'
import { BassBoost } from './effects/BassBoost'
import { TrebleBoost } from './effects/TrebleBoost'
import { Balance } from './effects/Balance'
import { AnalyzerService } from './analyzers/AnalyzerService'
import { PresetManager } from './presets/PresetManager'
import { logDisconnect } from './diagnostics'
import type { AudioEffect } from './AudioEffect'
import type { QualityPreset, Preset } from './types'

/**
 * DspEngine — the top-level singleton that:
 *
 * 1. Owns the shared AudioContext used by all playback providers
 * 2. Provides an input node for audio sources to connect to
 * 3. Provides a master volume GainNode
 *
 * ── Phase 6 topology (Balance inserted between TrebleBoost and MasterVolume) ──
 *
 *   Source → DspEngine._inputNode
 *   → Preamp class
 *   → Equalizer class (10 bands, all 0 dB flat)
 *   → BassBoost class (lowshelf filter, default 0 dB transparent)
 *   → TrebleBoost class (highshelf filter, default 0 dB transparent)
 *   → Balance class (StereoPannerNode, default center)
 *   → MasterVolume class
 *   → AudioContext.destination
 *
 * The PluginChain, AnalyzerService, and PresetManager exist as stubs for
 * UI compatibility but are NOT connected to the audio path.
 * They will be wired in incrementally:
 *   7. + StereoWidth
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
  /** Dedicated MasterVolume effect (AudioEffect interface, post-chain stage). */
  private _masterVolumeEffect: MasterVolume | null = null
  /** Ordered list of effects — single source of truth for the UI. */
  private _effects: AudioEffect[] = []
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
    console.log('[DSP] AudioContext created. state=', this._ctx.state, 'sampleRate=', this._ctx.sampleRate, 'baseLatency=', this._ctx.baseLatency)

    // Monitor AudioContext state changes.
    this._ctx.onstatechange = () => {
      if (!this._ctx) return
      console.log('[DSP-CTX] AudioContext state:', this._ctx.state)
    }

    // Create input gain node (sources connect here).
    this._inputNode = this._ctx.createGain()
    this._inputNode.gain.value = 1.0
    console.log('[DSP] _inputNode created. gain=', this._inputNode.gain.value)

    // ── Create Preamp effect (input gain stage) ────────────────────
    this._preampEffect = new Preamp()
    this._preampEffect.initialize(this._ctx)
    // Default is 0 dB (linear gain = 1.0, unity), so no behavioral change.
    console.log('[DSP] Preamp effect created. gain=0 dB (unity)')
    this._effects.push(this._preampEffect)

    // ── Create Equalizer (flat, transparent) ───────────────────────
    this._equalizerEffect = new Equalizer10Band()
    this._equalizerEffect.initialize(this._ctx)
    // All 10 bands at 0 dB by default — completely transparent.
    console.log('[DSP] Equalizer effect created. all bands at 0 dB (flat)')
    this._effects.push(this._equalizerEffect)

    // ── Create Bass Boost (default 0 dB, transparent) ──────────────
    this._bassBoostEffect = new BassBoost()
    this._bassBoostEffect.initialize(this._ctx)
    // Default gain is 0 dB — lowshelf at 120 Hz, completely transparent.
    console.log('[DSP] BassBoost effect created. gain=0 dB (transparent), cutoff=120 Hz')
    this._effects.push(this._bassBoostEffect)

    // ── Create Treble Boost (default 0 dB, transparent at ~4 kHz) ──
    this._trebleBoostEffect = new TrebleBoost()
    this._trebleBoostEffect.initialize(this._ctx)
    // Default gain is 0 dB — highshelf at 4 kHz, completely transparent.
    console.log('[DSP] TrebleBoost effect created. gain=0 dB (transparent), cutoff=4 kHz')
    this._effects.push(this._trebleBoostEffect)

    // ── Create Balance (StereoPannerNode, default center) ───────
    this._balanceEffect = new Balance()
    this._balanceEffect.initialize(this._ctx)
    // Default pan is 0 (center) — completely transparent.
    console.log('[DSP] Balance effect created. pan=0 (center)')
    this._effects.push(this._balanceEffect)

    // ── Create dedicated MasterVolume effect ──────────────────────
    this._masterVolumeEffect = new MasterVolume()
    this._masterVolumeEffect.initialize(this._ctx)
    this._masterVolumeEffect.setParameter('volume', this._masterVolume)
    console.log('[DSP] MasterVolume effect created. volume=', this._masterVolume)
    this._effects.push(this._masterVolumeEffect)

    // Wire: _inputNode → Preamp → Equalizer → BassBoost → TrebleBoost → Balance → MasterVolume → destination
    this._inputNode.connect(this._preampEffect.input)
    console.log('[DSP] _inputNode -> Preamp.input connected')
    this._preampEffect.output.connect(this._equalizerEffect.input)
    console.log('[DSP] Preamp.output -> Equalizer.input connected')
    this._equalizerEffect.output.connect(this._bassBoostEffect.input)
    console.log('[DSP] Equalizer.output -> BassBoost.input connected')
    this._bassBoostEffect.output.connect(this._trebleBoostEffect.input)
    console.log('[DSP] BassBoost.output -> TrebleBoost.input connected')
    this._trebleBoostEffect.output.connect(this._balanceEffect.input)
    console.log('[DSP] TrebleBoost.output -> Balance.input connected')
    this._balanceEffect.output.connect(this._masterVolumeEffect.input)
    console.log('[DSP] Balance.output -> MasterVolume.input connected')
    this._masterVolumeEffect.output.connect(this._ctx.destination)
    console.log('[DSP] MasterVolume.output -> AudioContext.destination connected')

    // ── 🔬 Create analyser probes ─────────────────────────────────
    this._inputProbe = this._ctx.createAnalyser()
    this._inputProbe.fftSize = 2048
    this._outputProbe = this._ctx.createAnalyser()
    this._outputProbe.fftSize = 2048

    // Wire probes in parallel (snoop signal, don't affect main path).
    //   _inputNode →+→ MasterVolume →+→ _outputProbe →+→ destination
    //                |                 |
    //                +→ _inputProbe    +→ (snoops only)
    this._inputNode.connect(this._inputProbe)
    console.log('[DSP] 🔬 _inputNode -> _inputProbe connected (parallel snoop)')
    this._masterVolumeEffect.output.connect(this._outputProbe)
    console.log('[DSP] 🔬 MasterVolume.output -> _outputProbe connected (parallel snoop)')

    // Start probe logging interval (500ms polling).
    this._startProbeLogging()

    // Initialize stub chain (NOT connected to audio path).
    this._chain.initialize(this._ctx)
    console.log('[DSP] Stub PluginChain initialized (NOT connected to audio)')

    // Initialize stub analyzer (NOT connected to any audio node).
    // Pass a dummy AnalyserNode to avoid crashes — it won't produce data.
    const dummyAnalyser = this._ctx.createAnalyser()
    this._analyzer.initialize(this._ctx, dummyAnalyser)
    console.log('[DSP] Stub AnalyzerService initialized (dummy analyser, no data)')

    // Load presets.
    await this._presets.loadPresets()

    this._initialized = true

    // Routing summary.
    const mvGain = (this._masterVolumeEffect as any)?._gainNode?.gain?.value ?? '?'
    console.log('[DSP] ═══════════════════════════════════════════')
    console.log('[DSP] DSP Engine initialized — Phase 6 (Preamp + Equalizer + BassBoost + TrebleBoost + Balance + MasterVolume):')
    console.log('[DSP]   Source')
    console.log('[DSP]   → _inputNode (gain:', this._inputNode.gain.value, ')')
    console.log('[DSP]   → [Preamp] (0 dB unity)')
    console.log('[DSP]   → [Equalizer 10-band] (all bands 0 dB flat)')
    console.log('[DSP]   → [BassBoost] (lowshelf, 0 dB transparent, 120 Hz cutoff)')
    console.log('[DSP]   → [TrebleBoost] (highshelf, 0 dB transparent, 4 kHz cutoff)')
    console.log('[DSP]   → [Balance] (StereoPannerNode, center)')
    console.log('[DSP]   → [MasterVolume class] _gainNode.gain:', mvGain)
    console.log('[DSP]   → AudioContext.destination')
    console.log('[DSP]   🔬 _inputProbe fftSize:', this._inputProbe?.fftSize, '— snooping post-_inputNode')
    console.log('[DSP]   🔬 _outputProbe fftSize:', this._outputProbe?.fftSize, '— snooping pre-destination')
    console.log('[DSP]   🔬 Probe logging every 500ms (filter [PROBE])')
    console.log('[DSP]   ⚠️  PluginChain is DISCONNECTED from audio path')
    console.log('[DSP]   ⚠️  AnalyzerService has dummy analyser — no signal data')
    console.log('[DSP]   AudioContext state:', this._ctx.state)
    console.log('[DSP]   AudioContext sampleRate:', this._ctx.sampleRate)
    console.log('[DSP] ═══════════════════════════════════════════')

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
    this._masterVolumeEffect?.destroy()
    this._masterVolumeEffect = null
    this._effects = []
    this._chain.destroy()
    logDisconnect('GainNode(_inputNode)', 'DspEngine.destroy')
    this._inputNode?.disconnect()
    this._inputNode = null
    if (this._ctx && this._ctx.state !== 'closed') {
      this._ctx.close().catch(() => {})
    }
    this._ctx = null
    this._initialized = false
    console.log('[DSP] Engine destroyed')
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
   *   _inputNode → Preamp → Equalizer → BassBoost → TrebleBoost → Balance → MasterVolume → destination.
   *
   * @returns A disconnect function.
   */
  connectSource(source: AudioNode): () => void {
    if (!this._inputNode) {
      throw new Error('DspEngine not initialized')
    }
    console.log('[DSP] connectSource called. source node type:', source.constructor.name, 'inputNode.gain:', this._inputNode.gain.value)
    try {
      source.connect(this._inputNode)
      console.log('[DSP] Source connected to _inputNode successfully')
    } catch (err) {
      console.error('[DSP] FAILED to connect source to _inputNode:', err)
    }
    return () => {
      logDisconnect(source.constructor.name, 'DspEngine.connectSource(returned disconnect)')
      try {
        source.disconnect(this._inputNode!)
        console.log('[DSP] Source disconnected from _inputNode')
      } catch (err) {
        console.warn('[DSP] Error disconnecting source:', err)
      }
    }
  }

  /** Set master volume (0..1). Delegates to MasterVolume effect. */
  setMasterVolume(v: number): void {
    this._masterVolume = Math.max(0, Math.min(1, v))
    console.log('[DSP] setMasterVolume(', v, ') — clamped to', this._masterVolume)
    if (this._masterVolumeEffect) {
      this._masterVolumeEffect.setParameter('volume', this._masterVolume)
      console.log('[DSP]   MasterVolume effect updated. volume=', this._masterVolume)
    } else {
      console.warn('[DSP]   MasterVolume effect NOT initialized yet!')
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

      // Compute RMS and peak from byte data (128 = zero).
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

      console.log(
        '[PROBE] InputRMS=' + inputRms.toFixed(2) +
        ' OutputRMS=' + outputRms.toFixed(2) +
        ' InputPeak=' + inputPeak +
        ' OutputPeak=' + outputPeak +
        ' InputSilent=' + inputSilent +
        ' OutputSilent=' + outputSilent
      )

      if (!inputSilent && outputSilent) {
        console.warn('[PROBE] ⚠️  SIGNAL LOST IN DSP GRAPH! Input has signal, output is silent.')
      } else if (inputSilent && !outputSilent) {
        console.warn('[PROBE] ⚠️  REVERSE: Output has signal but input is silent (unexpected).')
      }
    }, 500)
  }

  /** Stop probe logging interval. */
  private _stopProbeLogging(): void {
    if (this._probeInterval) {
      clearInterval(this._probeInterval)
      this._probeInterval = null
    }
  }

  // ── Stub methods for UI compatibility ───────────────────────────

  setQualityPreset(_preset: QualityPreset): void {
    console.log('[DSP] setQualityPreset called — stub (no-op in minimal mode)')
  }

  applyPresetByName(_name: string): boolean {
    console.log('[DSP] applyPresetByName called — stub (no-op in minimal mode)')
    return false
  }

  applyPreset(_preset: Preset): void {
    console.log('[DSP] applyPreset called — stub (no-op in minimal mode)')
  }

  getActivePresetName(): string | null {
    return null
  }

  setAnalyserSource(_source: 'pre-fx' | 'post-fx'): void {
    console.log('[DSP] setAnalyserSource called — stub (no-op in minimal mode)')
  }
}

/** Singleton instance — import and use directly. */
export const dspEngine = new DspEngineSingleton()
