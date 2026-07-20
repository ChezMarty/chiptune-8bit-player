import { usePlayerStore } from '../../state/usePlayerStore'
import { LocalPlaybackProvider } from './localProvider'
import { SpotifySdkProvider } from './spotifySdkProvider'
import { LibrespotProvider } from './librespotProvider'
import type {
  PlaybackProvider,
  PlaybackSource,
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

  constructor() {
    this.local = new LocalPlaybackProvider()
    this.spotifySdk = new SpotifySdkProvider()
    this.librespot = new LibrespotProvider()
    this.active = this.local

    // Wire the local provider's now-playing into the store.
    this.setupLocalSync()
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

    // Pause the current provider before switching.
    this.active.pause().catch(() => {})

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

    usePlayerStore.getState().setActiveSource(source)
    console.log('[playback] Switched to', source)
  }

  /** Start playing a resource with automatic provider detection. */
  async play(resource: string): Promise<void> {
    if (resource.startsWith('spotify:')) {
      // Spotify URI — use Librespot (direct streaming) if available,
      // or fall back to the Web Playback SDK.
      if (this.librespot.isAvailable()) {
        this.setSource('spotify-librespot')
        await this.active.play(resource)
      } else if (this.spotifySdk.isAvailable()) {
        this.setSource('spotify-sdk')
        // For SDK, we need to transfer playback to our device first,
        // then call play via the Web API with our device_id.
        const deviceId = this.spotifySdk.getDeviceId()
        await this.playOnSpotify(resource, deviceId)
      } else {
        throw new Error('No Spotify playback engine available')
      }
    } else {
      // Local file path.
      this.setSource('local')
      await this.active.play(resource)
    }
  }

  async togglePlay(): Promise<void> {
    await this.active.togglePlay()
  }

  async pause(): Promise<void> {
    await this.active.pause()
  }

  async resume(): Promise<void> {
    await this.active.resume()
  }

  async stop(): Promise<void> {
    await this.active.stop()
  }

  async next(): Promise<void> {
    await this.active.next()
  }

  async prev(): Promise<void> {
    await this.active.prev()
  }

  async seek(seconds: number): Promise<void> {
    await this.active.seek(seconds)
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

  // ── internal ──────────────────────────────────────────────

  private setupLocalSync(): void {
    // When the store's currentIndex changes and we're on local,
    // load the track into the local provider.
    usePlayerStore.subscribe((state, prev) => {
      if (this.active.id !== 'local') return
      if (state.currentIndex !== prev.currentIndex) {
        const track = state.tracks[state.currentIndex]
        if (track) {
          this.local.play(track.path).catch(() => {})
        }
      }
    })
  }

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
