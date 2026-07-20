import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { usePlayerStore } from '../../state/usePlayerStore'
import type {
  PlaybackProvider,
  PlaybackSource,
  ProgressCallback,
  TrackEndedCallback,
  TrackChangedCallback,
  ErrorCallback,
  AudioDataCallback,
  AudioData,
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
 *
 * ── Architecture ──
 *
 * The playstore (usePlayerStore) is the SINGLE source of truth for
 * playback state (currentTime, duration, isPlaying, playbackStatus).
 *
 * This provider:
 *   - Decodes audio / communicates with Rust
 *   - Emits events (progressCbs, endedCbs) that the engine writes to the store
 *   - Reads from the store when it needs state (togglePlay, seek, etc.)
 *
 * It does NOT maintain its own copy of playback state, eliminating the
 * synchronization problems caused by multiple state writers.
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

  // State tracking — MINIMAL, only needed to estimate position smoothly
  // between Rust state loop updates (every 250 ms). The store is the
  // canonical source; these fields only provide interpolation data.
  private lastRustPositionMs = 0
  /** Date.now() when the last Rust state update arrived. */
  private lastRustUpdateAt = 0

  // Callbacks
  private progressCbs: ProgressCallback[] = []
  private endedCbs: TrackEndedCallback[] = []
  private trackCbs: TrackChangedCallback[] = []
  private errorCbs: ErrorCallback[] = []
  private audioDataCbs: AudioDataCallback[] = []

  // Tauri event listeners
  private unlistenState: (() => void) | null = null
  private unlistenAudio: (() => void) | null = null
  private unlistenTrackEnded: (() => void) | null = null
  private unlistenAudioClear: (() => void) | null = null

  // Progress interval — drives smooth position updates between Rust polls
  private progressInterval: ReturnType<typeof setInterval> | null = null

  // Active AudioBufferSourceNode objects — tracked so stop() can clear them
  private activeSources: AudioBufferSourceNode[] = []

  /** Flag set after stop/clear to discard stale audio data until next play(). */
  private cleared = false

  /** Set after seek() to prevent the progress timer from estimating forward
   *  past the seek target before the Rust state loop confirms the new position.
   *  Cleared when the next librespot-state-changed event arrives. */
  private pendingSeek = false

  // EndOfTrack delay — the Rust decoder emits EndOfTrack when decoding finishes,
  // but ~1.8s of audio may still be buffered in the mpsc channel + emitter + Web Audio.
  // We delay the 'ended' state until the Web Audio queue is actually empty.
  private endOfTrackPending = false
  /** Position (ms) at the moment EndOfTrack was received from Rust. */
  private endOfTrackAtMs = 0
  /** Real-time (Date.now()) when EndOfTrack was received. */
  private endOfTrackTime = 0

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
          console.log('[LIBRESPOT] state event: position_ms=', state.position_ms, 'is_playing=', state.is_playing, 'duration_ms=', state.duration_ms, 'endOfTrackPending=', this.endOfTrackPending)

          // Remember the last Rust position + timestamp so the progress
          // timer can interpolate smoothly between state updates.
          this.lastRustPositionMs = state.position_ms
          this.lastRustUpdateAt = Date.now()

          // During the EndOfTrack tail, Rust sends position_ms=0 and
          // is_playing=false. We must NOT overwrite the store's estimated
          // position — the EOT path in emitProgress() handles this.
          if (!this.endOfTrackPending) {
            const store = usePlayerStore.getState()
            // Rust has confirmed the actual position — clear the pending-seek
            // guard so emitProgress resumes normal estimation from this position.
            this.pendingSeek = false
            console.log('[LIBRESPOT] state event → writing to store (pendingSeek=false)')
            store.setCurrentTime(state.position_ms / 1000)
            store.setPlaying(state.is_playing)
            if (state.duration_ms > 0) {
              store.setDuration(state.duration_ms / 1000)
            }
          } else {
            console.log('[LIBRESPOT] state event — SKIPPED store write (EOT pending)')
          }

          // Fire progress callbacks so the engine's onProgress can react.
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

    // Listen for track-ended events from the Rust backend.
    // IMPORTANT: We do NOT immediately transition to 'ended' state here.
    // The Rust decoder has finished decoding, but up to ~1.8s of audio
    // may still be buffered in the mpsc channel + emitter + Web Audio queue.
    // Instead we set a pending flag and let emitProgress() fire endedCbs
    // once the Web Audio scheduled queue is actually empty.
    try {
      this.unlistenTrackEnded = await listen<null>(
        'librespot-track-ended',
        () => {
          if (this.destroyed) return
          console.log('[librespot] track-ended event received — delaying ended state until audio queue drains')

          // Capture the current position from the store before Rust resets it.
          const store = usePlayerStore.getState()
          this.endOfTrackAtMs = store.currentTime * 1000
          this.endOfTrackTime = Date.now()
          this.endOfTrackPending = true

          // Keep the progress timer running so the UI stays alive during the tail.
          // We do NOT call endedCbs immediately — emitProgress() handles queue drain detection.
        },
      )
    } catch (e) {
      console.warn('[librespot] Failed to listen for track-ended events', e)
    }

    // Listen for audio-clear events — Rust sends this on stop_playback().
    try {
      this.unlistenAudioClear = await listen<null>(
        'librespot-audio-clear',
        () => {
          if (this.destroyed) return
          console.log('[librespot] audio-clear event received — flushing scheduled audio')
          this.flushAudioQueue()
        },
      )
    } catch (e) {
      console.warn('[librespot] Failed to listen for audio-clear events', e)
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

    // Flush any scheduled audio.
    this.flushAudioQueue()

    // Unlisten Tauri events.
    this.unlistenState?.()
    this.unlistenState = null
    this.unlistenAudio?.()
    this.unlistenAudio = null
    this.unlistenTrackEnded?.()
    this.unlistenTrackEnded = null
    this.unlistenAudioClear?.()
    this.unlistenAudioClear = null

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

    // Clear the stale-audio guard — new playback should produce sound.
    this.cleared = false
    this.endOfTrackPending = false
    this.pendingSeek = false

    // Stop the progress timer — it will be restarted once playback actually starts.
    this.stopProgressTimer()

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

    // Reset scheduling — start fresh for the new track.
    this.scheduledEndTime = 0

    try {
      console.log('[librespot] Sending play command to backend...')
      await invoke('librespot_play', { uri: resource })
      console.log('[librespot] Play command succeeded.')

      // Reset interpolation state before starting the timer.
      // Without this, lastRustUpdateAt=0 would produce a huge position
      // estimate on the first timer tick (Date.now() - 0 ≈ 3e11 ms).
      this.lastRustPositionMs = 0
      this.lastRustUpdateAt = Date.now()

      // Start the progress timer for smooth position interpolation.
      this.startProgressTimer()
    } catch (e) {
      const msg = String(e)
      console.error('[librespot] Play command failed:', msg)
      this.errorCbs.forEach((cb) => cb(msg))
    }
  }

  async pause(): Promise<void> {
    console.log('[LIBRESPOT] pause() — flushing audio, stopping timer, invoking backend')
    // 1. Flush ALL scheduled Web Audio sources immediately.
    //    This stops the already-scheduled AudioBufferSourceNodes from
    //    continuing to play out their buffered PCM.
    this.flushAudioQueue()
    // 2. Discard any incoming audio chunks still arriving from the Rust
    //    emitter (which drains the mpsc channel after the decoder pauses).
    this.cleared = true
    // 3. Stop the progress timer (avoids position estimation during pause).
    this.stopProgressTimer()
    try {
      await invoke('librespot_pause')
      console.log('[LIBRESPOT] pause() — backend completed')
    } catch (e) {
      console.error('[LIBRESPOT] pause() failed:', e)
    }
  }

  async resume(): Promise<void> {
    console.log('[LIBRESPOT] resume() — accepting new audio, resuming playback')
    // Re-accept incoming audio chunks (was blocked by cleared=true in pause()).
    this.cleared = false
    if (this.audioCtx?.state === 'suspended') {
      console.log('[LIBRESPOT] resume() — resuming AudioContext')
      await this.audioCtx.resume()
    }
    if (!this.progressInterval) {
      console.log('[LIBRESPOT] resume() — restarting progress timer')
      this.startProgressTimer()
    }
    try {
      await invoke('librespot_resume')
      console.log('[LIBRESPOT] resume() — backend completed')
    } catch (e) {
      console.error('[LIBRESPOT] resume() failed:', e)
    }
  }

  async togglePlay(): Promise<void> {
    // Read playback state from the STORE (single source of truth).
    const store = usePlayerStore.getState()
    if (store.isPlaying) {
      await this.pause()
    } else {
      await this.resume()
    }
  }

  async stop(): Promise<void> {
    console.log('[LIBRESPOT] stop() — flushing audio queue, clearing state')
    this.flushAudioQueue()
    this.cleared = true
    this.scheduledEndTime = 0
    this.endOfTrackPending = false
    this.stopProgressTimer()

    // Tell the backend to stop the decoder and clear its buffer.
    try {
      console.log('[LIBRESPOT] stop() — invoking librespot_stop_playback')
      await invoke('librespot_stop_playback')
      console.log('[LIBRESPOT] stop() — backend completed')
    } catch (e) {
      console.error('[LIBRESPOT] stop_playback failed:', e)
    }
  }

  async next(): Promise<void> {
    // Librespot doesn't queue — the engine handles track advancement.
  }

  async prev(): Promise<void> {
    // Same as next — handled by the engine.
  }

  async seek(seconds: number): Promise<void> {
    console.log('[LIBRESPOT] seek(', seconds, ') — pendingSeek=true, invoking backend')
    // The engine has already done the optimistic store update.
    // We only need to tell the backend.
    const ms = Math.round(seconds * 1000)
    this.lastRustPositionMs = ms
    this.lastRustUpdateAt = Date.now()
    this.pendingSeek = true
    try {
      await invoke('librespot_seek', { positionMs: ms })
      console.log('[LIBRESPOT] seek() — backend completed')
    } catch (e) {
      console.error('[LIBRESPOT] seek() failed:', e)
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
  onAudioData(cb: AudioDataCallback): void {
    this.audioDataCbs.push(cb)
  }

  removeAllListeners(): void {
    this.progressCbs = []
    this.endedCbs = []
    this.trackCbs = []
    this.errorCbs = []
    this.audioDataCbs = []
  }

  // ── Internal ──────────────────────────────────────────────

  /**
   * Start the progress timer for smooth position interpolation.
   *
   * Between Rust state loop updates (every 250 ms), this timer
   * estimates the current position by incrementing from the last
   * known Rust position based on real elapsed time. This gives
   * the UI a smooth 200ms-refresh experience instead of 250ms jumps.
   */
  private startProgressTimer(): void {
    if (this.progressInterval) {
      console.log('[LIBRESPOT] startProgressTimer() — already running, skipping')
      return
    }
    console.log('[LIBRESPOT] startProgressTimer() — starting 200ms interval')
    this.progressInterval = setInterval(() => {
      this.emitProgress()
    }, 200)
  }

  private stopProgressTimer(): void {
    if (this.progressInterval) {
      console.log('[LIBRESPOT] stopProgressTimer() — clearing interval')
      clearInterval(this.progressInterval)
      this.progressInterval = null
    } else {
      console.log('[LIBRESPOT] stopProgressTimer() — no interval to clear')
    }
  }

  /**
   * Emit a progress event to the engine.
   *
   * Reads playback state FROM THE STORE (single source of truth)
   * rather than from internal fields. During the EndOfTrack tail,
   * position is estimated from the saved EOT position + elapsed time.
   */
  private emitProgress(): void {
    const store = usePlayerStore.getState()

    let currentTimeSec: number
    let isPlaying: boolean
    let sourceTag: string

    if (this.endOfTrackPending) {
      const elapsedSec = (Date.now() - this.endOfTrackTime) / 1000
      currentTimeSec = (this.endOfTrackAtMs / 1000) + elapsedSec
      isPlaying = true
      sourceTag = 'EOT-tail'
    } else {
      isPlaying = store.isPlaying

      if (this.pendingSeek) {
        // After a seek, the Rust backend hasn't confirmed the new position yet.
        // Don't estimate forward — use the exact seek target until the next
        // Rust state update arrives (~250ms). This prevents the progress bar
        // from racing ahead and then jumping back when Rust confirms.
        currentTimeSec = this.lastRustPositionMs / 1000
        sourceTag = 'seek-pending'
      } else {
        // Between Rust state updates, estimate position from the last known
        // Rust position + elapsed real time. This provides smooth interpolation.
        const elapsedSinceRust = (Date.now() - this.lastRustUpdateAt) / 1000
        const estimatedMs = this.lastRustPositionMs + (elapsedSinceRust * 1000)
        currentTimeSec = estimatedMs / 1000
        sourceTag = 'interpolated'
      }
    }

    const progress = {
      currentTimeSec,
      durationSec: store.duration,
      isPlaying,
    }

    console.log('[LIBRESPOT] emitProgress() [' + sourceTag + '] → currentTimeSec=', currentTimeSec, 'isPlaying=', isPlaying, 'firing', this.progressCbs.length, 'callbacks')

    // Check if the Web Audio queue is finally exhausted during EOT tail.
    if (this.endOfTrackPending &&
        (!this.audioCtx || this.scheduledEndTime <= this.audioCtx.currentTime)) {
      console.log('[LIBRESPOT] Audio queue drained — firing EndOfTrack now')
      this.endOfTrackPending = false
      this.stopProgressTimer()

      const finalProgress = {
        currentTimeSec,
        durationSec: store.duration,
        isPlaying: false,
      }
      console.log('[LIBRESPOT] emitProgress() final EOT → isPlaying=false, firing endedCbs')
      this.progressCbs.forEach((cb) => cb(finalProgress))
      this.endedCbs.forEach((cb) => cb())
      return
    }

    this.progressCbs.forEach((cb) => cb(progress))
  }

  /** Flush the Web Audio scheduled queue — stop all active sources immediately. */
  private flushAudioQueue(): void {
    // Stop all active BufferSource nodes.
    const sources = this.activeSources
    this.activeSources = []
    for (const src of sources) {
      try {
        src.stop()
      } catch {
        // Source may have already stopped — ignore.
      }
    }
    // Reset scheduling so new buffers start immediately instead of queuing.
    this.scheduledEndTime = 0
    console.log(`[librespot] Flushed ${sources.length} active audio sources`)
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

    // After stop/clear, discard any stale audio data still arriving via
    // the emitter (which drains remaining mpsc packets after stop).
    if (this.cleared) return

    try {
      // Decode base64 → raw f32 bytes → Float32Array.
      const samples = base64ToFloat32(payload.samples)
      if (samples.length === 0) return

      // Emit raw PCM data for visualizers before scheduling playback.
      if (this.audioDataCbs.length > 0) {
        const audioData: AudioData = {
          samples,
          sampleRate: payload.sample_rate,
          channels: payload.channels,
        }
        this.audioDataCbs.forEach((cb) => cb(audioData))
      }

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

      // Track this source so stop() can immediately terminate it.
      this.activeSources.push(source)
      source.onended = () => {
        // Remove from active list when it naturally finishes.
        const idx = this.activeSources.indexOf(source)
        if (idx >= 0) this.activeSources.splice(idx, 1)
      }

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
