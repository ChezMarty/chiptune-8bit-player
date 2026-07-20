import { invoke } from '@tauri-apps/api/core'
import type {
  PlaybackProvider,
  PlaybackSource,
  ProgressCallback,
  TrackEndedCallback,
  TrackChangedCallback,
  ErrorCallback,
  AudioDataCallback,
  NowPlayingMeta,
} from './types'

declare global {
  interface Window {
    Spotify: {
      Player: new (cfg: SpotifyPlayerCfg) => SpotifyPlayerInstance
    }
    onSpotifyWebPlaybackSDKReady?: () => void
  }
}

interface SpotifyPlayerCfg {
  name: string
  getOAuthToken: (cb: (token: string) => void) => void
  volume?: number
}

interface SpotifyPlayerInstance {
  addListener(event: string, cb: (data: any) => void): boolean
  removeListener(event: string, cb?: (data: any) => void): boolean
  connect(): Promise<boolean>
  disconnect(): void
  togglePlay(): Promise<void>
  pause(): Promise<void>
  resume(): Promise<void>
  nextTrack(): Promise<void>
  previousTrack(): Promise<void>
  seek(positionMs: number): Promise<void>
  setVolume(volume: number): Promise<void>
  getVolume(): Promise<number>
  getCurrentState(): Promise<SpotifyPlaybackState | null>
  activateElement(): Promise<void>
}

interface SpotifyPlaybackState {
  paused: boolean
  position: number
  duration: number
  track_window: {
    current_track: SpotifySDKTrack
    next_tracks: SpotifySDKTrack[]
    previous_tracks: SpotifySDKTrack[]
  }
}

interface SpotifySDKTrack {
  id: string
  name: string
  uri: string
  duration_ms: number
  artists: { name: string; uri: string }[]
  album: {
    name: string
    uri: string
    images: { url: string; height?: number; width?: number }[]
  }
}

const SDK_URL = 'https://sdk.scdn.co/spotify-player.js'
const PLAYER_NAME = 'Chiptune & Bits'
const PROGRESS_INTERVAL_MS = 200

/**
 * Spotify Web Playback SDK provider.
 *
 * Injects the SDK script, creates a Spotify.Player instance, and maps
 * its events into the PlaybackProvider interface. Requires a Spotify
 * Premium account.
 *
 * Falls back to 'unavailable' state if initialization fails (e.g.,
 * non-Premium account), letting the engine switch to Spotify Connect.
 *
 * ── PlayReady / EME warnings ──
 *
 * The Spotify Web Playback SDK (loaded from sdk.scdn.co/spotify-player.js)
 * internally calls navigator.requestMediaKeySystemAccess() with the
 * com.microsoft.playready.recommendation.3000 key system during its own
 * initialization. This triggers the following console warnings on Windows:
 *
 *   "It is recommended that a robustness level be specified."
 *   "com.microsoft.playready.recommendation"
 *   "com.microsoft.playready.recommendation.3000"
 *   "Before generating a request, setServerCertificate() must be called
 *    with a valid server certificate."
 *   "requestMediaKeySystemAccess()"
 *
 * These warnings originate from the Spotify SDK's internal DRM code, NOT
 * from our application. No TypeScript/TSX/HTML/JS file in this project
 * calls requestMediaKeySystemAccess, MediaKeys, setServerCertificate,
 * or any other EME API.
 *
 * The warnings are completely harmless in this application because:
 * 1. All Spotify audio is delivered via librespot (direct PCM streaming
 *    through Web Audio API — no EME needed).
 * 2. The Spotify SDK is loaded as a fallback only; Librespot is preferred.
 * 3. No application functionality depends on PlayReady CDM working.
 *
 * The SDK's EME calls can be avoided entirely when Librespot is the active
 * provider — the SDK is loaded at startup by playbackEngine.initialize()
 * but its EME initialization is for Spotify's own encrypted streams, which
 * we bypass via librespot's direct PCM delivery.
 */
export class SpotifySdkProvider implements PlaybackProvider {
  readonly id: PlaybackSource = 'spotify-sdk'

  private player: SpotifyPlayerInstance | null = null
  private deviceId: string | null = null
  private initialized = false
  private available = false
  private progressTimer: ReturnType<typeof setInterval> | null = null
  private currentTrack: SpotifySDKTrack | null = null
  private currentVolume = 0.7

  private progressCbs: ProgressCallback[] = []
  private endedCbs: TrackEndedCallback[] = []
  private trackCbs: TrackChangedCallback[] = []
  private errorCbs: ErrorCallback[] = []
  private audioDataCbs: AudioDataCallback[] = []

  async initialize(): Promise<void> {
    if (this.initialized) return
    this.initialized = true

    // 0. Create the ready Promise and set the callback BEFORE injecting the
    //    script. The Spotify Web Playback SDK calls
    //    window.onSpotifyWebPlaybackSDKReady() synchronously when it loads.
    //    If the callback isn't set before the script element is appended,
    //    the SDK throws AnthemError: "onSpotifyWebPlaybackSDKReady is not defined".
    const sdkReady = new Promise<void>((resolve) => {
      if (window.Spotify) {
        resolve()
        return
      }
      window.onSpotifyWebPlaybackSDKReady = () => resolve()
      // Timeout if SDK never loads (e.g. offline).
      setTimeout(() => resolve(), 8000)
    })

    // 1. Inject the SDK script (after the callback is set).
    await this.injectSdk()

    // 2. Wait for the SDK to become ready (callback fires or timeout).
    await sdkReady

    if (!window.Spotify) {
      console.warn('[spotify-sdk] SDK script did not load')
      this.errorCbs.forEach((cb) => cb('Spotify Web Playback SDK unavailable'))
      return
    }

    // 3. Create the player.
    this.player = new window.Spotify.Player({
      name: PLAYER_NAME,
      getOAuthToken: (cb) => {
        invoke<string>('get_spotify_access_token')
          .then((token) => cb(token))
          .catch((e) => {
            console.error('[spotify-sdk] Failed to get access token', e)
            this.errorCbs.forEach((cb) => cb(String(e)))
          })
      },
      volume: this.currentVolume,
    })

    // 4. Register event listeners.
    this.player.addListener('ready', (data: { device_id: string }) => {
      this.deviceId = data.device_id
      this.available = true
      console.log('[spotify-sdk] Ready, device_id =', this.deviceId)
      this.startProgressLoop()
    })

    this.player.addListener('not_ready', (data: any) => {
      console.warn('[spotify-sdk] Not ready', data)
      this.available = false
      this.stopProgressLoop()
    })

    this.player.addListener('player_state_changed', (state: SpotifyPlaybackState | null) => {
      if (!state) {
        this.currentTrack = null
        this.trackCbs.forEach((cb) => cb(null))
        return
      }
      // Emit track change if the track changed.
      const newTrack = state.track_window.current_track
      if (newTrack?.id !== this.currentTrack?.id) {
        this.currentTrack = newTrack
        if (newTrack) {
          this.trackCbs.forEach((cb) => cb(this.toMeta(newTrack)))
        }
      }
      // If the track ended (position near duration and paused), fire ended.
      if (
        state.paused &&
        state.duration > 0 &&
        state.position >= state.duration - 2000 &&
        this.currentTrack
      ) {
        this.endedCbs.forEach((cb) => cb())
      }
    })

    this.player.addListener('initialization_error', (data: { message: string }) => {
      console.error('[spotify-sdk] Init error', data.message)
      this.errorCbs.forEach((cb) => cb(`SDK init error: ${data.message}`))
      this.available = false
    })

    this.player.addListener('authentication_error', (data: { message: string }) => {
      console.error('[spotify-sdk] Auth error', data.message)
      this.errorCbs.forEach((cb) => cb(`SDK auth error: ${data.message}`))
    })

    this.player.addListener('account_error', (data: { message: string }) => {
      console.error('[spotify-sdk] Account error', data.message)
      this.errorCbs.forEach((cb) =>
        cb(`Spotify Premium required: ${data.message}`),
      )
      this.available = false
    })

    // 5. Connect.
    try {
      const connected = await this.player.connect()
      if (!connected) {
        console.warn('[spotify-sdk] Failed to connect')
        this.available = false
      }
    } catch (e) {
      console.error('[spotify-sdk] Connect threw', e)
      this.available = false
    }
  }

  destroy(): void {
    this.stopProgressLoop()
    if (this.player) {
      this.player.disconnect()
      this.player = null
    }
    this.deviceId = null
    this.available = false
    this.initialized = false
    this.removeAllListeners()
    // Clean up the global callback so a fresh mount doesn't see a stale reference.
    window.onSpotifyWebPlaybackSDKReady = undefined
  }

  /** Whether the SDK is connected and ready for playback. */
  isAvailable(): boolean {
    return this.available
  }

  getDeviceId(): string | null {
    return this.deviceId
  }

  async play(resource: string): Promise<void> {
    if (!this.player) throw new Error('SDK player not initialized')
    // resource should be a Spotify URI like spotify:track:xxx
    console.log('[spotify-sdk] play', resource)
    // The SDK doesn't have a direct "play this URI" method on the Player
    // instance. Instead, we use the Web API to transfer playback to this
    // device. But to keep things simple for now, we rely on the player
    // being the active device and let the Web API handle it.
    // The engine will call the Spotify Web API PUT /me/player/play with
    // the device_id set to this.deviceId.
  }

  async pause(): Promise<void> {
    if (!this.player) return
    await this.player.pause()
  }

  async resume(): Promise<void> {
    if (!this.player) return
    await this.player.resume()
  }

  async togglePlay(): Promise<void> {
    if (!this.player) return
    await this.player.togglePlay()
  }

  async stop(): Promise<void> {
    await this.pause()
  }

  async next(): Promise<void> {
    if (!this.player) return
    await this.player.nextTrack()
  }

  async prev(): Promise<void> {
    if (!this.player) return
    await this.player.previousTrack()
  }

  async seek(seconds: number): Promise<void> {
    if (!this.player) return
    await this.player.seek(Math.round(seconds * 1000))
  }

  async setVolume(v: number): Promise<void> {
    this.currentVolume = Math.max(0, Math.min(1, v))
    if (this.player) {
      await this.player.setVolume(this.currentVolume)
    }
  }

  getVolume(): number {
    return this.currentVolume
  }

  onProgress(cb: ProgressCallback): void { this.progressCbs.push(cb) }
  onTrackEnded(cb: TrackEndedCallback): void { this.endedCbs.push(cb) }
  onTrackChanged(cb: TrackChangedCallback): void { this.trackCbs.push(cb) }
  onError(cb: ErrorCallback): void { this.errorCbs.push(cb) }
  onAudioData(cb: AudioDataCallback): void { this.audioDataCbs.push(cb) }

  removeAllListeners(): void {
    this.progressCbs = []
    this.endedCbs = []
    this.trackCbs = []
    this.errorCbs = []
    this.audioDataCbs = []
  }

  // ── internal ──────────────────────────────────────────────

  private startProgressLoop(): void {
    if (this.progressTimer) return
    this.progressTimer = setInterval(async () => {
      if (!this.player) return
      try {
        const state = await this.player.getCurrentState()
        if (state) {
          this.progressCbs.forEach((cb) =>
            cb({
              currentTimeSec: state.position / 1000,
              durationSec: state.duration / 1000,
              isPlaying: !state.paused,
            }),
          )
        }
      } catch {
        // Ignore polling errors.
      }
    }, PROGRESS_INTERVAL_MS)
  }

  private stopProgressLoop(): void {
    if (this.progressTimer) {
      clearInterval(this.progressTimer)
      this.progressTimer = null
    }
  }

  private toMeta(track: SpotifySDKTrack): NowPlayingMeta {
    const img = track.album.images[0]
    const minImg = track.album.images[track.album.images.length - 1]
    return {
      id: track.id,
      title: track.name,
      artist: track.artists.map((a) => a.name).join(', '),
      album: track.album.name,
      durationSec: track.duration_ms / 1000,
      imageUrl: minImg?.url ?? img?.url ?? null,
      uri: track.uri,
    }
  }

  private injectSdk(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (document.querySelector('script[src="' + SDK_URL + '"]')) {
        resolve()
        return
      }
      const script = document.createElement('script')
      script.src = SDK_URL
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => {
        console.warn('[spotify-sdk] Failed to load SDK script')
        resolve() // Don't block the app — just mark as unavailable.
      }
      document.head.appendChild(script)
    })
  }
}
