import { convertFileSrc } from '@tauri-apps/api/core'
import { usePlayerStore } from '../state/usePlayerStore'

/**
 * Singleton audio controller.
 *
 * Owns a single HTMLAudioElement and forwards its events to the zustand
 * store. The store remains the source of truth for UI rendering; this
 * controller is the side-effecting engine that actually plays audio.
 */
class AudioController {
  private audio: HTMLAudioElement
  private currentPath: string | null = null

  constructor() {
    this.audio = new Audio()
    this.audio.preload = 'auto'
    this.audio.volume = usePlayerStore.getState().volume

    // Forward events to the store.
    const s = () => usePlayerStore.getState()
    this.audio.addEventListener('play', () => s().setPlaying(true))
    this.audio.addEventListener('pause', () => s().setPlaying(false))
    this.audio.addEventListener('timeupdate', () =>
      s().setCurrentTime(this.audio.currentTime),
    )
    this.audio.addEventListener('loadedmetadata', () =>
      s().setDuration(this.audio.duration || 0),
    )
    this.audio.addEventListener('durationchange', () => {
      const d = this.audio.duration
      if (Number.isFinite(d)) s().setDuration(d)
    })
    this.audio.addEventListener('ended', () => this.handleEnded())
    this.audio.addEventListener('error', (e) => {
      console.error('[audio] error event', e)
      s().setPlaying(false)
    })
  }

  private handleEnded(): void {
    const s = usePlayerStore.getState()
    if (s.tracks.length === 0) return
    // Advance the store index synchronously.
    s.next()
    const next = usePlayerStore.getState()
    const nextTrack = next.tracks[next.currentIndex]
    if (!nextTrack) return
    // Swap the audio source BEFORE calling play(). React's useEffect on
    // currentIndex will fire after commit, but HTMLAudio.play() is called
    // synchronously here; if we don't swap src first, play() would resume
    // the just-ended track from the start instead of advancing.
    this.forceLoad(nextTrack.path)
    void this.play()
  }

  /** Switch the audio source to a local file. No-op if already loaded. */
  load(path: string): void {
    if (path === this.currentPath) return
    this.forceLoad(path)
  }

  /** Force-swap the audio source regardless of currentPath. Used by auto-advance. */
  forceLoad(path: string): void {
    this.currentPath = path
    this.audio.src = convertFileSrc(path)
    try {
      this.audio.load()
    } catch (err) {
      console.error('[audio] load failed', err)
    }
  }

  async play(): Promise<void> {
    try {
      await this.audio.play()
    } catch (err) {
      console.error('[audio] play rejected', err)
    }
  }

  pause(): void {
    try {
      this.audio.pause()
    } catch (err) {
      console.error('[audio] pause failed', err)
    }
  }

  togglePlay(): void {
    if (this.audio.paused) {
      void this.play()
    } else {
      this.pause()
    }
  }

  seek(seconds: number): void {
    const target = Math.max(0, seconds)
    this.audio.currentTime = target
    usePlayerStore.getState().setCurrentTime(target)
  }

  setVolume(v: number): void {
    const value = Math.max(0, Math.min(1, v))
    this.audio.volume = value
  }

  /** Returns the underlying <audio> element for any external debug. */
  raw(): HTMLAudioElement {
    return this.audio
  }
}

export const audioController = new AudioController()
