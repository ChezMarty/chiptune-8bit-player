import { convertFileSrc } from '@tauri-apps/api/core'
import { usePlayerStore } from '../../state/usePlayerStore'
import type {
  PlaybackProvider,
  PlaybackSource,
  ProgressCallback,
  TrackEndedCallback,
  TrackChangedCallback,
  ErrorCallback,
  NowPlayingMeta,
} from './types'

/**
 * Wraps the existing HTMLAudioElement-based playback as a PlaybackProvider.
 *
 * Owns a single <audio> element and syncs everything to usePlayerStore
 * so the UI works identically to before.
 */
export class LocalPlaybackProvider implements PlaybackProvider {
  readonly id: PlaybackSource = 'local'

  private audio: HTMLAudioElement
  private currentPath: string | null = null
  private progressCbs: ProgressCallback[] = []
  private endedCbs: TrackEndedCallback[] = []
  private trackCbs: TrackChangedCallback[] = []
  private errorCbs: ErrorCallback[] = []

  constructor() {
    this.audio = new Audio()
    this.audio.preload = 'auto'
    this.audio.volume = usePlayerStore.getState().volume

    this.audio.addEventListener('play', () => {
      usePlayerStore.getState().setPlaying(true)
    })
    this.audio.addEventListener('pause', () => {
      usePlayerStore.getState().setPlaying(false)
    })
    this.audio.addEventListener('timeupdate', () => {
      usePlayerStore.getState().setCurrentTime(this.audio.currentTime)
      this.emitProgress()
    })
    this.audio.addEventListener('loadedmetadata', () => {
      usePlayerStore.getState().setDuration(this.audio.duration || 0)
      this.emitProgress()
    })
    this.audio.addEventListener('durationchange', () => {
      const d = this.audio.duration
      if (Number.isFinite(d)) usePlayerStore.getState().setDuration(d)
      this.emitProgress()
    })
    this.audio.addEventListener('ended', () => {
      this.handleEnded()
    })
    this.audio.addEventListener('error', (e) => {
      console.error('[local] audio error event', e)
      usePlayerStore.getState().setPlaying(false)
      this.errorCbs.forEach((cb) => cb('Audio playback error'))
    })
  }

  async initialize(): Promise<void> {
    // Nothing to do — Audio element is always ready.
  }

  destroy(): void {
    this.audio.pause()
    this.audio.src = ''
    this.removeAllListeners()
  }

  async play(resource: string): Promise<void> {
    if (resource !== this.currentPath) {
      this.currentPath = resource
      this.audio.src = convertFileSrc(resource)
      try {
        this.audio.load()
      } catch (err) {
        console.error('[local] load failed', err)
      }
    }
    try {
      await this.audio.play()
    } catch (err) {
      console.error('[local] play rejected', err)
    }
  }

  async pause(): Promise<void> {
    try {
      this.audio.pause()
    } catch (err) {
      console.error('[local] pause failed', err)
    }
  }

  async resume(): Promise<void> {
    try {
      await this.audio.play()
    } catch (err) {
      console.error('[local] resume rejected', err)
    }
  }

  async togglePlay(): Promise<void> {
    if (this.audio.paused) {
      await this.resume()
    } else {
      await this.pause()
    }
  }

  async stop(): Promise<void> {
    try {
      this.audio.pause()
      if (usePlayerStore.getState().stopRewinds) {
        this.audio.currentTime = 0
        usePlayerStore.getState().setCurrentTime(0)
      }
    } catch (err) {
      console.error('[local] stop failed', err)
    }
  }

  async next(): Promise<void> {
    const s = usePlayerStore.getState()
    if (s.tracks.length === 0) return
    const nextIdx = (s.currentIndex + 1) % s.tracks.length
    s.setCurrent(nextIdx)
    // Load is handled by a useEffect in TransportControls watching currentIndex.
  }

  async prev(): Promise<void> {
    const s = usePlayerStore.getState()
    if (s.tracks.length === 0) return
    const prevIdx = (s.currentIndex - 1 + s.tracks.length) % s.tracks.length
    s.setCurrent(prevIdx)
  }

  async seek(seconds: number): Promise<void> {
    const target = Math.max(0, seconds)
    this.audio.currentTime = target
    usePlayerStore.getState().setCurrentTime(target)
  }

  async setVolume(v: number): Promise<void> {
    const value = Math.max(0, Math.min(1, v))
    this.audio.volume = value
    usePlayerStore.getState().setVolume(value)
  }

  getVolume(): number {
    return this.audio.volume
  }

  onProgress(cb: ProgressCallback): void { this.progressCbs.push(cb) }
  onTrackEnded(cb: TrackEndedCallback): void { this.endedCbs.push(cb) }
  onTrackChanged(cb: TrackChangedCallback): void { this.trackCbs.push(cb) }
  onError(cb: ErrorCallback): void { this.errorCbs.push(cb) }

  removeAllListeners(): void {
    this.progressCbs = []
    this.endedCbs = []
    this.trackCbs = []
    this.errorCbs = []
  }

  // ── internal ──────────────────────────────────────────────

  private emitProgress(): void {
    const p = {
      currentTimeSec: this.audio.currentTime,
      durationSec: this.audio.duration || 0,
      isPlaying: !this.audio.paused,
    }
    this.progressCbs.forEach((cb) => cb(p))
  }

  private handleEnded(): void {
    const s = usePlayerStore.getState()
    if (s.tracks.length === 0) return
    // Advance the store index. The engine's subscription on currentIndex
    // will handle loading and playing the next track automatically.
    s.next()
    this.endedCbs.forEach((cb) => cb())
  }

  /** Get now-playing metadata from the current store state. */
  getNowPlaying(): NowPlayingMeta | null {
    const s = usePlayerStore.getState()
    const t = s.tracks[s.currentIndex]
    if (!t) return null
    return {
      id: t.id,
      title: t.title,
      artist: t.artist,
      album: t.album,
      durationSec: t.durationSec,
      imageUrl: t.artDataUrl ?? null,
    }
  }
}
