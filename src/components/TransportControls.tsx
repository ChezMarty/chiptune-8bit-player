import { useEffect } from 'react'
import { usePlayerStore } from '../state/usePlayerStore'
import { audioController } from '../lib/audio'
import { useT } from '../i18n/useT'

export function TransportControls() {
  const tracks = usePlayerStore((s) => s.tracks)
  const currentIndex = usePlayerStore((s) => s.currentIndex)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const currentTime = usePlayerStore((s) => s.currentTime)
  const duration = usePlayerStore((s) => s.duration)
  const volume = usePlayerStore((s) => s.volume)
  const setVolume = usePlayerStore((s) => s.setVolume)
  const next = usePlayerStore((s) => s.next)
  const prev = usePlayerStore((s) => s.prev)
  const { t } = useT()

  const hasTracks = tracks.length > 0
  const hasCurrent = currentIndex >= 0 && tracks[currentIndex] !== undefined

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
          audioController.togglePlay()
          break
        case 'ArrowRight':
          if (e.shiftKey) s().next()
          else audioController.seek(s().currentTime + 5)
          break
        case 'ArrowLeft':
          if (e.shiftKey) s().prev()
          else audioController.seek(Math.max(0, s().currentTime - 5))
          break
        case 'ArrowUp': {
          const v = Math.min(1, s().volume + 0.05)
          s().setVolume(v)
          audioController.setVolume(v)
          break
        }
        case 'ArrowDown': {
          const v = Math.max(0, s().volume - 0.05)
          s().setVolume(v)
          audioController.setVolume(v)
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
    audioController.load(t.path)
  }, [currentIndex])

  function togglePlay() {
    if (!hasCurrent) return
    audioController.togglePlay()
  }

  function doStop() {
    if (!hasCurrent) return
    audioController.stop()
  }

  function doNext() {
    if (!hasTracks) return
    next()
  }

  function doPrev() {
    if (!hasTracks) return
    prev()
  }

  function onSeek(e: React.MouseEvent<HTMLDivElement>) {
    if (!duration) return
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
    const x = e.clientX - rect.left
    const pct = Math.max(0, Math.min(1, x / rect.width))
    audioController.seek(pct * duration)
  }

  function onVolume(e: React.ChangeEvent<HTMLInputElement>) {
    const v = Number(e.target.value)
    setVolume(v)
    audioController.setVolume(v)
  }

  const progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0

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
        </button>
        <button
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
          disabled={!hasCurrent}
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
          className="transport__progress"
          onClick={onSeek}
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
