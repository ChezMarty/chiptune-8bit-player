import { readFile } from '@tauri-apps/plugin-fs'
import { usePlayerStore } from '../../state/usePlayerStore'
import { dspEngine } from '../../dsp/DspEngine'
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
  private mediaSourceConnected = false
  private sourceDisconnect: (() => void) | null = null
  /** Keep track of the user's intended volume separate from audio.volume. */
  private _effectiveVolume = 0.7
  /** Blob URL created from the audio file (same-origin, avoids CORS with asset protocol). */
  private _blobUrl: string | null = null


  constructor() {
    this.audio = new Audio()
    this.audio.preload = 'auto'
    const initialVolume = usePlayerStore.getState().volume
    this.audio.volume = initialVolume
    this._effectiveVolume = initialVolume

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
    this._revokeBlobUrl()
    this.sourceDisconnect?.()
    this.sourceDisconnect = null
    this.mediaSourceConnected = false
    this.removeAllListeners()
  }

  async play(resource: string): Promise<void> {
    if (resource !== this.currentPath) {
      this.currentPath = resource

      // Read the file as binary using Tauri filesystem API and create a blob URL.
      // Using blob: URLs avoids CORS restrictions that affect asset://localhost URLs
      // when using createMediaElementSource().
      try {
        const data = await readFile(resource)
        this._revokeBlobUrl() // revoke previous blob URL if any
        const blob = new Blob([data], { type: this._inferMimeType(resource) })
        this._blobUrl = URL.createObjectURL(blob)
        this.audio.src = this._blobUrl
        console.log('[LOCAL]   File read successfully, blob URL created. size=', data.length, 'bytes')
      } catch (err) {
        console.error('[LOCAL] ❌ readFile failed:', err)
        console.warn('[LOCAL]   Falling back to asset URL (may have CORS issues)')
        // Fallback: use the previous convertFileSrc approach (may have CORS issues)
        this.audio.src = `asset://localhost/${encodeURI(resource.replace(/\\/g, '/'))}`
      }

      try {
        this.audio.load()
        console.log('[LOCAL]   audio.load() called — waiting for canplay...')
      } catch (err) {
        console.error('[LOCAL] load failed', err)
      }
    }

    // Ensure AudioContext is running before connecting or playing.
    await this._ensureAudioContextRunning()

    // Connect to DSP pipeline if not already connected.
    // Wait for the media element to have enough data loaded (createMediaElementSource
    // requires a non-null media resource).
    await this._ensureMediaLoaded()
    this._connectToDspEngine()

    try {
      await this.audio.play()
      console.log('[LOCAL] ✅ audio.play() succeeded')
    } catch (err) {
      console.error('[LOCAL] play rejected:', err)
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
    // Ensure AudioContext is running (may have been suspended during pause).
    await this._ensureAudioContextRunning()
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
    this._effectiveVolume = value
    console.log('[LOCAL] setVolume:', v, '->', value, 'mediaSourceConnected=', this.mediaSourceConnected, 'dspInitialized=', dspEngine.initialized)

    if (dspEngine.initialized && this.mediaSourceConnected) {
      // DSP is connected — route volume through DSP engine.
      dspEngine.setMasterVolume(value)
      this.audio.volume = value
      console.log('[LOCAL]   DSP connected — MasterVolume=', value, 'audio.volume=', value)
    } else {
      // DSP not connected — control volume directly on audio element.
      this.audio.volume = value
      console.log('[LOCAL]   DSP NOT connected — volume set directly on audio element:', value)
    }
    usePlayerStore.getState().setVolume(value)
  }

  getVolume(): number {
    // Return the user's intended volume, which may differ from audio.volume
    // when both the DSP path and native path are active simultaneously.
    return this._effectiveVolume
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
   * Ensure the AudioContext is in 'running' state.
   * If 'suspended', try to resume and wait.
   */
  private async _ensureAudioContextRunning(): Promise<void> {
    if (!dspEngine.initialized) {
      console.log('[LOCAL] _ensureAudioContextRunning: DSP not initialized, skipping')
      return
    }
    const ctx = dspEngine.audioCtx
    if (ctx.state === 'running') {
      console.log('[LOCAL] _ensureAudioContextRunning: AudioContext already running')
      return
    }
    if (ctx.state === 'suspended') {
      console.log('[LOCAL] _ensureAudioContextRunning: AudioContext suspended — resuming...')
      try {
        await ctx.resume()
        console.log('[LOCAL] _ensureAudioContextRunning: AudioContext resumed. New state:', ctx.state)
      } catch (err) {
        console.error('[LOCAL] _ensureAudioContextRunning: Failed to resume:', err)
      }
    }
    if (ctx.state === 'closed') {
      console.error('[LOCAL] _ensureAudioContextRunning: AudioContext is closed — cannot play!')
    }
  }

  /**
   * Wait for the HTMLAudioElement to have enough data loaded.
   * createMediaElementSource() requires a non-null media resource.
   */
  private _ensureMediaLoaded(): Promise<void> {
    // HAVE_CURRENT_DATA = readyState 2 (enough data to play at current position)
    // HAVE_FUTURE_DATA = readyState 3 (enough data to play a bit ahead)
    if (this.audio.readyState >= 2) {
      console.log('[LOCAL] _ensureMediaLoaded: already loaded (readyState=', this.audio.readyState, ')')
      return Promise.resolve()
    }

    console.log('[LOCAL] _ensureMediaLoaded: waiting for canplay event (readyState=', this.audio.readyState, ')...')
    return new Promise((resolve) => {
      const onCanPlay = () => {
        this.audio.removeEventListener('canplay', onCanPlay)
        console.log('[LOCAL] _ensureMediaLoaded: canplay fired (readyState=', this.audio.readyState, ')')
        resolve()
      }
      this.audio.addEventListener('canplay', onCanPlay)
      // Fallback: if the event never fires, resolve after 5 seconds anyway.
      setTimeout(() => {
        this.audio.removeEventListener('canplay', onCanPlay)
        console.log('[LOCAL] _ensureMediaLoaded: timeout (5s) — proceeding anyway (readyState=', this.audio.readyState, ')')
        resolve()
      }, 5000)
    })
  }

  /**
   * Connect the HTMLAudioElement to the DSP engine via MediaElementSource.
   * The source feeds directly into the DSP graph:
   *   MediaElementSource → DspEngine._inputNode → MasterVolume → destination.
   */
  private _connectToDspEngine(): void {
    if (this.mediaSourceConnected) {
      console.log('[LOCAL] _connectToDspEngine: Already connected, skipping')
      return
    }
    if (!dspEngine.initialized) {
      console.warn('[LOCAL] _connectToDspEngine: DSP engine not initialized yet')
      return
    }

    console.log('[LOCAL] _connectToDspEngine: Connecting MediaElementSource...')

    try {
      const ctx = dspEngine.audioCtx
      console.log('[LOCAL]   Creating MediaElementSource...')
      const source = ctx.createMediaElementSource(this.audio)
      console.log('[LOCAL] ✅ MediaElementSource created.')

      console.log('[LOCAL]   Connecting to DSP engine...')
      this.sourceDisconnect = dspEngine.connectSource(source)
      this.mediaSourceConnected = true
      console.log('[LOCAL] ✅ MediaElementSource connected to DSP engine')
    } catch (e) {
      console.error('[LOCAL] ❌ _connectToDspEngine FAILED:', e)
      console.error('[LOCAL]   MediaElementSource error — it can only be created once per <audio> element.')
    }
  }

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

    // If a queue is active, let the engine handle advancement via
    // its onTrackEnded → engine.next() logic. This prevents the
    // double-advance that would happen if we also called s.next().
    if (s.queue.length > 0) {
      this.endedCbs.forEach((cb) => cb())
      return
    }

    if (s.tracks.length === 0) return
    // Advance the store index. The engine's subscription on currentIndex
    // will handle loading and playing the next track automatically.
    s.next()
    this.endedCbs.forEach((cb) => cb())
  }

  /** Revoke the current blob URL if one exists. */
  private _revokeBlobUrl(): void {
    if (this._blobUrl) {
      URL.revokeObjectURL(this._blobUrl)
      this._blobUrl = null
    }
  }

  /** Infer MIME type from file extension. */
  private _inferMimeType(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase() ?? ''
    const mimeMap: Record<string, string> = {
      mp3: 'audio/mpeg',
      m4a: 'audio/mp4',
      aac: 'audio/aac',
      flac: 'audio/flac',
      wav: 'audio/wav',
      ogg: 'audio/ogg',
      oga: 'audio/ogg',
      opus: 'audio/ogg',
      wma: 'audio/x-ms-wma',
      aiff: 'audio/aiff',
      aif: 'audio/aiff',
    }
    return mimeMap[ext] ?? 'audio/mpeg'
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
