import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import type {
  PlaybackProvider,
  PlaybackSource,
  ProgressCallback,
  TrackEndedCallback,
  TrackChangedCallback,
  ErrorCallback,
} from './types'

/** Payload emitted by the Rust librespot playback loop every 250 ms. */
interface LibrespotStatePayload {
  is_playing: boolean
  position_ms: number
  duration_ms: number
  volume: number
}

/** Audio chunk payload sent from the Rust audio sink. */
interface AudioChunkPayload {
  /** Base64-encoded raw f32 bytes (little-endian, interleaved). */
  samples: string
  sample_rate: number
  channels: number
}

/**
 * Librespot playback provider.
 *
 * Uses the embedded librespot Rust backend for direct Spotify audio
 * streaming without requiring the official Spotify desktop application.
 * Audio PCM data is received via Tauri events and played through the
 * Web Audio API, so it behaves exactly like local file playback.
 */
export class LibrespotProvider implements PlaybackProvider {
  readonly id: PlaybackSource = 'spotify-librespot'

  private initialised = false
  private destroyed = false

  // Audio context & playback
  private audioCtx: AudioContext | null = null
  private gainNode: GainNode | null = null
  private scheduledEndTime = 0
  private currentVolume = 0.7

  // State tracking
  private isPlaying = false
  private currentPositionMs = 0
  private trackDurationMs = 0

  // Callbacks
  private progressCbs: ProgressCallback[] = []
  private endedCbs: TrackEndedCallback[] = []
  private trackCbs: TrackChangedCallback[] = []
  private errorCbs: ErrorCallback[] = []

  // Tauri event listeners
  private unlistenState: (() => void) | null = null
  private unlistenAudio: (() => void) | null = null

  // Progress interval
  private progressInterval: ReturnType<typeof setInterval> | null = null

  /** Whether the provider has been initialised and is ready for playback. */
  isAvailable(): boolean {
    return this.initialised && this.audioCtx !== null
  }

  async initialize(): Promise<void> {
    if (this.initialised) return
    this.initialised = true

    // Listen for librespot state changes from the Rust backend.
    try {
      this.unlistenState = await listen<LibrespotStatePayload>(
        'librespot-state-changed',
        (event) => {
          if (this.destroyed) return
          const state = event.payload
          this.isPlaying = state.is_playing
          this.currentPositionMs = state.position_ms
          this.trackDurationMs = state.duration_ms

          this.emitProgress()
        },
      )
    } catch (e) {
      console.warn('[librespot] Failed to listen for state events', e)
    }

    // Listen for audio data chunks from the Rust backend.
    try {
      this.unlistenAudio = await listen<AudioChunkPayload>(
        'librespot-audio-data',
        (event) => {
          if (this.destroyed) return
          this.handleAudioChunk(event.payload)
        },
      )
    } catch (e) {
      console.warn('[librespot] Failed to listen for audio events', e)
    }

    // Initialise Web Audio API context (must be done after user gesture).
    try {
      this.audioCtx = new AudioContext()
      this.gainNode = this.audioCtx.createGain()
      this.gainNode.gain.value = this.currentVolume
      this.gainNode.connect(this.audioCtx.destination)
    } catch (e) {
      console.warn('[librespot] Web Audio API not available', e)
    }
  }

  destroy(): void {
    this.destroyed = true

    // Unlisten Tauri events.
    this.unlistenState?.()
    this.unlistenState = null
    this.unlistenAudio?.()
    this.unlistenAudio = null

    // Stop progress interval.
    if (this.progressInterval) {
      clearInterval(this.progressInterval)
      this.progressInterval = null
    }

    // Close audio context.
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close().catch(() => {})
    }
    this.audioCtx = null
    this.gainNode = null

    // Stop the librespot session in the backend.
    invoke('librespot_stop').catch(() => {})

    this.removeAllListeners()
  }

  async play(resource: string): Promise<void> {
    console.log('[librespot] Play requested:', resource)

    // Ensure audio context is resumed (user gesture requirement).
    if (this.audioCtx?.state === 'suspended') {
      await this.audioCtx.resume()
    }

    // Lazily start the librespot session on the first play call.
    console.log('[librespot] Ensuring session started...')
    try {
      await this.ensureSessionStarted()
    } catch (e) {
      const msg = `[librespot] Session start failed: ${e}`
      console.error(msg)
      this.errorCbs.forEach((cb) => cb(msg))
      throw e
    }

    // Reset scheduling.
    this.scheduledEndTime = 0

    try {
      console.log('[librespot] Sending play command to backend...')
      await invoke('librespot_play', { uri: resource })
      console.log('[librespot] Play command succeeded.')
      this.isPlaying = true
      this.startProgressTimer()
    } catch (e) {
      const msg = String(e)
      console.error('[librespot] Play command failed:', msg)
      this.errorCbs.forEach((cb) => cb(msg))
    }
  }

  async pause(): Promise<void> {
    try {
      await invoke('librespot_pause')
      this.isPlaying = false
    } catch (e) {
      console.error('[librespot] Pause failed:', e)
    }
  }

  async resume(): Promise<void> {
    if (this.audioCtx?.state === 'suspended') {
      await this.audioCtx.resume()
    }
    try {
      await invoke('librespot_resume')
      this.isPlaying = true
      this.startProgressTimer()
    } catch (e) {
      console.error('[librespot] Resume failed:', e)
    }
  }

  async togglePlay(): Promise<void> {
    if (this.isPlaying) {
      await this.pause()
    } else {
      await this.resume()
    }
  }

  async stop(): Promise<void> {
    await this.pause()
    this.currentPositionMs = 0
    this.scheduledEndTime = 0
    this.stopProgressTimer()
  }

  async next(): Promise<void> {
    // Librespot doesn't queue — the engine handles track advancement.
    // This is a no-op at the provider level; the engine will call
    // play() with the next track's URI.
  }

  async prev(): Promise<void> {
    // Same as next — handled by the engine.
  }

  async seek(seconds: number): Promise<void> {
    const ms = Math.round(seconds * 1000)
    try {
      await invoke('librespot_seek', { positionMs: ms })
      this.currentPositionMs = ms
      this.emitProgress()
    } catch (e) {
      console.error('[librespot] Seek failed:', e)
    }
  }

  async setVolume(v: number): Promise<void> {
    this.currentVolume = Math.max(0, Math.min(1, v))

    // Set local gain.
    if (this.gainNode) {
      this.gainNode.gain.value = this.currentVolume
    }

    // Sync to Rust backend.
    try {
      await invoke('librespot_set_volume', { volume: this.currentVolume })
    } catch (e) {
      console.error('[librespot] Set volume failed:', e)
    }
  }

  getVolume(): number {
    return this.currentVolume
  }

  onProgress(cb: ProgressCallback): void {
    this.progressCbs.push(cb)
  }
  onTrackEnded(cb: TrackEndedCallback): void {
    this.endedCbs.push(cb)
  }
  onTrackChanged(cb: TrackChangedCallback): void {
    this.trackCbs.push(cb)
  }
  onError(cb: ErrorCallback): void {
    this.errorCbs.push(cb)
  }

  removeAllListeners(): void {
    this.progressCbs = []
    this.endedCbs = []
    this.trackCbs = []
    this.errorCbs = []
  }

  // ── Internal ──────────────────────────────────────────────

  private startProgressTimer(): void {
    if (this.progressInterval) return
    this.progressInterval = setInterval(() => {
      this.emitProgress()
    }, 200)
  }

  private stopProgressTimer(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval)
      this.progressInterval = null
    }
  }

  private emitProgress(): void {
    const progress = {
      currentTimeSec: this.currentPositionMs / 1000,
      durationSec: this.trackDurationMs / 1000,
      isPlaying: this.isPlaying,
    }
    this.progressCbs.forEach((cb) => cb(progress))
  }

  /**
   * Ensure the librespot backend session is started.
   * Lazily initialised on the first play() call.
   */
  private sessionStarted = false
  private sessionStartPromise: Promise<void> | null = null

  private async ensureSessionStarted(): Promise<void> {
    if (this.sessionStarted) return
    if (this.sessionStartPromise) return this.sessionStartPromise

    this.sessionStartPromise = (async () => {
      console.log('[librespot] Creating session...')
      try {
        // Get the Spotify access token and account info from the backend.
        const { spotifyService } = await import('../spotify')
        const token = await spotifyService.getAccessToken()

        // Fetch the account product type (premium/free) for diagnostic logging.
        let accountProduct: string | null = null
        try {
          const status = await spotifyService.accountStatus()
          accountProduct = status.product ?? null
          console.log('[librespot] Account product:', accountProduct)
        } catch {
          console.warn('[librespot] Could not fetch account product')
        }

        console.log('[librespot] Got access token, starting session...')

        await invoke('librespot_start', {
          authData: token,
          accountProduct: accountProduct,
        })
        console.log('[librespot] Session connected.')

        this.sessionStarted = true
      } catch (e) {
        console.error('[librespot] Session start failed:', e)
        this.sessionStartPromise = null // Allow retry on next play call
        throw e
      }
    })()

    return this.sessionStartPromise
  }

  /** Handle incoming PCM audio data from the Rust backend. */
  private handleAudioChunk(payload: AudioChunkPayload): void {
    if (!this.audioCtx || !this.gainNode) return

    try {
      // Decode base64 → raw f32 bytes → Float32Array.
      const samples = base64ToFloat32(payload.samples)
      if (samples.length === 0) return

      const frameCount = Math.floor(samples.length / payload.channels)
      if (frameCount === 0) return

      const buffer = this.audioCtx.createBuffer(
        payload.channels,
        frameCount,
        payload.sample_rate,
      )

      // Deinterleave the interleaved Float32Array into per-channel views.
      for (let ch = 0; ch < payload.channels; ch++) {
        const channelData = buffer.getChannelData(ch)
        for (let i = 0; i < frameCount; i++) {
          channelData[i] = samples[i * payload.channels + ch] ?? 0
        }
      }

      // Schedule the buffer for gap-less playback.
      const source = this.audioCtx.createBufferSource()
      source.buffer = buffer
      source.connect(this.gainNode)

      const now = this.audioCtx.currentTime
      const duration = frameCount / payload.sample_rate

      if (this.scheduledEndTime <= now) {
        source.start(now)
        this.scheduledEndTime = now + duration
      } else {
        source.start(this.scheduledEndTime)
        this.scheduledEndTime += duration
      }
    } catch (e) {
      // Silently ignore parse/playback errors for individual chunks.
      console.warn('[librespot] Audio chunk error:', e)
    }
  }
}

// ── Helpers ──────────────────────────────────────────────────────

/**
 * Decode a base64 string into a Float32Array of interleaved PCM samples.
 *
 * The base64 string encodes raw little-endian f32 bytes. This approach
 * is ~2.25x more compact than JSON number arrays and avoids the cost
 * of parsing N individual JSON numbers.
 */
function base64ToFloat32(b64: string): Float32Array {
  const binaryString = atob(b64)
  const len = binaryString.length
  const buffer = new ArrayBuffer(len)
  const bytes = new Uint8Array(buffer)
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return new Float32Array(buffer)
}

