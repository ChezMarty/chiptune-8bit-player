import { useCallback, useEffect, useRef } from 'react'
import { usePlayerStore } from '../state/usePlayerStore'
import { playbackEngine } from '../lib/playback/engine'
import { useT } from '../i18n/useT'

export function TransportControls() {
  const tracks = usePlayerStore((s) => s.tracks)
  const currentIndex = usePlayerStore((s) => s.currentIndex)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const currentTime = usePlayerStore((s) => s.currentTime)
  const duration = usePlayerStore((s) => s.duration)
  const volume = usePlayerStore((s) => s.volume)
  const nowPlaying = usePlayerStore((s) => s.nowPlaying)
  const activeSource = usePlayerStore((s) => s.activeSource)
  const playbackStatus = usePlayerStore((s) => s.playbackStatus)
  const { t } = useT()

  // Drag state for seek bar
  const isDraggingRef = useRef(false)
  const progressRef = useRef<HTMLDivElement | null>(null)

  const isSpotify = activeSource === 'spotify-librespot' || activeSource === 'spotify-sdk'
  const hasCurrent = isSpotify
    ? !!nowPlaying
    : currentIndex >= 0 && tracks[currentIndex] !== undefined
  const hasTracks = tracks.length > 0 || isSpotify

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
      ) {
        return
      }
      const s = () => usePlayerStore.getState()
      switch (e.code) {
        case 'Space':
          e.preventDefault()
          playbackEngine.togglePlay()
          break
        case 'ArrowRight':
          if (e.shiftKey) playbackEngine.next()
          else playbackEngine.seek(s().currentTime + 5)
          break
        case 'ArrowLeft':
          if (e.shiftKey) playbackEngine.prev()
          else playbackEngine.seek(Math.max(0, s().currentTime - 5))
          break
        case 'ArrowUp': {
          const v = Math.min(1, s().volume + 0.05)
          playbackEngine.setVolume(v)
          break
        }
        case 'ArrowDown': {
          const v = Math.max(0, s().volume - 0.05)
          playbackEngine.setVolume(v)
          break
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (currentIndex < 0) return
    const t = usePlayerStore.getState().tracks[currentIndex]
    if (!t) return
    // Only auto-load local files; Spotify tracks are handled by the engine.
    if (playbackEngine.isLocal) {
      playbackEngine.play(t.path)
    }
  }, [currentIndex])

  function togglePlay() {
    if (!hasCurrent) return
    // In 'ended' state, pressing play restarts the current track from 0.
    // The engine handles this by calling play() with the last resource.
    if (playbackStatus === 'ended') {
      playbackEngine.togglePlay()
      return
    }
    playbackEngine.togglePlay()
  }

  function doStop() {
    if (!hasCurrent) return
    playbackEngine.stop()
  }

  function doNext() {
    if (!hasTracks) return
    playbackEngine.next()
  }

  function doPrev() {
    if (!hasTracks) return
    playbackEngine.prev()
  }

  const calculateSeek = useCallback(
    (clientX: number) => {
      if (!duration || !progressRef.current) return
      const rect = progressRef.current.getBoundingClientRect()
      const x = clientX - rect.left
      const pct = Math.max(0, Math.min(1, x / rect.width))
      playbackEngine.seek(pct * duration)
    },
    [duration],
  )

  function onSeekMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (!duration) return
    isDraggingRef.current = true
    calculateSeek(e.clientX)
  }

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!isDraggingRef.current) return
      calculateSeek(e.clientX)
    }
    function onMouseUp() {
      isDraggingRef.current = false
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [calculateSeek])

  function onVolume(e: React.ChangeEvent<HTMLInputElement>) {
    const v = Number(e.target.value)
    playbackEngine.setVolume(v)
  }

  const progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0

  // Source indicator emoji
  const sourceIcon =
    activeSource === 'local'
      ? '💻'
      : activeSource === 'spotify-sdk'
        ? '🟢'
        : '🔗'

  return (
    <div className="transport pixel-panel">
      <div className="transport__buttons">
        <button
          className="pixel-button transport__btn"
          onClick={doPrev}
          disabled={!hasTracks}
          aria-label={t('transport.prev.aria')}
          title={t('transport.prev.title')}
        >
          {t('transport.prev')}
        </button>          <button
            className="pixel-button pixel-button--primary transport__btn"
            onClick={togglePlay}
            disabled={!hasCurrent}
            aria-label={isPlaying ? t('transport.pause.aria') : t('transport.play.aria')}
            title={isPlaying ? t('transport.pause.title') : t('transport.play.title')}
          >
            {isPlaying ? t('transport.pause') : t('transport.play')}
          </button>
          <button
            className="pixel-button pixel-button--stop transport__btn"
            onClick={doStop}
            disabled={!hasCurrent || playbackStatus === 'ended'}
            aria-label={t('transport.stop.aria')}
            title={t('transport.stop.title')}
          >
            {t('transport.stop')}
          </button>
        <button
          className="pixel-button transport__btn"
          onClick={doNext}
          disabled={!hasTracks}
          aria-label={t('transport.next.aria')}
          title={t('transport.next.title')}
        >
          {t('transport.next')}
        </button>
      </div>

      <div className="transport__time-info">
        <span className="transport__time-current">{fmtTime(currentTime)}</span>
        <div
          ref={progressRef}
          className={`transport__progress ${isDraggingRef.current ? 'is-dragging' : ''}`}
          onMouseDown={onSeekMouseDown}
          role="slider"
          aria-label={t('transport.progress.aria')}
          aria-valuemin={0}
          aria-valuemax={duration || 0}
          aria-valuenow={currentTime}
        >
          <div
            className="transport__progress-fill"
            style={{ width: `${progressPct}%` }}
          />
          <div
            className="transport__progress-thumb"
            style={{ left: `${progressPct}%` }}
          />
        </div>
        <span className="transport__time-total">{fmtTime(duration)}</span>
      </div>

      <div className="transport__volume">
        <span className="transport__volume-label">{t('transport.volume.label')}</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={onVolume}
          aria-label={t('transport.volume.aria')}
          className="transport__volume-slider"
        />
        <span className="transport__volume-num">{Math.round(volume * 100)}</span>
        <span className="transport__source">{sourceIcon}</span>
      </div>
    </div>
  )
}

function fmtTime(s: number): string {
  if (!s || !Number.isFinite(s)) return '00:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}
