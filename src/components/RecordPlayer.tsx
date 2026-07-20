import { useEffect } from 'react'
import { usePlayerStore } from '../state/usePlayerStore'
import { playbackEngine } from '../lib/playback/engine'
import { useT } from '../i18n/useT'

interface RecordPlayerProps {
  className?: string
}

export function RecordPlayer({ className = '' }: RecordPlayerProps) {
  // Constants live INSIDE the component (not at module scope) so that
  // Vite HMR reliably picks up value changes on every render. Module-
  // scope consts can occasionally be retained across HMR boundaries.
  const RESTING_ANGLE = 0
  const OUTER_ANGLE = -10
  const INNER_ANGLE = -20
  const tracks = usePlayerStore((s) => s.tracks)
  const currentIndex = usePlayerStore((s) => s.currentIndex)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const currentTime = usePlayerStore((s) => s.currentTime)
  const duration = usePlayerStore((s) => s.duration)
  const { t } = useT()

  const track = currentIndex >= 0 ? tracks[currentIndex] : null
  const hasTrack = !!track

  const progress =
    duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0
  const tonearmAngle = !hasTrack
    ? RESTING_ANGLE
    : isPlaying
      ? OUTER_ANGLE + (INNER_ANGLE - OUTER_ANGLE) * progress
      : RESTING_ANGLE

  const spin = isPlaying && hasTrack

  function onVinylClick() {
    if (!hasTrack) return
    playbackEngine.togglePlay()
  }

  useEffect(() => {
    if (!track) {
      document.title = t('app.title')
      return
    }
    const sym = isPlaying ? '▶' : '❚❚'
    document.title = `${sym} ${track.artist} — ${track.title}`.slice(0, 80)
  }, [track?.id, track?.artist, track?.title, isPlaying, t])

  const ariaLabel = !hasTrack
    ? t('recordPlayer.aria.noTrack')
    : isPlaying
      ? t('recordPlayer.aria.pause')
      : t('recordPlayer.aria.play')

  return (
    <div
      className={`record-player ${className} ${spin ? 'is-spinning' : ''}`}
    >
      <div className="record-player__body">
        <button
          className="record-player__vinyl"
          aria-label={ariaLabel}
          aria-pressed={isPlaying}
          onClick={onVinylClick}
          disabled={!hasTrack}
        >
          <svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet">
            <style>{`
              .rp-vinyl-body { fill: url(#rp-vinyl-shine); }
              .rp-vinyl-edge { fill: none; stroke: var(--vinyl-black); stroke-width: 3; }
              .rp-vinyl-groove { fill: none; stroke: var(--vinyl-groove); stroke-width: 2; }
              .rp-vinyl-shine-highlight { fill: none; stroke: var(--vinyl-shine); stroke-width: 1; opacity: 0.6; }
              .rp-vinyl-label-fill { fill: var(--vinyl-label); }
              .rp-vinyl-label-border { fill: none; stroke: color-mix(in srgb, var(--vinyl-label) 50%, black); stroke-width: 1.5; }
              .rp-vinyl-spindle { fill: var(--vinyl-black); }
              .rp-vinyl-fallback-note { fill: var(--vinyl-black); }
            `}</style>
            <defs>
              <radialGradient id="rp-vinyl-shine" cx="50%" cy="50%" r="55%">
                <stop offset="0%" style={{ stopColor: 'var(--vinyl-groove)' }} />
                <stop offset="60%" style={{ stopColor: 'var(--vinyl-black)' }} />
                <stop offset="100%" style={{ stopColor: 'var(--vinyl-black)' }} />
              </radialGradient>
            </defs>
            <g className="record-player__disc">
              <circle className="rp-vinyl-body" cx="200" cy="200" r="195" />
              <circle className="rp-vinyl-edge" cx="200" cy="200" r="195" />
              <g vectorEffect="non-scaling-stroke">
                <circle className="rp-vinyl-groove" cx="200" cy="200" r="180" />
                <circle className="rp-vinyl-groove" cx="200" cy="200" r="160" />
                <circle className="rp-vinyl-groove" cx="200" cy="200" r="142" />
                <circle className="rp-vinyl-groove" cx="200" cy="200" r="124" />
              </g>
              <circle
                className="rp-vinyl-shine-highlight"
                cx="200"
                cy="200"
                r="160"
                vectorEffect="non-scaling-stroke"
              />
              <circle className="rp-vinyl-label-fill" cx="200" cy="200" r="62" />
              <circle className="rp-vinyl-label-border" cx="200" cy="200" r="62" />
              {track?.artDataUrl ? (
                <image
                  href={track.artDataUrl}
                  x="170"
                  y="170"
                  width="60"
                  height="60"
                  preserveAspectRatio="xMidYMid slice"
                  style={{ imageRendering: 'pixelated' }}
                />
              ) : (
                <text
                  className="rp-vinyl-fallback-note"
                  x="200"
                  y="212"
                  textAnchor="middle"
                  fontFamily="'Press Start 2P', monospace"
                  fontSize="32"
                >
                  ♪
                </text>
              )}
              <circle className="rp-vinyl-spindle" cx="200" cy="200" r="6" />
            </g>
          </svg>
        </button>

        <div className="record-player__tonearm" aria-hidden="true">
          <div
            className={`record-player__tonearm-pivot ${
              !isPlaying ? 'is-lifted' : ''
            }`}
          >
            <div
              className="record-player__tonearm-arm"
              style={{ transform: `rotate(${tonearmAngle}deg)` }}
            >            <svg viewBox="0 0 320 40" width="320" height="40" style={{ overflow: 'visible' }}>
              <style>{`
                .rp-tonearm-stylus { fill: var(--accent); }
                .rp-tonearm-cartridge { fill: var(--bg-panel-light); stroke: var(--bg-app); stroke-width: 2; }
                .rp-tonearm-shaft { fill: var(--text-primary); stroke: var(--bg-app); stroke-width: 1; }
                .rp-tonearm-pivot { fill: color-mix(in srgb, var(--text-primary) 50%, var(--bg-app)); stroke: var(--bg-app); stroke-width: 2; }
              `}</style>
              <rect className="rp-tonearm-stylus" x="-6" y="20" width="6" height="6" />
              <rect className="rp-tonearm-cartridge" x="0" y="12" width="24" height="18" />
              <rect className="rp-tonearm-shaft" x="24" y="18" width="274" height="6" />
              <rect className="rp-tonearm-pivot" x="298" y="14" width="22" height="22" />
            </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="record-player__info">
        <div
          className="record-player__title"
          title={track?.title || t('recordPlayer.titleEmpty')}
        >
          {track?.title || t('recordPlayer.titleEmpty')}
        </div>
        <div className="record-player__artist" title={track?.artist || ''}>
          {track?.artist || t('recordPlayer.artistEmpty')}
        </div>
      </div>
    </div>
  )
}
