import { usePlayerStore } from '../../state/usePlayerStore'
import { LocalPlaybackProvider } from './localProvider'
import { SpotifySdkProvider } from './spotifySdkProvider'
import { LibrespotProvider } from './librespotProvider'
import type {
  AudioDataCallback,
  PlaybackProvider,
  PlaybackSource,
  NowPlayingMeta,
} from './types'

/**
 * Singleton facade that routes playback commands to the active provider.
 *
 * Components call `playbackEngine.togglePlay()` / `.next()` / `.seek()`
 * etc. — the engine decides whether to control local audio, the Spotify
 * Web Playback SDK, or the embedded Librespot engine.
 *
 * Librespot replaces Spotify Connect as the primary Spotify playback
 * mechanism — it streams audio directly from Spotify without requiring
 * the official desktop application.
 */
class PlaybackEngine {
  private local: LocalPlaybackProvider
  private spotifySdk: SpotifySdkProvider
  private librespot: LibrespotProvider
  private active: PlaybackProvider
  private initialized = false
  private audioDataCbs: AudioDataCallback[] = []

  // Track the last-played resource + metadata for restarting after EndOfTrack.
  private lastResource: string | null = null
  private lastMeta: NowPlayingMeta | null = null

  constructor() {
    this.local = new LocalPlaybackProvider()
    this.spotifySdk = new SpotifySdkProvider()
    this.librespot = new LibrespotProvider()
    this.active = this.local

    // Wire the initial active provider (local) so its events drive the store.
    this.wireActiveProvider()

  }

  /** Call once at app startup. Initializes all providers. */
  async initialize(): Promise<void> {
    if (this.initialized) return
    this.initialized = true

    // Local is always ready — nothing to init.
    // Try to init the Librespot backend (non-blocking).
    try {
      await this.librespot.initialize()
      console.log('[playback] Librespot provider ready')
    } catch (e) {
      console.warn('[playback] Librespot init failed', e)
    }

    // Try to init the Spotify SDK (non-blocking, optional fallback).
    try {
      await this.spotifySdk.initialize()
      if (this.spotifySdk.isAvailable()) {
        console.log('[playback] Spotify Web Playback SDK ready')
      }
    } catch (e) {
      console.warn('[playback] Spotify SDK init failed', e)
    }
  }

  /** Get the currently active provider ID. */
  get source(): PlaybackSource {
    return this.active.id
  }

  /** Switch the active provider. */
  setSource(source: PlaybackSource): void {
    if (this.active.id === source) return

    // Step 1: Clean up the OLD provider so its events stop affecting the store.
    this.active.removeAllListeners()
    this.active.pause().catch(() => {})

    // Step 2: Switch to the new provider.
    switch (source) {
      case 'local':
        this.active = this.local
        break
      case 'spotify-sdk':
        this.active = this.spotifySdk
        break
      case 'spotify-librespot':
        this.active = this.librespot
        break
    }

    // Step 3: Wire the NEW provider's callbacks.
    const store = usePlayerStore.getState()
    store.setActiveSource(source)
    if (source !== 'local') {
      store.setNowPlaying(null)
    }
    store.setPlaybackStatus('loading')
    console.log('[playback] Switched to', source)
    this.wireActiveProvider()
  }

  /**
   * Wire only the active provider's callbacks. Call this after switching
   * providers so stale events from inactive providers never touch the store.
   */
  private wireActiveProvider(): void {
    // We store the current active source so callbacks can verify freshness.
    const currentSource = this.active.id

    this.active.removeAllListeners()

    this.active.onProgress((p) => {
      // Guard: ignore events from previously-active providers.
      if (currentSource !== this.active.id) return
      console.log('[ENGINE] onProgress fired from provider', this.active.id, '→ currentTimeSec=', p.currentTimeSec, 'durationSec=', p.durationSec, 'isPlaying=', p.isPlaying)
      const store = usePlayerStore.getState()

      // ── Single authoritative source of currentTime ──────────────
      // During a user-initiated drag, ONLY the UI (TransportControls)
      // writes currentTime — skip progress callbacks entirely so they
      // never fight the drag position or cause snap-back.
      // Once the drag ends (mouseup), the engine issues one final
      // seek() and the next progress callback from the backend
      // confirms the real position.
      if (!store.isDragging) {
        console.log('[SRC:engine/onProgress] store.setCurrentTime(', p.currentTimeSec.toFixed(3), ') via progress callback from', this.active.id)
        store.setCurrentTime(p.currentTimeSec)
      }

      // Only overwrite duration if the provider reports a non-zero value.
      // This preserves the duration set from track metadata (e.g., librespot
      // which sends 0 from Rust until the backend tracks it properly).
      if (p.durationSec > 0) store.setDuration(p.durationSec)
      store.setPlaying(p.isPlaying)
      if (p.isPlaying) {
        console.log('[ENGINE] onProgress → setPlaybackStatus playing')
        store.setPlaybackStatus('playing')
      } else if (store.playbackStatus === 'playing') {
        console.log('[ENGINE] onProgress → setPlaybackStatus paused')
        store.setPlaybackStatus('paused')
      }
    })

    this.active.onTrackChanged((meta) => {
      if (currentSource !== this.active.id) return
      const store = usePlayerStore.getState()
      if (meta) {
        store.setNowPlaying(meta)
        store.setDuration(meta.durationSec)
        console.log('[state] Playing ← engine.onTrackChanged (new track metadata)')
        store.setPlaybackStatus('playing')
      } else {
        // Track ended — fall back to local track if any.
        const s = usePlayerStore.getState()
        const localTrack = s.tracks[s.currentIndex]
        if (!localTrack || s.activeSource !== 'local') {
          store.setNowPlaying(null)
        }
      }
    })

    this.active.onTrackEnded(() => {
      if (currentSource !== this.active.id) return
      const store = usePlayerStore.getState()
      console.log('[ENGINE] onTrackEnded fired from provider', this.active.id)
      store.setPlaybackStatus('ended')
      store.setPlaying(false)
      this.next().catch(() => {})
    })

    this.active.onError((error) => {
      if (currentSource !== this.active.id) return
      const store = usePlayerStore.getState()
      console.log('[state] Error ← engine.onError:', error)
      store.setPlaybackStatus('error')
      console.error('[playback] Provider error:', error)
    })

    // Forward audio data to engine-level subscribers (e.g. visualizers).
    if (this.audioDataCbs.length > 0) {
      this.active.onAudioData((data) => {
        // Use active provider guard: capture currentSource at subscription time.
        if (currentSource !== this.active.id) return
        this.audioDataCbs.forEach((cb) => cb(data))
      })
    }
  }

  /**
   * Start playing a resource with automatic provider detection.
   *
   * @param resource  Spotify URI (spotify:track:xxx) or local file path.
   * @param meta      Optional track metadata. When provided, it is stored in
   *                  the player store so the UI can display title/artist/art.
   */
  async play(resource: string, meta?: NowPlayingMeta): Promise<void> {
    const store = usePlayerStore.getState()

    // Store the resource + metadata so we can restart after EndOfTrack.
    this.lastResource = resource
    this.lastMeta = meta ?? null

    if (resource.startsWith('spotify:')) {
      // Spotify URI — use Librespot (direct streaming) if available,
      // or fall back to the Web Playback SDK.
      if (this.librespot.isAvailable()) {
        // ═══════════════════════════════════════════════════════════
        // CRITICAL: Stop any existing Spotify playback before
        // starting a new one. This prevents two Spotify tracks from
        // playing simultaneously.
        //
        // setSource() returns early when the source hasn't changed,
        // so we must explicitly stop the current playback here.
        // ═══════════════════════════════════════════════════════════
        const status = store.playbackStatus
        if (status === 'playing' || status === 'paused' || status === 'loading') {
          console.log('[PLAY] Existing playback detected. Stopping current track...')
          await this.active.stop()
          console.log('[PLAY] Current track stopped.')
          // Wait briefly for the backend to fully flush its audio channel.
          await new Promise(resolve => setTimeout(resolve, 100))
          console.log('[PLAY] Audio queue flushed. Player is idle.')
        }

        this.setSource('spotify-librespot')
        console.log('[state] Loading ← engine.play (Spotify URI)')
        // Set provided metadata immediately (UI shows track info right away).
        // Also set duration so the right timer shows total duration instead of 00:00.
        if (meta) {
          store.setNowPlaying(meta)
          store.setDuration(meta.durationSec)
        }
        store.setPlaybackStatus('loading')
        console.log('[PLAY] Loading new track...')
        await this.active.play(resource)
        console.log('[PLAY] New playback started.')
      } else if (this.spotifySdk.isAvailable()) {
        this.setSource('spotify-sdk')
        store.setPlaybackStatus('loading')
        if (meta) {
          store.setNowPlaying(meta)
          store.setDuration(meta.durationSec)
        }
        // For SDK, we need to transfer playback to our device first,
        // then call play via the Web API with our device_id.
        const deviceId = this.spotifySdk.getDeviceId()
        await this.playOnSpotify(resource, deviceId)
      } else {
        store.setPlaybackStatus('error')
        throw new Error('No Spotify playback engine available')
      }
    } else {
      // Local file path.
      this.setSource('local')
      store.setPlaybackStatus('loading')
      await this.active.play(resource)
    }
  }

  async togglePlay(): Promise<void> {
    const store = usePlayerStore.getState()
    console.log('[ENGINE] togglePlay() — current isPlaying=', store.isPlaying, 'status=', store.playbackStatus)

    // If the player is in 'ended' or 'stopped' state, restart the current
    // track from the beginning instead of calling resume(). Librespot's
    // player.play() only resumes a PAUSED player — after player.stop() the
    // player is in a Stopped state and needs player.load() to play again.
    if ((store.playbackStatus === 'ended' || store.playbackStatus === 'stopped') && this.lastResource) {
      console.log('[ENGINE] togglePlay() —', store.playbackStatus, 'state, restarting track')
      await this.play(this.lastResource, this.lastMeta ?? undefined)
      return
    }

    // Capture the REAL playback state BEFORE the optimistic update,
    // then call the correct method directly. DO NOT call
    // this.active.togglePlay() — the provider's togglePlay() reads
    // store.isPlaying which has ALREADY been flipped by the optimistic
    // update above, causing the provider to call the wrong method.
    const wasPlaying = store.isPlaying

    // Optimistic UI: flip immediately, then send correct command.
    if (wasPlaying) {
      console.log('[ENGINE] togglePlay() → pausing (optimistic store update)')
      store.setPlaying(false)
      store.setPlaybackStatus('paused')
    } else {
      console.log('[ENGINE] togglePlay() → playing (optimistic store update)')
      store.setPlaying(true)
      store.setPlaybackStatus('playing')
    }

    // Call the correct method directly using the PRE-OPTIMISTIC state.
    // This avoids the race where the provider reads the already-flipped
    // store.isPlaying and calls the wrong method.
    console.log('[ENGINE] togglePlay() — calling active.', wasPlaying ? 'pause()' : 'resume()', '(wasPlaying=', wasPlaying, ')')
    if (wasPlaying) {
      await this.active.pause()
    } else {
      await this.active.resume()
    }
    console.log('[ENGINE] togglePlay() — completed')
  }

  async pause(): Promise<void> {
    await this.active.pause()
  }

  async resume(): Promise<void> {
    await this.active.resume()
  }

  async stop(): Promise<void> {
    // Optimistic UI: reset everything immediately,
    // then clean up the backend.
    const store = usePlayerStore.getState()
    console.log('[ENGINE] stop() called — optimistic store update started')
    store.setPlaybackStatus('stopped')
    store.setPlaying(false)
    console.log('[SRC:engine/stop] store.setCurrentTime(0) optimistic')
    store.setCurrentTime(0)
    console.log('[ENGINE] stop() — optimistic store update done, calling active.stop()')

    await this.active.stop()
    console.log('[ENGINE] stop() — active.stop() completed')
  }

  async next(): Promise<void> {
    const store = usePlayerStore.getState()

    // If a queue is active, advance within it
    if (store.queue.length > 0) {
      if (store.queueIndex >= store.queue.length - 1) {
        // End of queue — stop playback
        await this.stop()
        return
      }
      store.queueNext()
      await this.playCurrentQueueTrack()
      return
    }

    // Fall back to provider (local library tracks)
    await this.active.next()
  }

  async prev(): Promise<void> {
    const store = usePlayerStore.getState()

    // If a queue is active, go back within it
    if (store.queue.length > 0) {
      if (store.queueIndex <= 0) {
        // Already at the beginning — restart the current track
        store.setQueueIndex(0)
        await this.playCurrentQueueTrack()
        return
      }
      store.queuePrev()
      await this.playCurrentQueueTrack()
      return
    }

    // Fall back to provider (local library tracks)
    await this.active.prev()
  }

  /**
   * Play the track at the current queue index.
   * Handles both Spotify and local tracks within the queue.
   */
  private async playCurrentQueueTrack(): Promise<void> {
    const store = usePlayerStore.getState()
    const track = store.queue[store.queueIndex]
    if (!track) {
      await this.stop()
      return
    }

    if (track.source === 'spotify' && track.uri) {
      const meta: NowPlayingMeta = {
        id: track.id,
        title: track.title,
        artist: track.artist,
        album: track.album,
        durationSec: track.durationSec,
        imageUrl: track.imageUrl ?? null,
        uri: track.uri,
      }
      await this.play(track.uri, meta)
    } else if (track.source === 'local' && track.path) {
      this.setSource('local')
      store.setPlaybackStatus('loading')
      await this.active.play(track.path)
    }
  }

  async seek(seconds: number): Promise<void> {
    // ── TRACE: engine seek ─────────────────────────────────────
    performance.mark('seek-engine-enter')
    performance.measure(
      '⏱️ [C.1] mouseup → engine.seek() (synchronous before store update)',
      'seek-mouseup',
      'seek-engine-enter',
    )

    // Optimistic UI: update position immediately,
    // then send the seek command to the backend.
    const store = usePlayerStore.getState()
    console.log('[ENGINE] seek(', seconds, ') — optimistic store update')
    console.log('[SRC:engine/seek] store.setCurrentTime(', seconds, ') optimistic')
    store.setCurrentTime(seconds)

    performance.mark('seek-engine-calling-active')
    performance.measure(
      '⏱️ [C.2] engine.seek() optimistic store update done',
      'seek-engine-enter',
      'seek-engine-calling-active',
    )

    console.log('[ENGINE] seek() — calling active.seek()')

    await this.active.seek(seconds)

    performance.mark('seek-active-done')
    performance.measure(
      '⏱️ [C.3] engine → active.seek() completed (total engine round-trip)',
      'seek-engine-enter',
      'seek-active-done',
    )
    console.log('[ENGINE] seek() — active.seek() completed')
  }

  async setVolume(v: number): Promise<void> {
    await this.active.setVolume(v)
    usePlayerStore.getState().setVolume(v)
  }

  getVolume(): number {
    return this.active.getVolume()
  }

  /** Whether the local provider is active. */
  get isLocal(): boolean {
    return this.active.id === 'local'
  }

  /** Whether any Spotify provider is active. */
  get isSpotify(): boolean {
    return this.active.id === 'spotify-sdk' || this.active.id === 'spotify-librespot'
  }

  /** Get the Spotify SDK provider (for direct device ID access). */
  getSpotifySdk(): SpotifySdkProvider {
    return this.spotifySdk
  }

  /**
   * Subscribe to raw PCM audio data from the active provider.
   * Used by visualizer components. The callback receives interleaved
   * float32 samples at the provider's native sample rate.
   *
   * Currently only librespot emits audio data. Local and Spotify SDK
   * providers don't expose raw PCM, so the callback will never fire
   * for those sources. This is intentional — the architecture is ready
   * for future providers that emit PCM data.
   */
  subscribeAudioData(cb: AudioDataCallback): () => void {
    this.audioDataCbs.push(cb)
    // Re-wire the active provider so it forwards audio data to this subscriber.
    this.wireActiveProvider()
    // Return an unsubscribe function.
    return () => {
      const idx = this.audioDataCbs.indexOf(cb)
      if (idx >= 0) this.audioDataCbs.splice(idx, 1)
    }
  }

  // ── internal ──────────────────────────────────────────────

  private async playOnSpotify(uri: string, deviceId: string | null): Promise<void> {
    // Use the Spotify Web API to start playback on the SDK device.
    const { spotifyService } = await import('../spotify')
    try {
      await spotifyService.playUris([uri], deviceId ?? undefined)
      console.log('[playback] Started Spotify playback on', deviceId ?? 'active device')
    } catch (e) {
      console.error('[playback] Spotify play failed', e)
      throw e
    }
  }
}

/** Singleton instance — import and use directly in components. */
export const playbackEngine = new PlaybackEngine()
