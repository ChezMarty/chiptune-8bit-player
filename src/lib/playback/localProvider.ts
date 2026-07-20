import { convertFileSrc } from '@tauri-apps/api/core'
import { usePlayerStore } from '../../state/usePlayerStore'
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

/**
 * Wraps the existing HTMLAudioElement-based playback as a PlaybackProvider.
 *
 * Owns a single <audio> element and drives the store entirely through
 * progress callbacks (progressCbs → engine.onProgress → store).
 * The HTMLAudioElement is the source of truth for local file playback;
 * its native events provide smooth position/duration/status updates at
 * ~4–15 Hz (browser-dependent).
 *
 * ── Architecture ──
 *
 * Direct store writes are NOT used for playback state (currentTime,
 * duration, isPlaying). Instead, the HTMLAudioElement events fire
 * emitProgress() which sends a PlaybackProgress through progressCbs.
 * The engine's wireActiveProvider → onProgress callback writes these
 * values to the store, making the callback chain the single path.
 */
export class LocalPlaybackProvider implements PlaybackProvider {
  readonly id: PlaybackSource = 'local'

  private audio: HTMLAudioElement
  private currentPath: string | null = null
  private progressCbs: ProgressCallback[] = []
  private endedCbs: TrackEndedCallback[] = []
  private trackCbs: TrackChangedCallback[] = []
  private errorCbs: ErrorCallback[] = []
  private audioDataCbs: AudioDataCallback[] = []

  constructor() {
    this.audio = new Audio()
    this.audio.preload = 'auto'
    this.audio.volume = usePlayerStore.getState().volume

    this.audio.addEventListener('play', () => {
      if (usePlayerStore.getState().activeSource !== 'local') return
      this.emitProgress()
    })
    this.audio.addEventListener('pause', () => {
      if (usePlayerStore.getState().activeSource !== 'local') return
      this.emitProgress()
    })
    this.audio.addEventListener('timeupdate', () => {
      if (usePlayerStore.getState().activeSource !== 'local') return
      this.emitProgress()
    })
    this.audio.addEventListener('loadedmetadata', () => {
      if (usePlayerStore.getState().activeSource !== 'local') return
      this.emitProgress()
    })
    this.audio.addEventListener('durationchange', () => {
      if (usePlayerStore.getState().activeSource !== 'local') return
      this.emitProgress()
    })
    this.audio.addEventListener('ended', () => {
      if (usePlayerStore.getState().activeSource !== 'local') return
      this.handleEnded()
    })
    this.audio.addEventListener('error', (e) => {
      if (usePlayerStore.getState().activeSource !== 'local') return
      console.error('[LOCAL] audio error event — calling store.setPlaying(false)', e)
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
    console.log('[LOCAL] stop() called — resetting position and pausing')
    try {
      // Reset audio.currentTime to 0 BEFORE pausing.
      // The HTMLAudioElement fires 'pause' and 'timeupdate' events after
      // pause(). If we don't reset first, those events will emit the
      // real position via emitProgress() → onProgress → store.setCurrentTime(),
      // overwriting the engine's optimistic currentTime=0.
      //
      // Note: this always resets the audio position on stop regardless of the
      // stopRewinds preference. The engine's stop() already sets
      // store.setCurrentTime(0) unconditionally, so the store always shows 0
      // on stop.
      this.audio.currentTime = 0
      this.audio.pause()
    } catch (err) {
      console.error('[LOCAL] stop failed', err)
    }
  }

  async next(): Promise<void> {
    const s = usePlayerStore.getState()
    if (s.tracks.length === 0) return
    const nextIdx = (s.currentIndex + 1) % s.tracks.length
    s.setCurrent(nextIdx)
    const nextTrack = s.tracks[nextIdx]
    if (nextTrack) await this.play(nextTrack.path)
  }

  async prev(): Promise<void> {
    const s = usePlayerStore.getState()
    if (s.tracks.length === 0) return
    const prevIdx = (s.currentIndex - 1 + s.tracks.length) % s.tracks.length
    s.setCurrent(prevIdx)
    const prevTrack = s.tracks[prevIdx]
    if (prevTrack) await this.play(prevTrack.path)
  }

  async seek(seconds: number): Promise<void> {
    const target = Math.max(0, seconds)
    console.log('[LOCAL] seek(', seconds, ') — setting audio.currentTime =', target)
    this.audio.currentTime = target
    // NOTE: engine.seek() already performs the optimistic store update.
    // We only need to set the DOM audio element's position.
    // The HTMLAudioElement's 'timeupdate' event will fire and emitProgress()
    // → onProgress → store.setCurrentTime() will confirm the real position,
    // but if the user is dragging, isDragging gates that write.
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
  onAudioData(cb: AudioDataCallback): void { this.audioDataCbs.push(cb) }

  removeAllListeners(): void {
    this.progressCbs = []
    this.endedCbs = []
    this.trackCbs = []
    this.errorCbs = []
    this.audioDataCbs = []
  }

  // ── internal ──────────────────────────────────────────────

  /**
   * Emit progress from the HTMLAudioElement's current state.
   * This is the single path for writing playback state to the store
   * (via progressCbs → engine.onProgress → store.setCurrentTime/setDuration/setPlaying).
   */
  private emitProgress(): void {
    const p = {
      currentTimeSec: this.audio.currentTime,
      durationSec: this.audio.duration || 0,
      isPlaying: !this.audio.paused,
    }
    console.log('[LOCAL] emitProgress() → firing', this.progressCbs.length, 'callbacks with currentTimeSec=', p.currentTimeSec, 'isPlaying=', p.isPlaying)
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
