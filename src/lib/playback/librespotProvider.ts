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
 *
 * ── Seek Architecture ──
 *
 * The seek pipeline has been carefully designed to handle two critical
 * issues that caused the progress bar to be unreliable:
 *
 * ISSUE 1: Stale Rust state events overwriting seek targets
 * ─────────────────────────────────────────────────────
 * The Rust backend sends state events every 250ms via a polling loop.
 * When we send a seek command via invoke('librespot_seek'), the Rust
 * backend processes it asynchronously. But the state polling loop
 * continues sending events with the OLD position until the seek
 * actually completes. These stale events would previously clear
 * `pendingSeek` and overwrite the store with the old position,
 * causing the slider to snap back.
 *
 * FIX: track `seekTargetMs` and `preSeekPositionMs`. In the state
 * listener, only clear `pendingSeek` when the Rust position has
 * actually CROSSED or REACHED the seek target (within tolerance).
 * Until then, the emitProgress timer (200ms) returns the seek target
 * and keeps the slider at the correct position.
 *
 * ISSUE 2: Stale audio playing after seek
 * ──────────────────────────────────────
 * When seeking, the old audio packets in the Rust sync_channel buffer
 * (up to ~2 seconds of audio) continue to be sent and played. This
 * creates a delay between clicking and hearing the seeked position.
 *
 * FIX: call flushAudioQueue() immediately on seek to stop ALL
 * currently-scheduled AudioBufferSourceNodes. Set `cleared = true`
 * to discard stale incoming packets. The Rust backend emits
 * `librespot-seek-ready` when PlayerEvent::Seeked fires (the
 * decoder has actually produced audio at the new position). At that
 * point, set `cleared = false` to accept new audio.
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
  /** Fired by Rust when PlayerEvent::Seeked arrives — decoder has produced
   *  audio at the seeked position. Signals seek completion. */
  private unlistenSeekReady: (() => void) | null = null

  // Progress interval — drives smooth position updates between Rust polls
  private progressInterval: ReturnType<typeof setInterval> | null = null

  // Active AudioBufferSourceNode objects — tracked so stop() can clear them
  private activeSources: AudioBufferSourceNode[] = []

  /** Flag set after stop/clear to discard stale audio data until next play(). */
  private cleared = false

  /** Set after seek() to prevent the progress timer from estimating forward
   *  past the seek target before the Rust state loop confirms the new position.
   *  NOT cleared by stale Rust state events — only cleared when the Rust
   *  position has actually crossed or reached the seek target. */
  private pendingSeek = false
  /** The target position (ms) of the most recent seek. Used to detect when
   *  the Rust backend has actually processed our seek by comparing against
   *  the reported position in state events. */
  private seekTargetMs = 0
  /** The Rust position before seeking — captures direction for cross-detection. */
  private preSeekPositionMs = 0

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

            // ═══════════════════════════════════════════════════════
            // ISSUE 1 FIX: Guard against stale Rust state events
            // ═══════════════════════════════════════════════════════
            // The Rust backend sends position updates every 250ms via a
            // polling loop. After we send a seek command, the next few
            // state events will still report the OLD position (the seek
            // hasn't been processed yet).
            //
            // Previously, we cleared `pendingSeek` on EVERY state event,
            // causing stale positions to overwrite our seek target. This
            // created the "snap-back" behavior where the slider jumps to
            // the old position and stays there for 4-15 seconds.
            //
            // FIX: Only clear `pendingSeek` when the Rust position has
            // actually CROSSED or REACHED our seek target (within tolerance).
            // The emitProgress timer (200ms) maintains the seek target
            // position while we wait.
            if (this.pendingSeek) {
              const crossed = this.hasSeekTargetBeenReached(state.position_ms)

              if (crossed) {
                // ── TRACE: Rust state confirm ───────────────────
                performance.mark('seek-rust-confirm')
                performance.measure(
                  '⏱️ [G] seek-invoke-done → first Rust state confirm (backend seek latency)',
                  'seek-invoke-done',
                  'seek-rust-confirm',
                )

                // ── Log summary of ALL seek pipeline measurements ──
                console.group('⏱️ Seek pipeline timing');
                console.log(`  ⏱️ [A] user click: 0 ms (baseline)`);
                const measures = performance.getEntriesByType('measure')
                  .filter(m => m.name.startsWith('⏱️'))
                measures.forEach(m =>
                  console.log(`  ${m.name}: ${m.duration.toFixed(1)} ms`)
                )
                const first = performance.getEntriesByName('seek-mousedown', 'mark')[0]
                const last = performance.getEntriesByName('seek-rust-confirm', 'mark')[0]
                if (first && last) {
                  console.log(`  ─────────────────────────────────────────`)
                  console.log(`  ⏱️ TOTAL click → Rust confirm: ${(last.startTime - first.startTime).toFixed(1)} ms`)
                }
                console.groupEnd();

                // Seek confirmed — clear pendingSeek so emitProgress
                // resumes normal interpolation from this confirmed position.
                console.log('[SEEK] Rust position CROSSED target — seek confirmed')
                this.pendingSeek = false

                // Write the confirmed position to the store
                // (only if not dragging — the UI handles that).
                if (!store.isDragging) {
                  store.setCurrentTime(state.position_ms / 1000)
                }
              } else {
                // Rust position is still stale — don't touch currentTime.
                // The emitProgress timer keeps the slider at the seek target.
                console.log(
                  '[SEEK] Rust state stale:',
                  'position_ms=', state.position_ms,
                  'target=', this.seekTargetMs,
                  'preSeek=', this.preSeekPositionMs,
                  '— KEEPING pendingSeek=true, SKIPPING store write',
                )
              }
            } else {
              // ── Normal (non-seek) state update ───────────────────
              // No seek in progress — write the Rust position directly.
              if (!store.isDragging) {
                console.log('[LIBRESPOT] state event → writing to store (normal)')
                store.setCurrentTime(state.position_ms / 1000)
              } else {
                console.log('[LIBRESPOT] state event → SKIPPED setCurrentTime (isDragging=true)')
              }
            }

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

    // Listen for seek-ready events — Rust emits this when PlayerEvent::Seeked
    // fires, meaning the decoder has produced audio at the seeked position.
    // At this point we can accept new audio packets (cleared = false).
    try {
      this.unlistenSeekReady = await listen<null>(
        'librespot-seek-ready',
        () => {
          if (this.destroyed) return
          console.log('[SEEK] librespot-seek-ready received — decoder has produced seeked audio')
          // Accept incoming audio chunks from the new position.
          this.cleared = false
          // Reset scheduling so new audio starts immediately at the current
          // AudioContext time (not queued after stale packets).
          this.scheduledEndTime = 0
        },
      )
    } catch (e) {
      console.warn('[librespot] Failed to listen for seek-ready events', e)
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
    this.unlistenSeekReady?.()
    this.unlistenSeekReady = null

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
    console.log('[SEEK] requested=', seconds, 's (', Math.round(seconds * 1000), 'ms )')

    // ═══════════════════════════════════════════════════════════
    // ISSUE 2 FIX: Flush stale audio immediately
    // ═══════════════════════════════════════════════════════════
    // When seeking, the old audio packets in the Rust sync_channel
    // (up to ~2s of buffered PCM) and our Web Audio scheduled queue
    // continue to play. This creates latency between clicking and
    // hearing the new position.
    //
    // Fix: flush our entire audio queue immediately, and discard
    // incoming stale packets until the Rust decoder produces audio
    // at the new position (signalled by librespot-seek-ready).
    // Clear the EndOfTrack tail flag if set — the seek overrides it.
    this.endOfTrackPending = false

    this.flushAudioQueue()
    this.cleared = true
    console.log('[SEEK] flushed audio queue + discarded incoming packets (cleared=true)')

    // ── Safety timeout ───────────────────────────────────────────
    // If librespot-seek-ready never fires (e.g., seek fails, player
    // error), cleared stays true and audio goes permanently silent.
    // Reset after 10 seconds as a fallback.
    setTimeout(() => {
      if (this.cleared) {
        console.warn('[SEEK] Fallback: cleared still true after 10s — forcing re-enable')
        this.cleared = false
        this.scheduledEndTime = 0
      }
    }, 10000)

    const ms = Math.round(seconds * 1000)

    // ── TRACE: provider seek ───────────────────────────────────
    performance.mark('seek-provider-enter')
    performance.measure(
      '⏱️ [E.1] engine → librespotProvider.seek() enter (before invoke)',
      'seek-engine-calling-active',
      'seek-provider-enter',
    )

    // ── Track seek target for cross-detection ──────────────────
    this.preSeekPositionMs = this.lastRustPositionMs
    this.seekTargetMs = ms
    this.lastRustPositionMs = ms
    this.lastRustUpdateAt = Date.now()
    this.pendingSeek = true
    console.log('[SEEK] preSeekPositionMs=', this.preSeekPositionMs, 'seekTargetMs=', this.seekTargetMs)

    console.log('[RUST] seek command sent')
    try {
      await invoke('librespot_seek', { positionMs: ms })

      performance.mark('seek-invoke-done')
      performance.measure(
        '⏱️ [E.2] Tauri invoke → Rust librespot_seek completed (IPC round-trip)',
        'seek-provider-enter',
        'seek-invoke-done',
      )

      console.log('[RUST] seek command accepted — waiting for backend confirmation...')
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
   * Detect whether the Rust backend has processed our seek by checking
   * if the reported position has CROSSED or REACHED the seek target.
   *
   * For forward seeks (target > pre-seek position): wait until
   * the reported position >= target - tolerance.
   *
   * For backward seeks (target < pre-seek position): wait until
   * the reported position <= target + tolerance.
   */
  private hasSeekTargetBeenReached(reportedMs: number): boolean {
    const toleranceMs = 1000 // 1 second tolerance

    if (this.seekTargetMs >= this.preSeekPositionMs) {
      // Forward seek: position should increase from preSeek → target
      return reportedMs >= this.seekTargetMs - toleranceMs
    } else {
      // Backward seek: position should decrease from preSeek → target
      return reportedMs <= this.seekTargetMs + toleranceMs
    }
  }

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

        // ── TRACE: emitProgress during seek-pending ────────────
        // This fires every 200ms while waiting for Rust confirmation.
        // Measures time from invoke-done to first emitProgress after seek.
        // Guards against missing start mark (invoke may not have completed yet).
        const measure = performance.getEntriesByName(
          '⏱️ seek-pending emitProgress',
          'measure',
        )
        if (
          measure.length === 0 &&
          this.lastRustPositionMs > 0 &&
          performance.getEntriesByName('seek-invoke-done', 'mark').length > 0
        ) {
          performance.mark('seek-pending-emit')
          performance.measure(
            '⏱️ [F] invoke-done → first seek-pending emitProgress (Rust confirmation delay)',
            'seek-invoke-done',
            'seek-pending-emit',
          )
        }
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
