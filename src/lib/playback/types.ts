/** Which playback engine is currently driving the audio. */
export type PlaybackSource = 'local' | 'spotify-sdk' | 'spotify-librespot'

/**
 * Progress emitted by a provider.
 * `currentTimeSec` and `durationSec` are in seconds.
 */
export interface PlaybackProgress {
  currentTimeSec: number
  durationSec: number
  isPlaying: boolean
}

/**
 * Metadata for the currently playing track (provider-agnostic).
 */
export interface NowPlayingMeta {
  id: string
  title: string
  artist: string
  album?: string
  durationSec: number
  imageUrl?: string | null
  uri?: string
}

/** Event callback types */
export type ProgressCallback = (p: PlaybackProgress) => void
export type TrackEndedCallback = () => void
export type TrackChangedCallback = (meta: NowPlayingMeta | null) => void
export type ErrorCallback = (error: string) => void

/**
 * Generic playback provider. Every provider (local, Spotify SDK,
 * Spotify Connect) implements this interface.
 */
export interface PlaybackProvider {
  /** Human-readable ID matching PlaybackSource. */
  readonly id: PlaybackSource

  /** One-time setup (load SDK, resume previous state, etc.). */
  initialize(): Promise<void>

  /** Tear down the provider (disconnect SDK, clean up timers). */
  destroy(): void

  /** Start playback of the given resource (file path or Spotify URI). */
  play(resource: string): Promise<void>

  /** Pause without losing position. */
  pause(): Promise<void>

  /** Resume from the current position. */
  resume(): Promise<void>

  /** Toggle between play and pause. */
  togglePlay(): Promise<void>

  /** Stop playback and optionally rewind. */
  stop(): Promise<void>

  /** Skip to the next track. */
  next(): Promise<void>

  /** Skip to the previous track / restart current. */
  prev(): Promise<void>

  /** Seek to an absolute position in seconds. */
  seek(seconds: number): Promise<void>

  /** Set volume 0..1. */
  setVolume(v: number): Promise<void>

  /** Current volume 0..1. */
  getVolume(): number

  /** Register callbacks for state changes. */
  onProgress(cb: ProgressCallback): void
  onTrackEnded(cb: TrackEndedCallback): void
  onTrackChanged(cb: TrackChangedCallback): void
  onError(cb: ErrorCallback): void

  /** Remove all registered callbacks. */
  removeAllListeners(): void
}
